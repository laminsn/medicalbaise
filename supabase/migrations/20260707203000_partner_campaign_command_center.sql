-- Partner campaign command center: campaign memberships, share codes, QR links,
-- partner conversion metrics, and campaign rules for approved partners.

CREATE OR REPLACE FUNCTION public.normalize_partner_campaign_code(input_code text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(upper(coalesce(input_code, '')), '[^A-Z0-9_-]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.build_partner_campaign_url(
  target_app_key text,
  target_code text,
  target_path text DEFAULT '/discover'
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  base_url text;
  clean_path text := coalesce(nullif(target_path, ''), '/discover');
  separator text;
BEGIN
  base_url := CASE lower(coalesce(target_app_key, 'casa'))
    WHEN 'medical' THEN 'https://www.mdbaise.com'
    WHEN 'legal' THEN 'https://www.legalbaise.com'
    ELSE 'https://www.casabaise.com'
  END;

  IF left(clean_path, 1) <> '/' THEN
    clean_path := '/' || clean_path;
  END IF;

  separator := CASE WHEN position('?' IN clean_path) > 0 THEN '&' ELSE '?' END;
  RETURN base_url || clean_path || separator || 'partner=' || target_code;
END;
$$;

CREATE TABLE IF NOT EXISTS public.partner_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  slug text NOT NULL,
  name text NOT NULL,
  campaign_type text NOT NULL DEFAULT 'provider_growth'
    CHECK (campaign_type IN ('provider_growth', 'real_estate', 'influencer', 'brokerage', 'medical', 'legal', 'custom')),
  description text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  approval_required boolean NOT NULL DEFAULT true,
  commission_type text NOT NULL DEFAULT 'percent'
    CHECK (commission_type IN ('percent', 'flat', 'tiered', 'hybrid')),
  commission_value numeric NOT NULL DEFAULT 10 CHECK (commission_value >= 0),
  currency text NOT NULL DEFAULT 'USD',
  rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  payout_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_guidelines jsonb NOT NULL DEFAULT '[]'::jsonb,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, slug)
);

CREATE TABLE IF NOT EXISTS public.partner_campaign_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.partner_campaigns(id) ON DELETE CASCADE,
  partner_user_id uuid NOT NULL,
  approved_by uuid,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'paused', 'completed', 'rejected')),
  partner_code text NOT NULL DEFAULT ('PT' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  custom_code text,
  landing_path text NOT NULL DEFAULT '/discover',
  tracking_url text,
  qr_payload text,
  leads_count integer NOT NULL DEFAULT 0 CHECK (leads_count >= 0),
  conversions_count integer NOT NULL DEFAULT 0 CHECK (conversions_count >= 0),
  gross_revenue numeric NOT NULL DEFAULT 0 CHECK (gross_revenue >= 0),
  partner_profit numeric NOT NULL DEFAULT 0 CHECK (partner_profit >= 0),
  last_lead_at timestamptz,
  last_conversion_at timestamptz,
  approved_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, partner_user_id),
  UNIQUE (partner_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_campaign_memberships_custom_code
ON public.partner_campaign_memberships(custom_code)
WHERE custom_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.partner_campaign_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.partner_campaigns(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES public.partner_campaign_memberships(id) ON DELETE CASCADE,
  partner_user_id uuid NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('click', 'lead', 'qualified_lead', 'signup', 'booking', 'conversion', 'payout', 'refund', 'chargeback', 'note')),
  lead_email text,
  lead_label text,
  revenue_amount numeric NOT NULL DEFAULT 0 CHECK (revenue_amount >= 0),
  profit_amount numeric NOT NULL DEFAULT 0 CHECK (profit_amount >= 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS partner_campaign_id uuid REFERENCES public.partner_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_campaign_membership_id uuid REFERENCES public.partner_campaign_memberships(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_campaigns_app_status ON public.partner_campaigns(app_key, status);
CREATE INDEX IF NOT EXISTS idx_partner_campaign_memberships_partner ON public.partner_campaign_memberships(partner_user_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_campaign_memberships_campaign ON public.partner_campaign_memberships(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_campaign_events_membership ON public.partner_campaign_events(membership_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_campaign_events_partner ON public.partner_campaign_events(partner_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_partner_campaign ON public.referrals(partner_campaign_id, partner_campaign_membership_id);

CREATE OR REPLACE FUNCTION public.sync_partner_campaign_membership_tracking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  campaign_app_key text;
  tracking_code text;
BEGIN
  NEW.partner_code := public.normalize_partner_campaign_code(NEW.partner_code);

  IF NEW.partner_code = '' THEN
    NEW.partner_code := 'PT' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  END IF;

  IF NEW.custom_code IS NOT NULL THEN
    NEW.custom_code := nullif(public.normalize_partner_campaign_code(NEW.custom_code), '');
  END IF;

  tracking_code := coalesce(NEW.custom_code, NEW.partner_code);

  SELECT app_key INTO campaign_app_key
  FROM public.partner_campaigns
  WHERE id = NEW.campaign_id;

  NEW.tracking_url := public.build_partner_campaign_url(coalesce(campaign_app_key, 'casa'), tracking_code, NEW.landing_path);
  NEW.qr_payload := NEW.tracking_url;

  IF NEW.status = 'approved' AND NEW.approved_at IS NULL THEN
    NEW.approved_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_partner_campaign_membership_tracking ON public.partner_campaign_memberships;
CREATE TRIGGER sync_partner_campaign_membership_tracking
  BEFORE INSERT OR UPDATE OF campaign_id, partner_code, custom_code, landing_path, status
  ON public.partner_campaign_memberships
  FOR EACH ROW EXECUTE FUNCTION public.sync_partner_campaign_membership_tracking();

DROP TRIGGER IF EXISTS update_partner_campaigns_updated_at ON public.partner_campaigns;
CREATE TRIGGER update_partner_campaigns_updated_at
  BEFORE UPDATE ON public.partner_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

DROP TRIGGER IF EXISTS update_partner_campaign_memberships_updated_at ON public.partner_campaign_memberships;
CREATE TRIGGER update_partner_campaign_memberships_updated_at
  BEFORE UPDATE ON public.partner_campaign_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_partner_campaign_membership_metrics(target_membership_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.partner_campaign_memberships m
  SET
    leads_count = coalesce((
      SELECT count(*)::integer
      FROM public.partner_campaign_events e
      WHERE e.membership_id = target_membership_id
        AND e.event_type IN ('lead', 'qualified_lead', 'signup')
    ), 0),
    conversions_count = coalesce((
      SELECT count(*)::integer
      FROM public.partner_campaign_events e
      WHERE e.membership_id = target_membership_id
        AND e.event_type IN ('booking', 'conversion')
    ), 0),
    gross_revenue = greatest(0, coalesce((
      SELECT sum(
        CASE
          WHEN e.event_type IN ('booking', 'conversion') THEN e.revenue_amount
          WHEN e.event_type IN ('refund', 'chargeback') THEN -e.revenue_amount
          ELSE 0
        END
      )
      FROM public.partner_campaign_events e
      WHERE e.membership_id = target_membership_id
    ), 0)),
    partner_profit = greatest(0, coalesce((
      SELECT sum(
        CASE
          WHEN e.event_type IN ('booking', 'conversion', 'payout') THEN e.profit_amount
          WHEN e.event_type IN ('refund', 'chargeback') THEN -e.profit_amount
          ELSE 0
        END
      )
      FROM public.partner_campaign_events e
      WHERE e.membership_id = target_membership_id
    ), 0)),
    last_lead_at = (
      SELECT max(e.occurred_at)
      FROM public.partner_campaign_events e
      WHERE e.membership_id = target_membership_id
        AND e.event_type IN ('lead', 'qualified_lead', 'signup')
    ),
    last_conversion_at = (
      SELECT max(e.occurred_at)
      FROM public.partner_campaign_events e
      WHERE e.membership_id = target_membership_id
        AND e.event_type IN ('booking', 'conversion')
    )
  WHERE m.id = target_membership_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_partner_campaign_event_metrics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_partner_campaign_membership_metrics(coalesce(NEW.membership_id, OLD.membership_id));

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_partner_campaign_event_metrics ON public.partner_campaign_events;
CREATE TRIGGER sync_partner_campaign_event_metrics
  AFTER INSERT OR UPDATE OR DELETE ON public.partner_campaign_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_partner_campaign_event_metrics();

CREATE OR REPLACE FUNCTION public.update_partner_campaign_code(
  target_membership_id uuid,
  requested_code text
)
RETURNS TABLE (
  membership_id uuid,
  custom_code text,
  tracking_url text,
  qr_payload text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  membership_record public.partner_campaign_memberships%ROWTYPE;
  normalized_code text := public.normalize_partner_campaign_code(requested_code);
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication is required';
  END IF;

  IF length(normalized_code) < 4 OR length(normalized_code) > 32 THEN
    RAISE EXCEPTION 'Partner code must be 4 to 32 letters or numbers';
  END IF;

  SELECT *
  INTO membership_record
  FROM public.partner_campaign_memberships
  WHERE id = target_membership_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner campaign membership was not found';
  END IF;

  IF membership_record.partner_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'You can only update your own partner campaign code';
  END IF;

  IF membership_record.status <> 'approved' THEN
    RAISE EXCEPTION 'Custom codes are available after campaign approval';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.partner_campaign_memberships m
    WHERE m.id <> target_membership_id
      AND (m.partner_code = normalized_code OR m.custom_code = normalized_code)
  ) THEN
    RAISE EXCEPTION 'That partner code is already in use';
  END IF;

  UPDATE public.partner_campaign_memberships
  SET custom_code = normalized_code
  WHERE id = target_membership_id
  RETURNING id, partner_campaign_memberships.custom_code, partner_campaign_memberships.tracking_url, partner_campaign_memberships.qr_payload
  INTO membership_id, custom_code, tracking_url, qr_payload;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_partner_campaign_click(
  target_tracking_code text,
  target_event_type text DEFAULT 'click',
  event_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_code text := public.normalize_partner_campaign_code(target_tracking_code);
  normalized_event text := coalesce(nullif(target_event_type, ''), 'click');
  membership_record public.partner_campaign_memberships%ROWTYPE;
  event_id uuid;
BEGIN
  IF normalized_event NOT IN ('click', 'lead') THEN
    RAISE EXCEPTION 'Only click and lead events can be recorded publicly';
  END IF;

  SELECT m.*
  INTO membership_record
  FROM public.partner_campaign_memberships m
  JOIN public.partner_campaigns c ON c.id = m.campaign_id
  WHERE (m.partner_code = normalized_code OR m.custom_code = normalized_code)
    AND m.status = 'approved'
    AND c.status = 'active'
    AND (c.starts_at IS NULL OR c.starts_at <= now())
    AND (c.ends_at IS NULL OR c.ends_at >= now())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner campaign is not active';
  END IF;

  INSERT INTO public.partner_campaign_events (
    campaign_id,
    membership_id,
    partner_user_id,
    event_type,
    metadata
  )
  VALUES (
    membership_record.campaign_id,
    membership_record.id,
    membership_record.partner_user_id,
    normalized_event,
    coalesce(event_metadata, '{}'::jsonb)
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

ALTER TABLE public.partner_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_campaign_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_campaign_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view active partner campaigns" ON public.partner_campaigns;
CREATE POLICY "Authenticated users view active partner campaigns"
ON public.partner_campaigns FOR SELECT TO authenticated
USING (
  status = 'active'
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1
    FROM public.partner_campaign_memberships m
    WHERE m.campaign_id = partner_campaigns.id
      AND m.partner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins manage partner campaigns" ON public.partner_campaigns;
CREATE POLICY "Admins manage partner campaigns"
ON public.partner_campaigns FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Partners view own campaign memberships" ON public.partner_campaign_memberships;
CREATE POLICY "Partners view own campaign memberships"
ON public.partner_campaign_memberships FOR SELECT TO authenticated
USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage partner campaign memberships" ON public.partner_campaign_memberships;
CREATE POLICY "Admins manage partner campaign memberships"
ON public.partner_campaign_memberships FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Partners view own campaign events" ON public.partner_campaign_events;
CREATE POLICY "Partners view own campaign events"
ON public.partner_campaign_events FOR SELECT TO authenticated
USING (partner_user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage partner campaign events" ON public.partner_campaign_events;
CREATE POLICY "Admins manage partner campaign events"
ON public.partner_campaign_events FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_campaign_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_campaign_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_partner_campaign_code(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_partner_campaign_click(text, text, jsonb) TO anon, authenticated, service_role;

INSERT INTO public.partner_campaigns (
  app_key,
  slug,
  name,
  campaign_type,
  description,
  commission_type,
  commission_value,
  currency,
  rules,
  payout_rules,
  content_guidelines,
  metadata
)
VALUES
  (
    'casa',
    'real-estate-brokerage-growth',
    'Real Estate Brokerage Growth',
    'real_estate',
    'For brokerages and brokerage owners sharing trusted home, repair, inspection, and project service providers.',
    'hybrid',
    12,
    'USD',
    '["Use your assigned partner link, custom code, or QR code for attribution.", "Do not promise provider availability, pricing, licensing, or results outside the live Baise listing.", "Leads must be routed through Baise so clients keep transaction, invoice, receipt, and review history.", "Brokerage and owner influencer campaigns can run at the same time when each campaign is separately approved."]'::jsonb,
    '{"attribution_window_days":30,"payout_frequency":"monthly","minimum_payout":50,"conversion_definition":"A verified client books or pays a participating provider through Baise.","profit_basis":"Approved partner commission after refunds, chargebacks, and platform adjustments."}'::jsonb,
    '["Use approved marketplace screenshots or campaign assets.", "Clearly identify referral or partner relationship when required.", "Send users to the tracked Baise link instead of collecting payments outside the platform."]'::jsonb,
    '{"example":"brokerage_and_owner_influencer"}'::jsonb
  ),
  (
    'casa',
    'influencer-provider-growth',
    'Influencer Provider Growth',
    'influencer',
    'For creators promoting trusted service providers, local project help, and verified provider booking through Baise.',
    'percent',
    10,
    'USD',
    '["Use your tracked link, QR code, or approved custom code.", "Only promote active Baise service categories and approved claims.", "Conversions are credited when the client books or pays through the platform.", "Content must send clients into Baise for messages, quotes, invoices, and receipts."]'::jsonb,
    '{"attribution_window_days":30,"payout_frequency":"monthly","minimum_payout":50,"conversion_definition":"A new client request, booking, or paid invoice attributed to the partner campaign.","profit_basis":"Commissionable revenue net of refunds and disputes."}'::jsonb,
    '["Show the hero image or approved screenshots when sharing by text or WhatsApp.", "Keep pricing language general unless the provider listing states it.", "Use the assigned disclosure language for sponsored posts and UGC."]'::jsonb,
    '{"example":"creator_campaign"}'::jsonb
  ),
  (
    'medical',
    'medical-provider-network',
    'Medical Provider Network',
    'medical',
    'For partners introducing trusted medical service providers and patient-ready care resources.',
    'hybrid',
    10,
    'USD',
    '["Use approved Medical Baise tracking links and QR codes.", "Do not provide medical advice, guarantees, or diagnosis claims.", "All requests must stay inside Medical Baise for privacy-minded records and follow-up.", "Campaign approval defines the services, region, and compliant messaging allowed."]'::jsonb,
    '{"attribution_window_days":30,"payout_frequency":"monthly","minimum_payout":50,"conversion_definition":"A qualified request or booking attributed to the partner campaign.","profit_basis":"Approved commission after reversals and compliance review."}'::jsonb,
    '["Use approved educational language only.", "Avoid urgency, cure, or outcome guarantees.", "Route users to the tracked Medical Baise page for next steps."]'::jsonb,
    '{"example":"medical_partner_campaign"}'::jsonb
  ),
  (
    'medical',
    'medical-influencer-education',
    'Medical Influencer Education',
    'influencer',
    'For approved creators sharing educational healthcare navigation content and Medical Baise provider discovery.',
    'percent',
    8,
    'USD',
    '["Use your assigned partner code, tracked link, or QR code.", "Keep content educational and platform-focused.", "Do not make provider, treatment, or outcome guarantees.", "Conversions require attributed requests or bookings inside Medical Baise."]'::jsonb,
    '{"attribution_window_days":30,"payout_frequency":"monthly","minimum_payout":50,"conversion_definition":"A qualified attributed lead, booking, or paid service event.","profit_basis":"Eligible net campaign revenue after refunds and review."}'::jsonb,
    '["Use approved visuals and disclaimers.", "Send users to Medical Baise for account creation and provider requests.", "Do not collect patient details outside the platform."]'::jsonb,
    '{"example":"medical_creator_campaign"}'::jsonb
  ),
  (
    'legal',
    'legal-provider-network',
    'Legal Provider Network',
    'legal',
    'For partners introducing people and businesses to trusted legal service providers through Legal Baise.',
    'hybrid',
    10,
    'USD',
    '["Use approved Legal Baise tracking links and QR codes.", "Do not provide legal advice or promise legal outcomes.", "All inquiries should route through Legal Baise so records, quotes, and provider history stay organized.", "Campaign approval defines the legal categories and regions that can be promoted."]'::jsonb,
    '{"attribution_window_days":30,"payout_frequency":"monthly","minimum_payout":50,"conversion_definition":"A qualified request, consultation booking, or paid legal service event attributed to the partner.","profit_basis":"Approved campaign commission after refunds, disputes, and review."}'::jsonb,
    '["Keep language educational and marketplace-focused.", "Use approved disclaimers for legal content.", "Route users into Legal Baise before any provider engagement."]'::jsonb,
    '{"example":"legal_partner_campaign"}'::jsonb
  ),
  (
    'legal',
    'legal-influencer-education',
    'Legal Influencer Education',
    'influencer',
    'For approved creators sharing Legal Baise education, service discovery, and trusted provider access.',
    'percent',
    8,
    'USD',
    '["Use your assigned custom code, tracked link, or QR code.", "Do not give legal advice, draft legal positions, or guarantee provider outcomes.", "Conversions are credited when attributed users request, book, or pay through Legal Baise.", "Campaign content must match the approved rules and disclosure requirements."]'::jsonb,
    '{"attribution_window_days":30,"payout_frequency":"monthly","minimum_payout":50,"conversion_definition":"A qualified request, booking, or paid service attributed to the campaign.","profit_basis":"Eligible net revenue after refunds, disputes, and compliance review."}'::jsonb,
    '["Use approved content and marketplace screenshots.", "Add referral or sponsored disclosure when required.", "Send every call to action to the tracked Legal Baise link."]'::jsonb,
    '{"example":"legal_creator_campaign"}'::jsonb
  )
ON CONFLICT (app_key, slug) DO UPDATE
SET
  name = EXCLUDED.name,
  campaign_type = EXCLUDED.campaign_type,
  description = EXCLUDED.description,
  commission_type = EXCLUDED.commission_type,
  commission_value = EXCLUDED.commission_value,
  currency = EXCLUDED.currency,
  rules = EXCLUDED.rules,
  payout_rules = EXCLUDED.payout_rules,
  content_guidelines = EXCLUDED.content_guidelines,
  metadata = EXCLUDED.metadata,
  updated_at = now();
