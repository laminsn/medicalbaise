-- Partner/referral/testimonial integration layer.
-- Connects public campaign pages, account creation, partner portal visibility,
-- admin/staff partner vetting, referral tracking, and testimonial attribution.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS client_id text,
  ADD COLUMN IF NOT EXISTS referral_slug text,
  ADD COLUMN IF NOT EXISTS signup_app_key text NOT NULL DEFAULT 'casa'
    CHECK (signup_app_key IN ('casa', 'medical', 'legal'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_client_id_unique
ON public.profiles(client_id)
WHERE client_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_slug_unique
ON public.profiles(referral_slug)
WHERE referral_slug IS NOT NULL;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  ADD COLUMN IF NOT EXISTS client_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_unique_referred_user
ON public.referrals(referrer_id, referred_user_id, referral_code)
WHERE referred_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.normalize_referral_code(input_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(upper(coalesce(input_code, '')), '[^A-Z0-9_-]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.build_referral_url(
  target_app_key text,
  target_code text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  base_url text;
BEGIN
  base_url := CASE lower(coalesce(target_app_key, 'casa'))
    WHEN 'medical' THEN 'https://www.mdbaise.com'
    WHEN 'legal' THEN 'https://www.legalbaise.com'
    ELSE 'https://www.casabaise.com'
  END;

  RETURN base_url || '/ref/' || public.normalize_referral_code(target_code);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator');
$$;

CREATE OR REPLACE FUNCTION public.ensure_profile_referral_identity(
  target_user_id uuid,
  target_app_key text DEFAULT NULL
)
RETURNS TABLE (
  client_id text,
  referral_code text,
  referral_slug text,
  referral_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_app text := lower(coalesce(nullif(target_app_key, ''), 'casa'));
  profile_record public.profiles%ROWTYPE;
  generated_client_id text;
  generated_referral_code text;
BEGIN
  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  IF auth.uid() IS NOT NULL
    AND auth.uid() IS DISTINCT FROM target_user_id
    AND NOT public.is_admin_or_moderator()
  THEN
    RAISE EXCEPTION 'Profile identity access denied';
  END IF;

  SELECT *
  INTO profile_record
  FROM public.profiles
  WHERE user_id = target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile was not found';
  END IF;

  generated_client_id := 'CL' || upper(substr(replace(target_user_id::text, '-', ''), 1, 10));
  generated_referral_code := coalesce(
    nullif(public.normalize_referral_code(profile_record.referral_code), ''),
    'REF' || upper(substr(replace(target_user_id::text, '-', ''), 1, 8))
  );

  UPDATE public.profiles
  SET
    client_id = coalesce(nullif(client_id, ''), generated_client_id),
    referral_code = coalesce(nullif(referral_code, ''), generated_referral_code),
    referral_slug = coalesce(nullif(referral_slug, ''), generated_referral_code),
    signup_app_key = coalesce(nullif(signup_app_key, ''), normalized_app),
    updated_at = now()
  WHERE user_id = target_user_id
  RETURNING
    profiles.client_id,
    profiles.referral_code,
    profiles.referral_slug,
    public.build_referral_url(profiles.signup_app_key, profiles.referral_slug)
  INTO client_id, referral_code, referral_slug, referral_url;

  RETURN NEXT;
END;
$$;

CREATE TABLE IF NOT EXISTS public.referral_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  client_id text,
  event_type text NOT NULL
    CHECK (event_type IN ('click', 'invite_sent', 'signup', 'conversion', 'testimonial_request', 'testimonial_google', 'testimonial_video', 'credit_approved')),
  referred_email text,
  partner_campaign_id uuid REFERENCES public.partner_campaigns(id) ON DELETE SET NULL,
  partner_campaign_membership_id uuid REFERENCES public.partner_campaign_memberships(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_events_referrer
ON public.referral_tracking_events(referrer_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_events_referred
ON public.referral_tracking_events(referred_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_tracking_events_code
ON public.referral_tracking_events(referral_code, event_type, created_at DESC);

ALTER TABLE public.referral_tracking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view referral tracking connected to them" ON public.referral_tracking_events;
CREATE POLICY "Users view referral tracking connected to them"
ON public.referral_tracking_events FOR SELECT TO authenticated
USING (
  referrer_id = auth.uid()
  OR referred_user_id = auth.uid()
  OR public.is_admin_or_moderator()
);

DROP POLICY IF EXISTS "Admins manage referral tracking" ON public.referral_tracking_events;
CREATE POLICY "Admins manage referral tracking"
ON public.referral_tracking_events FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE OR REPLACE FUNCTION public.resolve_referral_identity(target_code text)
RETURNS TABLE (
  referrer_id uuid,
  client_id text,
  referral_code text,
  referral_slug text,
  referrer_label text,
  user_type text,
  app_key text,
  referral_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_code text := public.normalize_referral_code(target_code);
BEGIN
  RETURN QUERY
  SELECT
    p.user_id,
    p.client_id,
    p.referral_code,
    p.referral_slug,
    trim(coalesce(p.first_name, 'Baise') || ' ' || coalesce(left(p.last_name, 1) || '.', 'member')),
    p.user_type::text,
    p.signup_app_key,
    public.build_referral_url(p.signup_app_key, coalesce(p.referral_slug, p.referral_code, p.client_id))
  FROM public.profiles p
  WHERE public.normalize_referral_code(p.referral_code) = normalized_code
    OR public.normalize_referral_code(p.referral_slug) = normalized_code
    OR public.normalize_referral_code(p.client_id) = normalized_code
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_referral_event(
  target_code text,
  target_event_type text DEFAULT 'click',
  target_app_key text DEFAULT 'casa',
  event_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_code text := public.normalize_referral_code(target_code);
  normalized_event text := lower(coalesce(nullif(target_event_type, ''), 'click'));
  normalized_app text := lower(coalesce(nullif(target_app_key, ''), 'casa'));
  referrer_profile public.profiles%ROWTYPE;
  event_id uuid;
  current_user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
BEGIN
  IF normalized_event NOT IN ('click', 'invite_sent', 'signup', 'conversion', 'testimonial_request', 'testimonial_google', 'testimonial_video', 'credit_approved') THEN
    RAISE EXCEPTION 'Unsupported referral event type';
  END IF;

  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  SELECT *
  INTO referrer_profile
  FROM public.profiles p
  WHERE public.normalize_referral_code(p.referral_code) = normalized_code
    OR public.normalize_referral_code(p.referral_slug) = normalized_code
    OR public.normalize_referral_code(p.client_id) = normalized_code
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.referral_tracking_events (
    app_key,
    referrer_id,
    referred_user_id,
    referral_code,
    client_id,
    event_type,
    referred_email,
    metadata
  )
  VALUES (
    normalized_app,
    referrer_profile.user_id,
    CASE WHEN auth.uid() IS DISTINCT FROM referrer_profile.user_id THEN auth.uid() ELSE NULL END,
    coalesce(referrer_profile.referral_code, normalized_code),
    referrer_profile.client_id,
    normalized_event,
    nullif(current_user_email, ''),
    coalesce(event_metadata, '{}'::jsonb)
  )
  RETURNING id INTO event_id;

  IF normalized_event = 'signup'
    AND auth.uid() IS NOT NULL
    AND auth.uid() IS DISTINCT FROM referrer_profile.user_id
  THEN
    INSERT INTO public.referrals (
      referrer_id,
      referred_user_id,
      referral_code,
      referral_type,
      status,
      referred_email,
      credit_amount,
      app_key,
      client_id,
      activated_at,
      metadata
    )
    VALUES (
      referrer_profile.user_id,
      auth.uid(),
      coalesce(referrer_profile.referral_code, normalized_code),
      'customer',
      'active',
      nullif(current_user_email, ''),
      20,
      normalized_app,
      referrer_profile.client_id,
      now(),
      coalesce(event_metadata, '{}'::jsonb) || jsonb_build_object('source', 'tracked_referral_signup')
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_signup_attribution(
  target_user_id uuid,
  target_email text,
  raw_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inbound_referral text := public.normalize_referral_code(raw_metadata ->> 'inbound_referral_code');
  inbound_partner text := public.normalize_partner_campaign_code(raw_metadata ->> 'inbound_partner_code');
  normalized_app text := lower(coalesce(nullif(raw_metadata ->> 'signup_app', ''), nullif(raw_metadata ->> 'app_key', ''), 'casa'));
  referrer_profile public.profiles%ROWTYPE;
  membership_record public.partner_campaign_memberships%ROWTYPE;
BEGIN
  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  IF inbound_referral <> '' THEN
    SELECT *
    INTO referrer_profile
    FROM public.profiles p
    WHERE public.normalize_referral_code(p.referral_code) = inbound_referral
      OR public.normalize_referral_code(p.referral_slug) = inbound_referral
      OR public.normalize_referral_code(p.client_id) = inbound_referral
    LIMIT 1;

    IF FOUND AND referrer_profile.user_id IS DISTINCT FROM target_user_id THEN
      INSERT INTO public.referral_tracking_events (
        app_key,
        referrer_id,
        referred_user_id,
        referral_code,
        client_id,
        event_type,
        referred_email,
        metadata
      )
      VALUES (
        normalized_app,
        referrer_profile.user_id,
        target_user_id,
        coalesce(referrer_profile.referral_code, inbound_referral),
        referrer_profile.client_id,
        'signup',
        lower(target_email),
        coalesce(raw_metadata, '{}'::jsonb) || jsonb_build_object('source', 'auth_signup')
      );

      INSERT INTO public.referrals (
        referrer_id,
        referred_user_id,
        referral_code,
        referral_type,
        status,
        referred_email,
        credit_amount,
        app_key,
        client_id,
        activated_at,
        metadata
      )
      VALUES (
        referrer_profile.user_id,
        target_user_id,
        coalesce(referrer_profile.referral_code, inbound_referral),
        'customer',
        'active',
        lower(target_email),
        20,
        normalized_app,
        referrer_profile.client_id,
        now(),
        coalesce(raw_metadata, '{}'::jsonb) || jsonb_build_object('source', 'auth_signup')
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  IF inbound_partner <> '' THEN
    SELECT m.*
    INTO membership_record
    FROM public.partner_campaign_memberships m
    JOIN public.partner_campaigns c ON c.id = m.campaign_id
    WHERE (m.partner_code = inbound_partner OR m.custom_code = inbound_partner)
      AND m.status = 'approved'
      AND c.status = 'active'
    LIMIT 1;

    IF FOUND THEN
      INSERT INTO public.partner_campaign_events (
        campaign_id,
        membership_id,
        partner_user_id,
        event_type,
        lead_email,
        lead_label,
        metadata
      )
      VALUES (
        membership_record.campaign_id,
        membership_record.id,
        membership_record.partner_user_id,
        'signup',
        lower(target_email),
        'Account created',
        coalesce(raw_metadata, '{}'::jsonb) || jsonb_build_object('source', 'auth_signup', 'new_user_id', target_user_id)
      );
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_partner_applications_for_user(
  target_user_id uuid,
  target_email text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(trim(coalesce(target_email, '')));
  application_record public.partner_influencer_applications%ROWTYPE;
  activated_count integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL
    AND auth.uid() IS DISTINCT FROM target_user_id
    AND NOT public.is_admin_or_moderator()
  THEN
    RAISE EXCEPTION 'Partner application link access denied';
  END IF;

  IF normalized_email = '' THEN
    SELECT lower(email) INTO normalized_email
    FROM public.profiles
    WHERE user_id = target_user_id;
  END IF;

  FOR application_record IN
    SELECT *
    FROM public.partner_influencer_applications
    WHERE status = 'approved'
      AND campaign_id IS NOT NULL
      AND (
        user_id = target_user_id
        OR lower(email) = normalized_email
      )
  LOOP
    UPDATE public.partner_influencer_applications
    SET
      user_id = target_user_id,
      metadata = metadata || jsonb_build_object('linked_user_id', target_user_id, 'linked_at', now())
    WHERE id = application_record.id;

    INSERT INTO public.partner_campaign_memberships (
      campaign_id,
      partner_user_id,
      approved_by,
      status,
      landing_path,
      metadata
    )
    VALUES (
      application_record.campaign_id,
      target_user_id,
      application_record.reviewed_by,
      'approved',
      '/discover',
      jsonb_build_object('source', 'partner_application_approval', 'application_id', application_record.id)
    )
    ON CONFLICT (campaign_id, partner_user_id)
    DO UPDATE SET
      status = 'approved',
      approved_by = coalesce(partner_campaign_memberships.approved_by, EXCLUDED.approved_by),
      metadata = partner_campaign_memberships.metadata || EXCLUDED.metadata,
      updated_at = now();

    activated_count := activated_count + 1;
  END LOOP;

  RETURN activated_count;
END;
$$;

CREATE TABLE IF NOT EXISTS public.partner_application_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.partner_influencer_applications(id) ON DELETE CASCADE,
  reviewed_by uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'declined', 'waitlist', 'under_review')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_application_reviews_application
ON public.partner_application_reviews(application_id, created_at DESC);

ALTER TABLE public.partner_application_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and moderators view partner application reviews" ON public.partner_application_reviews;
CREATE POLICY "Admins and moderators view partner application reviews"
ON public.partner_application_reviews FOR SELECT TO authenticated
USING (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins and moderators create partner application reviews" ON public.partner_application_reviews;
CREATE POLICY "Admins and moderators create partner application reviews"
ON public.partner_application_reviews FOR INSERT TO authenticated
WITH CHECK (public.is_admin_or_moderator());

CREATE OR REPLACE FUNCTION public.review_partner_influencer_application(
  target_application_id uuid,
  review_decision text,
  review_note text DEFAULT NULL
)
RETURNS TABLE (
  application_id uuid,
  application_status text,
  membership_id uuid,
  partner_user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_decision text := lower(coalesce(nullif(review_decision, ''), 'under_review'));
  application_record public.partner_influencer_applications%ROWTYPE;
  linked_user_id uuid;
  created_membership_id uuid;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admins or selected staff can review partner applications';
  END IF;

  IF normalized_decision NOT IN ('approved', 'declined', 'waitlist', 'under_review') THEN
    RAISE EXCEPTION 'Unsupported partner application decision';
  END IF;

  SELECT *
  INTO application_record
  FROM public.partner_influencer_applications
  WHERE id = target_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner application was not found';
  END IF;

  linked_user_id := application_record.user_id;

  IF linked_user_id IS NULL THEN
    SELECT p.user_id
    INTO linked_user_id
    FROM public.profiles p
    WHERE lower(p.email) = lower(application_record.email)
    LIMIT 1;
  END IF;

  UPDATE public.partner_influencer_applications
  SET
    status = normalized_decision,
    user_id = coalesce(linked_user_id, user_id),
    review_notes = review_note,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    metadata = metadata || jsonb_build_object('last_review_decision', normalized_decision, 'last_reviewed_at', now())
  WHERE id = target_application_id
  RETURNING * INTO application_record;

  INSERT INTO public.partner_application_reviews (
    application_id,
    reviewed_by,
    decision,
    notes
  )
  VALUES (
    target_application_id,
    auth.uid(),
    normalized_decision,
    review_note
  );

  IF normalized_decision = 'approved'
    AND application_record.campaign_id IS NOT NULL
    AND application_record.user_id IS NOT NULL
  THEN
    INSERT INTO public.partner_campaign_memberships (
      campaign_id,
      partner_user_id,
      approved_by,
      status,
      landing_path,
      metadata
    )
    VALUES (
      application_record.campaign_id,
      application_record.user_id,
      auth.uid(),
      'approved',
      '/discover',
      jsonb_build_object('source', 'partner_application_review', 'application_id', application_record.id)
    )
    ON CONFLICT (campaign_id, partner_user_id)
    DO UPDATE SET
      status = 'approved',
      approved_by = auth.uid(),
      metadata = partner_campaign_memberships.metadata || EXCLUDED.metadata,
      updated_at = now()
    RETURNING id INTO created_membership_id;
  END IF;

  IF normalized_decision = 'declined'
    AND application_record.campaign_id IS NOT NULL
    AND application_record.user_id IS NOT NULL
  THEN
    UPDATE public.partner_campaign_memberships
    SET status = 'rejected', updated_at = now()
    WHERE campaign_id = application_record.campaign_id
      AND partner_user_id = application_record.user_id
      AND status IN ('pending', 'approved');
  END IF;

  RETURN QUERY
  SELECT
    application_record.id,
    application_record.status,
    created_membership_id,
    application_record.user_id;
END;
$$;

-- Fix short lead opt-ins: full applications still require 5,000+ followers,
-- but the first landing-page opt-in intentionally collects only name/email/phone.
CREATE OR REPLACE FUNCTION public.submit_influencer_partner_application(
  target_app_key text,
  application_stage text,
  application_payload jsonb,
  existing_application_id uuid DEFAULT NULL,
  existing_application_token uuid DEFAULT NULL
)
RETURNS TABLE (
  application_id uuid,
  application_token uuid,
  application_status text,
  review_due_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_app text := lower(coalesce(nullif(target_app_key, ''), 'casa'));
  normalized_stage text := lower(coalesce(nullif(application_stage, ''), 'lead'));
  payload jsonb := coalesce(application_payload, '{}'::jsonb);
  target_record public.partner_influencer_applications%ROWTYPE;
  target_campaign_id uuid;
  normalized_email text := lower(trim(coalesce(payload->>'email', '')));
  normalized_name text := trim(coalesce(payload->>'full_name', payload->>'creator_name', ''));
  normalized_followers integer := public.safe_partner_integer(payload->>'total_followers');
  next_status text;
BEGIN
  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  IF normalized_stage NOT IN ('lead', 'application') THEN
    RAISE EXCEPTION 'Unsupported influencer application stage';
  END IF;

  IF normalized_name = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  IF normalized_email = '' OR position('@' IN normalized_email) = 0 THEN
    RAISE EXCEPTION 'A valid email is required';
  END IF;

  IF normalized_stage = 'application' AND normalized_followers < 5000 THEN
    RAISE EXCEPTION 'Influencer partners must have at least 5,000 followers across platforms';
  END IF;

  SELECT id INTO target_campaign_id
  FROM public.partner_campaigns
  WHERE app_key = normalized_app
    AND campaign_type = 'influencer'
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_application_id IS NOT NULL AND existing_application_token IS NOT NULL THEN
    SELECT *
    INTO target_record
    FROM public.partner_influencer_applications
    WHERE id = existing_application_id
      AND application_token = existing_application_token
    FOR UPDATE;
  END IF;

  next_status := CASE WHEN normalized_stage = 'application' THEN 'submitted' ELSE 'lead' END;

  IF FOUND THEN
    UPDATE public.partner_influencer_applications
    SET
      app_key = normalized_app,
      campaign_id = coalesce(target_campaign_id, campaign_id),
      user_id = coalesce(auth.uid(), user_id),
      status = CASE
        WHEN status IN ('approved', 'declined', 'withdrawn') THEN status
        ELSE next_status
      END,
      full_name = normalized_name,
      creator_name = nullif(trim(coalesce(payload->>'creator_name', '')), ''),
      email = normalized_email,
      phone = nullif(trim(coalesce(payload->>'phone', '')), ''),
      country = nullif(trim(coalesce(payload->>'country', '')), ''),
      city = nullif(trim(coalesce(payload->>'city', '')), ''),
      primary_platform = nullif(trim(coalesce(payload->>'primary_platform', '')), ''),
      primary_handle = nullif(trim(coalesce(payload->>'primary_handle', '')), ''),
      primary_profile_url = nullif(trim(coalesce(payload->>'primary_profile_url', '')), ''),
      total_followers = normalized_followers,
      creator_bio = nullif(trim(coalesce(payload->>'creator_bio', '')), ''),
      audience_summary = nullif(trim(coalesce(payload->>'audience_summary', '')), ''),
      main_demographic = nullif(trim(coalesce(payload->>'main_demographic', '')), ''),
      content_niche = nullif(trim(coalesce(payload->>'content_niche', '')), ''),
      platforms = coalesce(payload->'platforms', platforms, '[]'::jsonb),
      campaign_interests = coalesce(
        ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'campaign_interests', '[]'::jsonb))),
        campaign_interests
      ),
      audience_locations = coalesce(
        ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'audience_locations', '[]'::jsonb))),
        audience_locations
      ),
      audience_languages = coalesce(
        ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'audience_languages', '[]'::jsonb))),
        audience_languages
      ),
      metrics = coalesce(payload->'metrics', metrics, '{}'::jsonb),
      content_examples = coalesce(payload->'content_examples', content_examples, '[]'::jsonb),
      payout_preferences = coalesce(payload->'payout_preferences', payout_preferences, '{}'::jsonb),
      application_payload = payload,
      application_submitted_at = CASE
        WHEN normalized_stage = 'application' THEN coalesce(application_submitted_at, now())
        ELSE application_submitted_at
      END,
      review_due_at = CASE
        WHEN normalized_stage = 'application' THEN coalesce(review_due_at, now() + interval '48 hours')
        ELSE review_due_at
      END,
      metadata = metadata || jsonb_build_object('last_stage', normalized_stage, 'last_touch_at', now())
    WHERE id = target_record.id
    RETURNING * INTO target_record;
  ELSE
    INSERT INTO public.partner_influencer_applications (
      app_key,
      campaign_id,
      user_id,
      status,
      full_name,
      creator_name,
      email,
      phone,
      country,
      city,
      primary_platform,
      primary_handle,
      primary_profile_url,
      total_followers,
      creator_bio,
      audience_summary,
      main_demographic,
      content_niche,
      platforms,
      campaign_interests,
      audience_locations,
      audience_languages,
      metrics,
      content_examples,
      payout_preferences,
      application_payload,
      application_submitted_at,
      review_due_at,
      metadata
    )
    VALUES (
      normalized_app,
      target_campaign_id,
      auth.uid(),
      next_status,
      normalized_name,
      nullif(trim(coalesce(payload->>'creator_name', '')), ''),
      normalized_email,
      nullif(trim(coalesce(payload->>'phone', '')), ''),
      nullif(trim(coalesce(payload->>'country', '')), ''),
      nullif(trim(coalesce(payload->>'city', '')), ''),
      nullif(trim(coalesce(payload->>'primary_platform', '')), ''),
      nullif(trim(coalesce(payload->>'primary_handle', '')), ''),
      nullif(trim(coalesce(payload->>'primary_profile_url', '')), ''),
      normalized_followers,
      nullif(trim(coalesce(payload->>'creator_bio', '')), ''),
      nullif(trim(coalesce(payload->>'audience_summary', '')), ''),
      nullif(trim(coalesce(payload->>'main_demographic', '')), ''),
      nullif(trim(coalesce(payload->>'content_niche', '')), ''),
      coalesce(payload->'platforms', '[]'::jsonb),
      ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'campaign_interests', '[]'::jsonb))),
      ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'audience_locations', '[]'::jsonb))),
      ARRAY(SELECT jsonb_array_elements_text(coalesce(payload->'audience_languages', '[]'::jsonb))),
      coalesce(payload->'metrics', '{}'::jsonb),
      coalesce(payload->'content_examples', '[]'::jsonb),
      coalesce(payload->'payout_preferences', '{}'::jsonb),
      payload,
      CASE WHEN normalized_stage = 'application' THEN now() ELSE NULL END,
      now() + interval '48 hours',
      jsonb_build_object('last_stage', normalized_stage, 'source', 'influencer_partner_funnel')
    )
    RETURNING * INTO target_record;
  END IF;

  RETURN QUERY
  SELECT target_record.id, target_record.application_token, target_record.status, target_record.review_due_at;
END;
$$;

DROP POLICY IF EXISTS "Applicants view own influencer applications" ON public.partner_influencer_applications;
CREATE POLICY "Applicants view own influencer applications"
ON public.partner_influencer_applications FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  OR public.is_admin_or_moderator()
);

DROP POLICY IF EXISTS "Admins manage influencer applications" ON public.partner_influencer_applications;
CREATE POLICY "Admins manage influencer applications"
ON public.partner_influencer_applications FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

-- Keep selected staff aligned with campaign/event visibility without giving
-- partners more internal detail.
DROP POLICY IF EXISTS "Admins manage partner campaign memberships" ON public.partner_campaign_memberships;
CREATE POLICY "Admins manage partner campaign memberships"
ON public.partner_campaign_memberships FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage partner campaign events" ON public.partner_campaign_events;
CREATE POLICY "Admins manage partner campaign events"
ON public.partner_campaign_events FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage partner campaign payouts" ON public.partner_campaign_payouts;
CREATE POLICY "Admins manage partner campaign payouts"
ON public.partner_campaign_payouts FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage partner payout receipts" ON public.partner_payout_receipts;
CREATE POLICY "Admins manage partner payout receipts"
ON public.partner_payout_receipts FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

ALTER TABLE public.client_testimonial_rewards
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS client_id text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_referral text := public.normalize_referral_code(
    upper(substring(coalesce(NEW.raw_user_meta_data ->> 'first_name', 'USER'), 1, 5) || '-' || substring(NEW.id::text, 1, 5))
  );
  generated_client_id text := 'CL' || upper(substr(replace(NEW.id::text, '-', ''), 1, 10));
  normalized_app text := lower(coalesce(nullif(NEW.raw_user_meta_data ->> 'signup_app', ''), nullif(NEW.raw_user_meta_data ->> 'app_key', ''), 'casa'));
BEGIN
  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    referral_code,
    referral_slug,
    client_id,
    signup_app_key
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    generated_referral,
    generated_referral,
    generated_client_id,
    normalized_app
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = coalesce(EXCLUDED.email, public.profiles.email),
    first_name = coalesce(public.profiles.first_name, EXCLUDED.first_name),
    last_name = coalesce(public.profiles.last_name, EXCLUDED.last_name),
    referral_code = coalesce(public.profiles.referral_code, EXCLUDED.referral_code),
    referral_slug = coalesce(public.profiles.referral_slug, EXCLUDED.referral_slug),
    client_id = coalesce(public.profiles.client_id, EXCLUDED.client_id),
    signup_app_key = coalesce(public.profiles.signup_app_key, EXCLUDED.signup_app_key),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  PERFORM public.record_signup_attribution(NEW.id, NEW.email, NEW.raw_user_meta_data);
  PERFORM public.activate_partner_applications_for_user(NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

UPDATE public.profiles
SET
  client_id = coalesce(nullif(client_id, ''), 'CL' || upper(substr(replace(user_id::text, '-', ''), 1, 10))),
  referral_code = coalesce(nullif(referral_code, ''), 'REF' || upper(substr(replace(user_id::text, '-', ''), 1, 8))),
  referral_slug = coalesce(nullif(referral_slug, ''), public.normalize_referral_code(coalesce(referral_code, 'REF' || upper(substr(replace(user_id::text, '-', ''), 1, 8))))),
  signup_app_key = coalesce(nullif(signup_app_key, ''), 'casa')
WHERE client_id IS NULL
  OR referral_code IS NULL
  OR referral_slug IS NULL
  OR signup_app_key IS NULL;

REVOKE ALL ON FUNCTION public.ensure_profile_referral_identity(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_referral_identity(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_referral_event(text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_partner_influencer_application(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_partner_applications_for_user(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ensure_profile_referral_identity(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resolve_referral_identity(text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_referral_event(text, text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_partner_influencer_application(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.activate_partner_applications_for_user(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_influencer_partner_application(text, text, jsonb, uuid, uuid) TO anon, authenticated, service_role;
