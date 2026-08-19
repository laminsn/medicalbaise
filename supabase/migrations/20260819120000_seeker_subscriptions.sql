-- Isolated medical seeker subscriptions. Plan slugs: flex | lifestyle | project.
-- Does not write providers.subscription_tier. This tree is app_key=medical only.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'seeker_plan'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.seeker_plan AS ENUM ('flex', 'lifestyle', 'project');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.seeker_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_key text NOT NULL DEFAULT 'medical' CHECK (app_key = 'medical'),
  plan public.seeker_plan NOT NULL DEFAULT 'flex',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'unpaid', 'trialing', 'paused')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  transaction_count integer NOT NULL DEFAULT 0 CHECK (transaction_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_key)
);

CREATE INDEX IF NOT EXISTS idx_seeker_subscriptions_user
  ON public.seeker_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_seeker_subscriptions_app_plan
  ON public.seeker_subscriptions(app_key, plan, status);

CREATE INDEX IF NOT EXISTS idx_seeker_subscriptions_stripe_subscription
  ON public.seeker_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_seeker_subscriptions_stripe_customer
  ON public.seeker_subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_seeker_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seeker_subscriptions_updated_at ON public.seeker_subscriptions;
CREATE TRIGGER trg_seeker_subscriptions_updated_at
BEFORE UPDATE ON public.seeker_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_seeker_subscriptions_updated_at();

ALTER TABLE public.seeker_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Seekers select own non-stripe columns" ON public.seeker_subscriptions;
CREATE POLICY "Seekers select own non-stripe columns"
  ON public.seeker_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON TABLE public.seeker_subscriptions FROM PUBLIC;
REVOKE ALL ON TABLE public.seeker_subscriptions FROM anon;
REVOKE ALL ON TABLE public.seeker_subscriptions FROM authenticated;

GRANT SELECT (
  id,
  user_id,
  app_key,
  plan,
  status,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  transaction_count,
  created_at,
  updated_at
) ON TABLE public.seeker_subscriptions TO authenticated;

GRANT ALL ON TABLE public.seeker_subscriptions TO service_role;

GRANT USAGE ON TYPE public.seeker_plan TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.try_consume_seeker_transaction(app_key text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.seeker_subscriptions%ROWTYPE;
  effective_plan public.seeker_plan;
  next_count integer;
  now_ts timestamptz := now();
BEGIN
  IF try_consume_seeker_transaction.app_key IS DISTINCT FROM 'medical' THEN
    RETURN false;
  END IF;

  IF try_consume_seeker_transaction.user_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.seeker_subscriptions AS s (user_id, app_key, plan, status)
  VALUES (try_consume_seeker_transaction.user_id, 'medical', 'flex', 'active')
  ON CONFLICT (user_id, app_key) DO NOTHING;

  SELECT *
  INTO rec
  FROM public.seeker_subscriptions s
  WHERE s.user_id = try_consume_seeker_transaction.user_id
    AND s.app_key = 'medical'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  effective_plan := rec.plan;
  IF rec.status IS DISTINCT FROM 'active' THEN
    effective_plan := 'flex';
  END IF;

  next_count := rec.transaction_count;
  IF rec.current_period_end IS NOT NULL AND rec.current_period_end <= now_ts THEN
    next_count := 0;
  END IF;

  IF effective_plan = 'lifestyle' AND next_count >= 8 THEN
    RETURN false;
  END IF;

  IF effective_plan NOT IN ('flex', 'lifestyle', 'project') THEN
    RETURN false;
  END IF;

  UPDATE public.seeker_subscriptions s
  SET transaction_count = next_count + 1
  WHERE s.id = rec.id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.try_consume_seeker_transaction(text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.try_consume_seeker_transaction(text, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.try_consume_seeker_transaction(text, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.try_consume_seeker_transaction(text, uuid) TO service_role;
