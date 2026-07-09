-- Bio/link hub analytics.
-- Captures social-bio page views, language changes, and CTA clicks so the
-- Growth Hub can report which bio links create real traction.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.bio_link_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  event_type text NOT NULL
    CHECK (event_type IN ('page_view', 'cta_click', 'language_change')),
  locale text NOT NULL DEFAULT 'en',
  section text,
  cta_key text,
  cta_label text,
  destination_url text,
  source text,
  campaign text,
  path text,
  referrer text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bio_link_events_app_created
  ON public.bio_link_events(app_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bio_link_events_app_type
  ON public.bio_link_events(app_key, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bio_link_events_cta
  ON public.bio_link_events(app_key, cta_key, created_at DESC)
  WHERE cta_key IS NOT NULL;

ALTER TABLE public.bio_link_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view bio link analytics" ON public.bio_link_events;
CREATE POLICY "Admins can view bio link analytics"
  ON public.bio_link_events
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can manage bio link analytics" ON public.bio_link_events;
CREATE POLICY "Admins can manage bio link analytics"
  ON public.bio_link_events
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.track_bio_link_event(
  target_app_key text DEFAULT 'casa',
  event_type text DEFAULT 'page_view',
  event_locale text DEFAULT 'en',
  event_section text DEFAULT NULL,
  event_cta_key text DEFAULT NULL,
  event_cta_label text DEFAULT NULL,
  event_destination_url text DEFAULT NULL,
  event_source text DEFAULT NULL,
  event_campaign text DEFAULT NULL,
  event_path text DEFAULT NULL,
  event_referrer text DEFAULT NULL,
  event_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  clean_event_type text := lower(coalesce(nullif(event_type, ''), 'page_view'));
  clean_locale text := lower(coalesce(nullif(event_locale, ''), 'en'));
  event_id uuid;
BEGIN
  IF clean_event_type NOT IN ('page_view', 'cta_click', 'language_change') THEN
    clean_event_type := 'cta_click';
  END IF;

  IF clean_locale NOT IN ('en', 'pt', 'es') THEN
    clean_locale := 'en';
  END IF;

  INSERT INTO public.bio_link_events (
    app_key,
    event_type,
    locale,
    section,
    cta_key,
    cta_label,
    destination_url,
    source,
    campaign,
    path,
    referrer,
    metadata
  )
  VALUES (
    clean_app_key,
    clean_event_type,
    clean_locale,
    nullif(event_section, ''),
    nullif(event_cta_key, ''),
    nullif(event_cta_label, ''),
    nullif(event_destination_url, ''),
    nullif(event_source, ''),
    nullif(event_campaign, ''),
    nullif(event_path, ''),
    nullif(event_referrer, ''),
    coalesce(event_metadata, '{}'::jsonb)
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

CREATE OR REPLACE VIEW public.bio_link_analytics_daily
WITH (security_invoker = true)
AS
SELECT
  app_key,
  date_trunc('day', created_at)::date AS event_date,
  event_type,
  locale,
  coalesce(source, 'unknown') AS source,
  coalesce(campaign, 'bio_link_hub') AS campaign,
  coalesce(section, 'unknown') AS section,
  coalesce(cta_key, 'none') AS cta_key,
  coalesce(cta_label, 'none') AS cta_label,
  count(*)::bigint AS event_count,
  count(DISTINCT metadata ->> 'session_id')::bigint AS session_count
FROM public.bio_link_events
GROUP BY
  app_key,
  date_trunc('day', created_at)::date,
  event_type,
  locale,
  coalesce(source, 'unknown'),
  coalesce(campaign, 'bio_link_hub'),
  coalesce(section, 'unknown'),
  coalesce(cta_key, 'none'),
  coalesce(cta_label, 'none');

CREATE OR REPLACE FUNCTION public.get_bio_link_analytics_summary(
  target_app_key text DEFAULT NULL,
  days_back integer DEFAULT 30
)
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
  clean_app_key text := CASE
    WHEN target_app_key IS NULL OR target_app_key = '' THEN NULL
    ELSE public.normalize_growth_app_key(target_app_key)
  END;
  clean_days integer := greatest(1, least(coalesce(days_back, 30), 365));
BEGIN
  IF auth.uid() IS NULL
    OR NOT (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'moderator'::public.app_role)
    )
  THEN
    RAISE EXCEPTION 'Not authorized to view bio link analytics';
  END IF;

  RETURN QUERY
  WITH filtered AS (
    SELECT *
    FROM public.bio_link_events
    WHERE created_at >= now() - make_interval(days => clean_days)
      AND (clean_app_key IS NULL OR app_key = clean_app_key)
  ),
  top_cta AS (
    SELECT
      coalesce(cta_label, cta_key, 'Unknown CTA') AS label,
      count(*)::numeric AS clicks
    FROM filtered
    WHERE event_type = 'cta_click'
    GROUP BY coalesce(cta_label, cta_key, 'Unknown CTA')
    ORDER BY clicks DESC, label
    LIMIT 1
  ),
  top_source AS (
    SELECT
      coalesce(source, 'unknown') AS label,
      count(*)::numeric AS events
    FROM filtered
    GROUP BY coalesce(source, 'unknown')
    ORDER BY events DESC, label
    LIMIT 1
  )
  SELECT 'page_views', 'Page views', count(*)::numeric, clean_days || ' day window'
  FROM filtered
  WHERE event_type = 'page_view'
  UNION ALL
  SELECT 'cta_clicks', 'CTA clicks', count(*)::numeric, clean_days || ' day window'
  FROM filtered
  WHERE event_type = 'cta_click'
  UNION ALL
  SELECT 'unique_sessions', 'Tracked sessions', count(DISTINCT metadata ->> 'session_id')::numeric, clean_days || ' day window'
  FROM filtered
  UNION ALL
  SELECT 'top_cta', 'Top CTA', clicks, label
  FROM top_cta
  UNION ALL
  SELECT 'top_source', 'Top source', events, label
  FROM top_source;
END;
$$;

REVOKE ALL ON FUNCTION public.track_bio_link_event(text, text, text, text, text, text, text, text, text, text, text, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_bio_link_analytics_summary(text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.track_bio_link_event(text, text, text, text, text, text, text, text, text, text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_bio_link_analytics_summary(text, integer) TO authenticated, service_role;
GRANT SELECT ON public.bio_link_analytics_daily TO authenticated, service_role;
