-- Provider operations platform foundation: flexible payments, calendar, portal messaging,
-- campaign strategy, integration registry, and export audit records.

CREATE OR REPLACE FUNCTION public.update_provider_operations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_provider_balance_delta(
  target_provider_id uuid,
  balance_bucket text,
  delta_amount numeric,
  balance_currency text DEFAULT 'brl'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF delta_amount IS NULL OR delta_amount = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.provider_account_balances (
    provider_id,
    available_balance,
    pending_balance,
    internal_credit_balance,
    currency
  )
  VALUES (
    target_provider_id,
    0,
    0,
    0,
    COALESCE(balance_currency, 'brl')
  )
  ON CONFLICT (provider_id) DO NOTHING;

  IF balance_bucket = 'available' THEN
    UPDATE public.provider_account_balances
    SET available_balance = GREATEST(0, available_balance + delta_amount),
        updated_at = now()
    WHERE provider_id = target_provider_id;
  ELSIF balance_bucket = 'pending' THEN
    UPDATE public.provider_account_balances
    SET pending_balance = GREATEST(0, pending_balance + delta_amount),
        updated_at = now()
    WHERE provider_id = target_provider_id;
  ELSIF balance_bucket = 'internal_credit' THEN
    UPDATE public.provider_account_balances
    SET internal_credit_balance = GREATEST(0, internal_credit_balance + delta_amount),
        updated_at = now()
    WHERE provider_id = target_provider_id;
  ELSE
    RAISE EXCEPTION 'Unsupported balance bucket: %', balance_bucket;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_provider_balance_delta(uuid, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_provider_balance_delta(uuid, text, numeric, text) TO service_role;

CREATE TABLE IF NOT EXISTS public.provider_payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.provider_invoices(id) ON DELETE SET NULL,
  customer_id uuid,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  subcontractor_id uuid REFERENCES public.provider_subcontractors(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'one_time'
    CHECK (plan_type IN ('one_time', 'recurring', 'subscription', 'milestone', 'split')),
  cadence text NOT NULL DEFAULT 'one_time'
    CHECK (cadence IN ('one_time', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'custom')),
  title text NOT NULL,
  description text,
  currency text NOT NULL DEFAULT 'brl',
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  deposit_amount numeric NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  installment_count integer NOT NULL DEFAULT 1 CHECK (installment_count >= 1),
  autopay_enabled boolean NOT NULL DEFAULT false,
  payment_method text NOT NULL DEFAULT 'hosted_checkout'
    CHECK (payment_method IN ('hosted_checkout', 'card', 'wallet', 'pix', 'internal_balance', 'service_credit', 'manual')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled', 'failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_payment_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_plan_id uuid NOT NULL REFERENCES public.provider_payment_plans(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.provider_invoices(id) ON DELETE SET NULL,
  sequence_number integer NOT NULL DEFAULT 1 CHECK (sequence_number >= 1),
  label text NOT NULL,
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'brl',
  due_at timestamptz NOT NULL,
  release_benchmark text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'pending', 'paid', 'released', 'overdue', 'cancelled', 'failed')),
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_id uuid,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  scheduled_service_id uuid REFERENCES public.scheduled_services(id) ON DELETE SET NULL,
  payment_plan_id uuid REFERENCES public.provider_payment_plans(id) ON DELETE SET NULL,
  campaign_id uuid,
  created_by uuid NOT NULL,
  event_type text NOT NULL DEFAULT 'booking'
    CHECK (event_type IN ('booking', 'cancellation', 'follow_up', 'payment_due', 'campaign', 'inspection', 'deadline', 'custom')),
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'missed', 'sent')),
  notification_offsets_minutes integer[] NOT NULL DEFAULT ARRAY[1440, 120],
  channel_preferences text[] NOT NULL DEFAULT ARRAY['portal'],
  portal_first boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_communication_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  name text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'follow_up'
    CHECK (campaign_type IN ('booking_confirmation', 'booking_reminder', 'cancellation', 'follow_up', 'payment_reminder', 'review_request', 'winback', 'coupon', 'newsletter', 'custom')),
  audience text NOT NULL DEFAULT 'clients'
    CHECK (audience IN ('clients', 'leads', 'past_clients', 'followers', 'custom')),
  primary_channel text NOT NULL DEFAULT 'portal'
    CHECK (primary_channel IN ('portal', 'email', 'whatsapp')),
  secondary_channels text[] NOT NULL DEFAULT ARRAY['email', 'whatsapp'],
  portal_first boolean NOT NULL DEFAULT true,
  subject text,
  message_body text NOT NULL,
  trigger_type text NOT NULL DEFAULT 'manual'
    CHECK (trigger_type IN ('manual', 'scheduled', 'booking_event', 'payment_event', 'review_event', 'inactive_client')),
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'sent', 'archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_communication_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.provider_communication_campaigns(id) ON DELETE SET NULL,
  customer_id uuid,
  created_by uuid NOT NULL,
  purpose text NOT NULL DEFAULT 'notification'
    CHECK (purpose IN ('confirmation', 'reminder', 'notification', 'follow_up', 'campaign', 'receipt', 'payment_request')),
  channel text NOT NULL DEFAULT 'portal'
    CHECK (channel IN ('portal', 'email', 'whatsapp')),
  subject text,
  message_body text NOT NULL,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('draft', 'queued', 'sent', 'failed', 'cancelled', 'read')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  integration_key text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'productivity'
    CHECK (category IN ('email', 'calendar', 'storage', 'productivity', 'ai', 'accounting', 'banking', 'payments', 'messaging')),
  status text NOT NULL DEFAULT 'not_connected'
    CHECK (status IN ('not_connected', 'pending', 'connected', 'needs_attention', 'disabled')),
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  last_sync_at timestamptz,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  token_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, integration_key)
);

CREATE TABLE IF NOT EXISTS public.provider_transaction_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  export_type text NOT NULL DEFAULT 'custom'
    CHECK (export_type IN ('monthly', 'mtd', 'annual', 'custom')),
  date_from date,
  date_to date,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  row_count integer NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_payment_plans_provider ON public.provider_payment_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_payment_plan_items_plan ON public.provider_payment_plan_items(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_provider_payment_plan_items_provider ON public.provider_payment_plan_items(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_calendar_events_provider_start ON public.provider_calendar_events(provider_id, start_at);
CREATE INDEX IF NOT EXISTS idx_provider_campaigns_provider ON public.provider_communication_campaigns(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_comm_events_provider ON public.provider_communication_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_integrations_provider ON public.provider_integrations(provider_id);

DROP TRIGGER IF EXISTS update_provider_payment_plans_updated_at ON public.provider_payment_plans;
CREATE TRIGGER update_provider_payment_plans_updated_at
  BEFORE UPDATE ON public.provider_payment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_operations_updated_at();

DROP TRIGGER IF EXISTS update_provider_payment_plan_items_updated_at ON public.provider_payment_plan_items;
CREATE TRIGGER update_provider_payment_plan_items_updated_at
  BEFORE UPDATE ON public.provider_payment_plan_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_operations_updated_at();

DROP TRIGGER IF EXISTS update_provider_calendar_events_updated_at ON public.provider_calendar_events;
CREATE TRIGGER update_provider_calendar_events_updated_at
  BEFORE UPDATE ON public.provider_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_operations_updated_at();

DROP TRIGGER IF EXISTS update_provider_campaigns_updated_at ON public.provider_communication_campaigns;
CREATE TRIGGER update_provider_campaigns_updated_at
  BEFORE UPDATE ON public.provider_communication_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_operations_updated_at();

DROP TRIGGER IF EXISTS update_provider_comm_events_updated_at ON public.provider_communication_events;
CREATE TRIGGER update_provider_comm_events_updated_at
  BEFORE UPDATE ON public.provider_communication_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_operations_updated_at();

DROP TRIGGER IF EXISTS update_provider_integrations_updated_at ON public.provider_integrations;
CREATE TRIGGER update_provider_integrations_updated_at
  BEFORE UPDATE ON public.provider_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_provider_operations_updated_at();

ALTER TABLE public.provider_payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_payment_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_communication_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_communication_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_transaction_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own payment plans" ON public.provider_payment_plans
  FOR ALL USING (
    created_by = auth.uid()
    OR customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_payment_plans.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_payment_plans.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Payment plan participants view items" ON public.provider_payment_plan_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.provider_payment_plans pp
      WHERE pp.id = provider_payment_plan_items.payment_plan_id
      AND (
        pp.created_by = auth.uid()
        OR pp.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = pp.provider_id AND p.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Providers manage own payment plan items" ON public.provider_payment_plan_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_payment_plan_items.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_payment_plan_items.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Calendar participants can view events" ON public.provider_calendar_events
  FOR SELECT USING (
    created_by = auth.uid()
    OR customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_calendar_events.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own calendar events" ON public.provider_calendar_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_calendar_events.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_calendar_events.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own campaigns" ON public.provider_communication_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_communication_campaigns.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_communication_campaigns.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Communication participants can view events" ON public.provider_communication_events
  FOR SELECT USING (
    created_by = auth.uid()
    OR customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_communication_events.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own communication events" ON public.provider_communication_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_communication_events.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_communication_events.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own integrations" ON public.provider_integrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_integrations.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_integrations.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own transaction exports" ON public.provider_transaction_exports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_transaction_exports.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_transaction_exports.provider_id AND p.user_id = auth.uid())
  );
