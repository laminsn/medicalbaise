-- Shared Baise identity account-deletion lifecycle (Casa + Medical + Legal).
-- Regulated-record retention duration remains [ATTORNEY-CONFIRM — per business].
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_state text NOT NULL DEFAULT 'active';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_deletion_state_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_deletion_state_check
  CHECK (deletion_state IN ('active', 'pending_deletion', 'purged'));

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('pending_deletion','recovered','purged','cancelled')),
  initiated_by text NOT NULL CHECK (initiated_by IN ('self','staff')),
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_purge_at timestamptz NOT NULL,
  recovered_at timestamptz,
  purged_at timestamptz,
  immediate boolean NOT NULL DEFAULT false,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  app_context text CHECK (app_context IS NULL OR app_context IN ('casa','medical','legal')),
  winback_days_sent integer[] NOT NULL DEFAULT '{}'::integer[],
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_deletion_one_pending_per_user
  ON public.account_deletion_requests(user_id) WHERE status = 'pending_deletion';
CREATE INDEX IF NOT EXISTS account_deletion_purge_due
  ON public.account_deletion_requests(scheduled_purge_at) WHERE status = 'pending_deletion';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users read own deletion requests" ON public.account_deletion_requests
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users create own deletion requests" ON public.account_deletion_requests;
CREATE POLICY "Users create own deletion requests" ON public.account_deletion_requests
  FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid() AND created_by_user_id = auth.uid() AND initiated_by = 'self'
    AND status = 'pending_deletion' AND immediate = false
  );
-- Updates/purge/anonymization are intentionally service-role only.
REVOKE UPDATE, DELETE ON public.account_deletion_requests FROM authenticated;
GRANT SELECT, INSERT ON public.account_deletion_requests TO authenticated;

CREATE TABLE IF NOT EXISTS public.account_deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.account_deletion_requests(id) ON DELETE SET NULL,
  user_id uuid,
  actor_id uuid,
  action text NOT NULL CHECK (action IN ('request','recover','staff_close','purge','purge_failed','email')),
  app_context text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_deletion_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_deletion_audit FROM anon, authenticated;

-- Service-role RPC used immediately before deleting auth.users. It touches the
-- shared identity once and anonymizes all app-key rows. No retention interval is
-- asserted here: TODO(lamin): set retained_until only after counsel approves each matrix row.
CREATE OR REPLACE FUNCTION public.anonymize_baise_identity_for_purge(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;
  UPDATE public.growth_people SET
    user_id = NULL, full_name = NULL, email = NULL, phone = NULL,
    client_id = NULL, referral_code = NULL, partner_code = NULL,
    consent = '{}'::jsonb, communication_preferences = '{}'::jsonb,
    metadata = jsonb_build_object('account_tombstoned', true, 'tombstoned_at', now()),
    governance_status = 'archived', archived_at = coalesce(archived_at, now()), updated_at = now()
  WHERE user_id = p_user_id;
  UPDATE public.providers SET business_name = 'Conta encerrada', tagline = NULL,
    bio = NULL, address = NULL, location_lat = NULL, location_lng = NULL, updated_at = now()
  WHERE user_id = p_user_id;
  UPDATE public.team_members SET invited_by = NULL WHERE invited_by = p_user_id;
  UPDATE public.team_invitations SET invited_by = NULL WHERE invited_by = p_user_id;
  UPDATE public.security_audit_log SET user_id = NULL WHERE user_id = p_user_id;
  -- TODO(lamin): confirm against live Baise information_schema that no RESTRICT FK to auth.users/profiles remains un-nulled before enabling Auth deletion.
  UPDATE public.profiles SET first_name = NULL, last_name = NULL, email = NULL,
    phone = NULL, avatar_url = NULL, city = NULL, state = NULL,
    referral_code = NULL, updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.anonymize_baise_identity_for_purge(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.anonymize_baise_identity_for_purge(uuid) TO service_role;
