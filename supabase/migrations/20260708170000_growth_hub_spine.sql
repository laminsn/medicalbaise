-- Unified Growth Hub spine.
-- Connects partner applications, referrals, promotions, testimonials, payouts,
-- credits, and follow-up work into one measurable operating layer.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.normalize_growth_app_key(raw_app_key text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(nullif(raw_app_key, ''), 'casa'))
    WHEN 'medical' THEN 'medical'
    WHEN 'legal' THEN 'legal'
    ELSE 'casa'
  END;
$$;

ALTER TABLE public.promotional_campaigns
  ADD COLUMN IF NOT EXISTS app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal'));

ALTER TABLE public.campaign_redemptions
  ADD COLUMN IF NOT EXISTS app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.campaign_redemptions cr
SET app_key = pc.app_key
FROM public.promotional_campaigns pc
WHERE cr.campaign_id = pc.id
  AND cr.app_key IS DISTINCT FROM pc.app_key;

ALTER TABLE public.promotional_campaigns
  DROP CONSTRAINT IF EXISTS promotional_campaigns_promo_code_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotional_campaigns_app_code_unique
  ON public.promotional_campaigns(app_key, upper(promo_code))
  WHERE promo_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_app_active
  ON public.promotional_campaigns(app_key, is_active, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_redemptions_app_user
  ON public.campaign_redemptions(app_key, user_id, redeemed_at DESC);

CREATE TABLE IF NOT EXISTS public.growth_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  person_type text NOT NULL DEFAULT 'unknown'
    CHECK (person_type IN (
      'lead',
      'client',
      'provider',
      'partner',
      'influencer',
      'referral_lead',
      'staff',
      'unknown'
    )),
  full_name text,
  email text,
  phone text,
  preferred_locale text DEFAULT 'en',
  client_id text,
  referral_code text,
  partner_code text,
  lead_source text,
  campaign_key text,
  consent jsonb NOT NULL DEFAULT '{}'::jsonb,
  communication_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  duplicate_warning boolean NOT NULL DEFAULT false,
  duplicate_of uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_people_app_email_unique
  ON public.growth_people(app_key, lower(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_people_referral_code
  ON public.growth_people(app_key, referral_code)
  WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_people_partner_code
  ON public.growth_people(app_key, partner_code)
  WHERE partner_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_growth_people_client_id
  ON public.growth_people(app_key, client_id)
  WHERE client_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.growth_campaign_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  intake_type text NOT NULL
    CHECK (intake_type IN (
      'partner_application',
      'referral',
      'promotion',
      'promo_lead',
      'testimonial',
      'partner_campaign',
      'payout',
      'credit',
      'email_sequence'
    )),
  campaign_key text,
  campaign_name text,
  landing_page text,
  language text DEFAULT 'en',
  source text,
  source_table text NOT NULL,
  source_id text NOT NULL,
  person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  partner_campaign_id uuid REFERENCES public.partner_campaigns(id) ON DELETE SET NULL,
  partner_membership_id uuid REFERENCES public.partner_campaign_memberships(id) ON DELETE SET NULL,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  testimonial_reward_id uuid REFERENCES public.client_testimonial_rewards(id) ON DELETE SET NULL,
  promotional_campaign_id uuid REFERENCES public.promotional_campaigns(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new',
  stage text NOT NULL DEFAULT 'captured',
  approval_status text,
  eligibility_status text,
  assigned_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  duplicate_warning boolean NOT NULL DEFAULT false,
  value_amount numeric NOT NULL DEFAULT 0,
  credit_amount numeric NOT NULL DEFAULT 0,
  payout_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT growth_campaign_intakes_source_unique UNIQUE (source_table, source_id)
);

CREATE INDEX IF NOT EXISTS idx_growth_campaign_intakes_app_type
  ON public.growth_campaign_intakes(app_key, intake_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_campaign_intakes_person
  ON public.growth_campaign_intakes(person_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_campaign_intakes_owner
  ON public.growth_campaign_intakes(assigned_owner_id, status, due_at);

CREATE INDEX IF NOT EXISTS idx_growth_campaign_intakes_campaign
  ON public.growth_campaign_intakes(app_key, campaign_key, created_at DESC);

CREATE TABLE IF NOT EXISTS public.growth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  intake_id uuid REFERENCES public.growth_campaign_intakes(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_family text NOT NULL
    CHECK (event_family IN ('partner', 'referral', 'promotion', 'testimonial', 'payout', 'credit', 'email', 'system')),
  event_type text NOT NULL,
  action_taken text,
  source_table text,
  source_id text,
  campaign_key text,
  status text,
  amount numeric,
  currency text NOT NULL DEFAULT 'BRL',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_events_app_family
  ON public.growth_events(app_key, event_family, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_growth_events_intake
  ON public.growth_events(intake_id, occurred_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_growth_events_source_event_unique
  ON public.growth_events(source_table, source_id, event_type, coalesce(status, ''))
  WHERE source_table IS NOT NULL AND source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.growth_followup_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  intake_id uuid REFERENCES public.growth_campaign_intakes(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.growth_events(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  task_type text NOT NULL DEFAULT 'follow_up'
    CHECK (task_type IN ('follow_up', 'review', 'approve', 'credit', 'payout', 'email', 'fraud_review')),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_followup_tasks_app_status
  ON public.growth_followup_tasks(app_key, status, due_at);

DROP TRIGGER IF EXISTS update_growth_people_updated_at ON public.growth_people;
CREATE TRIGGER update_growth_people_updated_at
  BEFORE UPDATE ON public.growth_people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_growth_campaign_intakes_updated_at ON public.growth_campaign_intakes;
CREATE TRIGGER update_growth_campaign_intakes_updated_at
  BEFORE UPDATE ON public.growth_campaign_intakes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_growth_followup_tasks_updated_at ON public.growth_followup_tasks;
CREATE TRIGGER update_growth_followup_tasks_updated_at
  BEFORE UPDATE ON public.growth_followup_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.growth_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_campaign_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_followup_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage growth people" ON public.growth_people;
CREATE POLICY "Admins manage growth people"
ON public.growth_people FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users view own growth people record" ON public.growth_people;
CREATE POLICY "Users view own growth people record"
ON public.growth_people FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage growth intakes" ON public.growth_campaign_intakes;
CREATE POLICY "Admins manage growth intakes"
ON public.growth_campaign_intakes FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users view own growth intakes" ON public.growth_campaign_intakes;
CREATE POLICY "Users view own growth intakes"
ON public.growth_campaign_intakes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR partner_user_id = auth.uid()
  OR referrer_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins manage growth events" ON public.growth_events;
CREATE POLICY "Admins manage growth events"
ON public.growth_events FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users view own growth events" ON public.growth_events;
CREATE POLICY "Users view own growth events"
ON public.growth_events FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.growth_campaign_intakes gi
    WHERE gi.id = growth_events.intake_id
      AND (
        gi.user_id = auth.uid()
        OR gi.partner_user_id = auth.uid()
        OR gi.referrer_id = auth.uid()
      )
  )
);

DROP POLICY IF EXISTS "Admins manage growth followup tasks" ON public.growth_followup_tasks;
CREATE POLICY "Admins manage growth followup tasks"
ON public.growth_followup_tasks FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Assigned staff view growth followup tasks" ON public.growth_followup_tasks;
CREATE POLICY "Assigned staff view growth followup tasks"
ON public.growth_followup_tasks FOR SELECT TO authenticated
USING (assigned_to = auth.uid() OR public.is_admin_or_moderator());

CREATE OR REPLACE FUNCTION public.upsert_growth_person(
  target_app_key text,
  target_user_id uuid DEFAULT NULL,
  target_person_type text DEFAULT 'unknown',
  target_full_name text DEFAULT NULL,
  target_email text DEFAULT NULL,
  target_phone text DEFAULT NULL,
  target_preferred_locale text DEFAULT NULL,
  target_client_id text DEFAULT NULL,
  target_referral_code text DEFAULT NULL,
  target_partner_code text DEFAULT NULL,
  target_lead_source text DEFAULT NULL,
  target_campaign_key text DEFAULT NULL,
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  clean_person_type text := lower(coalesce(nullif(target_person_type, ''), 'unknown'));
  clean_email text := lower(nullif(trim(coalesce(target_email, '')), ''));
  clean_referral_code text := nullif(public.normalize_referral_code(target_referral_code), '');
  clean_partner_code text := nullif(public.normalize_partner_campaign_code(target_partner_code), '');
  target_id uuid;
BEGIN
  IF clean_person_type NOT IN ('lead', 'client', 'provider', 'partner', 'influencer', 'referral_lead', 'staff', 'unknown') THEN
    clean_person_type := 'unknown';
  END IF;

  IF auth.uid() IS NOT NULL
    AND target_user_id IS NOT NULL
    AND target_user_id IS DISTINCT FROM auth.uid()
    AND NOT public.is_admin_or_moderator()
  THEN
    RAISE EXCEPTION 'Growth profile access denied';
  END IF;

  SELECT gp.id
  INTO target_id
  FROM public.growth_people gp
  WHERE gp.app_key = clean_app_key
    AND (
      (target_user_id IS NOT NULL AND gp.user_id = target_user_id)
      OR (clean_email IS NOT NULL AND lower(gp.email) = clean_email)
      OR (target_client_id IS NOT NULL AND gp.client_id = target_client_id)
      OR (clean_referral_code IS NOT NULL AND gp.referral_code = clean_referral_code)
      OR (clean_partner_code IS NOT NULL AND gp.partner_code = clean_partner_code)
    )
  ORDER BY
    CASE WHEN target_user_id IS NOT NULL AND gp.user_id = target_user_id THEN 0 ELSE 1 END,
    gp.created_at
  LIMIT 1;

  IF target_id IS NULL THEN
    INSERT INTO public.growth_people (
      app_key,
      user_id,
      person_type,
      full_name,
      email,
      phone,
      preferred_locale,
      client_id,
      referral_code,
      partner_code,
      lead_source,
      campaign_key,
      metadata
    )
    VALUES (
      clean_app_key,
      target_user_id,
      clean_person_type,
      nullif(trim(coalesce(target_full_name, '')), ''),
      clean_email,
      nullif(trim(coalesce(target_phone, '')), ''),
      coalesce(nullif(target_preferred_locale, ''), 'en'),
      nullif(trim(coalesce(target_client_id, '')), ''),
      clean_referral_code,
      clean_partner_code,
      nullif(trim(coalesce(target_lead_source, '')), ''),
      nullif(trim(coalesce(target_campaign_key, '')), ''),
      coalesce(target_metadata, '{}'::jsonb)
    )
    RETURNING id INTO target_id;
  ELSE
    UPDATE public.growth_people gp
    SET
      user_id = coalesce(target_user_id, gp.user_id),
      person_type = CASE WHEN clean_person_type = 'unknown' THEN gp.person_type ELSE clean_person_type END,
      full_name = coalesce(nullif(trim(coalesce(target_full_name, '')), ''), gp.full_name),
      email = coalesce(clean_email, gp.email),
      phone = coalesce(nullif(trim(coalesce(target_phone, '')), ''), gp.phone),
      preferred_locale = coalesce(nullif(target_preferred_locale, ''), gp.preferred_locale),
      client_id = coalesce(nullif(trim(coalesce(target_client_id, '')), ''), gp.client_id),
      referral_code = coalesce(clean_referral_code, gp.referral_code),
      partner_code = coalesce(clean_partner_code, gp.partner_code),
      lead_source = coalesce(nullif(trim(coalesce(target_lead_source, '')), ''), gp.lead_source),
      campaign_key = coalesce(nullif(trim(coalesce(target_campaign_key, '')), ''), gp.campaign_key),
      metadata = gp.metadata || coalesce(target_metadata, '{}'::jsonb)
    WHERE gp.id = target_id;
  END IF;

  RETURN target_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_growth_intake(
  target_app_key text,
  target_intake_type text,
  target_source_table text,
  target_source_id text,
  target_person_id uuid DEFAULT NULL,
  target_user_id uuid DEFAULT NULL,
  target_campaign_key text DEFAULT NULL,
  target_campaign_name text DEFAULT NULL,
  target_landing_page text DEFAULT NULL,
  target_language text DEFAULT NULL,
  target_source text DEFAULT NULL,
  target_partner_user_id uuid DEFAULT NULL,
  target_referrer_id uuid DEFAULT NULL,
  target_partner_campaign_id uuid DEFAULT NULL,
  target_partner_membership_id uuid DEFAULT NULL,
  target_referral_id uuid DEFAULT NULL,
  target_testimonial_reward_id uuid DEFAULT NULL,
  target_promotional_campaign_id uuid DEFAULT NULL,
  target_status text DEFAULT 'new',
  target_stage text DEFAULT 'captured',
  target_approval_status text DEFAULT NULL,
  target_eligibility_status text DEFAULT NULL,
  target_assigned_owner_id uuid DEFAULT NULL,
  target_duplicate_warning boolean DEFAULT false,
  target_value_amount numeric DEFAULT 0,
  target_credit_amount numeric DEFAULT 0,
  target_payout_amount numeric DEFAULT 0,
  target_currency text DEFAULT 'BRL',
  target_due_at timestamptz DEFAULT NULL,
  target_completed_at timestamptz DEFAULT NULL,
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  clean_type text := lower(coalesce(nullif(target_intake_type, ''), 'promo_lead'));
  clean_source_table text := nullif(trim(coalesce(target_source_table, '')), '');
  clean_source_id text := nullif(trim(coalesce(target_source_id, '')), '');
  intake_id uuid;
BEGIN
  IF clean_type NOT IN (
    'partner_application',
    'referral',
    'promotion',
    'promo_lead',
    'testimonial',
    'partner_campaign',
    'payout',
    'credit',
    'email_sequence'
  ) THEN
    clean_type := 'promo_lead';
  END IF;

  IF clean_source_table IS NULL OR clean_source_id IS NULL THEN
    RAISE EXCEPTION 'Growth intake source_table and source_id are required';
  END IF;

  IF auth.uid() IS NOT NULL
    AND NOT public.is_admin_or_moderator()
    AND target_user_id IS DISTINCT FROM auth.uid()
    AND target_partner_user_id IS DISTINCT FROM auth.uid()
    AND target_referrer_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Growth intake access denied';
  END IF;

  INSERT INTO public.growth_campaign_intakes (
    app_key,
    intake_type,
    campaign_key,
    campaign_name,
    landing_page,
    language,
    source,
    source_table,
    source_id,
    person_id,
    user_id,
    partner_user_id,
    referrer_id,
    partner_campaign_id,
    partner_membership_id,
    referral_id,
    testimonial_reward_id,
    promotional_campaign_id,
    status,
    stage,
    approval_status,
    eligibility_status,
    assigned_owner_id,
    duplicate_warning,
    value_amount,
    credit_amount,
    payout_amount,
    currency,
    due_at,
    completed_at,
    metadata
  )
  VALUES (
    clean_app_key,
    clean_type,
    nullif(trim(coalesce(target_campaign_key, '')), ''),
    nullif(trim(coalesce(target_campaign_name, '')), ''),
    nullif(trim(coalesce(target_landing_page, '')), ''),
    coalesce(nullif(target_language, ''), 'en'),
    nullif(trim(coalesce(target_source, '')), ''),
    clean_source_table,
    clean_source_id,
    target_person_id,
    target_user_id,
    target_partner_user_id,
    target_referrer_id,
    target_partner_campaign_id,
    target_partner_membership_id,
    target_referral_id,
    target_testimonial_reward_id,
    target_promotional_campaign_id,
    coalesce(nullif(target_status, ''), 'new'),
    coalesce(nullif(target_stage, ''), 'captured'),
    nullif(trim(coalesce(target_approval_status, '')), ''),
    nullif(trim(coalesce(target_eligibility_status, '')), ''),
    target_assigned_owner_id,
    coalesce(target_duplicate_warning, false),
    coalesce(target_value_amount, 0),
    coalesce(target_credit_amount, 0),
    coalesce(target_payout_amount, 0),
    coalesce(nullif(target_currency, ''), 'BRL'),
    target_due_at,
    target_completed_at,
    coalesce(target_metadata, '{}'::jsonb)
  )
  ON CONFLICT ON CONSTRAINT growth_campaign_intakes_source_unique
  DO UPDATE SET
    app_key = EXCLUDED.app_key,
    intake_type = EXCLUDED.intake_type,
    campaign_key = coalesce(EXCLUDED.campaign_key, growth_campaign_intakes.campaign_key),
    campaign_name = coalesce(EXCLUDED.campaign_name, growth_campaign_intakes.campaign_name),
    landing_page = coalesce(EXCLUDED.landing_page, growth_campaign_intakes.landing_page),
    language = coalesce(EXCLUDED.language, growth_campaign_intakes.language),
    source = coalesce(EXCLUDED.source, growth_campaign_intakes.source),
    person_id = coalesce(EXCLUDED.person_id, growth_campaign_intakes.person_id),
    user_id = coalesce(EXCLUDED.user_id, growth_campaign_intakes.user_id),
    partner_user_id = coalesce(EXCLUDED.partner_user_id, growth_campaign_intakes.partner_user_id),
    referrer_id = coalesce(EXCLUDED.referrer_id, growth_campaign_intakes.referrer_id),
    partner_campaign_id = coalesce(EXCLUDED.partner_campaign_id, growth_campaign_intakes.partner_campaign_id),
    partner_membership_id = coalesce(EXCLUDED.partner_membership_id, growth_campaign_intakes.partner_membership_id),
    referral_id = coalesce(EXCLUDED.referral_id, growth_campaign_intakes.referral_id),
    testimonial_reward_id = coalesce(EXCLUDED.testimonial_reward_id, growth_campaign_intakes.testimonial_reward_id),
    promotional_campaign_id = coalesce(EXCLUDED.promotional_campaign_id, growth_campaign_intakes.promotional_campaign_id),
    status = EXCLUDED.status,
    stage = EXCLUDED.stage,
    approval_status = coalesce(EXCLUDED.approval_status, growth_campaign_intakes.approval_status),
    eligibility_status = coalesce(EXCLUDED.eligibility_status, growth_campaign_intakes.eligibility_status),
    assigned_owner_id = coalesce(EXCLUDED.assigned_owner_id, growth_campaign_intakes.assigned_owner_id),
    duplicate_warning = EXCLUDED.duplicate_warning,
    value_amount = EXCLUDED.value_amount,
    credit_amount = EXCLUDED.credit_amount,
    payout_amount = EXCLUDED.payout_amount,
    currency = EXCLUDED.currency,
    due_at = coalesce(EXCLUDED.due_at, growth_campaign_intakes.due_at),
    completed_at = coalesce(EXCLUDED.completed_at, growth_campaign_intakes.completed_at),
    metadata = growth_campaign_intakes.metadata || EXCLUDED.metadata
  RETURNING id INTO intake_id;

  RETURN intake_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_growth_event(
  target_app_key text,
  target_event_family text,
  target_event_type text,
  target_person_id uuid DEFAULT NULL,
  target_intake_id uuid DEFAULT NULL,
  target_user_id uuid DEFAULT NULL,
  target_action_taken text DEFAULT NULL,
  target_source_table text DEFAULT NULL,
  target_source_id text DEFAULT NULL,
  target_campaign_key text DEFAULT NULL,
  target_status text DEFAULT NULL,
  target_amount numeric DEFAULT NULL,
  target_currency text DEFAULT 'BRL',
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  clean_family text := lower(coalesce(nullif(target_event_family, ''), 'system'));
  clean_type text := nullif(trim(coalesce(target_event_type, '')), '');
  event_id uuid;
BEGIN
  IF clean_family NOT IN ('partner', 'referral', 'promotion', 'testimonial', 'payout', 'credit', 'email', 'system') THEN
    clean_family := 'system';
  END IF;

  IF clean_type IS NULL THEN
    RAISE EXCEPTION 'Growth event type is required';
  END IF;

  INSERT INTO public.growth_events (
    app_key,
    person_id,
    intake_id,
    user_id,
    event_family,
    event_type,
    action_taken,
    source_table,
    source_id,
    campaign_key,
    status,
    amount,
    currency,
    metadata
  )
  VALUES (
    clean_app_key,
    target_person_id,
    target_intake_id,
    target_user_id,
    clean_family,
    clean_type,
    nullif(trim(coalesce(target_action_taken, '')), ''),
    nullif(trim(coalesce(target_source_table, '')), ''),
    nullif(trim(coalesce(target_source_id, '')), ''),
    nullif(trim(coalesce(target_campaign_key, '')), ''),
    nullif(trim(coalesce(target_status, '')), ''),
    target_amount,
    coalesce(nullif(target_currency, ''), 'BRL'),
    coalesce(target_metadata, '{}'::jsonb)
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO event_id;

  IF event_id IS NULL AND target_source_table IS NOT NULL AND target_source_id IS NOT NULL THEN
    SELECT ge.id
    INTO event_id
    FROM public.growth_events ge
    WHERE ge.source_table = target_source_table
      AND ge.source_id = target_source_id
      AND ge.event_type = clean_type
      AND coalesce(ge.status, '') = coalesce(nullif(target_status, ''), '')
    ORDER BY ge.created_at DESC
    LIMIT 1;
  END IF;

  RETURN event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_growth_from_partner_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_id uuid;
  intake_id uuid;
  campaign_record public.partner_campaigns%ROWTYPE;
  stage_label text;
BEGIN
  SELECT *
  INTO campaign_record
  FROM public.partner_campaigns
  WHERE id = NEW.campaign_id;

  person_id := public.upsert_growth_person(
    NEW.app_key,
    NEW.user_id,
    CASE WHEN NEW.status = 'approved' THEN 'partner' ELSE 'influencer' END,
    NEW.full_name,
    NEW.email,
    NEW.phone,
    coalesce(NEW.audience_languages[1], 'en'),
    NULL,
    NULL,
    NULL,
    'influencer_application',
    coalesce(campaign_record.slug, 'influencer-partners'),
    jsonb_build_object(
      'application_id', NEW.id,
      'total_followers', NEW.total_followers,
      'primary_platform', NEW.primary_platform,
      'primary_handle', NEW.primary_handle
    )
  );

  stage_label := CASE
    WHEN NEW.status = 'lead' THEN 'lead_captured'
    WHEN NEW.status IN ('submitted', 'under_review') THEN 'needs_review'
    WHEN NEW.status = 'approved' THEN 'approved'
    WHEN NEW.status IN ('declined', 'waitlist') THEN NEW.status
    ELSE 'application'
  END;

  intake_id := public.upsert_growth_intake(
    NEW.app_key,
    'partner_application',
    'partner_influencer_applications',
    NEW.id::text,
    person_id,
    NEW.user_id,
    coalesce(campaign_record.slug, 'influencer-partners'),
    coalesce(campaign_record.name, 'Influencer partner application'),
    '/influencer-partners',
    coalesce(NEW.audience_languages[1], 'en'),
    'influencer_landing',
    NEW.user_id,
    NULL,
    NEW.campaign_id,
    NULL,
    NULL,
    NULL,
    NULL,
    NEW.status,
    stage_label,
    NEW.status,
    CASE WHEN NEW.total_followers >= 5000 THEN 'eligible' ELSE 'needs_review' END,
    NEW.reviewed_by,
    false,
    0,
    0,
    0,
    coalesce(campaign_record.currency, 'BRL'),
    NEW.review_due_at,
    NEW.reviewed_at,
    jsonb_build_object('review_notes', NEW.review_notes, 'campaign_interests', NEW.campaign_interests)
  );

  PERFORM public.record_growth_event(
    NEW.app_key,
    'partner',
    'partner_application_' || NEW.status,
    person_id,
    intake_id,
    NEW.user_id,
    'Partner application ' || NEW.status,
    'partner_influencer_applications',
    NEW.id::text,
    coalesce(campaign_record.slug, 'influencer-partners'),
    NEW.status,
    NULL,
    coalesce(campaign_record.currency, 'BRL'),
    jsonb_build_object('review_due_at', NEW.review_due_at)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_growth_from_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_id uuid;
  intake_id uuid;
  referrer_profile public.profiles%ROWTYPE;
  campaign_record public.partner_campaigns%ROWTYPE;
  membership_record public.partner_campaign_memberships%ROWTYPE;
BEGIN
  SELECT *
  INTO referrer_profile
  FROM public.profiles
  WHERE user_id = NEW.referrer_id
  LIMIT 1;

  SELECT *
  INTO campaign_record
  FROM public.partner_campaigns
  WHERE id = NEW.partner_campaign_id;

  SELECT *
  INTO membership_record
  FROM public.partner_campaign_memberships
  WHERE id = NEW.partner_campaign_membership_id;

  person_id := public.upsert_growth_person(
    NEW.app_key,
    NEW.referred_user_id,
    'referral_lead',
    NULL,
    NEW.referred_email,
    NULL,
    'en',
    NEW.client_id,
    NEW.referral_code,
    NULL,
    'referral',
    coalesce(campaign_record.slug, 'give-a-month-get-a-month'),
    jsonb_build_object('referrer_id', NEW.referrer_id, 'referral_id', NEW.id)
  );

  intake_id := public.upsert_growth_intake(
    NEW.app_key,
    'referral',
    'referrals',
    NEW.id::text,
    person_id,
    NEW.referred_user_id,
    coalesce(campaign_record.slug, 'give-a-month-get-a-month'),
    coalesce(campaign_record.name, 'Referral campaign'),
    '/give-a-month-get-a-month',
    'en',
    'client_referral',
    membership_record.partner_user_id,
    NEW.referrer_id,
    NEW.partner_campaign_id,
    NEW.partner_campaign_membership_id,
    NEW.id,
    NULL,
    NULL,
    NEW.status,
    CASE
      WHEN NEW.status = 'credited' THEN 'credit_issued'
      WHEN NEW.status = 'active' THEN 'became_client'
      ELSE 'referral_submitted'
    END,
    NULL,
    CASE WHEN NEW.status = 'credited' THEN 'approved' ELSE 'pending' END,
    NULL,
    false,
    coalesce(NEW.credit_amount, 0) + coalesce(NEW.bonus_credit, 0),
    coalesce(NEW.credit_amount, 0) + coalesce(NEW.bonus_credit, 0),
    0,
    'BRL',
    NULL,
    coalesce(NEW.credited_at, NEW.activated_at),
    jsonb_build_object(
      'referrer_client_id', referrer_profile.client_id,
      'referral_type', NEW.referral_type
    )
  );

  PERFORM public.record_growth_event(
    NEW.app_key,
    'referral',
    'referral_' || NEW.status,
    person_id,
    intake_id,
    NEW.referred_user_id,
    'Referral ' || NEW.status,
    'referrals',
    NEW.id::text,
    coalesce(campaign_record.slug, 'give-a-month-get-a-month'),
    NEW.status,
    coalesce(NEW.credit_amount, 0) + coalesce(NEW.bonus_credit, 0),
    'BRL',
    jsonb_build_object('referrer_id', NEW.referrer_id)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_growth_from_testimonial_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_id uuid;
  intake_id uuid;
  profile_record public.profiles%ROWTYPE;
BEGIN
  SELECT *
  INTO profile_record
  FROM public.profiles
  WHERE user_id = NEW.customer_id
  LIMIT 1;

  person_id := public.upsert_growth_person(
    NEW.app_key,
    NEW.customer_id,
    'client',
    trim(coalesce(profile_record.first_name, '') || ' ' || coalesce(profile_record.last_name, '')),
    profile_record.email,
    profile_record.phone,
    'en',
    profile_record.client_id,
    profile_record.referral_code,
    NULL,
    'testimonial_request',
    'testimonial-request',
    jsonb_build_object('testimonial_reward_id', NEW.id, 'reward_type', NEW.reward_type)
  );

  intake_id := public.upsert_growth_intake(
    NEW.app_key,
    'testimonial',
    'client_testimonial_rewards',
    NEW.id::text,
    person_id,
    NEW.customer_id,
    'testimonial-request',
    CASE
      WHEN NEW.reward_type = 'google_review' THEN 'Google review request'
      ELSE 'Video testimonial request'
    END,
    '/testimonial-request',
    'en',
    'service_completion',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NEW.id,
    NULL,
    NEW.status,
    CASE
      WHEN NEW.status = 'pending_review' THEN 'needs_review'
      WHEN NEW.status = 'credited' THEN 'credit_issued'
      ELSE NEW.status
    END,
    NEW.status,
    CASE WHEN NEW.status IN ('approved', 'credited') THEN 'approved' ELSE 'pending' END,
    NEW.approved_by,
    false,
    NEW.amount_brl,
    NEW.amount_brl,
    0,
    'BRL',
    NULL,
    coalesce(NEW.credited_at, NEW.approved_at),
    jsonb_build_object(
      'request_id', NEW.request_id,
      'provider_id', NEW.provider_id,
      'job_id', NEW.job_id,
      'rejection_reason', NEW.rejection_reason
    )
  );

  PERFORM public.record_growth_event(
    NEW.app_key,
    'testimonial',
    'testimonial_' || NEW.status,
    person_id,
    intake_id,
    NEW.customer_id,
    'Testimonial reward ' || NEW.status,
    'client_testimonial_rewards',
    NEW.id::text,
    'testimonial-request',
    NEW.status,
    NEW.amount_brl,
    'BRL',
    jsonb_build_object('reward_type', NEW.reward_type)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_growth_from_partner_campaign_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_id uuid;
  intake_id uuid;
  campaign_record public.partner_campaigns%ROWTYPE;
BEGIN
  SELECT *
  INTO campaign_record
  FROM public.partner_campaigns
  WHERE id = NEW.campaign_id;

  person_id := public.upsert_growth_person(
    campaign_record.app_key,
    NEW.partner_user_id,
    'partner',
    NULL,
    NULL,
    NULL,
    'en',
    NULL,
    NULL,
    NULL,
    'partner_campaign',
    campaign_record.slug,
    jsonb_build_object('membership_id', NEW.membership_id)
  );

  intake_id := public.upsert_growth_intake(
    campaign_record.app_key,
    'partner_campaign',
    'partner_campaign_events',
    NEW.id::text,
    person_id,
    NEW.partner_user_id,
    campaign_record.slug,
    campaign_record.name,
    NULL,
    'en',
    'partner_campaign_event',
    NEW.partner_user_id,
    NULL,
    NEW.campaign_id,
    NEW.membership_id,
    NULL,
    NULL,
    NULL,
    NEW.event_type,
    NEW.event_type,
    NULL,
    NULL,
    NULL,
    false,
    coalesce(NEW.revenue_amount, 0),
    0,
    coalesce(NEW.profit_amount, 0),
    coalesce(campaign_record.currency, 'BRL'),
    NULL,
    NEW.occurred_at,
    NEW.metadata || jsonb_build_object('lead_email', NEW.lead_email, 'lead_label', NEW.lead_label)
  );

  PERFORM public.record_growth_event(
    campaign_record.app_key,
    'partner',
    'partner_campaign_' || NEW.event_type,
    person_id,
    intake_id,
    NEW.partner_user_id,
    'Partner campaign event',
    'partner_campaign_events',
    NEW.id::text,
    campaign_record.slug,
    NEW.event_type,
    coalesce(NEW.profit_amount, NEW.revenue_amount, 0),
    coalesce(campaign_record.currency, 'BRL'),
    NEW.metadata
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_growth_from_partner_payout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_id uuid;
  intake_id uuid;
  campaign_record public.partner_campaigns%ROWTYPE;
BEGIN
  SELECT *
  INTO campaign_record
  FROM public.partner_campaigns
  WHERE id = NEW.campaign_id;

  person_id := public.upsert_growth_person(
    coalesce(campaign_record.app_key, 'casa'),
    NEW.partner_user_id,
    'partner',
    NULL,
    NULL,
    NULL,
    'en',
    NULL,
    NULL,
    NULL,
    'partner_payout',
    coalesce(campaign_record.slug, 'partner-payout'),
    jsonb_build_object('payout_id', NEW.id)
  );

  intake_id := public.upsert_growth_intake(
    coalesce(campaign_record.app_key, 'casa'),
    'payout',
    'partner_campaign_payouts',
    NEW.id::text,
    person_id,
    NEW.partner_user_id,
    coalesce(campaign_record.slug, 'partner-payout'),
    coalesce(campaign_record.name, 'Partner payout'),
    NULL,
    'en',
    'partner_payout',
    NEW.partner_user_id,
    NULL,
    NEW.campaign_id,
    NEW.membership_id,
    NULL,
    NULL,
    NULL,
    NEW.status,
    CASE WHEN NEW.status = 'paid' THEN 'paid' ELSE 'payout_pending' END,
    NEW.status,
    NEW.status,
    NULL,
    false,
    NEW.amount,
    0,
    NEW.amount,
    NEW.currency,
    NEW.payout_period_end::timestamptz,
    NEW.paid_at,
    jsonb_build_object(
      'receipt_number', NEW.receipt_number,
      'payout_period_start', NEW.payout_period_start,
      'payout_period_end', NEW.payout_period_end
    )
  );

  PERFORM public.record_growth_event(
    coalesce(campaign_record.app_key, 'casa'),
    'payout',
    'partner_payout_' || NEW.status,
    person_id,
    intake_id,
    NEW.partner_user_id,
    'Partner payout ' || NEW.status,
    'partner_campaign_payouts',
    NEW.id::text,
    coalesce(campaign_record.slug, 'partner-payout'),
    NEW.status,
    NEW.amount,
    NEW.currency,
    NEW.metadata
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_growth_from_promotional_campaign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intake_id uuid;
BEGIN
  intake_id := public.upsert_growth_intake(
    NEW.app_key,
    'promotion',
    'promotional_campaigns',
    NEW.id::text,
    NULL,
    NEW.created_by,
    coalesce(NEW.promo_code, NEW.name),
    NEW.name,
    NEW.metadata->>'landing_page',
    coalesce(NEW.metadata->>'language', 'en'),
    coalesce(NEW.metadata->>'source', 'admin'),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NEW.id,
    CASE WHEN NEW.is_active THEN 'active' ELSE 'paused' END,
    'campaign_configured',
    NULL,
    CASE WHEN NEW.is_active THEN 'eligible' ELSE 'paused' END,
    NEW.created_by,
    false,
    NEW.credit_amount,
    NEW.credit_amount,
    0,
    'BRL',
    NEW.expires_at,
    NULL,
    NEW.metadata || jsonb_build_object('target_audience', NEW.target_audience)
  );

  PERFORM public.record_growth_event(
    NEW.app_key,
    'promotion',
    CASE WHEN NEW.is_active THEN 'promotion_active' ELSE 'promotion_paused' END,
    NULL,
    intake_id,
    NEW.created_by,
    'Promotion campaign configured',
    'promotional_campaigns',
    NEW.id::text,
    coalesce(NEW.promo_code, NEW.name),
    CASE WHEN NEW.is_active THEN 'active' ELSE 'paused' END,
    NEW.credit_amount,
    'BRL',
    NEW.metadata
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_growth_from_campaign_redemption()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_id uuid;
  intake_id uuid;
  campaign_record public.promotional_campaigns%ROWTYPE;
  profile_record public.profiles%ROWTYPE;
BEGIN
  SELECT *
  INTO campaign_record
  FROM public.promotional_campaigns
  WHERE id = NEW.campaign_id;

  SELECT *
  INTO profile_record
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  person_id := public.upsert_growth_person(
    coalesce(NEW.app_key, campaign_record.app_key),
    NEW.user_id,
    'client',
    trim(coalesce(profile_record.first_name, '') || ' ' || coalesce(profile_record.last_name, '')),
    profile_record.email,
    profile_record.phone,
    'en',
    profile_record.client_id,
    profile_record.referral_code,
    NULL,
    'promotion_redemption',
    coalesce(campaign_record.promo_code, campaign_record.name),
    jsonb_build_object('redemption_id', NEW.id)
  );

  intake_id := public.upsert_growth_intake(
    coalesce(NEW.app_key, campaign_record.app_key),
    'promo_lead',
    'campaign_redemptions',
    NEW.id::text,
    person_id,
    NEW.user_id,
    coalesce(campaign_record.promo_code, campaign_record.name),
    campaign_record.name,
    campaign_record.metadata->>'landing_page',
    coalesce(campaign_record.metadata->>'language', 'en'),
    coalesce(NEW.source, 'promotion_redemption'),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NEW.campaign_id,
    'redeemed',
    'credit_applied',
    NULL,
    'approved',
    campaign_record.created_by,
    false,
    coalesce(NEW.credit_applied, 0),
    coalesce(NEW.credit_applied, 0),
    0,
    'BRL',
    NULL,
    NEW.redeemed_at,
    NEW.metadata
  );

  PERFORM public.record_growth_event(
    coalesce(NEW.app_key, campaign_record.app_key),
    'promotion',
    'promotion_redeemed',
    person_id,
    intake_id,
    NEW.user_id,
    'Promotion redeemed',
    'campaign_redemptions',
    NEW.id::text,
    coalesce(campaign_record.promo_code, campaign_record.name),
    'redeemed',
    coalesce(NEW.credit_applied, 0),
    'BRL',
    NEW.metadata
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS growth_sync_partner_application ON public.partner_influencer_applications;
CREATE TRIGGER growth_sync_partner_application
  AFTER INSERT OR UPDATE ON public.partner_influencer_applications
  FOR EACH ROW EXECUTE FUNCTION public.sync_growth_from_partner_application();

DROP TRIGGER IF EXISTS growth_sync_referral ON public.referrals;
CREATE TRIGGER growth_sync_referral
  AFTER INSERT OR UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.sync_growth_from_referral();

DROP TRIGGER IF EXISTS growth_sync_testimonial_reward ON public.client_testimonial_rewards;
CREATE TRIGGER growth_sync_testimonial_reward
  AFTER INSERT OR UPDATE ON public.client_testimonial_rewards
  FOR EACH ROW EXECUTE FUNCTION public.sync_growth_from_testimonial_reward();

DROP TRIGGER IF EXISTS growth_sync_partner_campaign_event ON public.partner_campaign_events;
CREATE TRIGGER growth_sync_partner_campaign_event
  AFTER INSERT ON public.partner_campaign_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_growth_from_partner_campaign_event();

DROP TRIGGER IF EXISTS growth_sync_partner_payout ON public.partner_campaign_payouts;
CREATE TRIGGER growth_sync_partner_payout
  AFTER INSERT OR UPDATE ON public.partner_campaign_payouts
  FOR EACH ROW EXECUTE FUNCTION public.sync_growth_from_partner_payout();

DROP TRIGGER IF EXISTS growth_sync_promotional_campaign ON public.promotional_campaigns;
CREATE TRIGGER growth_sync_promotional_campaign
  AFTER INSERT OR UPDATE ON public.promotional_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.sync_growth_from_promotional_campaign();

DROP TRIGGER IF EXISTS growth_sync_campaign_redemption ON public.campaign_redemptions;
CREATE TRIGGER growth_sync_campaign_redemption
  AFTER INSERT OR UPDATE ON public.campaign_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_growth_from_campaign_redemption();

CREATE OR REPLACE FUNCTION public.sync_growth_hub_from_existing(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  people_processed integer,
  intakes_processed integer,
  events_processed integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text;
  item record;
  processed_people integer := 0;
  processed_intakes integer := 0;
  processed_events integer := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can sync Growth Hub data';
  END IF;

  IF target_app_key IS NULL OR trim(target_app_key) = '' THEN
    clean_app_key := NULL;
  ELSE
    clean_app_key := public.normalize_growth_app_key(target_app_key);
  END IF;

  FOR item IN
    SELECT * FROM public.partner_influencer_applications pia
    WHERE clean_app_key IS NULL OR pia.app_key = clean_app_key
  LOOP
    UPDATE public.partner_influencer_applications
    SET metadata = metadata || jsonb_build_object('growth_resynced_at', now())
    WHERE id = item.id;
    processed_people := processed_people + 1;
    processed_intakes := processed_intakes + 1;
    processed_events := processed_events + 1;
  END LOOP;

  FOR item IN
    SELECT * FROM public.referrals r
    WHERE clean_app_key IS NULL OR r.app_key = clean_app_key
  LOOP
    UPDATE public.referrals
    SET referral_code = referral_code
    WHERE id = item.id;
    processed_people := processed_people + 1;
    processed_intakes := processed_intakes + 1;
    processed_events := processed_events + 1;
  END LOOP;

  FOR item IN
    SELECT * FROM public.client_testimonial_rewards ctr
    WHERE clean_app_key IS NULL OR ctr.app_key = clean_app_key
  LOOP
    UPDATE public.client_testimonial_rewards
    SET metadata = metadata || jsonb_build_object('growth_resynced_at', now())
    WHERE id = item.id;
    processed_people := processed_people + 1;
    processed_intakes := processed_intakes + 1;
    processed_events := processed_events + 1;
  END LOOP;

  FOR item IN
    SELECT pcp.*
    FROM public.partner_campaign_payouts pcp
    LEFT JOIN public.partner_campaigns pc ON pc.id = pcp.campaign_id
    WHERE clean_app_key IS NULL OR pc.app_key = clean_app_key
  LOOP
    UPDATE public.partner_campaign_payouts
    SET metadata = metadata || jsonb_build_object('growth_resynced_at', now())
    WHERE id = item.id;
    processed_people := processed_people + 1;
    processed_intakes := processed_intakes + 1;
    processed_events := processed_events + 1;
  END LOOP;

  FOR item IN
    SELECT * FROM public.promotional_campaigns pc
    WHERE clean_app_key IS NULL OR pc.app_key = clean_app_key
  LOOP
    UPDATE public.promotional_campaigns
    SET metadata = metadata || jsonb_build_object('growth_resynced_at', now())
    WHERE id = item.id;
    processed_intakes := processed_intakes + 1;
    processed_events := processed_events + 1;
  END LOOP;

  FOR item IN
    SELECT * FROM public.campaign_redemptions cr
    WHERE clean_app_key IS NULL OR cr.app_key = clean_app_key
  LOOP
    UPDATE public.campaign_redemptions
    SET metadata = metadata || jsonb_build_object('growth_resynced_at', now())
    WHERE id = item.id;
    processed_people := processed_people + 1;
    processed_intakes := processed_intakes + 1;
    processed_events := processed_events + 1;
  END LOOP;

  people_processed := processed_people;
  intakes_processed := processed_intakes;
  events_processed := processed_events;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_growth_hub_summary(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  metric_key text,
  metric_label text,
  metric_value numeric,
  detail text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view Growth Hub analytics';
  END IF;

  RETURN QUERY
  SELECT 'active_campaigns'::text, 'Active campaigns'::text, count(*)::numeric, 'Partner and promotional campaigns currently active'::text
  FROM (
    SELECT pc.id::text
    FROM public.partner_campaigns pc
    WHERE pc.app_key = clean_app_key
      AND pc.status = 'active'
    UNION ALL
    SELECT pr.id::text
    FROM public.promotional_campaigns pr
    WHERE pr.app_key = clean_app_key
      AND pr.is_active = true
  ) campaigns;

  RETURN QUERY
  SELECT 'partner_review_queue'::text, 'Partner applications to review'::text, count(*)::numeric, 'Submitted or under-review partner and influencer applications'::text
  FROM public.partner_influencer_applications pia
  WHERE pia.app_key = clean_app_key
    AND pia.status IN ('submitted', 'under_review');

  RETURN QUERY
  SELECT 'referral_pipeline'::text, 'Referral pipeline'::text, count(*)::numeric, 'Pending or active referrals not yet credited'::text
  FROM public.referrals r
  WHERE r.app_key = clean_app_key
    AND r.status IN ('pending', 'active');

  RETURN QUERY
  SELECT 'testimonial_approvals'::text, 'Testimonials pending approval'::text, count(*)::numeric, 'Google review and video testimonial credits awaiting staff review'::text
  FROM public.client_testimonial_rewards ctr
  WHERE ctr.app_key = clean_app_key
    AND ctr.status = 'pending_review';

  RETURN QUERY
  SELECT 'credits_to_issue'::text, 'Credits to issue'::text, coalesce(sum(amount), 0)::numeric, 'Referral and testimonial credits approved or pending review'::text
  FROM (
    SELECT coalesce(r.credit_amount, 0) + coalesce(r.bonus_credit, 0) AS amount
    FROM public.referrals r
    WHERE r.app_key = clean_app_key
      AND r.status IN ('active', 'credited')
    UNION ALL
    SELECT ctr.amount_brl AS amount
    FROM public.client_testimonial_rewards ctr
    WHERE ctr.app_key = clean_app_key
      AND ctr.status IN ('pending_review', 'approved')
  ) credits;

  RETURN QUERY
  SELECT 'payouts_to_process'::text, 'Partner payouts to process'::text, coalesce(sum(p.amount), 0)::numeric, 'Scheduled or processing partner payouts'::text
  FROM public.partner_campaign_payouts p
  LEFT JOIN public.partner_campaigns pc ON pc.id = p.campaign_id
  WHERE pc.app_key = clean_app_key
    AND p.status IN ('scheduled', 'processing');

  RETURN QUERY
  SELECT 'growth_events_30d'::text, 'Growth events in 30 days'::text, count(*)::numeric, 'Tracked partner, referral, promo, testimonial, credit, and payout events'::text
  FROM public.growth_events ge
  WHERE ge.app_key = clean_app_key
    AND ge.occurred_at >= now() - interval '30 days';
END;
$$;

GRANT SELECT ON public.growth_people TO authenticated;
GRANT SELECT ON public.growth_campaign_intakes TO authenticated;
GRANT SELECT ON public.growth_events TO authenticated;
GRANT SELECT ON public.growth_followup_tasks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.growth_people TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.growth_campaign_intakes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.growth_events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.growth_followup_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_growth_person(text, uuid, text, text, text, text, text, text, text, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_growth_intake(text, text, text, text, uuid, uuid, text, text, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, text, uuid, boolean, numeric, numeric, numeric, text, timestamptz, timestamptz, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_growth_event(text, text, text, uuid, uuid, uuid, text, text, text, text, text, numeric, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_growth_hub_from_existing(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_growth_hub_summary(text) TO authenticated;
