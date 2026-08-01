-- Medical privacy gate: appointment requests can contain symptoms, insurance,
-- location, and preferred-time data. They must never be anonymously readable.

BEGIN;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view open appointments"
  ON public.appointments;
DROP POLICY IF EXISTS "Appointments viewable by everyone"
  ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can view their own appointments"
  ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments"
  ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments"
  ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments"
  ON public.appointments;
DROP POLICY IF EXISTS "Users can delete own appointments"
  ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments"
  ON public.appointments;

REVOKE ALL ON TABLE public.appointments FROM PUBLIC;
REVOKE ALL ON TABLE public.appointments FROM anon;
REVOKE ALL ON TABLE public.appointments FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;

CREATE POLICY "Users can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
ON public.appointments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'appointments'
      AND ('anon' = ANY (roles) OR 'public' = ANY (roles))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.appointments', policy_record.policyname);
  END LOOP;
END
$$;

COMMENT ON TABLE public.appointments IS
  'Private medical appointment requests. Direct reads are restricted to the owning authenticated user until a verified provider-assignment lifecycle is implemented.';

COMMIT;
