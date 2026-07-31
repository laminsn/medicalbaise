-- =====================================================================
-- TEST COHORT PILOT — canonical baseline
-- Applied 2026-07-30. Byte-identical in Casa-Baise / Legal-Baise / medicalbaise.
--
-- Casa, Medical and Legal Baise share ONE Supabase project
-- (xpcoaedbfmtyzvkwhaav). Separation is providers.platform (baise_platform),
-- NOT app_key. Apply this file ONCE; it is live for all three apps.
--
-- Everything here is idempotent and additive. With zero test accounts every
-- object is a provable no-op, which is how it was verified on a live database.
--
-- NOTE: files in this directory dated BEFORE 20260730 are historical and were
-- never applied to the live database. See README.md.
-- =====================================================================

-- =====================================================================
-- PHASE 1 — schema
-- =====================================================================

ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS is_test_account       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tier_grant_source     text,
  ADD COLUMN IF NOT EXISTS tier_grant_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS tier_before_grant     public.subscription_tier,
  ADD COLUMN IF NOT EXISTS stripe_customer_id    text;

COMMENT ON COLUMN public.providers.is_test_account IS
  'Pilot cohort containment flag. Permanent: outlives the grant so test rows stay invisible to real users forever.';
COMMENT ON COLUMN public.providers.tier_grant_source IS
  'NULL => Stripe owns this tier. Non-NULL => granted; protect_active_tier_grant() suppresses Stripe stomps.';
COMMENT ON COLUMN public.providers.tier_before_grant IS
  'Tier captured immediately before a grant overwrote it, so revoke/expire restores a real customer exactly.';
COMMENT ON COLUMN public.providers.stripe_customer_id IS
  'Referenced by supabase/functions/stripe-webhook but previously missing from the live schema.';

DO $$ BEGIN
  ALTER TABLE public.providers
    ADD CONSTRAINT providers_tier_grant_source_check
    CHECK (tier_grant_source IS NULL
           OR tier_grant_source IN ('test_cohort','admin_comp','partner'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_test_account     boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS test_cohort_app_key text;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_test_cohort_app_key_check
    CHECK (test_cohort_app_key IS NULL OR test_cohort_app_key IN ('casa','medical','legal'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- rail discriminator: 'stripe_test' slots in later with no schema change
ALTER TABLE public.provider_payment_transactions
  ADD COLUMN IF NOT EXISTS rail text NOT NULL DEFAULT 'live';
DO $$ BEGIN
  ALTER TABLE public.provider_payment_transactions
    ADD CONSTRAINT provider_payment_transactions_rail_check
    CHECK (rail IN ('live','stripe_test','simulated'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.provider_ledger_entries
  ADD COLUMN IF NOT EXISTS rail text NOT NULL DEFAULT 'live';
DO $$ BEGIN
  ALTER TABLE public.provider_ledger_entries
    ADD CONSTRAINT provider_ledger_entries_rail_check
    CHECK (rail IN ('live','stripe_test','simulated'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- promotional_campaigns: referenced by src/components/admin/AdminPromotions.tsx,
-- which was querying a table that did not exist (PGRST205).
CREATE TABLE IF NOT EXISTS public.promotional_campaigns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by          uuid NOT NULL,
  app_key             text NOT NULL DEFAULT 'casa',
  name                text NOT NULL,
  description         text,
  campaign_type       text NOT NULL DEFAULT 'referral',
  source              text NOT NULL DEFAULT 'admin',
  promo_code          text,
  credit_amount       numeric NOT NULL DEFAULT 0,
  subscription_days   integer NOT NULL DEFAULT 0,
  tier_override       text,
  max_redemptions     integer,
  current_redemptions integer NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true,
  starts_at           timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz,
  target_audience     text NOT NULL DEFAULT 'all',
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN
  ALTER TABLE public.promotional_campaigns
    ADD CONSTRAINT promotional_campaigns_app_key_check CHECK (app_key IN ('casa','medical','legal'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS promotional_campaigns_app_code_uidx
  ON public.promotional_campaigns (app_key, upper(promo_code)) WHERE promo_code IS NOT NULL;

ALTER TABLE public.promotional_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage promotional campaigns" ON public.promotional_campaigns;
CREATE POLICY "Admins can manage promotional campaigns"
  ON public.promotional_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.campaign_redemptions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES public.promotional_campaigns(id) ON DELETE RESTRICT,
  user_id        uuid NOT NULL,
  app_key        text NOT NULL DEFAULT 'casa',
  source         text NOT NULL DEFAULT 'admin',
  credit_applied numeric NOT NULL DEFAULT 0,
  metadata       jsonb NOT NULL DEFAULT '{}'::jsonb,
  redeemed_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaign_redemptions_campaign_idx ON public.campaign_redemptions (campaign_id);
CREATE INDEX IF NOT EXISTS campaign_redemptions_user_idx     ON public.campaign_redemptions (user_id);

ALTER TABLE public.campaign_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.campaign_redemptions;
CREATE POLICY "Admins can view all redemptions" ON public.campaign_redemptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.campaign_redemptions;
CREATE POLICY "Users can view own redemptions" ON public.campaign_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can create redemptions" ON public.campaign_redemptions;
CREATE POLICY "Admins can create redemptions" ON public.campaign_redemptions
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
-- No user INSERT policy by design: redemptions are written only inside
-- redeem_test_cohort_code() (SECURITY DEFINER).

-- Per-tester single-use roster. Campaign is the cohort container; this row is
-- the individually revocable seat. Needed because promotional_campaigns.tier_override
-- is a single scalar and cannot express a mixed-tier cohort.
CREATE TABLE IF NOT EXISTS public.test_cohort_invites (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid NOT NULL REFERENCES public.promotional_campaigns(id) ON DELETE RESTRICT,
  platform         public.baise_platform NOT NULL,
  app_key          text NOT NULL,
  label            text NOT NULL,
  intended_role    text NOT NULL,
  granted_tier     public.subscription_tier,
  code_hash        text NOT NULL UNIQUE,
  code_last4       text,
  status           text NOT NULL DEFAULT 'pending',
  expires_at       timestamptz NOT NULL DEFAULT (now() + interval '45 days'),
  grant_days       integer NOT NULL DEFAULT 60,
  grant_expires_at timestamptz,
  claimed_by       uuid,
  claimed_at       timestamptz,
  revoked_at       timestamptz,
  created_by       uuid NOT NULL,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE public.test_cohort_invites
  ADD CONSTRAINT test_cohort_invites_app_key_check CHECK (app_key IN ('casa','medical','legal'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.test_cohort_invites
  ADD CONSTRAINT test_cohort_invites_role_check CHECK (intended_role IN ('provider','client'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.test_cohort_invites
  ADD CONSTRAINT test_cohort_invites_status_check CHECK (status IN ('pending','claimed','revoked','expired'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.test_cohort_invites
  ADD CONSTRAINT test_cohort_invites_grant_days_check CHECK (grant_days > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.test_cohort_invites
  ADD CONSTRAINT test_cohort_invites_tier_role_check
  CHECK ((intended_role='provider' AND granted_tier IS NOT NULL)
      OR (intended_role='client'   AND granted_tier IS NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS test_cohort_invites_campaign_idx ON public.test_cohort_invites (campaign_id);
CREATE INDEX IF NOT EXISTS test_cohort_invites_status_idx   ON public.test_cohort_invites (status);
CREATE INDEX IF NOT EXISTS test_cohort_invites_claimed_idx  ON public.test_cohort_invites (claimed_by) WHERE claimed_by IS NOT NULL;

ALTER TABLE public.test_cohort_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.test_cohort_invites FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.test_cohort_invites TO authenticated;

-- There is deliberately NO policy that can match a 'pending' row for a
-- non-admin, so code enumeration is structurally impossible.
DROP POLICY IF EXISTS "Admins manage test cohort invites" ON public.test_cohort_invites;
CREATE POLICY "Admins manage test cohort invites" ON public.test_cohort_invites
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Users view own claimed invite" ON public.test_cohort_invites;
CREATE POLICY "Users view own claimed invite" ON public.test_cohort_invites
  FOR SELECT TO authenticated USING (claimed_by = auth.uid());

CREATE TABLE IF NOT EXISTS public.test_cohort_redeem_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  app_key     text,
  code_prefix text,
  outcome     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS test_cohort_redeem_attempts_user_idx
  ON public.test_cohort_redeem_attempts (user_id, created_at DESC);
ALTER TABLE public.test_cohort_redeem_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.test_cohort_redeem_attempts FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "Admins view redeem attempts" ON public.test_cohort_redeem_attempts;
CREATE POLICY "Admins view redeem attempts" ON public.test_cohort_redeem_attempts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS providers_test_platform_idx      ON public.providers (platform) WHERE is_test_account;
CREATE INDEX IF NOT EXISTS providers_tier_grant_expiry_idx  ON public.providers (tier_grant_expires_at) WHERE tier_grant_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_test_account_idx        ON public.profiles (is_test_account) WHERE is_test_account;
CREATE INDEX IF NOT EXISTS provider_payment_transactions_rail_idx
  ON public.provider_payment_transactions (rail) WHERE rail <> 'live';

-- =====================================================================
-- PHASE 2 — functions & triggers
-- NOTE: search_path includes `extensions` because pgcrypto (digest,
-- gen_random_bytes) is installed there, NOT in public.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.current_user_is_test_cohort_peer(target_platform public.baise_platform)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles pr
                  WHERE pr.user_id = auth.uid() AND pr.is_test_account
                    AND target_platform = ANY (pr.platforms));
$$;
REVOKE ALL ON FUNCTION public.current_user_is_test_cohort_peer(public.baise_platform) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_test_cohort_peer(public.baise_platform) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.current_user_is_test_account()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$ SELECT COALESCE((SELECT pr.is_test_account FROM public.profiles pr
                        WHERE pr.user_id = auth.uid() LIMIT 1), false); $$;
REVOKE ALL ON FUNCTION public.current_user_is_test_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_test_account() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.current_user_test_cohort_app_key()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$ SELECT (SELECT pr.test_cohort_app_key FROM public.profiles pr
               WHERE pr.user_id = auth.uid() LIMIT 1); $$;
REVOKE ALL ON FUNCTION public.current_user_test_cohort_app_key() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_test_cohort_app_key() TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.user_is_test_account(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$ SELECT COALESCE((SELECT pr.is_test_account FROM public.profiles pr
                        WHERE pr.user_id = p_user_id LIMIT 1), false); $$;
REVOKE ALL ON FUNCTION public.user_is_test_account(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_test_account(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.tier_grant_is_active(p_provider_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $$
  SELECT EXISTS (SELECT 1 FROM public.providers p
                  WHERE p.id = p_provider_id AND p.tier_grant_source IS NOT NULL
                    AND (p.tier_grant_expires_at IS NULL OR p.tier_grant_expires_at > now()));
$$;
REVOKE ALL ON FUNCTION public.tier_grant_is_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tier_grant_is_active(uuid) TO authenticated, service_role;

-- THE TIER-STOMP GUARD.
-- Replaces editing stripe-webhook in three duplicated repos: it fires for ANY
-- writer (the webhook, the service role, psql, a future edge function).
-- COERCES rather than RAISEs, because a raise inside a Stripe-retried path
-- would turn one event into an infinite retry loop and a 500-ing webhook.
-- Escape hatch: co-write tier_grant_source in the same UPDATE (revoke/expire).
CREATE OR REPLACE FUNCTION public.protect_active_tier_grant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  IF OLD.tier_grant_source IS NOT NULL
     AND (OLD.tier_grant_expires_at IS NULL OR OLD.tier_grant_expires_at > now())
     AND NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
     AND NEW.tier_grant_source IS NOT DISTINCT FROM OLD.tier_grant_source
  THEN
    BEGIN
      PERFORM public.log_provider_audit_event(
        OLD.id, NULL, 'system', 'tier_write_suppressed', 'provider', OLD.id, 'warning',
        jsonb_build_object('attempted', NEW.subscription_tier,
                           'kept', OLD.subscription_tier,
                           'grant_source', OLD.tier_grant_source));
    EXCEPTION WHEN OTHERS THEN NULL;  -- audit must never break the write path
    END;
    NEW.subscription_tier := OLD.subscription_tier;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_active_tier_grant ON public.providers;
CREATE TRIGGER trg_protect_active_tier_grant BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.protect_active_tier_grant();

-- Visible TEST marker: zero frontend edits, propagates to every surface that
-- renders business_name. A tester cannot rename it away.
CREATE OR REPLACE FUNCTION public.enforce_test_marker_business_name()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.is_test_account THEN
    IF NEW.business_name IS NULL OR btrim(NEW.business_name) = '' THEN
      NEW.business_name := '[TESTE] Conta de teste';
    ELSIF NEW.business_name NOT LIKE '[TESTE]%' THEN
      NEW.business_name := '[TESTE] ' || NEW.business_name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_test_marker_business_name ON public.providers;
CREATE TRIGGER trg_enforce_test_marker_business_name
  BEFORE INSERT OR UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_test_marker_business_name();

-- Symmetric realm containment. One generic function driven by TG_ARGV:
--   [0] user-id column ('-' if absent)
--   [1] provider-id column ('-' if absent)
--   [2] job-id column ('-' if absent; resolves jobs_posted.customer_id)
CREATE OR REPLACE FUNCTION public.tg_assert_same_test_realm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE rec jsonb := to_jsonb(NEW); v_user uuid; v_other uuid;
BEGIN
  IF TG_ARGV[0] <> '-' THEN v_user := (rec ->> TG_ARGV[0])::uuid; END IF;
  IF v_user IS NULL AND TG_ARGV[2] <> '-' THEN
    SELECT j.customer_id INTO v_user FROM public.jobs_posted j WHERE j.id = (rec ->> TG_ARGV[2])::uuid;
  END IF;
  IF TG_ARGV[1] <> '-' THEN
    SELECT p.user_id INTO v_other FROM public.providers p WHERE p.id = (rec ->> TG_ARGV[1])::uuid;
  END IF;
  IF v_user IS NULL OR v_other IS NULL OR v_user = v_other THEN RETURN NEW; END IF;
  IF public.user_is_test_account(v_user) IS DISTINCT FROM public.user_is_test_account(v_other) THEN
    RAISE EXCEPTION 'Test-realm violation on %: test and real accounts cannot interact.', TG_TABLE_NAME
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_realm_bids ON public.bids;
CREATE TRIGGER trg_realm_bids BEFORE INSERT ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.tg_assert_same_test_realm('-','provider_id','job_id');
DROP TRIGGER IF EXISTS trg_realm_quote_requests ON public.quote_requests;
CREATE TRIGGER trg_realm_quote_requests BEFORE INSERT ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_assert_same_test_realm('customer_id','provider_id','-');
DROP TRIGGER IF EXISTS trg_realm_conversations ON public.conversations;
CREATE TRIGGER trg_realm_conversations BEFORE INSERT ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.tg_assert_same_test_realm('customer_id','provider_id','-');
DROP TRIGGER IF EXISTS trg_realm_active_jobs ON public.active_jobs;
CREATE TRIGGER trg_realm_active_jobs BEFORE INSERT ON public.active_jobs
  FOR EACH ROW EXECUTE FUNCTION public.tg_assert_same_test_realm('customer_id','provider_id','-');
DROP TRIGGER IF EXISTS trg_realm_reviews ON public.reviews;
CREATE TRIGGER trg_realm_reviews BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_assert_same_test_realm('customer_id','provider_id','-');
DROP TRIGGER IF EXISTS trg_realm_favorites ON public.favorites;
CREATE TRIGGER trg_realm_favorites BEFORE INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.tg_assert_same_test_realm('user_id','provider_id','-');
DROP TRIGGER IF EXISTS trg_realm_follows ON public.follows;
CREATE TRIGGER trg_realm_follows BEFORE INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.tg_assert_same_test_realm('follower_id','following_provider_id','-');
-- messages inherit from conversations (a cross-realm conversation cannot exist).
-- appointments has no provider linkage, so there is no pair to check.

-- =====================================================================
-- PHASE 3 — visibility containment
-- providers_public is a SECURITY DEFINER view (reloptions IS NULL) and all 13
-- discovery call sites read it, so one predicate closes public discovery.
-- The column list is reproduced verbatim: CREATE OR REPLACE VIEW cannot change
-- column names/types/order. The WITH (security_invoker) clause is deliberately
-- OMITTED — adding it would break the anonymous public directory, because
-- providers RLS is TO authenticated.
-- =====================================================================

CREATE OR REPLACE VIEW public.providers_public AS
 SELECT id, user_id, business_name, business_type, tagline, bio, years_experience,
    subscription_tier, service_radius_km, city, state, languages, avg_rating,
    total_reviews, total_jobs, response_time_hours, is_verified, is_background_checked,
    is_insured, is_licensed, warranty_info, guarantee_info, crm_number, specialty_id,
    hospital_affiliations, teleconsultation_available, consultation_fee, consultation_types,
    emergency_available, accepts_new_patients, total_patients, avatar_url, platform, created_at
   FROM providers p
  WHERE p.is_test_account = false
     OR public.current_user_is_test_cohort_peer(p.platform)
     OR public.has_role(auth.uid(), 'admin');

-- Favorites.tsx embeds the BASE table, not the view, so the view alone is
-- insufficient. This also narrows the pre-existing USING (true) exposure of
-- cpf_cnpj / passport_number to every authenticated user.
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
DROP POLICY IF EXISTS "providers_select_scoped" ON public.providers;
CREATE POLICY "providers_select_scoped" ON public.providers FOR SELECT TO authenticated
  USING (user_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR is_test_account = false
      OR public.current_user_is_test_cohort_peer(platform));

-- profiles_public has security_invoker=true, so it inherits this policy.
-- The self-lookup MUST go through SECURITY DEFINER helpers: an inline subquery
-- against public.profiles here re-triggers RLS and raises 42P17 infinite recursion.
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_scoped" ON public.profiles;
CREATE POLICY "profiles_select_scoped" ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR is_test_account = false
      OR (public.current_user_is_test_account()
          AND public.current_user_test_cohort_app_key() IS NOT DISTINCT FROM test_cohort_app_key));

-- =====================================================================
-- PHASE 4 — grant RPCs
-- =====================================================================

CREATE OR REPLACE FUNCTION public.app_key_to_platform(p_app_key text)
RETURNS public.baise_platform LANGUAGE sql IMMUTABLE
AS $$ SELECT CASE p_app_key
         WHEN 'casa' THEN 'casa_baise' WHEN 'medical' THEN 'medical_baise'
         WHEN 'legal' THEN 'legal_baise' END::public.baise_platform; $$;

CREATE OR REPLACE FUNCTION public.normalize_cohort_code(p_code text)
RETURNS text LANGUAGE sql IMMUTABLE
AS $$ SELECT upper(regexp_replace(COALESCE(p_code,''), '[^A-Za-z0-9]', '', 'g')); $$;

CREATE OR REPLACE FUNCTION public.hash_cohort_code(p_code text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public, extensions
AS $$ SELECT encode(extensions.digest(public.normalize_cohort_code(p_code), 'sha256'), 'hex'); $$;

-- Returns plaintext codes EXACTLY ONCE. Only hash + last4 are persisted.
-- 12 chars of Crockford base32 ~= 60 bits, so unsalted SHA-256 is sufficient
-- and no pepper/secret management is required.
CREATE OR REPLACE FUNCTION public.issue_test_cohort_codes(p_campaign_id uuid, p_specs jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_alphabet constant text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  v_campaign public.promotional_campaigns%ROWTYPE;
  v_spec jsonb; v_code text; v_hash text; v_id uuid; v_out jsonb := '[]'::jsonb; v_try int; i int;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_campaign FROM public.promotional_campaigns WHERE id = p_campaign_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign not found'; END IF;

  FOR v_spec IN SELECT * FROM jsonb_array_elements(p_specs) LOOP
    v_try := 0;
    LOOP
      v_try := v_try + 1;
      IF v_try > 8 THEN RAISE EXCEPTION 'could not generate a unique code'; END IF;
      v_code := '';
      FOR i IN 0..11 LOOP
        v_code := v_code || substr(v_alphabet, 1 + (get_byte(extensions.gen_random_bytes(12), i) % 32), 1);
      END LOOP;
      v_hash := public.hash_cohort_code(v_code);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.test_cohort_invites WHERE code_hash = v_hash);
    END LOOP;

    INSERT INTO public.test_cohort_invites (campaign_id, platform, app_key, label, intended_role,
      granted_tier, code_hash, code_last4, grant_days, expires_at, created_by, metadata)
    VALUES (p_campaign_id, public.app_key_to_platform(v_campaign.app_key), v_campaign.app_key,
      COALESCE(v_spec->>'label','tester'), COALESCE(v_spec->>'intended_role','provider'),
      NULLIF(v_spec->>'granted_tier','')::public.subscription_tier, v_hash, right(v_code,4),
      COALESCE((v_spec->>'grant_days')::int, 60),
      COALESCE((v_spec->>'expires_at')::timestamptz, now() + interval '45 days'),
      auth.uid(), COALESCE(v_spec->'metadata','{}'::jsonb))
    RETURNING id INTO v_id;

    v_out := v_out || jsonb_build_object('invite_id',v_id,'label',COALESCE(v_spec->>'label','tester'),
      'code',v_code,'intended_role',COALESCE(v_spec->>'intended_role','provider'),
      'granted_tier',v_spec->>'granted_tier');
  END LOOP;

  RETURN jsonb_build_object('ok',true,'issued',jsonb_array_length(v_out),'codes',v_out);
END;
$$;
REVOKE ALL ON FUNCTION public.issue_test_cohort_codes(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_test_cohort_codes(uuid,jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.preview_test_cohort_code(p_code text, p_app_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_inv public.test_cohort_invites%ROWTYPE; v_norm text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  v_norm := public.normalize_cohort_code(p_code);
  IF length(v_norm) < 8 OR length(v_norm) > 32 THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_CODE'); END IF;
  SELECT * INTO v_inv FROM public.test_cohort_invites WHERE code_hash = public.hash_cohort_code(v_norm);
  IF NOT FOUND                 THEN RETURN jsonb_build_object('ok',false,'error','INVALID_CODE'); END IF;
  IF v_inv.status = 'revoked'  THEN RETURN jsonb_build_object('ok',false,'error','CODE_REVOKED'); END IF;
  IF v_inv.status <> 'pending' THEN RETURN jsonb_build_object('ok',false,'error','CODE_ALREADY_USED'); END IF;
  IF v_inv.expires_at <= now() THEN RETURN jsonb_build_object('ok',false,'error','CODE_EXPIRED'); END IF;
  IF v_inv.app_key IS DISTINCT FROM p_app_key THEN
    RETURN jsonb_build_object('ok',false,'error','WRONG_APP'); END IF;
  -- returns nothing identifying: no label, no created_by, no campaign
  RETURN jsonb_build_object('ok',true,'role',v_inv.intended_role,'tier',v_inv.granted_tier,
                            'grant_days',v_inv.grant_days);
END;
$$;
REVOKE ALL ON FUNCTION public.preview_test_cohort_code(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_test_cohort_code(text,text) TO authenticated, service_role;

-- Returns {ok:false,error} for EVERY expected failure; RAISEs only for
-- AUTH_REQUIRED. A raise on a business failure would roll back the
-- attempt-log insert in the same transaction and destroy rate-limit state.
CREATE OR REPLACE FUNCTION public.redeem_test_cohort_code(
  p_code text, p_app_key text, p_business_name text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_norm text; v_inv public.test_cohort_invites%ROWTYPE;
  v_camp public.promotional_campaigns%ROWTYPE;
  v_rows int; v_platform public.baise_platform; v_provider uuid;
  v_prev public.subscription_tier; v_expires timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  v_norm := public.normalize_cohort_code(p_code);

  IF (SELECT count(*) FROM public.test_cohort_redeem_attempts
       WHERE user_id = v_uid AND created_at > now() - interval '1 hour') >= 10 THEN
    INSERT INTO public.test_cohort_redeem_attempts(user_id,app_key,code_prefix,outcome)
      VALUES (v_uid,p_app_key,left(v_norm,4),'RATE_LIMITED');
    RETURN jsonb_build_object('ok',false,'error','RATE_LIMITED');
  END IF;

  INSERT INTO public.test_cohort_redeem_attempts(user_id,app_key,code_prefix,outcome)
    VALUES (v_uid,p_app_key,left(v_norm,4),'ATTEMPT');

  IF length(v_norm) < 8 OR length(v_norm) > 32 THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_CODE'); END IF;

  SELECT * INTO v_inv FROM public.test_cohort_invites
   WHERE code_hash = public.hash_cohort_code(v_norm) FOR UPDATE;

  IF NOT FOUND                 THEN RETURN jsonb_build_object('ok',false,'error','INVALID_CODE'); END IF;
  IF v_inv.status = 'revoked'  THEN RETURN jsonb_build_object('ok',false,'error','CODE_REVOKED'); END IF;
  IF v_inv.status <> 'pending' THEN RETURN jsonb_build_object('ok',false,'error','CODE_ALREADY_USED'); END IF;
  IF v_inv.expires_at <= now() THEN
    UPDATE public.test_cohort_invites SET status='expired', updated_at=now() WHERE id=v_inv.id;
    RETURN jsonb_build_object('ok',false,'error','CODE_EXPIRED'); END IF;
  IF v_inv.app_key IS DISTINCT FROM p_app_key THEN
    RETURN jsonb_build_object('ok',false,'error','WRONG_APP'); END IF;

  SELECT * INTO v_camp FROM public.promotional_campaigns WHERE id = v_inv.campaign_id;
  IF NOT FOUND OR NOT v_camp.is_active OR v_camp.starts_at > now()
     OR (v_camp.expires_at IS NOT NULL AND v_camp.expires_at <= now())
     OR (v_camp.max_redemptions IS NOT NULL AND v_camp.current_redemptions >= v_camp.max_redemptions) THEN
    RETURN jsonb_build_object('ok',false,'error','CAMPAIGN_INACTIVE'); END IF;

  IF EXISTS (SELECT 1 FROM public.test_cohort_invites WHERE claimed_by = v_uid) THEN
    RETURN jsonb_build_object('ok',false,'error','ALREADY_A_TESTER'); END IF;

  -- refuse to convert a real paying customer into a test account
  IF EXISTS (SELECT 1 FROM public.providers
              WHERE user_id = v_uid AND NOT is_test_account
                AND subscription_tier IS DISTINCT FROM 'free'::public.subscription_tier) THEN
    RETURN jsonb_build_object('ok',false,'error','REAL_ACCOUNT_REFUSED'); END IF;

  -- claim. AND status='pending' + ROW_COUNT keeps this correct under READ
  -- COMMITTED even if the FOR UPDATE above is later refactored away.
  v_expires := now() + make_interval(days => v_inv.grant_days);
  UPDATE public.test_cohort_invites
     SET status='claimed', claimed_by=v_uid, claimed_at=now(),
         grant_expires_at=v_expires, updated_at=now()
   WHERE id=v_inv.id AND status='pending';
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN RETURN jsonb_build_object('ok',false,'error','CODE_ALREADY_USED'); END IF;

  UPDATE public.promotional_campaigns
     SET current_redemptions = current_redemptions + 1, updated_at = now()
   WHERE id = v_camp.id;

  INSERT INTO public.campaign_redemptions(campaign_id,user_id,app_key,source,metadata)
    VALUES (v_camp.id, v_uid, v_inv.app_key, 'test_cohort',
            jsonb_build_object('invite_id', v_inv.id, 'label', v_inv.label));

  v_platform := public.app_key_to_platform(v_inv.app_key);

  -- user_type is set HERE because useAuth.updateProfile's ALLOWED_FIELDS
  -- correctly blocks it client-side. This is why the RPC is SECURITY DEFINER.
  UPDATE public.profiles
     SET is_test_account = true,
         test_cohort_app_key = v_inv.app_key,
         platforms = ARRAY[v_platform]::public.baise_platform[],
         user_type = CASE WHEN v_inv.intended_role='provider'
                          THEN 'provider'::public.user_type ELSE user_type END,
         is_provider = CASE WHEN v_inv.intended_role='provider' THEN true ELSE is_provider END
   WHERE user_id = v_uid;

  IF v_inv.intended_role = 'provider' THEN
    SELECT subscription_tier INTO v_prev FROM public.providers WHERE user_id = v_uid;
    INSERT INTO public.providers (user_id, business_name, platform, subscription_tier,
      is_test_account, tier_grant_source, tier_grant_expires_at, tier_before_grant, is_active)
    VALUES (v_uid, COALESCE(NULLIF(btrim(p_business_name),''), v_inv.label), v_platform,
      v_inv.granted_tier, true, 'test_cohort', v_expires,
      COALESCE(v_prev,'free'::public.subscription_tier), true)
    ON CONFLICT (user_id) DO UPDATE SET
      business_name         = COALESCE(NULLIF(btrim(p_business_name),''), public.providers.business_name),
      platform              = EXCLUDED.platform,
      subscription_tier     = EXCLUDED.subscription_tier,
      is_test_account       = true,
      tier_grant_source     = 'test_cohort',
      tier_grant_expires_at = EXCLUDED.tier_grant_expires_at,
      tier_before_grant     = COALESCE(public.providers.tier_before_grant, public.providers.subscription_tier),
      is_active             = true
    RETURNING id INTO v_provider;
  END IF;

  UPDATE public.test_cohort_redeem_attempts SET outcome='OK'
   WHERE user_id=v_uid AND outcome='ATTEMPT'
     AND created_at = (SELECT max(created_at) FROM public.test_cohort_redeem_attempts WHERE user_id=v_uid);

  RETURN jsonb_build_object('ok',true,'role',v_inv.intended_role,'tier',v_inv.granted_tier,
    'provider_id',v_provider,'app_key',v_inv.app_key,'grant_expires_at',v_expires);
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_test_cohort_code(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_test_cohort_code(text,text,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.revoke_test_cohort_invite(p_invite_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_inv public.test_cohort_invites%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_inv FROM public.test_cohort_invites WHERE id=p_invite_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','NOT_FOUND'); END IF;

  UPDATE public.test_cohort_invites SET status='revoked', revoked_at=now(), updated_at=now()
   WHERE id=p_invite_id;

  IF v_inv.claimed_by IS NOT NULL THEN
    -- co-write tier_grant_source so protect_active_tier_grant() permits the change
    UPDATE public.providers
       SET subscription_tier     = COALESCE(tier_before_grant,'free'::public.subscription_tier),
           tier_grant_source     = NULL, tier_grant_expires_at = NULL, tier_before_grant = NULL
     WHERE user_id = v_inv.claimed_by AND tier_grant_source = 'test_cohort';
  END IF;
  RETURN jsonb_build_object('ok',true,'invite_id',p_invite_id);
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_test_cohort_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_test_cohort_invite(uuid) TO authenticated, service_role;

-- No pg_cron on this project: run from an admin control or a scheduled edge function.
CREATE OR REPLACE FUNCTION public.expire_tier_grants()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_tiers int; v_invites int;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE='42501'; END IF;

  UPDATE public.providers
     SET subscription_tier     = COALESCE(tier_before_grant,'free'::public.subscription_tier),
         tier_grant_source     = NULL, tier_grant_expires_at = NULL, tier_before_grant = NULL
   WHERE tier_grant_source IS NOT NULL AND tier_grant_expires_at <= now();
  GET DIAGNOSTICS v_tiers = ROW_COUNT;

  UPDATE public.test_cohort_invites SET status='expired', updated_at=now()
   WHERE status='claimed' AND grant_expires_at IS NOT NULL AND grant_expires_at <= now();
  GET DIAGNOSTICS v_invites = ROW_COUNT;

  RETURN jsonb_build_object('ok',true,'grants_expired',v_tiers,'invites_expired',v_invites);
END;
$$;
REVOKE ALL ON FUNCTION public.expire_tier_grants() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_tier_grants() TO authenticated, service_role;

-- =====================================================================
-- PHASE 5 — simulated payment rail (no Stripe)
-- =====================================================================

-- Unbypassable bidirectional guard: simulated money can only belong to a test
-- account, and a test account can never hold live-rail money.
CREATE OR REPLACE FUNCTION public.tg_enforce_payment_rail()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_is_test boolean;
BEGIN
  SELECT is_test_account INTO v_is_test FROM public.providers WHERE id = NEW.provider_id;
  IF v_is_test IS NULL THEN RETURN NEW; END IF;
  IF NEW.rail = 'simulated' AND NOT v_is_test THEN
    RAISE EXCEPTION 'rail=simulated is permitted only for test-cohort accounts (%.%)',
      TG_TABLE_NAME, NEW.provider_id USING ERRCODE='check_violation'; END IF;
  IF v_is_test AND NEW.rail = 'live' THEN
    RAISE EXCEPTION 'test-cohort accounts may never hold live-rail money (%.%)',
      TG_TABLE_NAME, NEW.provider_id USING ERRCODE='check_violation'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_payment_rail_txn ON public.provider_payment_transactions;
CREATE TRIGGER trg_enforce_payment_rail_txn
  BEFORE INSERT OR UPDATE ON public.provider_payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_payment_rail();
DROP TRIGGER IF EXISTS trg_enforce_payment_rail_ledger ON public.provider_ledger_entries;
CREATE TRIGGER trg_enforce_payment_rail_ledger
  BEFORE INSERT OR UPDATE ON public.provider_ledger_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_enforce_payment_rail();

-- SECURITY DEFINER RPC (not an edge function): the rail writes 5-7 tables that
-- must be atomic. Sequential PostgREST calls from an edge function would leave
-- half-paid invoices when a later call fails.
-- CHECK-constraint notes: payment_method must be 'manual' ('simulated' is not
-- an allowed value); ledger entry_type must be 'payment_available' ('payment'
-- is not allowed).
CREATE OR REPLACE FUNCTION public.simulate_provider_payment(
  p_provider_id uuid, p_invoice_id uuid, p_amount numeric DEFAULT NULL,
  p_currency text DEFAULT NULL, p_payment_plan_item_id uuid DEFAULT NULL,
  p_scenario text DEFAULT 'succeeded')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid(); v_is_admin boolean;
  v_prov public.providers%ROWTYPE; v_inv public.provider_invoices%ROWTYPE;
  v_amount numeric; v_ccy text; v_txn uuid;
  v_ref text := 'sim_' || replace(gen_random_uuid()::text,'-','');
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE='42501'; END IF;
  IF p_scenario NOT IN ('succeeded','failed','refunded') THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_SCENARIO'); END IF;

  v_is_admin := public.has_role(v_uid,'admin');
  SELECT * INTO v_prov FROM public.providers WHERE id = p_provider_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','PROVIDER_NOT_FOUND'); END IF;

  IF NOT v_prov.is_test_account THEN
    RETURN jsonb_build_object('ok',false,'error','NOT_A_TEST_ACCOUNT'); END IF;
  IF NOT public.current_user_is_test_account() AND NOT v_is_admin THEN
    RETURN jsonb_build_object('ok',false,'error','NOT_A_TEST_ACCOUNT'); END IF;
  IF NOT public.provider_owned_by_current_user(p_provider_id) AND NOT v_is_admin THEN
    RETURN jsonb_build_object('ok',false,'error','FORBIDDEN'); END IF;

  SELECT * INTO v_inv FROM public.provider_invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','INVOICE_NOT_FOUND'); END IF;
  IF v_inv.provider_id <> p_provider_id THEN
    RETURN jsonb_build_object('ok',false,'error','INVOICE_PROVIDER_MISMATCH'); END IF;

  v_amount := COALESCE(p_amount, v_inv.total_amount);
  v_ccy    := COALESCE(p_currency, v_inv.currency, 'brl');

  INSERT INTO public.provider_payment_transactions (invoice_id, provider_id, created_by,
    amount, currency, transaction_type, payment_method, status, rail,
    stripe_session_id, stripe_payment_intent_id, processed_at, metadata)
  VALUES (p_invoice_id, p_provider_id, v_uid, v_amount, v_ccy,
    CASE WHEN p_scenario='refunded' THEN 'refund' ELSE 'invoice_payment' END,
    'manual',
    CASE p_scenario WHEN 'succeeded' THEN 'succeeded' WHEN 'refunded' THEN 'refunded' ELSE 'failed' END,
    'simulated', v_ref, 'sim_pi_' || replace(gen_random_uuid()::text,'-',''), now(),
    jsonb_build_object('simulated', true, 'scenario', p_scenario))
  RETURNING id INTO v_txn;

  IF p_scenario = 'failed' THEN
    UPDATE public.provider_invoices SET payment_status='failed', updated_at=now(),
      metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('simulated',true)
     WHERE id = p_invoice_id;
    IF p_payment_plan_item_id IS NOT NULL THEN
      UPDATE public.provider_payment_plan_items
         SET status='failed', processor='manual', attempt_count=attempt_count+1,
             last_attempt_at=now(), last_payment_error='[SIMULATED] simulated failure',
             payment_transaction_id=v_txn, updated_at=now()
       WHERE id = p_payment_plan_item_id;
    END IF;
    RETURN jsonb_build_object('ok',true,'scenario','failed','transaction_id',v_txn,'rail','simulated');
  END IF;

  INSERT INTO public.provider_ledger_entries (provider_id, related_transaction_id, invoice_id,
    entry_type, direction, amount, currency, memo, rail, metadata)
  VALUES (p_provider_id, v_txn, p_invoice_id,
    CASE WHEN p_scenario='refunded' THEN 'refund' ELSE 'payment_available' END,
    CASE WHEN p_scenario='refunded' THEN 'debit' ELSE 'credit' END,
    v_amount, v_ccy,
    '[SIMULATED] ' || CASE WHEN p_scenario='refunded' THEN 'refund' ELSE 'invoice payment' END
      || ' ' || COALESCE(v_inv.invoice_number,''),
    'simulated', jsonb_build_object('simulated', true, 'scenario', p_scenario));

  BEGIN
    PERFORM public.apply_provider_balance_delta(p_provider_id, 'available',
      CASE WHEN p_scenario='refunded' THEN -v_amount ELSE v_amount END, v_ccy);
  EXCEPTION WHEN OTHERS THEN NULL;  -- never fail the rail on a balance-bucket naming difference
  END;

  UPDATE public.provider_invoices
     SET payment_status = CASE WHEN p_scenario='refunded' THEN 'refunded' ELSE 'paid' END,
         client_action_status = CASE WHEN p_scenario='refunded' THEN client_action_status ELSE 'paid' END,
         paid_at = CASE WHEN p_scenario='refunded' THEN paid_at ELSE now() END,
         updated_at = now(),
         metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('simulated', true)
   WHERE id = p_invoice_id;

  IF p_payment_plan_item_id IS NOT NULL THEN
    UPDATE public.provider_payment_plan_items
       SET status='paid', paid_at=now(), processor='manual', payment_transaction_id=v_txn,
           stripe_session_id=v_ref, updated_at=now(),
           metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object('simulated', true)
     WHERE id = p_payment_plan_item_id;
  END IF;

  RETURN jsonb_build_object('ok',true,'scenario',p_scenario,'transaction_id',v_txn,
    'amount',v_amount,'currency',v_ccy,'rail','simulated');
END;
$$;
REVOKE ALL ON FUNCTION public.simulate_provider_payment(uuid,uuid,numeric,text,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.simulate_provider_payment(uuid,uuid,numeric,text,uuid,text)
  TO authenticated, service_role;

-- =====================================================================
-- PHASE 8 — jobs_marketplace_public (2026-07-30, post-build repair)
--
-- This view did NOT exist in the live database while four surfaces queried
-- it: JobsMarketplace.tsx, JobDetails.tsx, SubmitBid.tsx, RecentJobs.tsx —
-- i.e. the entire post-job → browse → bid loop. Creating it here.
--
--  * security_invoker=true: jobs_posted SELECT is already open, so there is
--    no reason to escalate. Containment lives in the base policy, once.
--  * patient_notes deliberately EXCLUDED — free-text clinical context on
--    Medical Baise, read by no consumer of this view.
--  * customer_id included — JobDetails uses it for the ownership check.
-- =====================================================================

GRANT EXECUTE ON FUNCTION public.user_is_test_account(uuid) TO anon;

DROP POLICY IF EXISTS "Jobs viewable by everyone" ON public.jobs_posted;
DROP POLICY IF EXISTS "jobs_posted_select_scoped" ON public.jobs_posted;
CREATE POLICY "jobs_posted_select_scoped" ON public.jobs_posted FOR SELECT
  USING (
        NOT public.user_is_test_account(customer_id)
     OR customer_id = auth.uid()
     OR public.current_user_is_test_cohort_peer(platform)
     OR public.has_role(auth.uid(), 'admin')
  );

CREATE OR REPLACE VIEW public.jobs_marketplace_public
WITH (security_invoker = true) AS
  SELECT j.id, j.customer_id, j.title, j.description, j.category_id,
         j.location_address, j.location_lat, j.location_lng,
         j.budget_min, j.budget_max, j.budget_disclosed, j.urgency,
         j.preferred_start_date, j.preferred_end_date, j.materials_included,
         j.insurance_required, j.license_required, j.max_bids, j.bid_deadline,
         j.status, j.is_featured, j.is_urgent, j.appointment_type,
         j.is_teleconsultation, j.platform, j.created_at, j.updated_at
    FROM public.jobs_posted j;

GRANT SELECT ON public.jobs_marketplace_public TO anon, authenticated;

COMMENT ON VIEW public.jobs_marketplace_public IS
  'Public marketplace projection of jobs_posted. Excludes patient_notes. security_invoker=true so jobs_posted RLS (including test-cohort containment) applies.';

-- =====================================================================
-- PHASE 9 — pilot recruitment intake (public /pilot page)
--
-- Captures an APPLICATION + consent. NOT the signature: the cleared Tester
-- Agreement is still executed via Inkless before a code is issued.
-- Flow: apply -> sign -> code.
--
-- Write-only from outside: no anon/authenticated SELECT at all, and inserts go
-- exclusively through submit_pilot_application(). Rows hold name/email/phone,
-- so there must be no read path to enumerate.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.pilot_applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key          text NOT NULL,
  platform         public.baise_platform NOT NULL,
  full_name        text NOT NULL,
  email            text NOT NULL,
  phone            text,
  city             text,
  intended_role    text NOT NULL,
  profession       text,
  years_experience integer,
  device           text,
  motivation       text,
  consent_terms    boolean NOT NULL DEFAULT false,
  consent_lgpd     boolean NOT NULL DEFAULT false,
  consent_version  text NOT NULL,
  consented_at     timestamptz,
  status           text NOT NULL DEFAULT 'new',
  invite_id        uuid REFERENCES public.test_cohort_invites(id) ON DELETE SET NULL,
  reviewed_by      uuid,
  reviewed_at      timestamptz,
  notes            text,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN ALTER TABLE public.pilot_applications
  ADD CONSTRAINT pilot_applications_app_key_check CHECK (app_key IN ('casa','medical','legal'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.pilot_applications
  ADD CONSTRAINT pilot_applications_role_check CHECK (intended_role IN ('provider','client'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.pilot_applications
  ADD CONSTRAINT pilot_applications_status_check
  CHECK (status IN ('new','shortlisted','invited','signed','declined','withdrawn'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- consent is not optional: a row cannot exist without both acknowledgements
DO $$ BEGIN ALTER TABLE public.pilot_applications
  ADD CONSTRAINT pilot_applications_consent_check CHECK (consent_terms AND consent_lgpd);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS pilot_applications_app_email_uidx
  ON public.pilot_applications (app_key, lower(email));
CREATE INDEX IF NOT EXISTS pilot_applications_status_idx
  ON public.pilot_applications (status, created_at DESC);

ALTER TABLE public.pilot_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pilot_applications FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "Admins manage pilot applications" ON public.pilot_applications;
CREATE POLICY "Admins manage pilot applications"
  ON public.pilot_applications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Returns {ok:true} for both a new application and a re-submission, so the
-- endpoint cannot be used to test whether an address already applied.
CREATE OR REPLACE FUNCTION public.submit_pilot_application(
  p_app_key text, p_full_name text, p_email text, p_intended_role text,
  p_consent_terms boolean, p_consent_lgpd boolean, p_consent_version text,
  p_phone text DEFAULT NULL, p_city text DEFAULT NULL, p_profession text DEFAULT NULL,
  p_years_experience integer DEFAULT NULL, p_device text DEFAULT NULL,
  p_motivation text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE v_email text; v_platform public.baise_platform;
BEGIN
  IF p_consent_terms IS NOT TRUE OR p_consent_lgpd IS NOT TRUE THEN
    RETURN jsonb_build_object('ok',false,'error','CONSENT_REQUIRED'); END IF;
  IF p_app_key NOT IN ('casa','medical','legal') THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_APP'); END IF;
  IF p_intended_role NOT IN ('provider','client') THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_ROLE'); END IF;

  v_email := lower(btrim(COALESCE(p_email,'')));
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_EMAIL'); END IF;
  IF length(btrim(COALESCE(p_full_name,''))) < 2 THEN
    RETURN jsonb_build_object('ok',false,'error','INVALID_NAME'); END IF;

  v_platform := public.app_key_to_platform(p_app_key);

  INSERT INTO public.pilot_applications (
    app_key, platform, full_name, email, phone, city, intended_role, profession,
    years_experience, device, motivation, consent_terms, consent_lgpd,
    consent_version, consented_at)
  VALUES (
    p_app_key, v_platform, btrim(p_full_name), v_email, NULLIF(btrim(COALESCE(p_phone,'')),''),
    NULLIF(btrim(COALESCE(p_city,'')),''), p_intended_role,
    NULLIF(btrim(COALESCE(p_profession,'')),''), p_years_experience,
    NULLIF(btrim(COALESCE(p_device,'')),''), NULLIF(btrim(COALESCE(p_motivation,'')),''),
    true, true, p_consent_version, now())
  ON CONFLICT (app_key, lower(email)) DO UPDATE SET
    full_name        = EXCLUDED.full_name,
    phone            = COALESCE(EXCLUDED.phone, public.pilot_applications.phone),
    city             = COALESCE(EXCLUDED.city, public.pilot_applications.city),
    intended_role    = EXCLUDED.intended_role,
    profession       = COALESCE(EXCLUDED.profession, public.pilot_applications.profession),
    years_experience = COALESCE(EXCLUDED.years_experience, public.pilot_applications.years_experience),
    device           = COALESCE(EXCLUDED.device, public.pilot_applications.device),
    motivation       = COALESCE(EXCLUDED.motivation, public.pilot_applications.motivation),
    consent_version  = EXCLUDED.consent_version,
    consented_at     = now(),
    updated_at       = now()
  WHERE public.pilot_applications.status IN ('new','shortlisted','withdrawn');

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_pilot_application(text,text,text,text,boolean,boolean,text,text,text,text,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_pilot_application(text,text,text,text,boolean,boolean,text,text,text,text,integer,text,text)
  TO anon, authenticated, service_role;
