-- Marketing Intelligence Hub.
-- Centralizes client insight, regional context, product behavior, and ad audience
-- guidance so Growth Hub can show who Baise should market to over time.

ALTER TABLE public.client_insight_profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Brazil',
  ADD COLUMN IF NOT EXISTS region text;

UPDATE public.client_insight_profiles cip
SET
  city = coalesce(nullif(cip.city, ''), nullif(p.city, '')),
  state = coalesce(nullif(cip.state, ''), nullif(p.state, '')),
  country = coalesce(nullif(cip.country, ''), 'Brazil'),
  region = coalesce(nullif(cip.region, ''), nullif(cip.state, ''), nullif(p.state, ''), nullif(cip.city, ''), nullif(p.city, ''), 'Brazil')
FROM public.profiles p
WHERE p.user_id = cip.user_id;

UPDATE public.client_insight_profiles
SET
  country = coalesce(nullif(country, ''), 'Brazil'),
  region = coalesce(nullif(region, ''), nullif(state, ''), nullif(city, ''), country, 'Brazil');

CREATE INDEX IF NOT EXISTS idx_client_insight_profiles_region
  ON public.client_insight_profiles(app_key, region, state, city);

CREATE TABLE IF NOT EXISTS public.marketing_audience_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  snapshot_key text NOT NULL,
  total_profiles integer NOT NULL DEFAULT 0,
  active_buyers integer NOT NULL DEFAULT 0,
  top_occupation text,
  top_revenue_range text,
  top_region text,
  top_city text,
  top_state text,
  top_country text,
  top_lifestyle text,
  top_education_level text,
  top_product_key text,
  top_product_name text,
  common_client_summary text NOT NULL,
  purchasing_summary text NOT NULL,
  segment_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  product_habits jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_ads_guidance jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_by uuid DEFAULT auth.uid(),
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_audience_snapshots_app
  ON public.marketing_audience_snapshots(app_key, generated_at DESC);

ALTER TABLE public.marketing_audience_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage marketing audience snapshots" ON public.marketing_audience_snapshots;
CREATE POLICY "Admins manage marketing audience snapshots"
ON public.marketing_audience_snapshots FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE OR REPLACE FUNCTION public.get_marketing_intelligence_summary(target_app_key text DEFAULT NULL)
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
  profile_count numeric := 0;
  relationship_count numeric := 0;
  buyer_count numeric := 0;
  avg_products numeric := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view marketing intelligence';
  END IF;

  SELECT count(*)::numeric INTO profile_count
  FROM public.client_insight_profiles
  WHERE app_key = clean_app_key;

  SELECT count(*)::numeric INTO relationship_count
  FROM public.growth_people
  WHERE app_key = clean_app_key
    AND person_type IN ('client', 'provider', 'lead', 'referral_lead');

  SELECT count(DISTINCT person_id)::numeric INTO buyer_count
  FROM public.client_product_registrations
  WHERE app_key = clean_app_key
    AND person_id IS NOT NULL
    AND status IN ('trial', 'active', 'paused');

  SELECT coalesce(avg(product_count), 0)::numeric INTO avg_products
  FROM (
    SELECT person_id, count(*)::numeric AS product_count
    FROM public.client_product_registrations
    WHERE app_key = clean_app_key
      AND person_id IS NOT NULL
      AND status IN ('trial', 'active', 'paused')
    GROUP BY person_id
  ) product_counts;

  RETURN QUERY
  SELECT 'insight_profiles'::text, 'Insight profiles'::text, profile_count, 'People with demographic, goal, and lifestyle context'::text;

  RETURN QUERY
  SELECT 'profile_coverage'::text, 'Profile coverage'::text,
    CASE WHEN relationship_count = 0 THEN 0 ELSE round((profile_count / relationship_count) * 100, 2) END,
    'Insight profiles divided by active relationship profiles'::text;

  RETURN QUERY
  SELECT 'known_region'::text, 'Known region'::text, count(*)::numeric, 'Profiles with city, state, country, or region data'::text
  FROM public.client_insight_profiles
  WHERE app_key = clean_app_key
    AND coalesce(nullif(region, ''), nullif(state, ''), nullif(city, ''), nullif(country, '')) IS NOT NULL;

  RETURN QUERY
  SELECT 'active_buyers'::text, 'Active buyers'::text, buyer_count, 'People with trial, active, or paused product registrations'::text;

  RETURN QUERY
  SELECT 'avg_products_per_buyer'::text, 'Avg products/buyer'::text, round(avg_products, 2), 'Average active products among buyers'::text;

  RETURN QUERY
  SELECT 'queued_value_campaigns'::text, 'Queued value campaigns'::text, count(*)::numeric, 'Email, push, and portal recommendations waiting for dispatch'::text
  FROM public.product_value_campaign_events
  WHERE app_key = clean_app_key
    AND status = 'queued';

  RETURN QUERY
  SELECT 'latest_snapshots'::text, 'Audience snapshots'::text, count(*)::numeric, 'Generated marketing audience snapshots available in Growth Hub'::text
  FROM public.marketing_audience_snapshots
  WHERE app_key = clean_app_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_audience_breakdowns(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  dimension text,
  label text,
  audience_count numeric,
  buyer_count numeric,
  buyer_rate numeric,
  avg_fit_score numeric,
  recommendation_count numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view marketing audience breakdowns';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      cip.person_id,
      cip.occupation,
      cip.revenue_range,
      coalesce(nullif(cip.region, ''), nullif(cip.state, ''), nullif(p.state, ''), nullif(cip.city, ''), nullif(p.city, ''), 'Unknown') AS region,
      coalesce(nullif(cip.city, ''), nullif(p.city, ''), 'Unknown') AS city,
      coalesce(nullif(cip.state, ''), nullif(p.state, ''), 'Unknown') AS state,
      coalesce(nullif(cip.country, ''), 'Brazil') AS country,
      cip.education_level,
      cip.lifestyle_tags
    FROM public.client_insight_profiles cip
    LEFT JOIN public.profiles p ON p.user_id = cip.user_id
    WHERE cip.app_key = clean_app_key
  ),
  dimensions AS (
    SELECT person_id, 'occupation'::text AS dimension, coalesce(nullif(occupation, ''), 'Unknown') AS label FROM base
    UNION ALL
    SELECT person_id, 'income_level', coalesce(nullif(revenue_range, ''), 'Unknown') FROM base
    UNION ALL
    SELECT person_id, 'region', region FROM base
    UNION ALL
    SELECT person_id, 'city', city FROM base
    UNION ALL
    SELECT person_id, 'state', state FROM base
    UNION ALL
    SELECT person_id, 'country', country FROM base
    UNION ALL
    SELECT person_id, 'education', coalesce(nullif(education_level, ''), 'Unknown') FROM base
    UNION ALL
    SELECT person_id, 'lifestyle', lifestyle_label
    FROM base
    CROSS JOIN LATERAL unnest(coalesce(lifestyle_tags, ARRAY[]::text[])) AS lifestyle_label
  ),
  buyers AS (
    SELECT DISTINCT person_id
    FROM public.client_product_registrations
    WHERE app_key = clean_app_key
      AND person_id IS NOT NULL
      AND status IN ('trial', 'active', 'paused')
  ),
  recs AS (
    SELECT person_id, count(*)::numeric AS rec_count
    FROM public.product_recommendations
    WHERE app_key = clean_app_key
      AND person_id IS NOT NULL
      AND status IN ('pending', 'queued', 'sent', 'viewed', 'accepted')
    GROUP BY person_id
  ),
  fit AS (
    SELECT person_id, fit_score
    FROM public.product_fit_scores
    WHERE app_key = clean_app_key
  )
  SELECT
    d.dimension,
    d.label,
    count(DISTINCT d.person_id)::numeric AS audience_count,
    count(DISTINCT b.person_id)::numeric AS buyer_count,
    CASE WHEN count(DISTINCT d.person_id) = 0 THEN 0 ELSE round((count(DISTINCT b.person_id)::numeric / count(DISTINCT d.person_id)::numeric) * 100, 2) END AS buyer_rate,
    round(coalesce(avg(f.fit_score), 0), 2)::numeric AS avg_fit_score,
    coalesce(sum(recs.rec_count), 0)::numeric AS recommendation_count
  FROM dimensions d
  LEFT JOIN buyers b ON b.person_id = d.person_id
  LEFT JOIN recs ON recs.person_id = d.person_id
  LEFT JOIN fit f ON f.person_id = d.person_id
  WHERE d.label IS NOT NULL
  GROUP BY d.dimension, d.label
  ORDER BY d.dimension, audience_count DESC, buyer_count DESC, d.label;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketing_product_habits(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  product_key text,
  product_name text,
  product_family text,
  audience text,
  active_registrations numeric,
  trial_registrations numeric,
  recommendation_count numeric,
  accepted_recommendations numeric,
  campaign_events numeric,
  email_events numeric,
  push_events numeric,
  estimated_monthly_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view marketing product habits';
  END IF;

  RETURN QUERY
  SELECT
    p.product_key,
    p.name,
    p.product_family,
    p.audience,
    count(DISTINCT cpr.id) FILTER (WHERE cpr.status IN ('active', 'paused'))::numeric AS active_registrations,
    count(DISTINCT cpr.id) FILTER (WHERE cpr.status = 'trial')::numeric AS trial_registrations,
    count(DISTINCT pr.id)::numeric AS recommendation_count,
    count(DISTINCT pr.id) FILTER (WHERE pr.status = 'accepted')::numeric AS accepted_recommendations,
    count(DISTINCT pvce.id)::numeric AS campaign_events,
    count(DISTINCT pvce.id) FILTER (WHERE pvce.channel = 'email')::numeric AS email_events,
    count(DISTINCT pvce.id) FILTER (WHERE pvce.channel IN ('push', 'portal'))::numeric AS push_events,
    round(
      coalesce(count(DISTINCT cpr.id) FILTER (WHERE cpr.status IN ('active', 'paused')), 0)::numeric *
      CASE
        WHEN p.billing_interval = 'annual' THEN coalesce(p.price_amount, 0) / 12
        WHEN p.billing_interval IN ('monthly', 'usage', 'custom') THEN coalesce(p.price_amount, 0)
        ELSE coalesce(p.price_amount, 0)
      END,
      2
    )::numeric AS estimated_monthly_value
  FROM public.platform_products p
  LEFT JOIN public.client_product_registrations cpr
    ON cpr.app_key = p.app_key
   AND cpr.product_key = p.product_key
   AND cpr.status IN ('trial', 'active', 'paused')
  LEFT JOIN public.product_recommendations pr
    ON pr.app_key = p.app_key
   AND pr.recommended_product_key = p.product_key
  LEFT JOIN public.product_value_campaign_events pvce
    ON pvce.app_key = p.app_key
   AND pvce.product_key = p.product_key
  WHERE p.app_key = clean_app_key
    AND p.is_active = true
  GROUP BY p.product_key, p.name, p.product_family, p.audience, p.billing_interval, p.price_amount
  ORDER BY active_registrations DESC, estimated_monthly_value DESC, recommendation_count DESC, p.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_marketing_audience_snapshot(target_app_key text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  snapshot_id uuid;
  total_profiles_value integer := 0;
  active_buyers_value integer := 0;
  top_occupation_value text;
  top_revenue_value text;
  top_region_value text;
  top_city_value text;
  top_state_value text;
  top_country_value text;
  top_lifestyle_value text;
  top_education_value text;
  top_product_key_value text;
  top_product_name_value text;
  segment_breakdown_value jsonb := '{}'::jsonb;
  product_habits_value jsonb := '[]'::jsonb;
  common_summary text;
  purchase_summary text;
  app_category text;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can generate marketing audience snapshots';
  END IF;

  app_category := CASE clean_app_key
    WHEN 'legal' THEN 'trusted legal support'
    WHEN 'medical' THEN 'trusted medical support'
    ELSE 'trusted home and business services'
  END;

  SELECT count(*)::integer INTO total_profiles_value
  FROM public.client_insight_profiles
  WHERE app_key = clean_app_key;

  SELECT count(DISTINCT person_id)::integer INTO active_buyers_value
  FROM public.client_product_registrations
  WHERE app_key = clean_app_key
    AND person_id IS NOT NULL
    AND status IN ('trial', 'active', 'paused');

  SELECT label INTO top_occupation_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'occupation' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT label INTO top_revenue_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'income_level' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT label INTO top_region_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'region' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT label INTO top_city_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'city' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT label INTO top_state_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'state' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT label INTO top_country_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'country' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT label INTO top_lifestyle_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'lifestyle' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT label INTO top_education_value
  FROM public.get_marketing_audience_breakdowns(clean_app_key)
  WHERE dimension = 'education' AND label <> 'Unknown'
  ORDER BY audience_count DESC, buyer_count DESC
  LIMIT 1;

  SELECT product_key, product_name
  INTO top_product_key_value, top_product_name_value
  FROM public.get_marketing_product_habits(clean_app_key)
  ORDER BY active_registrations DESC, estimated_monthly_value DESC
  LIMIT 1;

  SELECT coalesce(jsonb_object_agg(dimension, items), '{}'::jsonb)
  INTO segment_breakdown_value
  FROM (
    SELECT
      dimension,
      jsonb_agg(
        jsonb_build_object(
          'label', label,
          'audience_count', audience_count,
          'buyer_count', buyer_count,
          'buyer_rate', buyer_rate,
          'avg_fit_score', avg_fit_score,
          'recommendation_count', recommendation_count
        )
        ORDER BY audience_count DESC, buyer_count DESC
      ) AS items
    FROM (
      SELECT *
      FROM public.get_marketing_audience_breakdowns(clean_app_key)
      WHERE label <> 'Unknown'
    ) breakdowns
    GROUP BY dimension
  ) grouped;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'product_key', product_key,
      'product_name', product_name,
      'product_family', product_family,
      'audience', audience,
      'active_registrations', active_registrations,
      'trial_registrations', trial_registrations,
      'recommendation_count', recommendation_count,
      'accepted_recommendations', accepted_recommendations,
      'campaign_events', campaign_events,
      'estimated_monthly_value', estimated_monthly_value
    )
    ORDER BY active_registrations DESC, estimated_monthly_value DESC
  ), '[]'::jsonb)
  INTO product_habits_value
  FROM public.get_marketing_product_habits(clean_app_key);

  common_summary := concat_ws(
    ' ',
    'Most common audience:',
    coalesce(top_occupation_value, 'unknown occupation'),
    'with',
    coalesce(top_revenue_value, 'unknown income level'),
    'in',
    coalesce(top_region_value, top_state_value, top_city_value, 'unknown region') || '.'
  );

  purchase_summary := concat_ws(
    ' ',
    'Most visible purchase habit:',
    coalesce(top_product_name_value, 'no dominant product yet') || '.',
    active_buyers_value::text || ' active buyer profiles detected.'
  );

  INSERT INTO public.marketing_audience_snapshots (
    app_key,
    snapshot_key,
    total_profiles,
    active_buyers,
    top_occupation,
    top_revenue_range,
    top_region,
    top_city,
    top_state,
    top_country,
    top_lifestyle,
    top_education_level,
    top_product_key,
    top_product_name,
    common_client_summary,
    purchasing_summary,
    segment_breakdown,
    product_habits,
    meta_ads_guidance
  )
  VALUES (
    clean_app_key,
    'marketing-intelligence-' || to_char(now(), 'YYYYMMDDHH24MISS'),
    total_profiles_value,
    active_buyers_value,
    top_occupation_value,
    top_revenue_value,
    top_region_value,
    top_city_value,
    top_state_value,
    top_country_value,
    top_lifestyle_value,
    top_education_value,
    top_product_key_value,
    top_product_name_value,
    common_summary,
    purchase_summary,
    segment_breakdown_value,
    product_habits_value,
    jsonb_build_object(
      'primary_audience', trim(concat_ws(' ', top_occupation_value, top_revenue_value, top_lifestyle_value)),
      'suggested_locations', jsonb_strip_nulls(jsonb_build_object(
        'country', top_country_value,
        'state', top_state_value,
        'city', top_city_value,
        'region', top_region_value
      )),
      'value_angles', jsonb_build_array(
        'Make trusted support easier to find and compare.',
        'Keep records, payments, invoices, and proof organized in one portal.',
        'Reduce uncertainty when choosing ' || app_category || '.'
      ),
      'creative_hooks', jsonb_build_array(
        'Trusted help without guessing where to start.',
        'One portal for providers, payments, records, and next steps.',
        'Built for people who need confidence before they choose a pro.'
      ),
      'retargeting_signals', jsonb_build_array(
        'Survey started but not completed',
        'Open product recommendation',
        'Queued value campaign not clicked',
        'Premium product viewed but not active'
      ),
      'exclude_or_review', jsonb_build_array(
        'Duplicate-warning profiles',
        'Do-not-pitch profiles',
        'Clients with paused marketing preferences'
      )
    )
  )
  RETURNING id INTO snapshot_id;

  RETURN snapshot_id;
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
  'all',
  question.question_key,
  question.locale,
  question.label,
  question.helper,
  question.input_type,
  '[]'::jsonb,
  false,
  question.display_order,
  jsonb_build_object('seeded', true, 'source', 'marketing_intelligence_hub')
FROM (VALUES ('casa'), ('legal'), ('medical')) AS app(app_key)
CROSS JOIN (
  VALUES
    ('country', 'en', 'Country', 'Where are you primarily based?', 'text', 70),
    ('country', 'pt', 'Pais', 'Onde voce esta principalmente localizado?', 'text', 70),
    ('country', 'es', 'Pais', 'Donde estas ubicado principalmente?', 'text', 70),
    ('state', 'en', 'State or region', 'This helps us understand which geographic audiences are most common.', 'text', 80),
    ('state', 'pt', 'Estado ou regiao', 'Isso nos ajuda a entender quais publicos geograficos sao mais comuns.', 'text', 80),
    ('state', 'es', 'Estado o region', 'Esto nos ayuda a entender que publicos geograficos son mas comunes.', 'text', 80),
    ('city', 'en', 'City', 'City-level trends help us target ads and provider coverage more intelligently.', 'text', 90),
    ('city', 'pt', 'Cidade', 'Tendencias por cidade ajudam a direcionar anuncios e cobertura de prestadores com mais inteligencia.', 'text', 90),
    ('city', 'es', 'Ciudad', 'Las tendencias por ciudad ayudan a dirigir anuncios y cobertura de proveedores con mas inteligencia.', 'text', 90)
) AS question(question_key, locale, label, helper, input_type, display_order)
ON CONFLICT (app_key, survey_key, audience, question_key, locale)
DO UPDATE SET
  question_label = EXCLUDED.question_label,
  helper_text = EXCLUDED.helper_text,
  input_type = EXCLUDED.input_type,
  display_order = EXCLUDED.display_order,
  metadata = public.client_insight_question_bank.metadata || EXCLUDED.metadata,
  updated_at = now();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_audience_snapshots TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_intelligence_summary(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_audience_breakdowns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_marketing_product_habits(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_marketing_audience_snapshot(text) TO authenticated;
