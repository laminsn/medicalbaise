CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  lane text NOT NULL CHECK (lane IN ('provider', 'client', 'member')),
  steps jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(steps) = 'object'),
  tour_completed_at timestamptz,
  welcome_dismissed_at timestamptz,
  percent integer NOT NULL DEFAULT 0 CHECK (percent BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own onboarding progress"
  ON public.onboarding_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own onboarding progress"
  ON public.onboarding_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff read onboarding progress"
  ON public.onboarding_progress FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'moderator'::public.app_role)
  );

REVOKE INSERT, UPDATE, DELETE ON public.onboarding_progress FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.onboarding_progress TO authenticated;
GRANT ALL ON public.onboarding_progress TO service_role;
