-- Client insight surveys and value-based product campaigns.
-- Adds the demographic/context layer that lets Product Intelligence recommend
-- useful next steps based on the person, not just the sale.

CREATE TABLE IF NOT EXISTS public.client_insight_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  person_id uuid NOT NULL REFERENCES public.growth_people(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  occupation text,
  revenue_range text,
  lifestyle_tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  family_size integer CHECK (family_size IS NULL OR family_size >= 0),
  life_goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  education_level text,
  preferred_language text NOT NULL DEFAULT 'en'
    CHECK (preferred_language IN ('en', 'es', 'pt')),
  household_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  business_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  insight_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score integer NOT NULL DEFAULT 40 CHECK (confidence_score BETWEEN 0 AND 100),
  source text NOT NULL DEFAULT 'client_survey',
  last_surveyed_at timestamptz,
  next_survey_due_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, person_id)
);

CREATE INDEX IF NOT EXISTS idx_client_insight_profiles_app_due
  ON public.client_insight_profiles(app_key, next_survey_due_at, confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_client_insight_profiles_user
  ON public.client_insight_profiles(app_key, user_id);

DROP TRIGGER IF EXISTS update_client_insight_profiles_updated_at ON public.client_insight_profiles;
CREATE TRIGGER update_client_insight_profiles_updated_at
  BEFORE UPDATE ON public.client_insight_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_insight_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own client insight profiles" ON public.client_insight_profiles;
CREATE POLICY "Users view own client insight profiles"
ON public.client_insight_profiles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users manage own client insight profiles" ON public.client_insight_profiles;
CREATE POLICY "Users manage own client insight profiles"
ON public.client_insight_profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users update own client insight profiles" ON public.client_insight_profiles;
CREATE POLICY "Users update own client insight profiles"
ON public.client_insight_profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator())
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins delete client insight profiles" ON public.client_insight_profiles;
CREATE POLICY "Admins delete client insight profiles"
ON public.client_insight_profiles FOR DELETE TO authenticated
USING (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.client_insight_survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  profile_id uuid REFERENCES public.client_insight_profiles(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.growth_people(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  survey_key text NOT NULL DEFAULT 'client_value_fit',
  survey_stage text NOT NULL DEFAULT 'intake'
    CHECK (survey_stage IN ('intake', 'quarterly', 'life_change', 'product_fit', 'manual_update')),
  locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es', 'pt')),
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  completion_score integer NOT NULL DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
  completed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_insight_responses_person
  ON public.client_insight_survey_responses(app_key, person_id, completed_at DESC);

ALTER TABLE public.client_insight_survey_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own client insight survey responses" ON public.client_insight_survey_responses;
CREATE POLICY "Users view own client insight survey responses"
ON public.client_insight_survey_responses FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users create own client insight survey responses" ON public.client_insight_survey_responses;
CREATE POLICY "Users create own client insight survey responses"
ON public.client_insight_survey_responses FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage client insight survey responses" ON public.client_insight_survey_responses;
CREATE POLICY "Admins manage client insight survey responses"
ON public.client_insight_survey_responses FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.client_insight_question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  survey_key text NOT NULL DEFAULT 'client_value_fit',
  audience text NOT NULL DEFAULT 'client'
    CHECK (audience IN ('all', 'client', 'provider', 'partner')),
  question_key text NOT NULL,
  locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es', 'pt')),
  question_label text NOT NULL,
  helper_text text,
  input_type text NOT NULL DEFAULT 'text'
    CHECK (input_type IN ('text', 'textarea', 'number', 'select', 'multiselect')),
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, survey_key, audience, question_key, locale)
);

DROP TRIGGER IF EXISTS update_client_insight_question_bank_updated_at ON public.client_insight_question_bank;
CREATE TRIGGER update_client_insight_question_bank_updated_at
  BEFORE UPDATE ON public.client_insight_question_bank
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_insight_question_bank ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view active client insight questions" ON public.client_insight_question_bank;
CREATE POLICY "Authenticated users view active client insight questions"
ON public.client_insight_question_bank FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage client insight questions" ON public.client_insight_question_bank;
CREATE POLICY "Admins manage client insight questions"
ON public.client_insight_question_bank FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

ALTER TABLE public.product_fit_scores
  ADD COLUMN IF NOT EXISTS insight_profile_id uuid REFERENCES public.client_insight_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS insight_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS missing_life_context jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.product_value_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  product_key text,
  campaign_key text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'product_value'
    CHECK (campaign_type IN ('product_value', 'survey_request', 'welcome', 'congrats', 'downsell')),
  audience text NOT NULL DEFAULT 'client'
    CHECK (audience IN ('all', 'client', 'provider', 'partner')),
  channel text NOT NULL DEFAULT 'email'
    CHECK (channel IN ('portal', 'email', 'push')),
  locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es', 'pt')),
  trigger_reason text NOT NULL DEFAULT 'missing_layer',
  subject text NOT NULL,
  body text NOT NULL,
  action_label text NOT NULL DEFAULT 'Open portal',
  action_url text NOT NULL DEFAULT '/customer-dashboard',
  cadence_days integer NOT NULL DEFAULT 21 CHECK (cadence_days >= 1),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_value_campaigns_unique
  ON public.product_value_campaigns(app_key, campaign_key, (coalesce(product_key, '__all__')), audience, channel, locale);

CREATE INDEX IF NOT EXISTS idx_product_value_campaigns_lookup
  ON public.product_value_campaigns(app_key, product_key, campaign_type, audience, channel, locale)
  WHERE is_active = true;

DROP TRIGGER IF EXISTS update_product_value_campaigns_updated_at ON public.product_value_campaigns;
CREATE TRIGGER update_product_value_campaigns_updated_at
  BEFORE UPDATE ON public.product_value_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_value_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view active product value campaigns" ON public.product_value_campaigns;
CREATE POLICY "Authenticated users view active product value campaigns"
ON public.product_value_campaigns FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage product value campaigns" ON public.product_value_campaigns;
CREATE POLICY "Admins manage product value campaigns"
ON public.product_value_campaigns FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.product_value_campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  campaign_id uuid REFERENCES public.product_value_campaigns(id) ON DELETE SET NULL,
  campaign_key text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'product_value'
    CHECK (campaign_type IN ('product_value', 'survey_request', 'welcome', 'congrats', 'downsell')),
  person_id uuid REFERENCES public.growth_people(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES public.product_recommendations(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  product_key text,
  audience text NOT NULL DEFAULT 'client'
    CHECK (audience IN ('all', 'client', 'provider', 'partner')),
  channel text NOT NULL DEFAULT 'email'
    CHECK (channel IN ('portal', 'email', 'push')),
  locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es', 'pt')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'read', 'clicked', 'dismissed', 'failed', 'cancelled')),
  subject text NOT NULL,
  body text NOT NULL,
  action_label text NOT NULL DEFAULT 'Open portal',
  action_url text NOT NULL DEFAULT '/customer-dashboard',
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  clicked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_value_campaign_events_person
  ON public.product_value_campaign_events(app_key, person_id, status, scheduled_for DESC);

CREATE INDEX IF NOT EXISTS idx_product_value_campaign_events_channel
  ON public.product_value_campaign_events(app_key, channel, status, scheduled_for);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_value_campaign_events_open_unique
  ON public.product_value_campaign_events(app_key, person_id, campaign_key, (coalesce(product_key, '__survey__')), channel)
  WHERE status IN ('queued', 'sent');

DROP TRIGGER IF EXISTS update_product_value_campaign_events_updated_at ON public.product_value_campaign_events;
CREATE TRIGGER update_product_value_campaign_events_updated_at
  BEFORE UPDATE ON public.product_value_campaign_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_value_campaign_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own product value campaign events" ON public.product_value_campaign_events;
CREATE POLICY "Users view own product value campaign events"
ON public.product_value_campaign_events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage product value campaign events" ON public.product_value_campaign_events;
CREATE POLICY "Admins manage product value campaign events"
ON public.product_value_campaign_events FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE OR REPLACE FUNCTION public.replace_value_campaign_tokens(
  source_text text,
  brand_name text,
  client_name text,
  product_name text,
  value_reason text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT replace(
    replace(
      replace(
        replace(coalesce(source_text, ''), '{{brand}}', coalesce(brand_name, 'Baise')),
        '{{client_name}}',
        coalesce(nullif(client_name, ''), 'there')
      ),
      '{{product_name}}',
      coalesce(nullif(product_name, ''), 'this option')
    ),
    '{{value_reason}}',
    coalesce(nullif(value_reason, ''), 'it may make your next step easier to manage from the portal')
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_value_campaigns_for_person(target_person_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_record public.growth_people%ROWTYPE;
  insight_record public.client_insight_profiles%ROWTYPE;
  target_audience text;
  selected_locale text;
  brand_name text;
  campaign_record public.product_value_campaigns%ROWTYPE;
  recommendation_record public.product_recommendations%ROWTYPE;
  product_record public.platform_products%ROWTYPE;
  fit_record public.product_fit_scores%ROWTYPE;
  resolved_subject text;
  resolved_body text;
  campaign_event_id uuid;
  queued_count integer := 0;
  survey_due boolean := false;
BEGIN
  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE id = target_person_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND person_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Value campaign access denied';
  END IF;

  target_audience := public.product_audience_for_person(person_record.person_type);
  selected_locale := CASE
    WHEN coalesce(person_record.preferred_locale, 'en') IN ('en', 'es', 'pt') THEN coalesce(person_record.preferred_locale, 'en')
    ELSE 'en'
  END;
  brand_name := CASE person_record.app_key
    WHEN 'legal' THEN 'Legal Baise'
    WHEN 'medical' THEN 'Medical Baise'
    ELSE 'Casa Baise'
  END;

  SELECT *
  INTO insight_record
  FROM public.client_insight_profiles
  WHERE app_key = person_record.app_key
    AND person_id = person_record.id;

  survey_due := NOT FOUND
    OR insight_record.next_survey_due_at IS NULL
    OR insight_record.next_survey_due_at <= now();

  IF survey_due THEN
    FOR campaign_record IN
      SELECT *
      FROM public.product_value_campaigns pvc
      WHERE pvc.app_key = person_record.app_key
        AND pvc.campaign_type = 'survey_request'
        AND pvc.product_key IS NULL
        AND pvc.audience IN ('all', target_audience)
        AND pvc.channel IN ('email', 'push', 'portal')
        AND pvc.locale = selected_locale
        AND pvc.is_active = true
        AND NOT EXISTS (
          SELECT 1
          FROM public.product_value_campaign_events pvce
          WHERE pvce.app_key = pvc.app_key
            AND pvce.person_id = person_record.id
            AND pvce.campaign_key = pvc.campaign_key
            AND pvce.channel = pvc.channel
            AND pvce.status IN ('queued', 'sent')
            AND pvce.created_at > now() - make_interval(days => pvc.cadence_days)
        )
      ORDER BY pvc.channel
    LOOP
      resolved_subject := public.replace_value_campaign_tokens(campaign_record.subject, brand_name, person_record.full_name, NULL, NULL);
      resolved_body := public.replace_value_campaign_tokens(campaign_record.body, brand_name, person_record.full_name, NULL, NULL);
      campaign_event_id := NULL;

      INSERT INTO public.product_value_campaign_events (
        app_key,
        campaign_id,
        campaign_key,
        campaign_type,
        person_id,
        user_id,
        audience,
        channel,
        locale,
        subject,
        body,
        action_label,
        action_url,
        metadata
      )
      VALUES (
        person_record.app_key,
        campaign_record.id,
        campaign_record.campaign_key,
        campaign_record.campaign_type,
        person_record.id,
        person_record.user_id,
        target_audience,
        campaign_record.channel,
        campaign_record.locale,
        resolved_subject,
        resolved_body,
        campaign_record.action_label,
        campaign_record.action_url,
        jsonb_build_object('source', 'client_insight_survey_due')
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO campaign_event_id;

      IF campaign_event_id IS NOT NULL THEN
        queued_count := queued_count + 1;

        IF campaign_record.channel IN ('push', 'portal') AND person_record.user_id IS NOT NULL THEN
          INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            priority,
            action_url,
            metadata,
            expires_at
          )
          VALUES (
            person_record.user_id,
            resolved_subject,
            resolved_body,
            'system',
            'normal',
            campaign_record.action_url,
            jsonb_build_object(
              'campaign_event_id', campaign_event_id,
              'campaign_key', campaign_record.campaign_key,
              'source', 'client_insight_value_campaign'
            ),
            now() + interval '45 days'
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  SELECT *
  INTO fit_record
  FROM public.product_fit_scores
  WHERE app_key = person_record.app_key
    AND person_id = person_record.id;

  IF FOUND AND coalesce(fit_record.do_not_pitch, false) THEN
    RETURN queued_count;
  END IF;

  FOR recommendation_record IN
    SELECT *
    FROM public.product_recommendations pr
    WHERE pr.app_key = person_record.app_key
      AND pr.person_id = person_record.id
      AND pr.status IN ('pending', 'queued', 'sent', 'viewed')
    ORDER BY pr.priority DESC, pr.created_at DESC
  LOOP
    SELECT *
    INTO product_record
    FROM public.platform_products
    WHERE app_key = person_record.app_key
      AND product_key = recommendation_record.recommended_product_key
      AND is_active = true;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    FOR campaign_record IN
      SELECT *
      FROM public.product_value_campaigns pvc
      WHERE pvc.app_key = person_record.app_key
        AND pvc.campaign_type = 'product_value'
        AND pvc.product_key = recommendation_record.recommended_product_key
        AND pvc.audience IN ('all', target_audience)
        AND pvc.channel IN ('email', 'push', 'portal')
        AND pvc.locale = selected_locale
        AND pvc.is_active = true
        AND NOT EXISTS (
          SELECT 1
          FROM public.product_value_campaign_events pvce
          WHERE pvce.app_key = pvc.app_key
            AND pvce.person_id = person_record.id
            AND pvce.campaign_key = pvc.campaign_key
            AND pvce.product_key = recommendation_record.recommended_product_key
            AND pvce.channel = pvc.channel
            AND pvce.status IN ('queued', 'sent')
            AND pvce.created_at > now() - make_interval(days => pvc.cadence_days)
        )
      ORDER BY
        CASE pvc.channel WHEN 'portal' THEN 1 WHEN 'push' THEN 2 ELSE 3 END
    LOOP
      resolved_subject := public.replace_value_campaign_tokens(
        campaign_record.subject,
        brand_name,
        person_record.full_name,
        product_record.name,
        recommendation_record.value_message
      );
      resolved_body := public.replace_value_campaign_tokens(
        campaign_record.body,
        brand_name,
        person_record.full_name,
        product_record.name,
        recommendation_record.value_message
      );
      campaign_event_id := NULL;

      INSERT INTO public.product_value_campaign_events (
        app_key,
        campaign_id,
        campaign_key,
        campaign_type,
        person_id,
        user_id,
        recommendation_id,
        product_id,
        product_key,
        audience,
        channel,
        locale,
        subject,
        body,
        action_label,
        action_url,
        metadata
      )
      VALUES (
        person_record.app_key,
        campaign_record.id,
        campaign_record.campaign_key,
        campaign_record.campaign_type,
        person_record.id,
        person_record.user_id,
        recommendation_record.id,
        product_record.id,
        product_record.product_key,
        target_audience,
        campaign_record.channel,
        campaign_record.locale,
        resolved_subject,
        resolved_body,
        campaign_record.action_label,
        campaign_record.action_url,
        jsonb_build_object(
          'source', 'product_value_fit',
          'fit_score', CASE WHEN fit_record.id IS NULL THEN NULL ELSE fit_record.fit_score END,
          'urgency', CASE WHEN fit_record.id IS NULL THEN NULL ELSE fit_record.urgency END,
          'value_reason', recommendation_record.value_message,
          'insight_profile_id', CASE WHEN insight_record.id IS NULL THEN NULL ELSE insight_record.id END
        )
      )
      ON CONFLICT DO NOTHING
      RETURNING id INTO campaign_event_id;

      IF campaign_event_id IS NOT NULL THEN
        queued_count := queued_count + 1;

        INSERT INTO public.product_offer_events (
          app_key,
          recommendation_id,
          person_id,
          user_id,
          product_key,
          event_type,
          channel,
          metadata
        )
        VALUES (
          person_record.app_key,
          recommendation_record.id,
          person_record.id,
          person_record.user_id,
          product_record.product_key,
          'queued',
          campaign_record.channel,
          jsonb_build_object('campaign_event_id', campaign_event_id, 'campaign_key', campaign_record.campaign_key)
        );

        UPDATE public.product_recommendations
        SET
          status = CASE WHEN status = 'pending' THEN 'queued' ELSE status END,
          last_sent_at = CASE WHEN campaign_record.channel = 'email' THEN now() ELSE last_sent_at END,
          metadata = metadata || jsonb_build_object('last_value_campaign_event_id', campaign_event_id),
          updated_at = now()
        WHERE id = recommendation_record.id;

        IF campaign_record.channel IN ('push', 'portal') AND person_record.user_id IS NOT NULL THEN
          INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            priority,
            action_url,
            metadata,
            expires_at
          )
          VALUES (
            person_record.user_id,
            resolved_subject,
            resolved_body,
            'system',
            CASE
              WHEN recommendation_record.priority >= 85 THEN 'high'
              WHEN recommendation_record.priority >= 65 THEN 'normal'
              ELSE 'low'
            END,
            campaign_record.action_url,
            jsonb_build_object(
              'campaign_event_id', campaign_event_id,
              'recommendation_id', recommendation_record.id,
              'product_key', product_record.product_key,
              'source', 'client_insight_value_campaign'
            ),
            now() + interval '45 days'
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  RETURN queued_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_value_campaigns_for_app(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  people_processed integer,
  campaigns_queued integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  person_record record;
  person_count integer := 0;
  queued_total integer := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can sync value campaigns';
  END IF;

  FOR person_record IN
    SELECT id
    FROM public.growth_people
    WHERE app_key = clean_app_key
      AND person_type IN ('client', 'provider', 'partner', 'influencer', 'lead', 'referral_lead')
    ORDER BY updated_at DESC
  LOOP
    person_count := person_count + 1;
    queued_total := queued_total + public.sync_value_campaigns_for_person(person_record.id);
  END LOOP;

  RETURN QUERY SELECT person_count, queued_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_client_insight_profile(
  target_app_key text,
  target_responses jsonb,
  target_survey_stage text DEFAULT 'intake',
  target_locale text DEFAULT 'en',
  target_person_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  clean_locale text := CASE WHEN target_locale IN ('en', 'es', 'pt') THEN target_locale ELSE 'en' END;
  clean_stage text := lower(coalesce(nullif(target_survey_stage, ''), 'intake'));
  responses jsonb := coalesce(target_responses, '{}'::jsonb);
  resolved_person_id uuid := target_person_id;
  person_record public.growth_people%ROWTYPE;
  profile_id uuid;
  response_id uuid;
  lifestyle_values text[] := ARRAY[]::text[];
  life_goals_value jsonb := '[]'::jsonb;
  family_size_value integer;
  answered_count integer := 0;
  completion_score_value integer := 0;
  missing_context jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to save insight profile';
  END IF;

  IF clean_stage NOT IN ('intake', 'quarterly', 'life_change', 'product_fit', 'manual_update') THEN
    clean_stage := 'intake';
  END IF;

  IF resolved_person_id IS NULL THEN
    SELECT public.upsert_growth_person(
      target_app_key := clean_app_key,
      target_user_id := auth.uid(),
      target_person_type := 'client',
      target_preferred_locale := clean_locale,
      target_metadata := jsonb_build_object('source', 'client_insight_survey')
    )
    INTO resolved_person_id;
  END IF;

  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE id = resolved_person_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship profile was not found';
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND person_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Client insight access denied';
  END IF;

  IF responses ? 'lifestyle_tags' THEN
    IF jsonb_typeof(responses->'lifestyle_tags') = 'array' THEN
      SELECT coalesce(array_agg(item.value), ARRAY[]::text[])
      INTO lifestyle_values
      FROM jsonb_array_elements_text(responses->'lifestyle_tags') AS item(value);
    ELSIF length(coalesce(responses->>'lifestyle_tags', '')) > 0 THEN
      lifestyle_values := string_to_array(responses->>'lifestyle_tags', ',');
    END IF;
  END IF;

  IF responses ? 'life_goals' THEN
    IF jsonb_typeof(responses->'life_goals') = 'array' THEN
      life_goals_value := responses->'life_goals';
    ELSIF length(coalesce(responses->>'life_goals', '')) > 0 THEN
      life_goals_value := to_jsonb(string_to_array(responses->>'life_goals', ','));
    END IF;
  END IF;

  family_size_value := CASE
    WHEN coalesce(responses->>'family_size', '') ~ '^[0-9]+$' THEN (responses->>'family_size')::integer
    ELSE NULL
  END;

  answered_count :=
    CASE WHEN nullif(trim(coalesce(responses->>'occupation', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN nullif(trim(coalesce(responses->>'revenue_range', '')), '') IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN coalesce(array_length(lifestyle_values, 1), 0) > 0 THEN 1 ELSE 0 END +
    CASE WHEN family_size_value IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN jsonb_array_length(life_goals_value) > 0 THEN 1 ELSE 0 END +
    CASE WHEN nullif(trim(coalesce(responses->>'education_level', '')), '') IS NOT NULL THEN 1 ELSE 0 END;

  completion_score_value := least(100, greatest(0, round((answered_count::numeric / 6::numeric) * 100)::integer));

  missing_context := (
    SELECT coalesce(jsonb_agg(item), '[]'::jsonb)
    FROM (
      SELECT 'occupation'::text AS item WHERE nullif(trim(coalesce(responses->>'occupation', '')), '') IS NULL
      UNION ALL SELECT 'revenue_range' WHERE nullif(trim(coalesce(responses->>'revenue_range', '')), '') IS NULL
      UNION ALL SELECT 'lifestyle_tags' WHERE coalesce(array_length(lifestyle_values, 1), 0) = 0
      UNION ALL SELECT 'family_size' WHERE family_size_value IS NULL
      UNION ALL SELECT 'life_goals' WHERE jsonb_array_length(life_goals_value) = 0
      UNION ALL SELECT 'education_level' WHERE nullif(trim(coalesce(responses->>'education_level', '')), '') IS NULL
    ) missing
  );

  INSERT INTO public.client_insight_profiles (
    app_key,
    person_id,
    user_id,
    occupation,
    revenue_range,
    lifestyle_tags,
    family_size,
    life_goals,
    education_level,
    preferred_language,
    household_context,
    business_context,
    insight_summary,
    confidence_score,
    source,
    last_surveyed_at,
    next_survey_due_at,
    metadata
  )
  VALUES (
    clean_app_key,
    person_record.id,
    person_record.user_id,
    nullif(trim(coalesce(responses->>'occupation', '')), ''),
    nullif(trim(coalesce(responses->>'revenue_range', '')), ''),
    lifestyle_values,
    family_size_value,
    life_goals_value,
    nullif(trim(coalesce(responses->>'education_level', '')), ''),
    clean_locale,
    coalesce(responses->'household_context', '{}'::jsonb),
    coalesce(responses->'business_context', '{}'::jsonb),
    jsonb_build_object(
      'answered_count', answered_count,
      'missing_context', missing_context,
      'survey_stage', clean_stage
    ),
    greatest(40, completion_score_value),
    'client_survey',
    now(),
    now() + interval '90 days',
    jsonb_build_object('last_response_source', 'portal')
  )
  ON CONFLICT (app_key, person_id)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    occupation = coalesce(EXCLUDED.occupation, client_insight_profiles.occupation),
    revenue_range = coalesce(EXCLUDED.revenue_range, client_insight_profiles.revenue_range),
    lifestyle_tags = CASE WHEN array_length(EXCLUDED.lifestyle_tags, 1) IS NULL THEN client_insight_profiles.lifestyle_tags ELSE EXCLUDED.lifestyle_tags END,
    family_size = coalesce(EXCLUDED.family_size, client_insight_profiles.family_size),
    life_goals = CASE WHEN jsonb_array_length(EXCLUDED.life_goals) = 0 THEN client_insight_profiles.life_goals ELSE EXCLUDED.life_goals END,
    education_level = coalesce(EXCLUDED.education_level, client_insight_profiles.education_level),
    preferred_language = EXCLUDED.preferred_language,
    household_context = client_insight_profiles.household_context || EXCLUDED.household_context,
    business_context = client_insight_profiles.business_context || EXCLUDED.business_context,
    insight_summary = EXCLUDED.insight_summary,
    confidence_score = greatest(client_insight_profiles.confidence_score, EXCLUDED.confidence_score),
    last_surveyed_at = now(),
    next_survey_due_at = now() + interval '90 days',
    metadata = client_insight_profiles.metadata || EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO profile_id;

  INSERT INTO public.client_insight_survey_responses (
    app_key,
    profile_id,
    person_id,
    user_id,
    survey_key,
    survey_stage,
    locale,
    responses,
    completion_score,
    metadata
  )
  VALUES (
    clean_app_key,
    profile_id,
    person_record.id,
    person_record.user_id,
    'client_value_fit',
    clean_stage,
    clean_locale,
    responses,
    completion_score_value,
    jsonb_build_object('missing_context', missing_context)
  )
  RETURNING id INTO response_id;

  UPDATE public.growth_people
  SET
    preferred_locale = clean_locale,
    metadata = metadata || jsonb_build_object(
      'client_insight_profile_id', profile_id,
      'latest_client_insight_response_id', response_id,
      'client_insight_completion_score', completion_score_value
    ),
    updated_at = now()
  WHERE id = person_record.id;

  PERFORM public.sync_product_recommendations_for_person(person_record.id);
  PERFORM public.recalculate_product_fit_score_for_person(person_record.id);

  UPDATE public.product_fit_scores
  SET
    insight_profile_id = profile_id,
    insight_summary = jsonb_build_object(
      'occupation', nullif(trim(coalesce(responses->>'occupation', '')), ''),
      'revenue_range', nullif(trim(coalesce(responses->>'revenue_range', '')), ''),
      'lifestyle_tags', lifestyle_values,
      'family_size', family_size_value,
      'life_goals', life_goals_value,
      'education_level', nullif(trim(coalesce(responses->>'education_level', '')), ''),
      'confidence_score', completion_score_value
    ),
    missing_life_context = missing_context,
    updated_at = now()
  WHERE app_key = clean_app_key
    AND person_id = person_record.id;

  PERFORM public.sync_value_campaigns_for_person(person_record.id);

  RETURN profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_client_insight_value_campaign_summary(target_app_key text DEFAULT NULL)
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
  relationship_count numeric := 0;
  profile_count numeric := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view client insight campaign summary';
  END IF;

  SELECT count(*)::numeric INTO relationship_count
  FROM public.growth_people
  WHERE app_key = clean_app_key
    AND person_type IN ('client', 'provider', 'lead', 'referral_lead');

  SELECT count(*)::numeric INTO profile_count
  FROM public.client_insight_profiles
  WHERE app_key = clean_app_key;

  RETURN QUERY
  SELECT 'insight_profiles'::text, 'Insight profiles'::text, profile_count, 'People with saved occupation, revenue, lifestyle, family, goals, or education context'::text;

  RETURN QUERY
  SELECT 'insight_coverage'::text, 'Insight coverage'::text,
    CASE WHEN relationship_count = 0 THEN 0 ELSE round((profile_count / relationship_count) * 100, 2) END,
    'Insight profiles divided by active relationship profiles'::text;

  RETURN QUERY
  SELECT 'surveys_due'::text, 'Surveys due'::text, count(*)::numeric, 'Profiles that should be refreshed now'::text
  FROM public.client_insight_profiles
  WHERE app_key = clean_app_key
    AND (next_survey_due_at IS NULL OR next_survey_due_at <= now());

  RETURN QUERY
  SELECT 'survey_responses_90d'::text, 'Survey responses 90d'::text, count(*)::numeric, 'Insight surveys completed in the last 90 days'::text
  FROM public.client_insight_survey_responses
  WHERE app_key = clean_app_key
    AND completed_at >= now() - interval '90 days';

  RETURN QUERY
  SELECT 'queued_email_campaigns'::text, 'Queued email campaigns'::text, count(*)::numeric, 'Value-based email events waiting for dispatch'::text
  FROM public.product_value_campaign_events
  WHERE app_key = clean_app_key
    AND channel = 'email'
    AND status = 'queued';

  RETURN QUERY
  SELECT 'queued_push_campaigns'::text, 'Queued push campaigns'::text, count(*)::numeric, 'Push and portal value prompts waiting for users'::text
  FROM public.product_value_campaign_events
  WHERE app_key = clean_app_key
    AND channel IN ('push', 'portal')
    AND status = 'queued';

  RETURN QUERY
  SELECT 'active_value_campaigns'::text, 'Active value campaigns'::text, count(*)::numeric, 'Active product, survey, welcome, congrats, and downsell campaign templates'::text
  FROM public.product_value_campaigns
  WHERE app_key = clean_app_key
    AND is_active = true;

  RETURN QUERY
  SELECT 'do_not_pitch'::text, 'Do not pitch'::text, count(*)::numeric, 'Fit profiles paused before outreach'::text
  FROM public.product_fit_scores
  WHERE app_key = clean_app_key
    AND do_not_pitch = true;
END;
$$;

INSERT INTO public.client_insight_question_bank (
  app_key,
  survey_key,
  audience,
  question_key,
  locale,
  question_label,
  helper_text,
  input_type,
  options,
  is_required,
  display_order,
  metadata
)
SELECT
  app.app_key,
  'client_value_fit',
  question.audience,
  question.question_key,
  question.locale,
  question.label,
  question.helper,
  question.input_type,
  question.options,
  question.is_required,
  question.display_order,
  jsonb_build_object('seeded', true, 'source', 'client_insight_value_campaigns')
FROM (VALUES ('casa'), ('legal'), ('medical')) AS app(app_key)
CROSS JOIN (
  VALUES
    ('all', 'occupation', 'en', 'What do you do for work?', 'This helps us understand the kind of time, risk, and record support that may be useful.', 'text', '[]'::jsonb, false, 10),
    ('all', 'occupation', 'pt', 'Qual e sua ocupacao?', 'Isso nos ajuda a entender que tipo de tempo, risco e organizacao pode ser util.', 'text', '[]'::jsonb, false, 10),
    ('all', 'occupation', 'es', 'A que te dedicas?', 'Esto nos ayuda a entender que tipo de tiempo, riesgo y organizacion puede ser util.', 'text', '[]'::jsonb, false, 10),
    ('all', 'revenue_range', 'en', 'Which revenue or income range best describes you?', 'Choose the range that feels closest. You can update it later.', 'select', '["Prefer not to say","Under R$5k/month","R$5k-R$15k/month","R$15k-R$40k/month","R$40k+/month","Business revenue varies"]'::jsonb, false, 20),
    ('all', 'revenue_range', 'pt', 'Qual faixa de renda ou faturamento melhor descreve voce?', 'Escolha a faixa mais proxima. Voce pode atualizar depois.', 'select', '["Prefiro nao informar","Abaixo de R$5 mil/mes","R$5 mil-R$15 mil/mes","R$15 mil-R$40 mil/mes","R$40 mil+/mes","Faturamento varia"]'::jsonb, false, 20),
    ('all', 'revenue_range', 'es', 'Que rango de ingresos describe mejor tu situacion?', 'Elige el rango mas cercano. Puedes actualizarlo despues.', 'select', '["Prefiero no decir","Menos de R$5 mil/mes","R$5 mil-R$15 mil/mes","R$15 mil-R$40 mil/mes","R$40 mil+/mes","Ingresos variables"]'::jsonb, false, 20),
    ('all', 'lifestyle_tags', 'en', 'Which lifestyle notes apply right now?', 'Select any context that helps us recommend support that fits your life.', 'multiselect', '["Busy professional","Business owner","Family organizer","Frequent traveler","New to Brazil","Planning a major change"]'::jsonb, false, 30),
    ('all', 'lifestyle_tags', 'pt', 'Quais aspectos do seu estilo de vida se aplicam agora?', 'Selecione qualquer contexto que ajude a recomendar suporte que se encaixe na sua vida.', 'multiselect', '["Profissional ocupado","Dono de negocio","Organizador da familia","Viajante frequente","Novo no Brasil","Planejando uma grande mudanca"]'::jsonb, false, 30),
    ('all', 'lifestyle_tags', 'es', 'Que aspectos de tu estilo de vida aplican ahora?', 'Selecciona cualquier contexto que ayude a recomendar apoyo que encaje con tu vida.', 'multiselect', '["Profesional ocupado","Dueno de negocio","Organizador familiar","Viajero frecuente","Nuevo en Brasil","Planeando un cambio importante"]'::jsonb, false, 30),
    ('all', 'family_size', 'en', 'How many people are in your household?', 'This helps us think about coverage, records, scheduling, and continuity.', 'number', '[]'::jsonb, false, 40),
    ('all', 'family_size', 'pt', 'Quantas pessoas moram com voce?', 'Isso ajuda a pensar em cobertura, registros, agenda e continuidade.', 'number', '[]'::jsonb, false, 40),
    ('all', 'family_size', 'es', 'Cuantas personas viven contigo?', 'Esto ayuda a pensar en cobertura, registros, agenda y continuidad.', 'number', '[]'::jsonb, false, 40),
    ('all', 'life_goals', 'en', 'What goals should your services support?', 'Examples: protect my family, grow my business, organize records, prepare for a move.', 'textarea', '[]'::jsonb, false, 50),
    ('all', 'life_goals', 'pt', 'Quais objetivos seus servicos devem apoiar?', 'Exemplos: proteger minha familia, crescer meu negocio, organizar registros, preparar uma mudanca.', 'textarea', '[]'::jsonb, false, 50),
    ('all', 'life_goals', 'es', 'Que metas deben apoyar tus servicios?', 'Ejemplos: proteger mi familia, crecer mi negocio, organizar registros, preparar una mudanza.', 'textarea', '[]'::jsonb, false, 50),
    ('all', 'education_level', 'en', 'What is your highest education level?', 'This helps us choose clearer resources and follow-up materials.', 'select', '["Prefer not to say","High school","Technical or vocational","Bachelor degree","Graduate degree","Doctorate or professional degree"]'::jsonb, false, 60),
    ('all', 'education_level', 'pt', 'Qual e seu maior nivel de escolaridade?', 'Isso nos ajuda a escolher recursos e acompanhamentos mais claros.', 'select', '["Prefiro nao informar","Ensino medio","Tecnico ou profissionalizante","Graduacao","Pos-graduacao","Doutorado ou grau profissional"]'::jsonb, false, 60),
    ('all', 'education_level', 'es', 'Cual es tu mayor nivel educativo?', 'Esto nos ayuda a elegir recursos y seguimientos mas claros.', 'select', '["Prefiero no decir","Secundaria","Tecnico o vocacional","Licenciatura","Posgrado","Doctorado o grado profesional"]'::jsonb, false, 60)
) AS question(audience, question_key, locale, label, helper, input_type, options, is_required, display_order)
ON CONFLICT (app_key, survey_key, audience, question_key, locale)
DO UPDATE SET
  question_label = EXCLUDED.question_label,
  helper_text = EXCLUDED.helper_text,
  input_type = EXCLUDED.input_type,
  options = EXCLUDED.options,
  is_required = EXCLUDED.is_required,
  display_order = EXCLUDED.display_order,
  metadata = public.client_insight_question_bank.metadata || EXCLUDED.metadata,
  updated_at = now();

INSERT INTO public.product_value_campaigns (
  app_key,
  product_id,
  product_key,
  campaign_key,
  campaign_type,
  audience,
  channel,
  locale,
  trigger_reason,
  subject,
  body,
  action_label,
  action_url,
  cadence_days,
  metadata
)
SELECT
  p.app_key,
  p.id,
  p.product_key,
  'value_fit_' || p.product_key || '_' || channel.channel || '_' || locale.locale,
  'product_value',
  p.audience,
  channel.channel,
  locale.locale,
  'missing_layer',
  CASE
    WHEN locale.locale = 'pt' AND channel.channel = 'push' THEN 'Uma opcao util esta pronta'
    WHEN locale.locale = 'pt' THEN '{{product_name}} pode ajudar agora'
    WHEN locale.locale = 'es' AND channel.channel = 'push' THEN 'Una opcion util esta lista'
    WHEN locale.locale = 'es' THEN '{{product_name}} puede ayudarte ahora'
    WHEN channel.channel = 'push' THEN 'A useful option is ready'
    ELSE '{{product_name}} may be useful now'
  END,
  CASE
    WHEN locale.locale = 'pt' AND p.audience = 'provider' THEN 'Com base no que sabemos sobre sua conta, {{product_name}} pode ajudar a organizar operacoes, pagamentos, clientes ou crescimento. Motivo: {{value_reason}}'
    WHEN locale.locale = 'pt' THEN 'Com base no que voce compartilhou e no que ainda nao esta usando, {{product_name}} pode adicionar uma camada util a sua vida ou servico. Motivo: {{value_reason}}'
    WHEN locale.locale = 'es' AND p.audience = 'provider' THEN 'Segun lo que sabemos de tu cuenta, {{product_name}} puede ayudar a organizar operaciones, pagos, clientes o crecimiento. Motivo: {{value_reason}}'
    WHEN locale.locale = 'es' THEN 'Segun lo que compartiste y lo que aun no usas, {{product_name}} puede agregar una capa util a tu vida o servicio. Motivo: {{value_reason}}'
    WHEN p.audience = 'provider' THEN 'Based on what we know about your account, {{product_name}} may help organize operations, payments, clients, or growth. Reason: {{value_reason}}'
    ELSE 'Based on what you shared and what you are not using yet, {{product_name}} may add a useful layer to your life or service path. Reason: {{value_reason}}'
  END,
  CASE
    WHEN locale.locale = 'pt' THEN 'Ver no portal'
    WHEN locale.locale = 'es' THEN 'Ver en el portal'
    ELSE 'Review in portal'
  END,
  CASE WHEN p.audience = 'provider' THEN '/provider-dashboard' ELSE '/customer-dashboard' END,
  21,
  jsonb_build_object('seeded', true, 'source', 'client_insight_value_campaigns')
FROM public.platform_products p
CROSS JOIN (VALUES ('portal'), ('email'), ('push')) AS channel(channel)
CROSS JOIN (VALUES ('en'), ('es'), ('pt')) AS locale(locale)
WHERE p.is_active = true
ON CONFLICT DO NOTHING;

INSERT INTO public.product_value_campaigns (
  app_key,
  product_key,
  campaign_key,
  campaign_type,
  audience,
  channel,
  locale,
  trigger_reason,
  subject,
  body,
  action_label,
  action_url,
  cadence_days,
  metadata
)
SELECT
  app.app_key,
  NULL,
  'client_insight_survey_' || audience.audience || '_' || channel.channel || '_' || locale.locale,
  'survey_request',
  audience.audience,
  channel.channel,
  locale.locale,
  'insight_refresh',
  CASE
    WHEN locale.locale = 'pt' THEN 'Ajude a {{brand}} recomendar melhor'
    WHEN locale.locale = 'es' THEN 'Ayuda a {{brand}} a recomendar mejor'
    ELSE 'Help {{brand}} recommend better'
  END,
  CASE
    WHEN locale.locale = 'pt' THEN 'Algumas respostas sobre trabalho, objetivos, familia e estilo de vida ajudam a mostrar apenas recomendacoes que realmente fazem sentido para voce.'
    WHEN locale.locale = 'es' THEN 'Unas respuestas sobre trabajo, metas, familia y estilo de vida ayudan a mostrar solo recomendaciones que realmente tienen sentido para ti.'
    ELSE 'A few answers about work, goals, family, and lifestyle help us show only recommendations that actually make sense for you.'
  END,
  CASE
    WHEN locale.locale = 'pt' THEN 'Atualizar perfil'
    WHEN locale.locale = 'es' THEN 'Actualizar perfil'
    ELSE 'Update profile'
  END,
  CASE WHEN audience.audience = 'provider' THEN '/provider-dashboard' ELSE '/customer-dashboard' END,
  45,
  jsonb_build_object('seeded', true, 'source', 'client_insight_value_campaigns')
FROM (VALUES ('casa'), ('legal'), ('medical')) AS app(app_key)
CROSS JOIN (VALUES ('client'), ('provider')) AS audience(audience)
CROSS JOIN (VALUES ('portal'), ('email'), ('push')) AS channel(channel)
CROSS JOIN (VALUES ('en'), ('es'), ('pt')) AS locale(locale)
ON CONFLICT DO NOTHING;

INSERT INTO public.platform_message_templates (
  app_key,
  event_type,
  audience,
  channel,
  locale,
  subject,
  body,
  action_label,
  is_transactional,
  metadata
)
SELECT
  app.app_key,
  template.event_type,
  template.audience,
  template.channel,
  template.locale,
  template.subject,
  template.body,
  template.action_label,
  false,
  jsonb_build_object('source', 'client_insight_value_campaigns')
FROM (VALUES ('casa'), ('legal'), ('medical')) AS app(app_key)
CROSS JOIN (
  VALUES
    ('client_insight_survey_request', 'client', 'email', 'en', 'Help Baise recommend better', 'A few answers about work, goals, family, and lifestyle help Baise show only recommendations that actually make sense for you.', 'Update profile'),
    ('client_insight_survey_request', 'client', 'push', 'en', 'Help Baise recommend better', 'Update your fit profile so recommendations stay useful.', 'Update profile'),
    ('client_insight_survey_request', 'client', 'email', 'pt', 'Ajude a Baise recomendar melhor', 'Algumas respostas sobre trabalho, objetivos, familia e estilo de vida ajudam a mostrar apenas recomendacoes que fazem sentido.', 'Atualizar perfil'),
    ('client_insight_survey_request', 'client', 'push', 'pt', 'Ajude a Baise recomendar melhor', 'Atualize seu perfil para manter recomendacoes uteis.', 'Atualizar perfil'),
    ('client_insight_survey_request', 'client', 'email', 'es', 'Ayuda a Baise a recomendar mejor', 'Unas respuestas sobre trabajo, metas, familia y estilo de vida ayudan a mostrar solo recomendaciones que tienen sentido.', 'Actualizar perfil'),
    ('client_insight_survey_request', 'client', 'push', 'es', 'Ayuda a Baise a recomendar mejor', 'Actualiza tu perfil para mantener recomendaciones utiles.', 'Actualizar perfil'),
    ('product_value_recommendation', 'client', 'email', 'en', 'A useful Baise option is ready', 'This recommendation is based on your account, goals, and current service path. Review it only when it adds value.', 'Review in portal'),
    ('product_value_recommendation', 'client', 'push', 'en', 'A useful Baise option is ready', 'Review a value-based recommendation in your portal.', 'Review'),
    ('product_value_recommendation', 'client', 'email', 'pt', 'Uma opcao util da Baise esta pronta', 'Esta recomendacao considera sua conta, objetivos e servicos atuais. Revise apenas se isso agregar valor.', 'Ver no portal'),
    ('product_value_recommendation', 'client', 'push', 'pt', 'Uma opcao util esta pronta', 'Veja uma recomendacao baseada em valor no portal.', 'Ver'),
    ('product_value_recommendation', 'client', 'email', 'es', 'Una opcion util de Baise esta lista', 'Esta recomendacion considera tu cuenta, metas y servicios actuales. Revisala solo si agrega valor.', 'Ver en el portal'),
    ('product_value_recommendation', 'client', 'push', 'es', 'Una opcion util esta lista', 'Revisa una recomendacion basada en valor en tu portal.', 'Ver')
) AS template(event_type, audience, channel, locale, subject, body, action_label)
ON CONFLICT (app_key, event_type, audience, channel, locale)
DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  action_label = EXCLUDED.action_label,
  is_transactional = EXCLUDED.is_transactional,
  metadata = public.platform_message_templates.metadata || EXCLUDED.metadata,
  updated_at = now();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_insight_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_insight_survey_responses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_insight_question_bank TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_value_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_value_campaign_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_value_campaign_tokens(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_value_campaigns_for_person(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_value_campaigns_for_app(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_client_insight_profile(text, jsonb, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_insight_value_campaign_summary(text) TO authenticated;
