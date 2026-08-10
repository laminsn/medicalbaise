-- Email consent and suppression controls shared by Casa, Medical, and Legal Baise.
-- This migration is intentionally written for later application while the shared
-- Supabase project is paused.

CREATE TABLE public.email_unsubscribe_tokens (
  token uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND email <> ''),
  brand text NOT NULL CHECK (brand IN ('casa', 'medical', 'legal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, brand)
);

CREATE TABLE public.email_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND email <> ''),
  brand text NOT NULL CHECK (brand IN ('casa', 'medical', 'legal')),
  category text NOT NULL CHECK (
    category IN ('all', 'promotions', 'education', 'analytics', 'referral', 'product_updates')
  ),
  source text NOT NULL CHECK (
    source IN ('one_click', 'preference_center', 'admin', 'bounce', 'complaint')
  ),
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, brand, category)
);

CREATE TABLE public.email_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND email <> ''),
  brand text NOT NULL CHECK (brand IN ('casa', 'medical', 'legal')),
  category text NOT NULL CHECK (
    category IN ('all', 'promotions', 'education', 'analytics', 'referral', 'product_updates')
  ),
  action text NOT NULL CHECK (action IN ('opt_in', 'opt_out')),
  source text NOT NULL CHECK (
    source IN ('one_click', 'preference_center', 'admin', 'bounce', 'complaint')
  ),
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX email_suppressions_email_brand_category_idx
  ON public.email_suppressions (lower(email), brand, category);

-- Preserve existing explicit marketing opt-outs without turning a shared user
-- preference into a cross-brand suppression. The signup product is the only
-- brand that can be attributed from the legacy user-scoped preference row.
WITH migrated_opt_outs AS (
  INSERT INTO public.email_suppressions (email, brand, category, source)
  SELECT
    lower(btrim(profile.email)),
    profile.signup_app_key,
    'all',
    'preference_center'
  FROM public.notification_preferences AS preference
  JOIN public.profiles AS profile ON profile.user_id = preference.user_id
  WHERE preference.marketing_email_enabled = false
    AND profile.email IS NOT NULL
    AND btrim(profile.email) <> ''
    AND profile.signup_app_key IN ('casa', 'medical', 'legal')
  ON CONFLICT (email, brand, category) DO NOTHING
  RETURNING email, brand, category, source, created_at
)
INSERT INTO public.email_consent_events (
  email,
  brand,
  category,
  action,
  source,
  created_at
)
SELECT email, brand, category, 'opt_out', source, created_at
FROM migrated_opt_outs;

-- Change suppression state and append its audit event in one transaction. The
-- service-role edge function is the only caller granted execute permission.
CREATE FUNCTION public.set_email_suppression(
  target_email text,
  target_brand text,
  target_category text,
  target_suppressed boolean,
  target_source text,
  target_ip text DEFAULT NULL,
  target_user_agent text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email text := lower(btrim(target_email));
  state_changed boolean := false;
  affected_rows integer := 0;
BEGIN
  IF normalized_email = '' THEN
    RAISE EXCEPTION 'A recipient email is required';
  END IF;

  IF target_suppressed THEN
    INSERT INTO public.email_suppressions (
      email,
      brand,
      category,
      source,
      ip,
      user_agent
    )
    VALUES (
      normalized_email,
      target_brand,
      target_category,
      target_source,
      target_ip,
      target_user_agent
    )
    ON CONFLICT (email, brand, category) DO NOTHING;
  ELSE
    DELETE FROM public.email_suppressions
    WHERE email = normalized_email
      AND brand = target_brand
      AND category = target_category;
  END IF;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  state_changed := affected_rows > 0;

  IF state_changed THEN
    INSERT INTO public.email_consent_events (
      email,
      brand,
      category,
      action,
      source,
      ip,
      user_agent
    )
    VALUES (
      normalized_email,
      target_brand,
      target_category,
      CASE WHEN target_suppressed THEN 'opt_out' ELSE 'opt_in' END,
      target_source,
      target_ip,
      target_user_agent
    );
  END IF;

  RETURN state_changed;
END;
$$;

REVOKE ALL ON FUNCTION public.set_email_suppression(text, text, text, boolean, text, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_email_suppression(text, text, text, boolean, text, text, text)
TO service_role;

ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_consent_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_unsubscribe_tokens FROM anon, authenticated;
REVOKE ALL ON public.email_suppressions FROM anon, authenticated;
REVOKE ALL ON public.email_consent_events FROM anon, authenticated;

GRANT SELECT, INSERT ON public.email_unsubscribe_tokens TO service_role;
GRANT SELECT, INSERT, DELETE ON public.email_suppressions TO service_role;
GRANT SELECT, INSERT ON public.email_consent_events TO service_role;

CREATE POLICY "Service role manages email unsubscribe tokens"
ON public.email_unsubscribe_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role manages email suppressions"
ON public.email_suppressions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role reads email consent events"
ON public.email_consent_events
FOR SELECT
TO service_role
USING (true);

CREATE POLICY "Service role appends email consent events"
ON public.email_consent_events
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE FUNCTION public.prevent_email_consent_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'email_consent_events is append-only';
END;
$$;

CREATE TRIGGER prevent_email_consent_event_mutation
BEFORE UPDATE OR DELETE ON public.email_consent_events
FOR EACH ROW
EXECUTE FUNCTION public.prevent_email_consent_event_mutation();
