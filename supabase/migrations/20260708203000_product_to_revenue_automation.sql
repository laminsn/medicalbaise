-- Product-to-revenue automation.
-- Turns product recommendations into trackable journeys, fit scores,
-- quote/invoice drafts, client add-on requests, partner-safe recommendations,
-- and revenue attribution.

ALTER TABLE public.provider_quote_records
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_key text,
  ADD COLUMN IF NOT EXISTS product_recommendation_id uuid REFERENCES public.product_recommendations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_campaign_key text,
  ADD COLUMN IF NOT EXISTS source_partner_code text;

ALTER TABLE public.provider_invoices
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_key text,
  ADD COLUMN IF NOT EXISTS product_recommendation_id uuid REFERENCES public.product_recommendations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_campaign_key text,
  ADD COLUMN IF NOT EXISTS source_partner_code text;

CREATE TABLE IF NOT EXISTS public.product_offer_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  journey_key text NOT NULL,
  name text NOT NULL,
  audience text NOT NULL DEFAULT 'client'
    CHECK (audience IN ('all', 'client', 'provider', 'partner', 'staff')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  welcome_subject text,
  welcome_body text,
  congrats_subject text,
  congrats_body text,
  upsell_subject text,
  upsell_body text,
  downsell_subject text,
  downsell_body text,
  reminder_subject text,
  reminder_body text,
  reminder_delay_days integer NOT NULL DEFAULT 7 CHECK (reminder_delay_days >= 0),
  consultation_cta_label text NOT NULL DEFAULT 'Schedule a consultation',
  consultation_cta_url text,
  portal_cta_label text NOT NULL DEFAULT 'Open your portal',
  portal_cta_path text NOT NULL DEFAULT '/dashboard',
  staff_task_trigger text NOT NULL DEFAULT 'recommendation_generated'
    CHECK (staff_task_trigger IN ('recommendation_generated', 'recommendation_sent', 'client_request', 'product_accepted', 'manual')),
  staff_task_title text NOT NULL DEFAULT 'Review product recommendation',
  staff_task_description text,
  staff_task_priority text NOT NULL DEFAULT 'normal'
    CHECK (staff_task_priority IN ('low', 'normal', 'high', 'urgent')),
  client_addon_label text,
  client_addon_description text,
  partner_safe_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, product_key, journey_key)
);

CREATE INDEX IF NOT EXISTS idx_product_offer_journeys_app_product
  ON public.product_offer_journeys(app_key, product_key, status);

DROP TRIGGER IF EXISTS update_product_offer_journeys_updated_at ON public.product_offer_journeys;
CREATE TRIGGER update_product_offer_journeys_updated_at
  BEFORE UPDATE ON public.product_offer_journeys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_offer_journeys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view active product offer journeys" ON public.product_offer_journeys;
CREATE POLICY "Authenticated users view active product offer journeys"
ON public.product_offer_journeys FOR SELECT TO authenticated
USING (status = 'active' OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage product offer journeys" ON public.product_offer_journeys;
CREATE POLICY "Admins manage product offer journeys"
ON public.product_offer_journeys FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.product_fit_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  person_id uuid NOT NULL REFERENCES public.growth_people(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fit_score integer NOT NULL DEFAULT 0 CHECK (fit_score BETWEEN 0 AND 100),
  urgency text NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('low', 'normal', 'medium', 'high', 'urgent')),
  timing text NOT NULL DEFAULT 'later'
    CHECK (timing IN ('now', 'soon', 'later', 'wait')),
  missing_protection jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_product_keys text[] NOT NULL DEFAULT ARRAY[]::text[],
  recommended_product_keys text[] NOT NULL DEFAULT ARRAY[]::text[],
  value_reason text,
  do_not_pitch boolean NOT NULL DEFAULT false,
  do_not_pitch_until timestamptz,
  do_not_pitch_reason text,
  status text NOT NULL DEFAULT 'watch'
    CHECK (status IN ('ready', 'watch', 'do_not_pitch', 'needs_review')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, person_id)
);

CREATE INDEX IF NOT EXISTS idx_product_fit_scores_app_status
  ON public.product_fit_scores(app_key, status, urgency, fit_score DESC);

DROP TRIGGER IF EXISTS update_product_fit_scores_updated_at ON public.product_fit_scores;
CREATE TRIGGER update_product_fit_scores_updated_at
  BEFORE UPDATE ON public.product_fit_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_fit_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own product fit scores" ON public.product_fit_scores;
CREATE POLICY "Users view own product fit scores"
ON public.product_fit_scores FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage product fit scores" ON public.product_fit_scores;
CREATE POLICY "Admins manage product fit scores"
ON public.product_fit_scores FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.product_revenue_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  recommendation_id uuid REFERENCES public.product_recommendations(id) ON DELETE SET NULL,
  person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.provider_quote_records(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.provider_invoices(id) ON DELETE SET NULL,
  calendar_event_id uuid REFERENCES public.provider_calendar_events(id) ON DELETE SET NULL,
  communication_event_id uuid REFERENCES public.provider_communication_events(id) ON DELETE SET NULL,
  action_type text NOT NULL
    CHECK (action_type IN ('proposal_draft', 'quote_line', 'call_scheduled', 'value_email', 'not_now', 'addon_request', 'partner_safe_recommendation', 'staff_task')),
  action_status text NOT NULL DEFAULT 'draft'
    CHECK (action_status IN ('draft', 'queued', 'completed', 'dismissed', 'failed')),
  title text NOT NULL,
  value_message text,
  client_safe_message text,
  internal_notes text,
  scheduled_for timestamptz,
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  created_by uuid DEFAULT auth.uid(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_revenue_actions_app_status
  ON public.product_revenue_actions(app_key, action_type, action_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_revenue_actions_recommendation
  ON public.product_revenue_actions(recommendation_id, created_at DESC);

DROP TRIGGER IF EXISTS update_product_revenue_actions_updated_at ON public.product_revenue_actions;
CREATE TRIGGER update_product_revenue_actions_updated_at
  BEFORE UPDATE ON public.product_revenue_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.provider_quote_records
  ADD COLUMN IF NOT EXISTS revenue_action_id uuid REFERENCES public.product_revenue_actions(id) ON DELETE SET NULL;

ALTER TABLE public.provider_invoices
  ADD COLUMN IF NOT EXISTS revenue_action_id uuid REFERENCES public.product_revenue_actions(id) ON DELETE SET NULL;

ALTER TABLE public.provider_communication_events
  ADD COLUMN IF NOT EXISTS product_key text,
  ADD COLUMN IF NOT EXISTS product_recommendation_id uuid REFERENCES public.product_recommendations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS revenue_action_id uuid REFERENCES public.product_revenue_actions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_provider_quote_records_product
  ON public.provider_quote_records(product_key, product_recommendation_id);

CREATE INDEX IF NOT EXISTS idx_provider_invoices_product
  ON public.provider_invoices(product_key, product_recommendation_id, payment_status);

ALTER TABLE public.product_revenue_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own product revenue actions" ON public.product_revenue_actions;
CREATE POLICY "Users view own product revenue actions"
ON public.product_revenue_actions FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin_or_moderator()
  OR EXISTS (
    SELECT 1
    FROM public.providers p
    WHERE p.id = product_revenue_actions.provider_id
      AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins manage product revenue actions" ON public.product_revenue_actions;
CREATE POLICY "Admins manage product revenue actions"
ON public.product_revenue_actions FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.client_product_addon_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  request_label text NOT NULL,
  request_message text,
  request_status text NOT NULL DEFAULT 'requested'
    CHECK (request_status IN ('requested', 'reviewing', 'quoted', 'accepted', 'declined', 'cancelled')),
  source text NOT NULL DEFAULT 'portal',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_product_addon_requests_user
  ON public.client_product_addon_requests(app_key, user_id, request_status, created_at DESC);

DROP TRIGGER IF EXISTS update_client_product_addon_requests_updated_at ON public.client_product_addon_requests;
CREATE TRIGGER update_client_product_addon_requests_updated_at
  BEFORE UPDATE ON public.client_product_addon_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_product_addon_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own product addon requests" ON public.client_product_addon_requests;
CREATE POLICY "Users manage own product addon requests"
ON public.client_product_addon_requests FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator())
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.partner_safe_product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  partner_person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  target_person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  suggestion_type text NOT NULL DEFAULT 'service'
    CHECK (suggestion_type IN ('service', 'resource', 'follow_up_request')),
  safe_message text NOT NULL,
  resource_url text,
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'reviewing', 'approved', 'declined', 'converted')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_safe_product_recommendations_app
  ON public.partner_safe_product_recommendations(app_key, status, created_at DESC);

DROP TRIGGER IF EXISTS update_partner_safe_product_recommendations_updated_at ON public.partner_safe_product_recommendations;
CREATE TRIGGER update_partner_safe_product_recommendations_updated_at
  BEFORE UPDATE ON public.partner_safe_product_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.partner_safe_product_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own safe product recommendations" ON public.partner_safe_product_recommendations;
CREATE POLICY "Partners view own safe product recommendations"
ON public.partner_safe_product_recommendations FOR SELECT TO authenticated
USING (
  public.is_admin_or_moderator()
  OR EXISTS (
    SELECT 1
    FROM public.growth_people gp
    WHERE gp.id = partner_safe_product_recommendations.partner_person_id
      AND gp.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Partners submit safe product recommendations" ON public.partner_safe_product_recommendations;
CREATE POLICY "Partners submit safe product recommendations"
ON public.partner_safe_product_recommendations FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin_or_moderator()
  OR EXISTS (
    SELECT 1
    FROM public.growth_people gp
    WHERE gp.id = partner_safe_product_recommendations.partner_person_id
      AND gp.user_id = auth.uid()
      AND gp.person_type IN ('partner', 'influencer')
  )
);

DROP POLICY IF EXISTS "Admins manage safe product recommendations" ON public.partner_safe_product_recommendations;
CREATE POLICY "Admins manage safe product recommendations"
ON public.partner_safe_product_recommendations FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE OR REPLACE FUNCTION public.recalculate_product_fit_score_for_person(target_person_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_record public.growth_people%ROWTYPE;
  current_products text[] := ARRAY[]::text[];
  recommended_products text[] := ARRAY[]::text[];
  missing_items jsonb := '[]'::jsonb;
  open_count integer := 0;
  current_count integer := 0;
  max_priority integer := 0;
  top_reason text;
  clean_score integer := 0;
  clean_urgency text := 'normal';
  clean_timing text := 'later';
  pitch_blocked boolean := false;
  pitch_reason text;
  score_id uuid;
BEGIN
  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE id = target_person_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship profile was not found';
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND person_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Product fit score access denied';
  END IF;

  SELECT coalesce(array_agg(DISTINCT product_key ORDER BY product_key), ARRAY[]::text[])
  INTO current_products
  FROM public.client_product_registrations
  WHERE app_key = person_record.app_key
    AND person_id = person_record.id
    AND status IN ('requested', 'trial', 'active', 'paused');

  SELECT
    coalesce(array_agg(DISTINCT recommended_product_key ORDER BY recommended_product_key), ARRAY[]::text[]),
    coalesce(jsonb_agg(
      jsonb_build_object(
        'product_key', recommended_product_key,
        'title', recommendation_title,
        'relation_type', relation_type,
        'priority', priority,
        'reason', trigger_reason,
        'value', value_message
      )
      ORDER BY priority DESC, created_at DESC
    ), '[]'::jsonb),
    count(*)::integer,
    coalesce(max(priority), 0)::integer,
    (array_agg(value_message ORDER BY priority DESC, created_at DESC))[1]
  INTO recommended_products, missing_items, open_count, max_priority, top_reason
  FROM public.product_recommendations
  WHERE app_key = person_record.app_key
    AND person_id = person_record.id
    AND status IN ('pending', 'queued', 'sent', 'viewed');

  current_count := coalesce(array_length(current_products, 1), 0);
  clean_score := least(100, greatest(0, 30 + (current_count * 8) + (open_count * 12) + floor(max_priority / 5)::integer));
  clean_urgency := CASE
    WHEN max_priority >= 90 THEN 'urgent'
    WHEN max_priority >= 80 THEN 'high'
    WHEN max_priority >= 60 THEN 'medium'
    WHEN open_count = 0 THEN 'low'
    ELSE 'normal'
  END;

  pitch_blocked := coalesce(person_record.duplicate_warning, false)
    OR lower(coalesce(person_record.communication_preferences->>'do_not_pitch', 'false')) = 'true'
    OR lower(coalesce(person_record.communication_preferences->>'marketing_paused', 'false')) = 'true';

  pitch_reason := CASE
    WHEN coalesce(person_record.duplicate_warning, false) THEN 'Duplicate warning must be reviewed before outreach.'
    WHEN lower(coalesce(person_record.communication_preferences->>'do_not_pitch', 'false')) = 'true' THEN 'Relationship is marked do not pitch.'
    WHEN lower(coalesce(person_record.communication_preferences->>'marketing_paused', 'false')) = 'true' THEN 'Marketing is paused for this relationship.'
    ELSE NULL
  END;

  clean_timing := CASE
    WHEN pitch_blocked THEN 'wait'
    WHEN max_priority >= 80 THEN 'now'
    WHEN open_count > 0 THEN 'soon'
    ELSE 'later'
  END;

  INSERT INTO public.product_fit_scores (
    app_key,
    person_id,
    user_id,
    fit_score,
    urgency,
    timing,
    missing_protection,
    current_product_keys,
    recommended_product_keys,
    value_reason,
    do_not_pitch,
    do_not_pitch_reason,
    status,
    metadata,
    calculated_at
  )
  VALUES (
    person_record.app_key,
    person_record.id,
    person_record.user_id,
    clean_score,
    clean_urgency,
    clean_timing,
    missing_items,
    current_products,
    recommended_products,
    coalesce(top_reason, 'No urgent product gap is currently detected.'),
    pitch_blocked,
    pitch_reason,
    CASE WHEN pitch_blocked THEN 'do_not_pitch' WHEN open_count > 0 THEN 'ready' ELSE 'watch' END,
    jsonb_build_object('open_recommendation_count', open_count, 'current_product_count', current_count),
    now()
  )
  ON CONFLICT (app_key, person_id)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    fit_score = EXCLUDED.fit_score,
    urgency = EXCLUDED.urgency,
    timing = EXCLUDED.timing,
    missing_protection = EXCLUDED.missing_protection,
    current_product_keys = EXCLUDED.current_product_keys,
    recommended_product_keys = EXCLUDED.recommended_product_keys,
    value_reason = EXCLUDED.value_reason,
    do_not_pitch = EXCLUDED.do_not_pitch,
    do_not_pitch_reason = EXCLUDED.do_not_pitch_reason,
    status = EXCLUDED.status,
    metadata = product_fit_scores.metadata || EXCLUDED.metadata,
    calculated_at = now(),
    updated_at = now()
  RETURNING id INTO score_id;

  RETURN score_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_fit_scores_for_app(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  people_processed integer,
  scores_updated integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  person_record record;
  people_count integer := 0;
  score_count integer := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can sync product fit scores';
  END IF;

  FOR person_record IN
    SELECT id
    FROM public.growth_people
    WHERE app_key = clean_app_key
  LOOP
    PERFORM public.recalculate_product_fit_score_for_person(person_record.id);
    people_count := people_count + 1;
    score_count := score_count + 1;
  END LOOP;

  people_processed := people_count;
  scores_updated := score_count;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_product_fit_score_from_recommendation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.person_id IS NOT NULL THEN
    PERFORM public.recalculate_product_fit_score_for_person(NEW.person_id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_fit_score_from_recommendation_sync ON public.product_recommendations;
CREATE TRIGGER product_fit_score_from_recommendation_sync
  AFTER INSERT OR UPDATE OF status, priority, recommended_product_key
  ON public.product_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_product_fit_score_from_recommendation();

CREATE OR REPLACE FUNCTION public.recalculate_product_fit_score_from_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.person_id IS NOT NULL THEN
    PERFORM public.recalculate_product_fit_score_for_person(NEW.person_id);
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_fit_score_from_registration_sync ON public.client_product_registrations;
CREATE TRIGGER product_fit_score_from_registration_sync
  AFTER INSERT OR UPDATE OF status, product_key
  ON public.client_product_registrations
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_product_fit_score_from_registration();

CREATE OR REPLACE FUNCTION public.create_product_revenue_action(
  target_recommendation_id uuid,
  target_action_type text,
  target_provider_id uuid DEFAULT NULL,
  target_amount numeric DEFAULT 0,
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.product_revenue_actions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recommendation_record public.product_recommendations%ROWTYPE;
  person_record public.growth_people%ROWTYPE;
  product_record public.platform_products%ROWTYPE;
  action_record public.product_revenue_actions%ROWTYPE;
  clean_action text := lower(coalesce(nullif(target_action_type, ''), 'staff_task'));
  clean_amount numeric := greatest(coalesce(target_amount, 0), 0);
  created_contact_id uuid;
  created_quote_id uuid;
  created_invoice_id uuid;
  created_calendar_id uuid;
  created_comm_id uuid;
  start_time timestamptz;
BEGIN
  IF clean_action NOT IN ('proposal_draft', 'quote_line', 'call_scheduled', 'value_email', 'not_now', 'staff_task') THEN
    RAISE EXCEPTION 'Unsupported revenue action';
  END IF;

  SELECT *
  INTO recommendation_record
  FROM public.product_recommendations
  WHERE id = target_recommendation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recommendation was not found';
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND recommendation_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Recommendation action access denied';
  END IF;

  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE id = recommendation_record.person_id;

  SELECT *
  INTO product_record
  FROM public.platform_products
  WHERE app_key = recommendation_record.app_key
    AND product_key = recommendation_record.recommended_product_key;

  IF target_provider_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.providers p
      WHERE p.id = target_provider_id
        AND (public.is_admin_or_moderator() OR p.user_id = auth.uid())
    )
  THEN
    RAISE EXCEPTION 'Provider access denied for revenue action';
  END IF;

  INSERT INTO public.product_revenue_actions (
    app_key,
    recommendation_id,
    person_id,
    user_id,
    product_id,
    product_key,
    provider_id,
    action_type,
    action_status,
    title,
    value_message,
    client_safe_message,
    internal_notes,
    scheduled_for,
    amount,
    currency,
    metadata
  )
  VALUES (
    recommendation_record.app_key,
    recommendation_record.id,
    recommendation_record.person_id,
    recommendation_record.user_id,
    product_record.id,
    recommendation_record.recommended_product_key,
    target_provider_id,
    clean_action,
    CASE WHEN clean_action = 'not_now' THEN 'dismissed' ELSE 'queued' END,
    recommendation_record.recommendation_title,
    recommendation_record.value_message,
    coalesce(target_metadata->>'client_safe_message', recommendation_record.value_message),
    target_metadata->>'internal_notes',
    NULLIF(target_metadata->>'scheduled_for', '')::timestamptz,
    clean_amount,
    coalesce(NULLIF(target_metadata->>'currency', ''), 'BRL'),
    coalesce(target_metadata, '{}'::jsonb)
  )
  RETURNING * INTO action_record;

  IF target_provider_id IS NOT NULL AND clean_action IN ('proposal_draft', 'quote_line', 'call_scheduled', 'value_email') THEN
    INSERT INTO public.provider_crm_contacts (
      provider_id,
      customer_id,
      created_by,
      full_name,
      email,
      phone,
      relationship_type,
      status,
      source,
      priority,
      preferred_channel,
      estimated_value,
      tags,
      notes,
      metadata
    )
    VALUES (
      target_provider_id,
      person_record.user_id,
      auth.uid(),
      coalesce(nullif(person_record.full_name, ''), nullif(person_record.email, ''), 'Recommended client'),
      person_record.email,
      person_record.phone,
      'lead',
      CASE WHEN clean_action IN ('proposal_draft', 'quote_line') THEN 'quoted' ELSE 'contacted' END,
      'campaign',
      CASE WHEN recommendation_record.priority >= 80 THEN 'hot' ELSE 'warm' END,
      'portal',
      clean_amount,
      ARRAY['product_recommendation', recommendation_record.recommended_product_key],
      recommendation_record.trigger_reason,
      jsonb_build_object(
        'growth_person_id', person_record.id,
        'recommendation_id', recommendation_record.id,
        'revenue_action_id', action_record.id
      )
    )
    RETURNING id INTO created_contact_id;
  END IF;

  IF clean_action = 'proposal_draft' AND target_provider_id IS NOT NULL THEN
    INSERT INTO public.provider_quote_records (
      provider_id,
      contact_id,
      created_by,
      title,
      service_scope,
      currency,
      subtotal,
      total_amount,
      status,
      valid_until,
      product_id,
      product_key,
      product_recommendation_id,
      revenue_action_id,
      source_campaign_key,
      source_partner_code,
      metadata
    )
    VALUES (
      target_provider_id,
      created_contact_id,
      auth.uid(),
      recommendation_record.recommendation_title,
      recommendation_record.value_message,
      lower(coalesce(NULLIF(target_metadata->>'currency', ''), 'brl')),
      clean_amount,
      clean_amount,
      'draft',
      current_date + 14,
      product_record.id,
      recommendation_record.recommended_product_key,
      recommendation_record.id,
      action_record.id,
      person_record.campaign_key,
      person_record.partner_code,
      jsonb_build_object('source', 'product_revenue_action', 'recommendation_id', recommendation_record.id)
    )
    RETURNING id INTO created_quote_id;
  ELSIF clean_action = 'quote_line' AND target_provider_id IS NOT NULL THEN
    INSERT INTO public.provider_invoices (
      provider_id,
      customer_id,
      created_by,
      currency,
      subtotal,
      total_amount,
      service_description,
      invoice_type,
      payment_status,
      due_at,
      product_id,
      product_key,
      product_recommendation_id,
      revenue_action_id,
      source_campaign_key,
      source_partner_code,
      metadata
    )
    VALUES (
      target_provider_id,
      person_record.user_id,
      auth.uid(),
      lower(coalesce(NULLIF(target_metadata->>'currency', ''), 'brl')),
      clean_amount,
      clean_amount,
      recommendation_record.recommendation_title || ': ' || recommendation_record.value_message,
      'standard',
      'draft',
      now() + interval '14 days',
      product_record.id,
      recommendation_record.recommended_product_key,
      recommendation_record.id,
      action_record.id,
      person_record.campaign_key,
      person_record.partner_code,
      jsonb_build_object('source', 'product_revenue_action', 'recommendation_id', recommendation_record.id)
    )
    RETURNING id INTO created_invoice_id;
  ELSIF clean_action = 'call_scheduled' AND target_provider_id IS NOT NULL THEN
    start_time := coalesce(NULLIF(target_metadata->>'scheduled_for', '')::timestamptz, now() + interval '2 days');

    INSERT INTO public.provider_calendar_events (
      provider_id,
      customer_id,
      created_by,
      event_type,
      title,
      description,
      start_at,
      end_at,
      status,
      notification_offsets_minutes,
      channel_preferences,
      portal_first,
      metadata
    )
    VALUES (
      target_provider_id,
      person_record.user_id,
      auth.uid(),
      'follow_up',
      'Product fit consultation: ' || recommendation_record.recommendation_title,
      recommendation_record.value_message,
      start_time,
      start_time + interval '30 minutes',
      'scheduled',
      ARRAY[1440, 120],
      ARRAY['portal', 'email'],
      true,
      jsonb_build_object('source', 'product_revenue_action', 'recommendation_id', recommendation_record.id, 'revenue_action_id', action_record.id)
    )
    RETURNING id INTO created_calendar_id;
  ELSIF clean_action = 'value_email' AND target_provider_id IS NOT NULL THEN
    INSERT INTO public.provider_communication_events (
      app_key,
      event_type,
      provider_id,
      customer_id,
      created_by,
      purpose,
      channel,
      subject,
      message_body,
      scheduled_at,
      status,
      recipient_email,
      recipient_phone,
      product_key,
      product_recommendation_id,
      revenue_action_id,
      metadata
    )
    VALUES (
      recommendation_record.app_key,
      'product_recommendation',
      target_provider_id,
      person_record.user_id,
      auth.uid(),
      'campaign',
      'email',
      coalesce(target_metadata->>'subject', recommendation_record.recommendation_title),
      coalesce(target_metadata->>'message_body', recommendation_record.value_message),
      now(),
      'queued',
      person_record.email,
      person_record.phone,
      recommendation_record.recommended_product_key,
      recommendation_record.id,
      action_record.id,
      jsonb_build_object('source', 'product_revenue_action')
    )
    RETURNING id INTO created_comm_id;
  END IF;

  IF clean_action = 'not_now' THEN
    UPDATE public.product_recommendations
    SET
      status = 'dismissed',
      dismissed_at = now(),
      metadata = metadata || jsonb_build_object('not_now_action_id', action_record.id)
    WHERE id = recommendation_record.id;
  ELSIF clean_action = 'value_email' THEN
    UPDATE public.product_recommendations
    SET
      status = CASE WHEN status = 'pending' THEN 'queued' ELSE status END,
      last_sent_at = now(),
      metadata = metadata || jsonb_build_object('last_value_email_action_id', action_record.id)
    WHERE id = recommendation_record.id;
  END IF;

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
    recommendation_record.app_key,
    recommendation_record.id,
    recommendation_record.person_id,
    recommendation_record.user_id,
    recommendation_record.recommended_product_key,
    CASE WHEN clean_action = 'not_now' THEN 'dismissed' WHEN clean_action = 'value_email' THEN 'sent' ELSE 'note' END,
    CASE WHEN clean_action = 'value_email' THEN 'email' ELSE 'staff' END,
    jsonb_build_object('revenue_action_id', action_record.id, 'action_type', clean_action)
  );

  UPDATE public.product_revenue_actions
  SET
    contact_id = coalesce(created_contact_id, product_revenue_actions.contact_id),
    quote_id = coalesce(created_quote_id, product_revenue_actions.quote_id),
    invoice_id = coalesce(created_invoice_id, product_revenue_actions.invoice_id),
    calendar_event_id = coalesce(created_calendar_id, product_revenue_actions.calendar_event_id),
    communication_event_id = coalesce(created_comm_id, product_revenue_actions.communication_event_id),
    action_status = CASE
      WHEN clean_action = 'not_now' THEN 'dismissed'
      WHEN created_quote_id IS NOT NULL OR created_invoice_id IS NOT NULL OR created_calendar_id IS NOT NULL OR created_comm_id IS NOT NULL THEN 'completed'
      ELSE 'queued'
    END,
    updated_at = now()
  WHERE id = action_record.id
  RETURNING * INTO action_record;

  INSERT INTO public.growth_followup_tasks (
    app_key,
    assigned_to,
    task_type,
    title,
    status,
    priority,
    due_at,
    metadata
  )
  VALUES (
    recommendation_record.app_key,
    auth.uid(),
    'follow_up',
    CASE clean_action
      WHEN 'proposal_draft' THEN 'Review proposal draft'
      WHEN 'quote_line' THEN 'Review quote or invoice draft'
      WHEN 'call_scheduled' THEN 'Prepare for product fit consultation'
      WHEN 'value_email' THEN 'Review value email follow-up'
      WHEN 'not_now' THEN 'Respect not-now product timing'
      ELSE 'Review product recommendation'
    END,
    CASE WHEN clean_action = 'not_now' THEN 'completed' ELSE 'open' END,
    CASE WHEN recommendation_record.priority >= 80 THEN 'high' ELSE 'normal' END,
    CASE WHEN clean_action = 'not_now' THEN now() ELSE now() + interval '2 days' END,
    jsonb_build_object(
      'source', 'product_revenue_action',
      'recommendation_id', recommendation_record.id,
      'revenue_action_id', action_record.id,
      'product_key', recommendation_record.recommended_product_key
    )
  );

  RETURN action_record;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_client_product_addon_request(
  target_app_key text,
  target_product_key text,
  target_message text DEFAULT NULL,
  target_source text DEFAULT 'portal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  person_record public.growth_people%ROWTYPE;
  product_record public.platform_products%ROWTYPE;
  request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in is required to request an add-on';
  END IF;

  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE app_key = clean_app_key
    AND user_id = auth.uid()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship profile was not found';
  END IF;

  SELECT *
  INTO product_record
  FROM public.platform_products
  WHERE app_key = clean_app_key
    AND product_key = target_product_key
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active product was not found';
  END IF;

  INSERT INTO public.client_product_addon_requests (
    app_key,
    person_id,
    user_id,
    product_id,
    product_key,
    request_label,
    request_message,
    source,
    metadata
  )
  VALUES (
    clean_app_key,
    person_record.id,
    person_record.user_id,
    product_record.id,
    product_record.product_key,
    coalesce(product_record.short_name, product_record.name),
    target_message,
    coalesce(nullif(target_source, ''), 'portal'),
    jsonb_build_object('product_name', product_record.name)
  )
  RETURNING id INTO request_id;

  INSERT INTO public.product_revenue_actions (
    app_key,
    person_id,
    user_id,
    product_id,
    product_key,
    action_type,
    action_status,
    title,
    value_message,
    client_safe_message,
    metadata
  )
  VALUES (
    clean_app_key,
    person_record.id,
    person_record.user_id,
    product_record.id,
    product_record.product_key,
    'addon_request',
    'queued',
    'Client add-on request: ' || product_record.name,
    target_message,
    coalesce(target_message, product_record.description),
    jsonb_build_object('addon_request_id', request_id, 'source', target_source)
  );

  RETURN request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_revenue_metrics(target_app_key text DEFAULT NULL)
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
  people_count numeric := 0;
  active_count numeric := 0;
  upsell_total numeric := 0;
  upsell_accepted numeric := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view product revenue metrics';
  END IF;

  SELECT count(*)::numeric INTO people_count
  FROM public.growth_people
  WHERE app_key = clean_app_key;

  SELECT count(*)::numeric INTO active_count
  FROM public.client_product_registrations
  WHERE app_key = clean_app_key
    AND status IN ('trial', 'active');

  SELECT count(*)::numeric INTO upsell_total
  FROM public.product_recommendations
  WHERE app_key = clean_app_key
    AND relation_type = 'upsell';

  SELECT count(*)::numeric INTO upsell_accepted
  FROM public.product_recommendations
  WHERE app_key = clean_app_key
    AND relation_type = 'upsell'
    AND status = 'accepted';

  RETURN QUERY
  SELECT 'products_sold'::text, 'Products sold'::text, active_count, 'Trial or active product registrations'::text;

  RETURN QUERY
  SELECT 'attach_rate'::text, 'Attach rate'::text,
    CASE WHEN people_count = 0 THEN 0 ELSE round((active_count / people_count) * 100, 2) END,
    'Active products divided by relationship profiles'::text;

  RETURN QUERY
  SELECT 'upsell_conversion'::text, 'Upsell conversion'::text,
    CASE WHEN upsell_total = 0 THEN 0 ELSE round((upsell_accepted / upsell_total) * 100, 2) END,
    'Accepted upsell recommendations divided by all generated upsells'::text;

  RETURN QUERY
  SELECT 'downsell_saves'::text, 'Downsell saves'::text, count(*)::numeric, 'Accepted downsell recommendations'::text
  FROM public.product_recommendations
  WHERE app_key = clean_app_key
    AND relation_type = 'downsell'
    AND status = 'accepted';

  RETURN QUERY
  SELECT 'attributed_paid_revenue'::text, 'Attributed paid revenue'::text, coalesce(sum(total_amount), 0)::numeric, 'Paid invoice revenue linked to products'::text
  FROM public.provider_invoices
  WHERE product_key IS NOT NULL
    AND product_key IN (
      SELECT product_key
      FROM public.platform_products
      WHERE app_key = clean_app_key
    )
    AND payment_status = 'paid';

  RETURN QUERY
  SELECT 'missed_product_opportunities'::text, 'Missed opportunities'::text, count(*)::numeric, 'Open recommendations not yet accepted or dismissed'::text
  FROM public.product_recommendations
  WHERE app_key = clean_app_key
    AND status IN ('pending', 'queued', 'sent', 'viewed');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_revenue_attribution(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  product_key text,
  product_name text,
  audience text,
  active_registrations numeric,
  open_recommendations numeric,
  accepted_recommendations numeric,
  revenue_actions numeric,
  quote_drafts numeric,
  invoiced_revenue numeric,
  paid_revenue numeric,
  attach_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  people_count numeric := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view product revenue attribution';
  END IF;

  SELECT count(*)::numeric INTO people_count
  FROM public.growth_people
  WHERE app_key = clean_app_key;

  RETURN QUERY
  SELECT
    p.product_key,
    p.name,
    p.audience,
    (
      SELECT count(*)::numeric
      FROM public.client_product_registrations cpr
      WHERE cpr.app_key = clean_app_key
        AND cpr.product_key = p.product_key
        AND cpr.status IN ('trial', 'active')
    ),
    (
      SELECT count(*)::numeric
      FROM public.product_recommendations pr
      WHERE pr.app_key = clean_app_key
        AND pr.recommended_product_key = p.product_key
        AND pr.status IN ('pending', 'queued', 'sent', 'viewed')
    ),
    (
      SELECT count(*)::numeric
      FROM public.product_recommendations pr
      WHERE pr.app_key = clean_app_key
        AND pr.recommended_product_key = p.product_key
        AND pr.status = 'accepted'
    ),
    (
      SELECT count(*)::numeric
      FROM public.product_revenue_actions pra
      WHERE pra.app_key = clean_app_key
        AND pra.product_key = p.product_key
    ),
    (
      SELECT count(*)::numeric
      FROM public.provider_quote_records pqr
      WHERE pqr.product_key = p.product_key
    ),
    (
      SELECT coalesce(sum(pi.total_amount), 0)::numeric
      FROM public.provider_invoices pi
      WHERE pi.product_key = p.product_key
        AND pi.payment_status IN ('draft', 'pending', 'processing', 'paid')
    ),
    (
      SELECT coalesce(sum(pi.total_amount), 0)::numeric
      FROM public.provider_invoices pi
      WHERE pi.product_key = p.product_key
        AND pi.payment_status = 'paid'
    ),
    CASE
      WHEN people_count = 0 THEN 0
      ELSE round((
        SELECT count(*)::numeric
        FROM public.client_product_registrations cpr
        WHERE cpr.app_key = clean_app_key
          AND cpr.product_key = p.product_key
          AND cpr.status IN ('trial', 'active')
      ) / people_count * 100, 2)
    END
  FROM public.platform_products p
  WHERE p.app_key = clean_app_key
  ORDER BY p.display_order, p.name;
END;
$$;

INSERT INTO public.product_offer_journeys (
  app_key,
  product_id,
  product_key,
  journey_key,
  name,
  audience,
  status,
  welcome_subject,
  welcome_body,
  congrats_subject,
  congrats_body,
  upsell_subject,
  upsell_body,
  downsell_subject,
  downsell_body,
  reminder_subject,
  reminder_body,
  consultation_cta_label,
  portal_cta_label,
  portal_cta_path,
  staff_task_title,
  staff_task_description,
  staff_task_priority,
  client_addon_label,
  client_addon_description,
  partner_safe_message,
  metadata
)
SELECT
  p.app_key,
  p.id,
  p.product_key,
  p.product_key || '_default_journey',
  coalesce(p.short_name, p.name) || ' offer journey',
  p.audience,
  'active',
  'Welcome to ' || p.name,
  'This is here to make your next step easier, more organized, and more valuable inside your Baise portal.',
  'Your next step is active',
  'You now have a cleaner way to manage the service, records, communication, and next actions connected to this product.',
  'A helpful next layer for your Baise account',
  'Based on what you already use, this can add structure, trust, records, or growth support without adding unnecessary noise.',
  'Start smaller and keep momentum',
  'If this is not the right time for the full option, staff can help you choose a smaller next step that still protects your progress.',
  'Still interested in this next step?',
  'You can review this anytime in your portal. The goal is value, clarity, and better follow-through, not pressure.',
  CASE WHEN p.audience = 'provider' THEN 'Discuss growth fit' WHEN p.audience = 'partner' THEN 'Request campaign follow-up' ELSE 'Ask a Baise specialist' END,
  CASE WHEN p.audience = 'provider' THEN 'Open provider portal' WHEN p.audience = 'partner' THEN 'Open partner portal' ELSE 'Open my portal' END,
  CASE WHEN p.audience = 'provider' THEN '/provider-dashboard' WHEN p.audience = 'partner' THEN '/partner-dashboard' ELSE '/dashboard' END,
  'Review ' || coalesce(p.short_name, p.name) || ' fit',
  'Review whether this product adds real value based on current products, recommendations, timing, and source.',
  CASE WHEN p.tier_level IN ('premium', 'advanced', 'enterprise') THEN 'high' ELSE 'normal' END,
  CASE
    WHEN p.product_key LIKE '%annual%' THEN 'Request annual care'
    WHEN p.product_key LIKE '%insurance%' THEN 'Ask about title insurance'
    WHEN p.product_key LIKE '%residency%' THEN 'Explore residency support'
    WHEN p.product_key LIKE '%ownership%' THEN 'Review ownership structure'
    ELSE 'Ask about ' || coalesce(p.short_name, p.name)
  END,
  'A Baise specialist can explain whether this fits your current service path and what it would add.',
  'Share this as a helpful resource and route the person back to Baise for pricing, availability, and follow-up.',
  jsonb_build_object('seeded', true, 'source', 'product_to_revenue_automation')
FROM public.platform_products p
ON CONFLICT (app_key, product_key, journey_key)
DO UPDATE SET
  product_id = EXCLUDED.product_id,
  name = EXCLUDED.name,
  audience = EXCLUDED.audience,
  status = EXCLUDED.status,
  welcome_subject = EXCLUDED.welcome_subject,
  welcome_body = EXCLUDED.welcome_body,
  congrats_subject = EXCLUDED.congrats_subject,
  congrats_body = EXCLUDED.congrats_body,
  upsell_subject = EXCLUDED.upsell_subject,
  upsell_body = EXCLUDED.upsell_body,
  downsell_subject = EXCLUDED.downsell_subject,
  downsell_body = EXCLUDED.downsell_body,
  reminder_subject = EXCLUDED.reminder_subject,
  reminder_body = EXCLUDED.reminder_body,
  consultation_cta_label = EXCLUDED.consultation_cta_label,
  portal_cta_label = EXCLUDED.portal_cta_label,
  portal_cta_path = EXCLUDED.portal_cta_path,
  staff_task_title = EXCLUDED.staff_task_title,
  staff_task_description = EXCLUDED.staff_task_description,
  staff_task_priority = EXCLUDED.staff_task_priority,
  client_addon_label = EXCLUDED.client_addon_label,
  client_addon_description = EXCLUDED.client_addon_description,
  partner_safe_message = EXCLUDED.partner_safe_message,
  metadata = product_offer_journeys.metadata || EXCLUDED.metadata,
  updated_at = now();

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
  app_key,
  event_type,
  audience,
  channel,
  locale,
  subject,
  body,
  action_label,
  false,
  jsonb_build_object('source', 'product_to_revenue_automation')
FROM (
  VALUES
    ('product_journey_welcome', 'client', 'email', 'en', 'Welcome to your next Baise step', 'This add-on is designed to make your service path easier to manage, easier to document, and easier to continue from your portal.', 'Open portal'),
    ('product_journey_congrats', 'client', 'email', 'en', 'Your next Baise step is active', 'Your account now has another useful layer connected to your service history, records, and next steps.', 'Open portal'),
    ('product_journey_reminder', 'client', 'email', 'en', 'Still reviewing this Baise option?', 'You can review the recommendation in your portal whenever it is useful. We only want this added when it creates real value for you.', 'Review recommendation'),
    ('product_journey_welcome', 'provider', 'email', 'en', 'A new growth option is ready', 'This product can help your provider account turn interest into cleaner operations, records, payments, or campaigns.', 'Open provider portal'),
    ('product_journey_reminder', 'provider', 'email', 'en', 'Review this provider growth option', 'This recommendation is based on what your provider account has not yet activated and where the next layer may add value.', 'Review recommendation'),
    ('product_journey_welcome', 'partner', 'email', 'en', 'A partner-safe recommendation is ready', 'Share this as a resource and send people back through Baise for pricing, availability, and official follow-up.', 'Open partner portal'),
    ('product_journey_welcome', 'client', 'email', 'pt', 'Bem-vindo ao seu próximo passo na Baise', 'Este complemento foi criado para deixar seu serviço mais organizado, documentado e fácil de acompanhar no portal.', 'Abrir portal'),
    ('product_journey_reminder', 'client', 'email', 'pt', 'Ainda avaliando esta opção da Baise?', 'Você pode revisar a recomendação no portal quando fizer sentido. Só queremos adicionar algo quando isso cria valor real.', 'Ver recomendação'),
    ('product_journey_welcome', 'provider', 'email', 'pt', 'Uma nova opção de crescimento está pronta', 'Este produto pode ajudar sua conta de prestador a organizar melhor interesse, operações, registros, pagamentos ou campanhas.', 'Abrir portal do prestador'),
    ('product_journey_welcome', 'partner', 'email', 'pt', 'Uma recomendação segura para parceiros está pronta', 'Compartilhe como recurso e envie as pessoas de volta para a Baise para preços, disponibilidade e acompanhamento oficial.', 'Abrir portal do parceiro'),
    ('product_journey_welcome', 'client', 'email', 'es', 'Bienvenido a tu próximo paso en Baise', 'Este complemento está diseñado para que tu servicio sea más organizado, documentado y fácil de continuar desde el portal.', 'Abrir portal'),
    ('product_journey_reminder', 'client', 'email', 'es', '¿Sigues revisando esta opción de Baise?', 'Puedes revisar la recomendación en tu portal cuando sea útil. Solo queremos agregarla cuando crea valor real.', 'Ver recomendación'),
    ('product_journey_welcome', 'provider', 'email', 'es', 'Una nueva opción de crecimiento está lista', 'Este producto puede ayudar a tu cuenta de proveedor a organizar mejor interés, operaciones, registros, pagos o campañas.', 'Abrir portal de proveedor'),
    ('product_journey_welcome', 'partner', 'email', 'es', 'Una recomendación segura para partners está lista', 'Compártela como recurso y dirige a las personas de vuelta a Baise para precios, disponibilidad y seguimiento oficial.', 'Abrir portal de partner')
) AS templates(event_type, audience, channel, locale, subject, body, action_label)
CROSS JOIN (VALUES ('casa'), ('legal'), ('medical')) AS apps(app_key)
ON CONFLICT (app_key, event_type, audience, channel, locale)
DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  action_label = EXCLUDED.action_label,
  is_transactional = EXCLUDED.is_transactional,
  metadata = public.platform_message_templates.metadata || EXCLUDED.metadata,
  updated_at = now();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_offer_journeys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_fit_scores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_revenue_actions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_product_addon_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_safe_product_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_product_fit_score_for_person(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_product_fit_scores_for_app(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_product_revenue_action(uuid, text, uuid, numeric, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_client_product_addon_request(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_revenue_metrics(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_revenue_attribution(text) TO authenticated;
