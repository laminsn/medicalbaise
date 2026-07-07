-- Platform workflow hardening: auditable operations, payment-plan processing,
-- client portal invitations, integration sync jobs, and message delivery states.

CREATE OR REPLACE FUNCTION public.update_platform_workflow_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.provider_operational_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_role text NOT NULL DEFAULT 'system'
    CHECK (actor_role IN ('owner', 'team', 'subcontractor', 'client', 'admin', 'integration', 'system')),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  severity text NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_client_portal_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_id uuid,
  invited_by uuid NOT NULL,
  invite_type text NOT NULL DEFAULT 'client_portal'
    CHECK (invite_type IN ('client_portal', 'quote_review', 'payment_request', 'signoff_request', 'project_update')),
  resource_type text NOT NULL DEFAULT 'provider_invoice'
    CHECK (resource_type IN ('provider_invoice', 'payment_plan', 'quote', 'project', 'signoff', 'crm_contact')),
  resource_id uuid,
  email text NOT NULL,
  token_hash text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'revoked', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  claimed_by uuid,
  claimed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_recurring_payment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  payment_plan_id uuid REFERENCES public.provider_payment_plans(id) ON DELETE CASCADE,
  payment_plan_item_id uuid REFERENCES public.provider_payment_plan_items(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.provider_payment_transactions(id) ON DELETE SET NULL,
  processor text NOT NULL DEFAULT 'stripe'
    CHECK (processor IN ('stripe', 'superwall_stripe', 'internal_balance', 'manual')),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'skipped')),
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  processor_reference text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_integration_sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  integration_id uuid REFERENCES public.provider_integrations(id) ON DELETE CASCADE,
  integration_key text NOT NULL,
  job_type text NOT NULL DEFAULT 'sync'
    CHECK (job_type IN ('oauth_exchange', 'sync', 'import', 'export', 'webhook_repair', 'token_refresh')),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  next_attempt_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'needs_auth')),
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_payment_plans
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS billing_mode text NOT NULL DEFAULT 'manual_or_checkout',
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS next_bill_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_billed_at timestamptz,
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  ADD COLUMN IF NOT EXISTS last_payment_error text;

ALTER TABLE public.provider_payment_plans
  DROP CONSTRAINT IF EXISTS provider_payment_plans_status_check;
ALTER TABLE public.provider_payment_plans
  ADD CONSTRAINT provider_payment_plans_status_check
  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'failed', 'past_due'));

ALTER TABLE public.provider_payment_plans
  DROP CONSTRAINT IF EXISTS provider_payment_plans_billing_mode_check;
ALTER TABLE public.provider_payment_plans
  ADD CONSTRAINT provider_payment_plans_billing_mode_check
  CHECK (billing_mode IN ('manual_or_checkout', 'stripe_checkout', 'stripe_subscription', 'superwall_stripe', 'internal_balance'));

ALTER TABLE public.provider_payment_plan_items
  ADD COLUMN IF NOT EXISTS payment_transaction_id uuid REFERENCES public.provider_payment_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS checkout_url text,
  ADD COLUMN IF NOT EXISTS checkout_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS processor text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_payment_error text,
  ADD COLUMN IF NOT EXISTS client_action_required boolean NOT NULL DEFAULT false;

ALTER TABLE public.provider_payment_plan_items
  DROP CONSTRAINT IF EXISTS provider_payment_plan_items_status_check;
ALTER TABLE public.provider_payment_plan_items
  ADD CONSTRAINT provider_payment_plan_items_status_check
  CHECK (status IN ('scheduled', 'pending', 'processing', 'paid', 'released', 'overdue', 'cancelled', 'failed', 'retry_due'));

ALTER TABLE public.provider_payment_plan_items
  DROP CONSTRAINT IF EXISTS provider_payment_plan_items_processor_check;
ALTER TABLE public.provider_payment_plan_items
  ADD CONSTRAINT provider_payment_plan_items_processor_check
  CHECK (processor IN ('stripe', 'superwall_stripe', 'internal_balance', 'manual'));

ALTER TABLE public.provider_invoices
  ADD COLUMN IF NOT EXISTS payment_plan_id uuid REFERENCES public.provider_payment_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receipt_url text,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_action_status text NOT NULL DEFAULT 'not_sent';

ALTER TABLE public.provider_invoices
  DROP CONSTRAINT IF EXISTS provider_invoices_client_action_status_check;
ALTER TABLE public.provider_invoices
  ADD CONSTRAINT provider_invoices_client_action_status_check
  CHECK (client_action_status IN ('not_sent', 'sent', 'viewed', 'accepted', 'signed', 'paid', 'declined'));

ALTER TABLE public.provider_payment_transactions
  DROP CONSTRAINT IF EXISTS provider_payment_transactions_status_check;
ALTER TABLE public.provider_payment_transactions
  ADD CONSTRAINT provider_payment_transactions_status_check
  CHECK (status IN ('draft', 'pending', 'processing', 'requires_action', 'succeeded', 'failed', 'cancelled', 'refunded', 'credited', 'released', 'disputed'));

ALTER TABLE public.provider_communication_events
  ADD COLUMN IF NOT EXISTS provider_calendar_event_id uuid REFERENCES public.provider_calendar_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_attempts integer NOT NULL DEFAULT 0 CHECK (delivery_attempts >= 0),
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_via text,
  ADD COLUMN IF NOT EXISTS external_message_id text,
  ADD COLUMN IF NOT EXISTS delivery_error text;

ALTER TABLE public.provider_communication_events
  DROP CONSTRAINT IF EXISTS provider_communication_events_status_check;
ALTER TABLE public.provider_communication_events
  ADD CONSTRAINT provider_communication_events_status_check
  CHECK (status IN ('draft', 'queued', 'processing', 'sent', 'failed', 'deferred', 'cancelled', 'read'));

ALTER TABLE public.provider_communication_events
  DROP CONSTRAINT IF EXISTS provider_communication_events_channel_check;
ALTER TABLE public.provider_communication_events
  ADD CONSTRAINT provider_communication_events_channel_check
  CHECK (channel IN ('portal', 'email', 'whatsapp', 'push', 'sms'));

ALTER TABLE public.provider_integrations
  ADD COLUMN IF NOT EXISTS oauth_state text,
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS connection_health text NOT NULL DEFAULT 'not_checked',
  ADD COLUMN IF NOT EXISTS sync_status text NOT NULL DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS next_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS sync_frequency_minutes integer NOT NULL DEFAULT 60 CHECK (sync_frequency_minutes >= 5),
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS sync_cursor jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.provider_integrations
  DROP CONSTRAINT IF EXISTS provider_integrations_connection_health_check;
ALTER TABLE public.provider_integrations
  ADD CONSTRAINT provider_integrations_connection_health_check
  CHECK (connection_health IN ('not_checked', 'healthy', 'needs_auth', 'failing', 'disabled'));

ALTER TABLE public.provider_integrations
  DROP CONSTRAINT IF EXISTS provider_integrations_sync_status_check;
ALTER TABLE public.provider_integrations
  ADD CONSTRAINT provider_integrations_sync_status_check
  CHECK (sync_status IN ('idle', 'queued', 'syncing', 'succeeded', 'failed', 'needs_auth'));

CREATE INDEX IF NOT EXISTS idx_provider_audit_provider_created
  ON public.provider_operational_audit_events(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_client_invites_provider
  ON public.provider_client_portal_invites(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_client_invites_customer
  ON public.provider_client_portal_invites(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_payment_runs_due
  ON public.provider_recurring_payment_runs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_provider_payment_items_due_status
  ON public.provider_payment_plan_items(provider_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_provider_comm_events_due_status
  ON public.provider_communication_events(status, scheduled_at, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_provider_integration_jobs_due
  ON public.provider_integration_sync_jobs(status, scheduled_at, next_attempt_at);

DROP TRIGGER IF EXISTS update_provider_client_portal_invites_updated_at ON public.provider_client_portal_invites;
CREATE TRIGGER update_provider_client_portal_invites_updated_at
  BEFORE UPDATE ON public.provider_client_portal_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_workflow_updated_at();

DROP TRIGGER IF EXISTS update_provider_recurring_payment_runs_updated_at ON public.provider_recurring_payment_runs;
CREATE TRIGGER update_provider_recurring_payment_runs_updated_at
  BEFORE UPDATE ON public.provider_recurring_payment_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_workflow_updated_at();

DROP TRIGGER IF EXISTS update_provider_integration_sync_jobs_updated_at ON public.provider_integration_sync_jobs;
CREATE TRIGGER update_provider_integration_sync_jobs_updated_at
  BEFORE UPDATE ON public.provider_integration_sync_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_workflow_updated_at();

CREATE OR REPLACE FUNCTION public.log_provider_audit_event(
  target_provider_id uuid,
  actor_id uuid,
  actor_kind text,
  event_action text,
  event_resource_type text,
  event_resource_id uuid DEFAULT NULL,
  event_severity text DEFAULT 'info',
  event_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.provider_operational_audit_events (
    provider_id,
    actor_user_id,
    actor_role,
    action,
    resource_type,
    resource_id,
    severity,
    metadata
  )
  VALUES (
    target_provider_id,
    actor_id,
    COALESCE(NULLIF(actor_kind, ''), 'system'),
    event_action,
    event_resource_type,
    event_resource_id,
    COALESCE(NULLIF(event_severity, ''), 'info'),
    COALESCE(event_metadata, '{}'::jsonb)
  )
  RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_provider_audit_event(uuid, uuid, text, text, text, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_provider_audit_event(uuid, uuid, text, text, text, uuid, text, jsonb) TO service_role;

ALTER TABLE public.provider_operational_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_client_portal_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_recurring_payment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_integration_sync_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers and team view provider audit events"
ON public.provider_operational_audit_events FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_operational_audit_events.provider_id AND p.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.provider_id = provider_operational_audit_events.provider_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND ('admin' = ANY(tm.permissions) OR 'settings' = ANY(tm.permissions) OR tm.role IN ('admin', 'manager'))
  )
);

CREATE POLICY "No direct client audit writes"
ON public.provider_operational_audit_events FOR INSERT
WITH CHECK (false);

CREATE POLICY "Providers manage client portal invites"
ON public.provider_client_portal_invites FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_client_portal_invites.provider_id AND p.user_id = auth.uid())
)
WITH CHECK (
  invited_by = auth.uid()
  AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_client_portal_invites.provider_id AND p.user_id = auth.uid())
);

CREATE POLICY "Clients view claimed portal invites"
ON public.provider_client_portal_invites FOR SELECT
USING (
  customer_id = auth.uid()
  OR claimed_by = auth.uid()
);

CREATE POLICY "Providers view own payment runs"
ON public.provider_recurring_payment_runs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_recurring_payment_runs.provider_id AND p.user_id = auth.uid())
);

CREATE POLICY "Providers view own integration sync jobs"
ON public.provider_integration_sync_jobs FOR SELECT
USING (
  EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_integration_sync_jobs.provider_id AND p.user_id = auth.uid())
);

CREATE POLICY "No direct payment run writes"
ON public.provider_recurring_payment_runs FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct integration job writes"
ON public.provider_integration_sync_jobs FOR INSERT
WITH CHECK (false);

CREATE POLICY "Invoice customers view payment plan items"
ON public.provider_payment_plan_items FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.provider_invoices i
    WHERE i.id = provider_payment_plan_items.invoice_id
      AND i.customer_id = auth.uid()
  )
);
