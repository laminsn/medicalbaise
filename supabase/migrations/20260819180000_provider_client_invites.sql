-- Shared Casa-equivalent client invitation spine.
-- Casa / Medical / Legal / Tech / Influencer share project xpcoaedbfmtyzvkwhaav.
-- Table + RPC names match Casa: provider_client_invites, redeem_client_invite, etc.
-- Raw token is NEVER persisted. Only sha256(token) is stored. URL carries the raw token.
-- Do not edit 2026081912 / 2026081913 / 2026081914 (Batches 1–3). This file is additive.

-- pgcrypto lives in schema `extensions` (digest / gen_random_bytes).
-- Fail-closed app_key: allowlist only. NULL / unknown / '' is rejected. No coerce-to-casa.

CREATE OR REPLACE FUNCTION public.is_allowed_client_invite_app_key(p_app_key text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_app_key IN ('casa', 'medical', 'legal', 'tech', 'influencer');
$$;
REVOKE ALL ON FUNCTION public.is_allowed_client_invite_app_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_allowed_client_invite_app_key(text) TO service_role;

CREATE OR REPLACE FUNCTION public.hash_client_invite_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');
$$;
REVOKE ALL ON FUNCTION public.hash_client_invite_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hash_client_invite_token(text) TO service_role;

CREATE OR REPLACE FUNCTION public.client_invite_token_well_formed(p_token text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_token IS NOT NULL
     AND char_length(p_token) BETWEEN 32 AND 128
     AND p_token ~ '^[A-Za-z0-9_-]+$';
$$;
REVOKE ALL ON FUNCTION public.client_invite_token_well_formed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_invite_token_well_formed(text) TO service_role;

CREATE TABLE IF NOT EXISTS public.provider_client_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  invited_by uuid NOT NULL,
  app_key text NOT NULL,
  token_hash text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  redeemed_by uuid,
  redeemed_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_client_invites
  ADD COLUMN IF NOT EXISTS provider_id uuid,
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS app_key text,
  ADD COLUMN IF NOT EXISTS token_hash text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS redeemed_by uuid,
  ADD COLUMN IF NOT EXISTS redeemed_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.provider_client_invites
    ADD CONSTRAINT provider_client_invites_app_key_check
    CHECK (public.is_allowed_client_invite_app_key(app_key));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.provider_client_invites
    ADD CONSTRAINT provider_client_invites_status_check
    CHECK (status IN ('pending', 'redeemed', 'revoked', 'expired'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.provider_client_invites
    ADD CONSTRAINT provider_client_invites_token_hash_unique UNIQUE (token_hash);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS provider_client_invites_provider_idx
  ON public.provider_client_invites (provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS provider_client_invites_redeemed_idx
  ON public.provider_client_invites (redeemed_by)
  WHERE redeemed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS provider_client_invites_pending_idx
  ON public.provider_client_invites (status, expires_at)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.provider_client_invite_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.provider_client_invites(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  service_id uuid REFERENCES public.provider_services(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  amount numeric,
  currency text NOT NULL DEFAULT 'BRL',
  approval_status text NOT NULL DEFAULT 'proposed',
  payment_status text NOT NULL DEFAULT 'unpaid',
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.provider_client_invite_items
    ADD CONSTRAINT provider_client_invite_items_approval_check
    CHECK (approval_status IN ('proposed', 'approved', 'declined'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.provider_client_invite_items
    ADD CONSTRAINT provider_client_invite_items_payment_check
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS provider_client_invite_items_invite_idx
  ON public.provider_client_invite_items (invite_id);
CREATE INDEX IF NOT EXISTS provider_client_invite_items_provider_idx
  ON public.provider_client_invite_items (provider_id);

CREATE TABLE IF NOT EXISTS public.provider_client_invite_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES public.provider_client_invites(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE RESTRICT,
  invited_by uuid NOT NULL,
  channel text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.provider_client_invite_sends
    ADD CONSTRAINT provider_client_invite_sends_channel_check
    CHECK (channel IN ('email', 'whatsapp', 'sms', 'copy'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS provider_client_invite_sends_provider_idx
  ON public.provider_client_invite_sends (provider_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.provider_client_invite_redeem_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  app_key text,
  outcome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_client_invite_redeem_attempts_user_idx
  ON public.provider_client_invite_redeem_attempts (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS: inviting provider + redeeming user after bind. No USING(true).
-- Anon cannot SELECT. Authenticated cannot write tables directly.
-- ---------------------------------------------------------------------------

ALTER TABLE public.provider_client_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_client_invite_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_client_invite_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_client_invite_redeem_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.provider_client_invites FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.provider_client_invite_items FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.provider_client_invite_sends FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.provider_client_invite_redeem_attempts FROM PUBLIC, anon, authenticated;

-- Participants may SELECT invite rows they own/redeemed, but never token_hash.
-- service_role + SECURITY DEFINER RPCs keep full-row access for hash-compare.
GRANT SELECT (
  id,
  provider_id,
  invited_by,
  app_key,
  status,
  expires_at,
  redeemed_by,
  redeemed_at,
  revoked_at,
  metadata,
  created_at,
  updated_at
) ON TABLE public.provider_client_invites TO authenticated;
GRANT SELECT ON TABLE public.provider_client_invites TO service_role;
GRANT SELECT ON TABLE public.provider_client_invite_items TO authenticated;
GRANT SELECT ON TABLE public.provider_client_invite_sends TO authenticated;

CREATE OR REPLACE FUNCTION public.client_invite_is_participant(p_invite_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.provider_client_invites i
    WHERE i.id = p_invite_id
      AND (
        i.redeemed_by = auth.uid()
        OR public.provider_owned_by_current_user(i.provider_id)
        OR i.invited_by = auth.uid()
      )
  );
$$;
REVOKE ALL ON FUNCTION public.client_invite_is_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.client_invite_is_participant(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "provider_client_invites_select_participants" ON public.provider_client_invites;
CREATE POLICY "provider_client_invites_select_participants"
  ON public.provider_client_invites
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR public.provider_owned_by_current_user(provider_id)
    OR redeemed_by = auth.uid()
  );

DROP POLICY IF EXISTS "provider_client_invite_items_select_participants" ON public.provider_client_invite_items;
CREATE POLICY "provider_client_invite_items_select_participants"
  ON public.provider_client_invite_items
  FOR SELECT
  TO authenticated
  USING (public.client_invite_is_participant(invite_id));

DROP POLICY IF EXISTS "provider_client_invite_sends_select_provider" ON public.provider_client_invite_sends;
CREATE POLICY "provider_client_invite_sends_select_provider"
  ON public.provider_client_invite_sends
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid()
    OR public.provider_owned_by_current_user(provider_id)
  );

-- No INSERT/UPDATE/DELETE policies: writes go through SECURITY DEFINER RPCs.
-- No policy for anon: anon cannot SELECT.
-- Clients have no table UPDATE grant, so they cannot write payment_status.
-- request_client_invite_payment may set pending; only settle_client_invite_payment
-- (inviting provider) may set paid.

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mint_client_invite(
  p_app_key text,
  p_service_ids uuid[] DEFAULT '{}'::uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_provider public.providers%ROWTYPE;
  v_platform public.baise_platform;
  v_token text;
  v_hash text;
  v_invite_id uuid;
  v_service_id uuid;
  v_title text;
  v_amount numeric;
  v_count int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  -- Fail-closed. NULL / blank / unknown is rejected. Never coerce to casa.
  IF p_app_key IS NULL OR btrim(p_app_key) = '' OR NOT public.is_allowed_client_invite_app_key(p_app_key) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'APP_KEY_REJECTED');
  END IF;

  SELECT * INTO v_provider
  FROM public.providers
  WHERE user_id = v_uid
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_A_PROVIDER');
  END IF;

  -- Fail-closed: only mint when app_key maps onto this provider's platform.
  -- tech/influencer are allowlisted on the column but have no baise_platform
  -- mapping here, so they are rejected (no coerce, no cross-app mint).
  v_platform := public.app_key_to_platform(p_app_key);
  IF v_platform IS NULL OR v_provider.platform IS DISTINCT FROM v_platform THEN
    RETURN jsonb_build_object('ok', false, 'error', 'APP_KEY_MISMATCH');
  END IF;

  IF (SELECT count(*) FROM public.provider_client_invites
       WHERE provider_id = v_provider.id
         AND created_at > now() - interval '1 hour') >= 10 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RATE_LIMITED');
  END IF;

  IF COALESCE(array_length(p_service_ids, 1), 0) > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'TOO_MANY_SERVICES');
  END IF;

  IF COALESCE(array_length(p_service_ids, 1), 0) > 0 THEN
    SELECT count(*) INTO v_count
    FROM public.provider_services s
    WHERE s.id = ANY (p_service_ids)
      AND s.provider_id = v_provider.id;
    IF v_count IS DISTINCT FROM COALESCE(array_length(p_service_ids, 1), 0) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'SERVICE_NOT_OWNED');
    END IF;
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := public.hash_client_invite_token(v_token);

  INSERT INTO public.provider_client_invites (
    provider_id, invited_by, app_key, token_hash, status, expires_at, metadata
  ) VALUES (
    v_provider.id, v_uid, p_app_key, v_hash, 'pending', now() + interval '7 days',
    jsonb_build_object('minted_by_app', p_app_key)
  )
  RETURNING id INTO v_invite_id;

  FOREACH v_service_id IN ARRAY COALESCE(p_service_ids, '{}'::uuid[]) LOOP
    SELECT
      COALESCE(NULLIF(btrim(s.description), ''), 'Proposed service'),
      s.fixed_price
    INTO v_title, v_amount
    FROM public.provider_services s
    WHERE s.id = v_service_id AND s.provider_id = v_provider.id;

    INSERT INTO public.provider_client_invite_items (
      invite_id, provider_id, service_id, title, amount, currency
    ) VALUES (
      v_invite_id, v_provider.id, v_service_id, v_title, v_amount, 'BRL'
    );
  END LOOP;

  -- Raw token returned once. It is not stored.
  RETURN jsonb_build_object(
    'ok', true,
    'invite_id', v_invite_id,
    'token', v_token,
    'app_key', p_app_key,
    'expires_at', now() + interval '7 days'
  );
END;
$$;
REVOKE ALL ON FUNCTION public.mint_client_invite(text, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mint_client_invite(text, uuid[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.preview_client_invite(p_token text, p_app_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_inv public.provider_client_invites%ROWTYPE;
  v_name text;
  v_services jsonb;
BEGIN
  IF p_app_key IS NULL OR btrim(p_app_key) = '' OR NOT public.is_allowed_client_invite_app_key(p_app_key) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'APP_KEY_REJECTED');
  END IF;
  IF NOT public.client_invite_token_well_formed(p_token) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  END IF;

  SELECT * INTO v_inv
  FROM public.provider_client_invites
  WHERE token_hash = public.hash_client_invite_token(p_token);

  -- Generic miss: do not distinguish missing / used / expired / wrong app to anon.
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  END IF;
  IF v_inv.app_key IS DISTINCT FROM p_app_key THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  END IF;
  IF v_inv.status IS DISTINCT FROM 'pending' OR v_inv.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  END IF;

  SELECT COALESCE(NULLIF(btrim(p.business_name), ''), 'A Baise provider')
    INTO v_name
  FROM public.providers p
  WHERE p.id = v_inv.provider_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'title', it.title,
           'amount', it.amount,
           'currency', it.currency
         ) ORDER BY it.created_at), '[]'::jsonb)
    INTO v_services
  FROM public.provider_client_invite_items it
  WHERE it.invite_id = v_inv.id;

  -- Welcome payload only. No emails, phones, other clients, or invite ids.
  RETURN jsonb_build_object(
    'ok', true,
    'provider_name', v_name,
    'expires_at', v_inv.expires_at,
    'services', v_services
  );
END;
$$;
REVOKE ALL ON FUNCTION public.preview_client_invite(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_client_invite(text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.redeem_client_invite(p_token text, p_app_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inv public.provider_client_invites%ROWTYPE;
  v_name text;
  v_services jsonb;
  v_rows int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF p_app_key IS NULL OR btrim(p_app_key) = '' OR NOT public.is_allowed_client_invite_app_key(p_app_key) THEN
    INSERT INTO public.provider_client_invite_redeem_attempts(user_id, app_key, outcome)
    VALUES (v_uid, p_app_key, 'APP_KEY_REJECTED');
    RETURN jsonb_build_object('ok', false, 'error', 'APP_KEY_REJECTED');
  END IF;

  IF (SELECT count(*) FROM public.provider_client_invite_redeem_attempts
       WHERE user_id = v_uid AND created_at > now() - interval '1 hour') >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RATE_LIMITED');
  END IF;

  INSERT INTO public.provider_client_invite_redeem_attempts(user_id, app_key, outcome)
  VALUES (v_uid, p_app_key, 'ATTEMPT');

  IF NOT public.client_invite_token_well_formed(p_token) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  END IF;

  SELECT * INTO v_inv
  FROM public.provider_client_invites
  WHERE token_hash = public.hash_client_invite_token(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_TOKEN');
  END IF;

  IF v_inv.app_key IS DISTINCT FROM p_app_key THEN
    RETURN jsonb_build_object('ok', false, 'error', 'APP_KEY_MISMATCH');
  END IF;

  -- Idempotent re-entry for the bound patient only.
  IF v_inv.redeemed_by IS NOT NULL AND v_inv.redeemed_by = v_uid THEN
    SELECT COALESCE(NULLIF(btrim(p.business_name), ''), 'A Baise provider')
      INTO v_name
    FROM public.providers p WHERE p.id = v_inv.provider_id;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'id', it.id,
             'title', it.title,
             'amount', it.amount,
             'currency', it.currency,
             'approval_status', it.approval_status,
             'payment_status', it.payment_status
           ) ORDER BY it.created_at), '[]'::jsonb)
      INTO v_services
    FROM public.provider_client_invite_items it
    WHERE it.invite_id = v_inv.id;

    UPDATE public.provider_client_invite_redeem_attempts
       SET outcome = 'OK_REENTRY'
     WHERE user_id = v_uid AND outcome = 'ATTEMPT'
       AND created_at = (SELECT max(created_at) FROM public.provider_client_invite_redeem_attempts WHERE user_id = v_uid);

    RETURN jsonb_build_object(
      'ok', true,
      'invite_id', v_inv.id,
      'provider_id', v_inv.provider_id,
      'provider_name', v_name,
      'app_key', v_inv.app_key,
      'status', v_inv.status,
      'services', v_services
    );
  END IF;

  IF v_inv.status = 'revoked' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'REVOKED');
  END IF;
  IF v_inv.expires_at <= now() THEN
    UPDATE public.provider_client_invites
       SET status = 'expired', updated_at = now()
     WHERE id = v_inv.id AND status = 'pending';
    RETURN jsonb_build_object('ok', false, 'error', 'EXPIRED');
  END IF;
  IF v_inv.status IS DISTINCT FROM 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_USED');
  END IF;

  -- Recipient is a patient/customer. Never grant provider or admin.
  UPDATE public.profiles
     SET user_type = 'customer',
         is_provider = false
   WHERE user_id = v_uid
     AND COALESCE(is_provider, false) = false
     AND user_type IS DISTINCT FROM 'provider';

  -- Single-use bind.
  UPDATE public.provider_client_invites
     SET status = 'redeemed',
         redeemed_by = v_uid,
         redeemed_at = now(),
         updated_at = now()
   WHERE id = v_inv.id
     AND status = 'pending'
     AND redeemed_by IS NULL;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_USED');
  END IF;

  SELECT COALESCE(NULLIF(btrim(p.business_name), ''), 'A Baise provider')
    INTO v_name
  FROM public.providers p WHERE p.id = v_inv.provider_id;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', it.id,
           'title', it.title,
           'amount', it.amount,
           'currency', it.currency,
           'approval_status', it.approval_status,
           'payment_status', it.payment_status
         ) ORDER BY it.created_at), '[]'::jsonb)
    INTO v_services
  FROM public.provider_client_invite_items it
  WHERE it.invite_id = v_inv.id;

  UPDATE public.provider_client_invite_redeem_attempts
     SET outcome = 'OK'
   WHERE user_id = v_uid AND outcome = 'ATTEMPT'
     AND created_at = (SELECT max(created_at) FROM public.provider_client_invite_redeem_attempts WHERE user_id = v_uid);

  RETURN jsonb_build_object(
    'ok', true,
    'invite_id', v_inv.id,
    'provider_id', v_inv.provider_id,
    'provider_name', v_name,
    'app_key', v_inv.app_key,
    'status', 'redeemed',
    'services', v_services
  );
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_client_invite(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_client_invite(text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.revoke_client_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rows int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  UPDATE public.provider_client_invites
     SET status = 'revoked',
         revoked_at = now(),
         updated_at = now()
   WHERE id = p_invite_id
     AND status = 'pending'
     AND (invited_by = v_uid OR public.provider_owned_by_current_user(provider_id));
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_client_invite(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_client_invite(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_client_invite_send(p_invite_id uuid, p_channel text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_inv public.provider_client_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_channel IS NULL OR p_channel NOT IN ('email', 'whatsapp', 'sms', 'copy') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_CHANNEL');
  END IF;

  SELECT * INTO v_inv FROM public.provider_client_invites WHERE id = p_invite_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  IF NOT (v_inv.invited_by = v_uid OR public.provider_owned_by_current_user(v_inv.provider_id)) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  IF (SELECT count(*) FROM public.provider_client_invite_sends
       WHERE provider_id = v_inv.provider_id
         AND created_at > now() - interval '1 hour') >= 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'RATE_LIMITED');
  END IF;

  INSERT INTO public.provider_client_invite_sends (invite_id, provider_id, invited_by, channel)
  VALUES (v_inv.id, v_inv.provider_id, v_uid, p_channel);

  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.record_client_invite_send(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_client_invite_send(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.approve_client_invite_item(p_item_id uuid, p_decision text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item public.provider_client_invite_items%ROWTYPE;
  v_inv public.provider_client_invites%ROWTYPE;
  v_decision text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;
  v_decision := lower(btrim(COALESCE(p_decision, '')));
  IF v_decision NOT IN ('approved', 'declined') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_DECISION');
  END IF;

  SELECT * INTO v_item FROM public.provider_client_invite_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  SELECT * INTO v_inv FROM public.provider_client_invites WHERE id = v_item.invite_id FOR UPDATE;
  IF v_inv.redeemed_by IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  UPDATE public.provider_client_invite_items
     SET approval_status = v_decision,
         approved_at = CASE WHEN v_decision = 'approved' THEN now() ELSE NULL END,
         updated_at = now()
   WHERE id = v_item.id;

  RETURN jsonb_build_object('ok', true, 'approval_status', v_decision, 'payment_status', v_item.payment_status);
END;
$$;
REVOKE ALL ON FUNCTION public.approve_client_invite_item(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_client_invite_item(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.request_client_invite_payment(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item public.provider_client_invite_items%ROWTYPE;
  v_inv public.provider_client_invites%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_item FROM public.provider_client_invite_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  SELECT * INTO v_inv FROM public.provider_client_invites WHERE id = v_item.invite_id FOR UPDATE;
  IF v_inv.redeemed_by IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;
  IF v_item.approval_status IS DISTINCT FROM 'approved' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_APPROVED');
  END IF;
  IF v_item.payment_status = 'paid' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'ALREADY_PAID');
  END IF;

  -- Participant may request payment. They cannot mark the item paid.
  UPDATE public.provider_client_invite_items
     SET payment_status = 'pending',
         updated_at = now()
   WHERE id = v_item.id
     AND payment_status IN ('unpaid', 'pending', 'failed');

  RETURN jsonb_build_object(
    'ok', true,
    'payment_status', 'pending',
    'amount', v_item.amount,
    'currency', v_item.currency
  );
END;
$$;
REVOKE ALL ON FUNCTION public.request_client_invite_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_client_invite_payment(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.settle_client_invite_payment(p_item_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item public.provider_client_invite_items%ROWTYPE;
  v_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED' USING ERRCODE = '42501';
  END IF;
  v_status := lower(btrim(COALESCE(p_status, '')));
  IF v_status NOT IN ('paid', 'failed') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'INVALID_STATUS');
  END IF;

  SELECT * INTO v_item FROM public.provider_client_invite_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  END IF;
  IF NOT public.provider_owned_by_current_user(v_item.provider_id)
     AND NOT public.has_role(v_uid, 'admin') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  END IF;

  UPDATE public.provider_client_invite_items
     SET payment_status = v_status,
         paid_at = CASE WHEN v_status = 'paid' THEN now() ELSE paid_at END,
         updated_at = now()
   WHERE id = v_item.id;

  RETURN jsonb_build_object('ok', true, 'payment_status', v_status);
END;
$$;
REVOKE ALL ON FUNCTION public.settle_client_invite_payment(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_client_invite_payment(uuid, text) TO authenticated, service_role;
