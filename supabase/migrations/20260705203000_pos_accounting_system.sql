-- POS, invoice, refund, internal balance, and subcontractor accounting foundation.

CREATE SEQUENCE IF NOT EXISTS public.provider_invoice_number_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS public.provider_client_display_seq START 1000;

CREATE OR REPLACE FUNCTION public.update_pos_accounting_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.provider_account_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL UNIQUE REFERENCES public.providers(id) ON DELETE CASCADE,
  available_balance numeric NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  pending_balance numeric NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  internal_credit_balance numeric NOT NULL DEFAULT 0 CHECK (internal_credit_balance >= 0),
  currency text NOT NULL DEFAULT 'brl',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  subcontractor_user_id uuid,
  display_name text NOT NULL,
  email text,
  phone text,
  public_collection_alias text,
  payment_terms text NOT NULL DEFAULT 'benchmark_release'
    CHECK (payment_terms IN ('benchmark_release', 'milestone_release', 'manual_release', 'immediate_transfer')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'paused', 'removed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subcontractor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  contractor_provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  subcontractor_id uuid NOT NULL REFERENCES public.provider_subcontractors(id) ON DELETE CASCADE,
  scope_description text NOT NULL,
  agreed_amount numeric NOT NULL DEFAULT 0 CHECK (agreed_amount >= 0),
  release_benchmark text,
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'in_progress', 'benchmark_met', 'released', 'cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE,
  client_display_id text,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  customer_id uuid,
  subcontractor_id uuid REFERENCES public.provider_subcontractors(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  service_description text NOT NULL,
  invoice_type text NOT NULL DEFAULT 'pos'
    CHECK (invoice_type IN ('pos', 'standard', 'milestone', 'subcontractor', 'credit', 'refund')),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('draft', 'pending', 'processing', 'paid', 'partially_refunded', 'refunded', 'credited', 'cancelled', 'failed')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  paid_at timestamptz,
  company_logo_url text,
  baise_branding boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_provider_invoice_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR length(trim(NEW.invoice_number)) = 0 THEN
    NEW.invoice_number := 'INV-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('public.provider_invoice_number_seq')::text, 6, '0');
  END IF;

  IF NEW.client_display_id IS NULL OR length(trim(NEW.client_display_id)) = 0 THEN
    NEW.client_display_id := 'CLIENT-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('public.provider_client_display_seq')::text, 6, '0');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_user_credits_balance(
  target_user_id uuid,
  credit_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF credit_amount IS NULL OR credit_amount <= 0 THEN
    RAISE EXCEPTION 'credit_amount must be positive';
  END IF;

  UPDATE public.profiles
  SET credits_balance = COALESCE(credits_balance, 0) + credit_amount
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for credit target';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_user_credits_balance(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_credits_balance(uuid, numeric) TO service_role;

CREATE TABLE IF NOT EXISTS public.provider_payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.provider_invoices(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  subcontractor_id uuid REFERENCES public.provider_subcontractors(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'brl',
  transaction_type text NOT NULL DEFAULT 'pos_payment'
    CHECK (transaction_type IN ('pos_payment', 'invoice_payment', 'refund', 'service_credit', 'internal_balance_payment', 'internal_balance_transfer', 'subcontractor_release')),
  payment_method text NOT NULL DEFAULT 'hosted_checkout'
    CHECK (payment_method IN ('hosted_checkout', 'card', 'wallet', 'pix', 'internal_balance', 'service_credit', 'manual')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded', 'credited', 'released')),
  refund_destination text
    CHECK (refund_destination IS NULL OR refund_destination IN ('original_payment_method', 'service_credit', 'internal_balance')),
  service_credit_amount numeric NOT NULL DEFAULT 0 CHECK (service_credit_amount >= 0),
  release_benchmark text,
  collected_by_subcontractor boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  related_transaction_id uuid REFERENCES public.provider_payment_transactions(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.provider_invoices(id) ON DELETE SET NULL,
  subcontractor_id uuid REFERENCES public.provider_subcontractors(id) ON DELETE SET NULL,
  entry_type text NOT NULL
    CHECK (entry_type IN ('payment_pending', 'payment_available', 'refund', 'service_credit', 'internal_transfer', 'subcontractor_release', 'fee', 'adjustment')),
  direction text NOT NULL CHECK (direction IN ('debit', 'credit')),
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'brl',
  memo text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_invoices_provider_id ON public.provider_invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_invoices_customer_id ON public.provider_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_provider_transactions_provider_id ON public.provider_payment_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_transactions_invoice_id ON public.provider_payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_provider_ledger_provider_id ON public.provider_ledger_entries(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_subcontractors_contractor ON public.provider_subcontractors(contractor_provider_id);

DROP TRIGGER IF EXISTS set_provider_invoice_identity_trigger ON public.provider_invoices;
CREATE TRIGGER set_provider_invoice_identity_trigger
  BEFORE INSERT ON public.provider_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_provider_invoice_identity();

DROP TRIGGER IF EXISTS update_provider_account_balances_updated_at ON public.provider_account_balances;
CREATE TRIGGER update_provider_account_balances_updated_at
  BEFORE UPDATE ON public.provider_account_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pos_accounting_updated_at();

DROP TRIGGER IF EXISTS update_provider_subcontractors_updated_at ON public.provider_subcontractors;
CREATE TRIGGER update_provider_subcontractors_updated_at
  BEFORE UPDATE ON public.provider_subcontractors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pos_accounting_updated_at();

DROP TRIGGER IF EXISTS update_subcontractor_assignments_updated_at ON public.subcontractor_assignments;
CREATE TRIGGER update_subcontractor_assignments_updated_at
  BEFORE UPDATE ON public.subcontractor_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pos_accounting_updated_at();

DROP TRIGGER IF EXISTS update_provider_invoices_updated_at ON public.provider_invoices;
CREATE TRIGGER update_provider_invoices_updated_at
  BEFORE UPDATE ON public.provider_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pos_accounting_updated_at();

DROP TRIGGER IF EXISTS update_provider_payment_transactions_updated_at ON public.provider_payment_transactions;
CREATE TRIGGER update_provider_payment_transactions_updated_at
  BEFORE UPDATE ON public.provider_payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pos_accounting_updated_at();

ALTER TABLE public.provider_account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider can view own balance" ON public.provider_account_balances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_account_balances.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Provider can manage own subcontractors" ON public.provider_subcontractors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_subcontractors.contractor_provider_id AND p.user_id = auth.uid())
    OR subcontractor_user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_subcontractors.contractor_provider_id AND p.user_id = auth.uid())
    OR subcontractor_user_id = auth.uid()
  );

CREATE POLICY "Provider can manage subcontractor assignments" ON public.subcontractor_assignments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = subcontractor_assignments.contractor_provider_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.provider_subcontractors ps
      WHERE ps.id = subcontractor_assignments.subcontractor_id
      AND ps.subcontractor_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = subcontractor_assignments.contractor_provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Invoice participants can view invoices" ON public.provider_invoices
  FOR SELECT USING (
    customer_id = auth.uid()
    OR created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_invoices.provider_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.provider_subcontractors ps
      WHERE ps.id = provider_invoices.subcontractor_id
      AND ps.subcontractor_user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create invoices" ON public.provider_invoices
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_invoices.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers can update own invoices" ON public.provider_invoices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_invoices.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Transaction participants can view transactions" ON public.provider_payment_transactions
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_payment_transactions.provider_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.provider_invoices i
      WHERE i.id = provider_payment_transactions.invoice_id
      AND i.customer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.provider_subcontractors ps
      WHERE ps.id = provider_payment_transactions.subcontractor_id
      AND ps.subcontractor_user_id = auth.uid()
    )
  );

CREATE POLICY "Providers can create payment transactions" ON public.provider_payment_transactions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_payment_transactions.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers can update own payment transactions" ON public.provider_payment_transactions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_payment_transactions.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers can view own ledger" ON public.provider_ledger_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_ledger_entries.provider_id AND p.user_id = auth.uid())
  );
