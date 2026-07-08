-- Influencer partner acquisition: public opt-ins, detailed applications,
-- 48-hour review targets, and campaign terms for creator partnerships.

CREATE TABLE IF NOT EXISTS public.partner_influencer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_token uuid NOT NULL DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  campaign_id uuid REFERENCES public.partner_campaigns(id) ON DELETE SET NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead', 'submitted', 'under_review', 'approved', 'waitlist', 'declined', 'withdrawn')),
  full_name text NOT NULL,
  creator_name text,
  email text NOT NULL,
  phone text,
  country text,
  city text,
  primary_platform text,
  primary_handle text,
  primary_profile_url text,
  total_followers integer NOT NULL DEFAULT 0 CHECK (total_followers >= 0),
  creator_bio text,
  audience_summary text,
  main_demographic text,
  content_niche text,
  platforms jsonb NOT NULL DEFAULT '[]'::jsonb,
  campaign_interests text[] NOT NULL DEFAULT ARRAY[]::text[],
  audience_locations text[] NOT NULL DEFAULT ARRAY[]::text[],
  audience_languages text[] NOT NULL DEFAULT ARRAY[]::text[],
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  payout_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  application_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  basic_opt_in_at timestamptz NOT NULL DEFAULT now(),
  application_submitted_at timestamptz,
  review_due_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_influencer_applications_app_status
ON public.partner_influencer_applications(app_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_influencer_applications_email
ON public.partner_influencer_applications(lower(email), app_key);

CREATE INDEX IF NOT EXISTS idx_partner_influencer_applications_campaign
ON public.partner_influencer_applications(campaign_id, status);

DROP TRIGGER IF EXISTS update_partner_influencer_applications_updated_at ON public.partner_influencer_applications;
CREATE TRIGGER update_partner_influencer_applications_updated_at
  BEFORE UPDATE ON public.partner_influencer_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

CREATE OR REPLACE FUNCTION public.safe_partner_integer(raw_value text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT coalesce(nullif(regexp_replace(coalesce(raw_value, '0'), '[^0-9]', '', 'g'), '')::integer, 0);
$$;

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

  IF normalized_followers < 5000 THEN
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

ALTER TABLE public.partner_influencer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants view own influencer applications" ON public.partner_influencer_applications;
CREATE POLICY "Applicants view own influencer applications"
ON public.partner_influencer_applications FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins manage influencer applications" ON public.partner_influencer_applications;
CREATE POLICY "Admins manage influencer applications"
ON public.partner_influencer_applications FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE ON public.partner_influencer_applications TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_influencer_partner_application(text, text, jsonb, uuid, uuid) TO anon, authenticated, service_role;

UPDATE public.partner_campaigns
SET
  name = CASE
    WHEN app_key = 'medical' THEN 'Medical Baise Influencer Partner Program'
    WHEN app_key = 'legal' THEN 'Legal Baise Influencer Partner Program'
    ELSE 'Baise Influencer Partner Program'
  END,
  description = 'For approved creators with at least 5,000 followers who create original brand content, help audiences find trusted services, and earn through posts, viral view milestones, and tracked conversions.',
  commission_type = 'hybrid',
  commission_value = 10,
  rules = '["Minimum 5,000 followers across active social platforms.", "Original or unique creator content is required for every paid post.", "Viral incentive eligibility starts after 10,000 verified views on approved posts.", "Conversions must be tracked through the partner link, QR code, or unique identifier code.", "Influencers can promote trusted service providers, legal support, medical support, or cross-platform Baise discovery when approved.", "Applicants are reviewed within 48 hours after a complete application is submitted."]'::jsonb,
  payout_rules = '{"paid_per_post":true,"viral_threshold_views":10000,"commission_on_tracked_conversions":true,"tracking_methods":["link","qr_code","unique_code"],"review_sla_hours":48,"minimum_followers":5000,"payout_frequency":"monthly","minimum_payout":50}'::jsonb,
  content_guidelines = '["Create original content that explains why Baise helps people who do not know where to look.", "Make the call to action clear: use the assigned link, QR code, or unique code.", "Disclose the partner relationship when required by platform rules or law.", "Do not promise provider availability, outcomes, legal advice, medical advice, or specific pricing outside the platform.", "Keep users inside Baise for requests, quotes, payments, invoices, reviews, and service history."]'::jsonb,
  metadata = metadata || jsonb_build_object(
    'minimum_followers', 5000,
    'viral_threshold_views', 10000,
    'paid_per_post', true,
    'original_content_required', true,
    'approval_sla_hours', 48,
    'campaign_scope', ARRAY['services', 'legal', 'medical', 'international', 'national']
  ),
  updated_at = now()
WHERE campaign_type = 'influencer';
