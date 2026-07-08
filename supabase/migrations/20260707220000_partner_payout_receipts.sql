-- Partner payout receipts: simple partner-facing payout history and tax-ready
-- receipt summaries without exposing internal platform accounting.

CREATE TABLE IF NOT EXISTS public.partner_campaign_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.partner_campaigns(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES public.partner_campaign_memberships(id) ON DELETE SET NULL,
  payout_period_start date NOT NULL,
  payout_period_end date NOT NULL,
  amount numeric NOT NULL DEFAULT 0 CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'processing', 'paid', 'failed', 'void')),
  paid_at timestamptz,
  payout_method text,
  payment_reference text,
  receipt_number text NOT NULL UNIQUE DEFAULT ('BPR-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.partner_payout_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id uuid NOT NULL,
  period_type text NOT NULL
    CHECK (period_type IN ('monthly', 'quarterly', 'annual', 'custom', 'single')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  currency text NOT NULL DEFAULT 'USD',
  payout_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  receipt_number text NOT NULL UNIQUE DEFAULT ('BPRS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  generated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_user_id, period_type, period_start, period_end, currency)
);

CREATE INDEX IF NOT EXISTS idx_partner_campaign_payouts_partner
ON public.partner_campaign_payouts(partner_user_id, status, paid_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_campaign_payouts_campaign
ON public.partner_campaign_payouts(campaign_id, membership_id);

CREATE INDEX IF NOT EXISTS idx_partner_payout_receipts_partner
ON public.partner_payout_receipts(partner_user_id, generated_at DESC);

DROP TRIGGER IF EXISTS update_partner_campaign_payouts_updated_at ON public.partner_campaign_payouts;
CREATE TRIGGER update_partner_campaign_payouts_updated_at
  BEFORE UPDATE ON public.partner_campaign_payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

DROP TRIGGER IF EXISTS update_partner_payout_receipts_updated_at ON public.partner_payout_receipts;
CREATE TRIGGER update_partner_payout_receipts_updated_at
  BEFORE UPDATE ON public.partner_payout_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

CREATE OR REPLACE FUNCTION public.generate_partner_payout_receipt(
  target_period_type text,
  target_period_start date,
  target_period_end date DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  receipt_number text,
  period_type text,
  period_start date,
  period_end date,
  total_amount numeric,
  currency text,
  generated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_partner_id uuid := auth.uid();
  normalized_period text := lower(coalesce(target_period_type, 'monthly'));
  computed_start date := coalesce(target_period_start, current_date);
  computed_end date;
  payout_ids uuid[];
  payout_total numeric := 0;
  payout_currency text := 'USD';
  receipt_record public.partner_payout_receipts%ROWTYPE;
BEGIN
  IF current_partner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF normalized_period NOT IN ('monthly', 'quarterly', 'annual', 'custom', 'single') THEN
    RAISE EXCEPTION 'Receipt period must be monthly, quarterly, annual, custom, or single';
  END IF;

  IF normalized_period = 'monthly' THEN
    computed_start := date_trunc('month', computed_start)::date;
    computed_end := (computed_start + interval '1 month - 1 day')::date;
  ELSIF normalized_period = 'quarterly' THEN
    computed_start := date_trunc('quarter', computed_start)::date;
    computed_end := (computed_start + interval '3 months - 1 day')::date;
  ELSIF normalized_period = 'annual' THEN
    computed_start := date_trunc('year', computed_start)::date;
    computed_end := (computed_start + interval '1 year - 1 day')::date;
  ELSE
    computed_end := coalesce(target_period_end, computed_start);
  END IF;

  IF target_period_end IS NOT NULL AND normalized_period IN ('custom', 'single') THEN
    computed_end := target_period_end;
  END IF;

  IF computed_end < computed_start THEN
    RAISE EXCEPTION 'Receipt period end must be after the start date';
  END IF;

  SELECT
    coalesce(array_agg(p.id ORDER BY coalesce(p.paid_at, p.created_at)), ARRAY[]::uuid[]),
    coalesce(sum(p.amount), 0),
    coalesce(max(p.currency), 'USD')
  INTO payout_ids, payout_total, payout_currency
  FROM public.partner_campaign_payouts p
  WHERE p.partner_user_id = current_partner_id
    AND p.status = 'paid'
    AND coalesce(p.paid_at::date, p.payout_period_end) BETWEEN computed_start AND computed_end;

  INSERT INTO public.partner_payout_receipts (
    partner_user_id,
    period_type,
    period_start,
    period_end,
    total_amount,
    currency,
    payout_ids,
    metadata,
    generated_at
  )
  VALUES (
    current_partner_id,
    normalized_period,
    computed_start,
    computed_end,
    payout_total,
    payout_currency,
    payout_ids,
    jsonb_build_object('source', 'partner_portal'),
    now()
  )
  ON CONFLICT (partner_user_id, period_type, period_start, period_end, currency)
  DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    payout_ids = EXCLUDED.payout_ids,
    metadata = partner_payout_receipts.metadata || jsonb_build_object('regenerated_at', now()),
    generated_at = now(),
    updated_at = now()
  RETURNING * INTO receipt_record;

  id := receipt_record.id;
  receipt_number := receipt_record.receipt_number;
  period_type := receipt_record.period_type;
  period_start := receipt_record.period_start;
  period_end := receipt_record.period_end;
  total_amount := receipt_record.total_amount;
  currency := receipt_record.currency;
  generated_at := receipt_record.generated_at;

  RETURN NEXT;
END;
$$;

ALTER TABLE public.partner_campaign_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payout_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners view own campaign payouts" ON public.partner_campaign_payouts;
CREATE POLICY "Partners view own campaign payouts"
ON public.partner_campaign_payouts FOR SELECT TO authenticated
USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage partner campaign payouts" ON public.partner_campaign_payouts;
CREATE POLICY "Admins manage partner campaign payouts"
ON public.partner_campaign_payouts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Partners view own payout receipts" ON public.partner_payout_receipts;
CREATE POLICY "Partners view own payout receipts"
ON public.partner_payout_receipts FOR SELECT TO authenticated
USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage partner payout receipts" ON public.partner_payout_receipts;
CREATE POLICY "Admins manage partner payout receipts"
ON public.partner_payout_receipts FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT ON public.partner_campaign_payouts TO authenticated;
GRANT SELECT ON public.partner_payout_receipts TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_partner_payout_receipt(text, date, date) TO authenticated;

UPDATE public.partner_campaigns
SET payout_rules = (coalesce(payout_rules, '{}'::jsonb) - 'profit_basis') ||
  jsonb_build_object(
    'earnings_basis', 'Partner earnings show the approved amount credited from tracked visitors and converted customers.',
    'payout_summary', 'Approved partner payouts are summarized monthly with downloadable receipts.'
  ),
  updated_at = now()
WHERE campaign_type IN ('provider_growth', 'real_estate', 'influencer', 'brokerage', 'medical', 'legal', 'custom');
