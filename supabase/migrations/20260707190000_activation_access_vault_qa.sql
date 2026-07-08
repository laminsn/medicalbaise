-- Activation layer: member/client access, lifecycle, engagement gates,
-- document vault, lifecycle campaign templates/sends, visibility QA, and referral RPCs.

CREATE OR REPLACE FUNCTION public.update_provider_activation_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.provider_owned_by_current_user(target_provider_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.providers p
    WHERE p.id = target_provider_id
      AND p.user_id = auth.uid()
  );
$$;

ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.provider_access_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  client_user_id uuid,
  granted_by uuid NOT NULL,
  access_level text NOT NULL DEFAULT 'client'
    CHECK (access_level IN ('member', 'client', 'vip_client', 'partner', 'staff')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'paused', 'revoked', 'expired')),
  access_source text NOT NULL DEFAULT 'portal'
    CHECK (access_source IN ('portal', 'quote', 'payment', 'signature', 'document', 'campaign', 'manual', 'referral')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  upgraded_at timestamptz,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_access_entitlements_provider ON public.provider_access_entitlements(provider_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_access_entitlements_client ON public.provider_access_entitlements(client_user_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_access_entitlements_contact ON public.provider_access_entitlements(contact_id);

DROP TRIGGER IF EXISTS update_provider_access_entitlements_updated_at ON public.provider_access_entitlements;
CREATE TRIGGER update_provider_access_entitlements_updated_at
  BEFORE UPDATE ON public.provider_access_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

ALTER TABLE public.provider_access_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage own access entitlements" ON public.provider_access_entitlements;
CREATE POLICY "Providers manage own access entitlements"
ON public.provider_access_entitlements FOR ALL
USING (public.provider_owned_by_current_user(provider_id))
WITH CHECK (public.provider_owned_by_current_user(provider_id));

DROP POLICY IF EXISTS "Clients view own access entitlements" ON public.provider_access_entitlements;
CREATE POLICY "Clients view own access entitlements"
ON public.provider_access_entitlements FOR SELECT
USING (client_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.member_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  member_user_id uuid,
  actor_id uuid,
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  lifecycle_stage text NOT NULL DEFAULT 'member'
    CHECK (lifecycle_stage IN ('visitor', 'member', 'lead', 'qualified', 'client', 'vip_client', 'inactive')),
  event_type text NOT NULL DEFAULT 'note'
    CHECK (event_type IN ('joined', 'resource_opt_in', 'webinar_opt_in', 'call_scheduled', 'access_granted', 'upgraded_to_client', 'conversion_reason_logged', 'payment_gate_updated', 'signature_gate_updated', 'document_uploaded', 'campaign_sent', 'qa_checked', 'note')),
  conversion_reason text,
  projected_ltv numeric NOT NULL DEFAULT 0 CHECK (projected_ltv >= 0),
  empire_hub_sync_status text NOT NULL DEFAULT 'not_synced'
    CHECK (empire_hub_sync_status IN ('not_synced', 'queued', 'synced', 'failed')),
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_lifecycle_events_provider ON public.member_lifecycle_events(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_lifecycle_events_contact ON public.member_lifecycle_events(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_lifecycle_events_type ON public.member_lifecycle_events(provider_id, event_type, lifecycle_stage);

ALTER TABLE public.member_lifecycle_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage own member lifecycle events" ON public.member_lifecycle_events;
CREATE POLICY "Providers manage own member lifecycle events"
ON public.member_lifecycle_events FOR ALL
USING (public.provider_owned_by_current_user(provider_id))
WITH CHECK (public.provider_owned_by_current_user(provider_id));

DROP POLICY IF EXISTS "Members view own lifecycle events" ON public.member_lifecycle_events;
CREATE POLICY "Members view own lifecycle events"
ON public.member_lifecycle_events FOR SELECT
USING (member_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.provider_engagement_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  client_user_id uuid,
  gate_type text NOT NULL
    CHECK (gate_type IN ('payment', 'signature', 'document', 'onboarding', 'review', 'access', 'custom')),
  resource_type text,
  resource_id uuid,
  status text NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'unlocked', 'satisfied', 'paused', 'failed', 'cancelled')),
  required_action text,
  visible_to_client boolean NOT NULL DEFAULT true,
  client_message text,
  staff_note text,
  satisfied_at timestamptz,
  paused_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_engagement_gates_provider ON public.provider_engagement_gates(provider_id, gate_type, status);
CREATE INDEX IF NOT EXISTS idx_provider_engagement_gates_client ON public.provider_engagement_gates(client_user_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_engagement_gates_resource ON public.provider_engagement_gates(resource_type, resource_id);

DROP TRIGGER IF EXISTS update_provider_engagement_gates_updated_at ON public.provider_engagement_gates;
CREATE TRIGGER update_provider_engagement_gates_updated_at
  BEFORE UPDATE ON public.provider_engagement_gates
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

ALTER TABLE public.provider_engagement_gates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage own engagement gates" ON public.provider_engagement_gates;
CREATE POLICY "Providers manage own engagement gates"
ON public.provider_engagement_gates FOR ALL
USING (public.provider_owned_by_current_user(provider_id))
WITH CHECK (public.provider_owned_by_current_user(provider_id));

DROP POLICY IF EXISTS "Clients view visible own engagement gates" ON public.provider_engagement_gates;
CREATE POLICY "Clients view visible own engagement gates"
ON public.provider_engagement_gates FOR SELECT
USING (client_user_id = auth.uid() AND visible_to_client = true);

CREATE TABLE IF NOT EXISTS public.provider_document_vault_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  client_user_id uuid,
  uploaded_by uuid NOT NULL,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('identity', 'contract', 'invoice', 'receipt', 'tax', 'photo', 'proof', 'quote', 'estimate', 'signature', 'reconciliation', 'p_and_l', 'general')),
  title text NOT NULL,
  file_name text NOT NULL,
  bucket_id text NOT NULL DEFAULT 'provider-document-vault',
  file_path text NOT NULL,
  mime_type text,
  file_size bigint,
  visibility text NOT NULL DEFAULT 'staff'
    CHECK (visibility IN ('client', 'staff', 'both')),
  parser_status text NOT NULL DEFAULT 'not_started'
    CHECK (parser_status IN ('not_started', 'queued', 'parsed', 'needs_review', 'failed')),
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_reclassification')),
  signoff_status text NOT NULL DEFAULT 'not_required'
    CHECK (signoff_status IN ('not_required', 'client_required', 'staff_required', 'both_required', 'complete')),
  source_resource_type text,
  source_resource_id uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  signed_off_by_client_at timestamptz,
  signed_off_by_staff_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_document_vault_provider ON public.provider_document_vault_items(provider_id, category, review_status);
CREATE INDEX IF NOT EXISTS idx_provider_document_vault_client ON public.provider_document_vault_items(client_user_id, visibility);
CREATE INDEX IF NOT EXISTS idx_provider_document_vault_contact ON public.provider_document_vault_items(contact_id);

DROP TRIGGER IF EXISTS update_provider_document_vault_items_updated_at ON public.provider_document_vault_items;
CREATE TRIGGER update_provider_document_vault_items_updated_at
  BEFORE UPDATE ON public.provider_document_vault_items
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

ALTER TABLE public.provider_document_vault_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage own document vault items" ON public.provider_document_vault_items;
CREATE POLICY "Providers manage own document vault items"
ON public.provider_document_vault_items FOR ALL
USING (public.provider_owned_by_current_user(provider_id))
WITH CHECK (public.provider_owned_by_current_user(provider_id));

DROP POLICY IF EXISTS "Clients view own visible document vault items" ON public.provider_document_vault_items;
CREATE POLICY "Clients view own visible document vault items"
ON public.provider_document_vault_items FOR SELECT
USING (client_user_id = auth.uid() AND visibility IN ('client', 'both'));

CREATE TABLE IF NOT EXISTS public.provider_email_campaign_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  template_key text NOT NULL,
  campaign_type text NOT NULL
    CHECK (campaign_type IN ('member_welcome', 'case_study_delivery', 'webinar_invite', 'payment_received', 'client_access_unlocked', 'service_onboarding', 'quote_follow_up', 'review_request', 'referral_invite', 'custom')),
  audience text NOT NULL DEFAULT 'client'
    CHECK (audience IN ('member', 'client', 'provider', 'partner')),
  locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es', 'pt')),
  subject text NOT NULL,
  body text NOT NULL,
  cta_label text,
  cta_path text,
  is_system_template boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, app_key, template_key, locale)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_email_campaign_templates_system_unique
ON public.provider_email_campaign_templates(app_key, template_key, locale)
WHERE provider_id IS NULL;

DROP TRIGGER IF EXISTS update_provider_email_campaign_templates_updated_at ON public.provider_email_campaign_templates;
CREATE TRIGGER update_provider_email_campaign_templates_updated_at
  BEFORE UPDATE ON public.provider_email_campaign_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

ALTER TABLE public.provider_email_campaign_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers view system and own campaign templates" ON public.provider_email_campaign_templates;
CREATE POLICY "Providers view system and own campaign templates"
ON public.provider_email_campaign_templates FOR SELECT
USING (provider_id IS NULL OR public.provider_owned_by_current_user(provider_id));

DROP POLICY IF EXISTS "Providers manage own campaign templates" ON public.provider_email_campaign_templates;
CREATE POLICY "Providers manage own campaign templates"
ON public.provider_email_campaign_templates FOR ALL
USING (provider_id IS NOT NULL AND public.provider_owned_by_current_user(provider_id))
WITH CHECK (provider_id IS NOT NULL AND public.provider_owned_by_current_user(provider_id));

CREATE TABLE IF NOT EXISTS public.provider_email_campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.provider_email_campaign_templates(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  recipient_user_id uuid,
  recipient_email text,
  recipient_phone text,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  provider_communication_event_id uuid,
  queued_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_email_campaign_sends_provider ON public.provider_email_campaign_sends(provider_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_email_campaign_sends_contact ON public.provider_email_campaign_sends(contact_id, created_at DESC);

ALTER TABLE public.provider_email_campaign_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage own email campaign sends" ON public.provider_email_campaign_sends;
CREATE POLICY "Providers manage own email campaign sends"
ON public.provider_email_campaign_sends FOR ALL
USING (public.provider_owned_by_current_user(provider_id))
WITH CHECK (public.provider_owned_by_current_user(provider_id));

CREATE TABLE IF NOT EXISTS public.provider_visibility_qa_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE,
  checked_by uuid,
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  check_type text NOT NULL
    CHECK (check_type IN ('env_vars', 'supabase_tables', 'rls', 'email_send', 'portal_roles', 'document_upload', 'client_view', 'member_view', 'partner_view', 'edge_functions', 'custom')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'passed', 'warning', 'failed')),
  title text NOT NULL,
  detail text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_visibility_qa_checks_provider ON public.provider_visibility_qa_checks(provider_id, status, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_visibility_qa_checks_app ON public.provider_visibility_qa_checks(app_key, check_type, status);

DROP TRIGGER IF EXISTS update_provider_visibility_qa_checks_updated_at ON public.provider_visibility_qa_checks;
CREATE TRIGGER update_provider_visibility_qa_checks_updated_at
  BEFORE UPDATE ON public.provider_visibility_qa_checks
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_activation_updated_at();

ALTER TABLE public.provider_visibility_qa_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers manage own visibility QA checks" ON public.provider_visibility_qa_checks;
CREATE POLICY "Providers manage own visibility QA checks"
ON public.provider_visibility_qa_checks FOR ALL
USING (provider_id IS NULL OR public.provider_owned_by_current_user(provider_id))
WITH CHECK (provider_id IS NULL OR public.provider_owned_by_current_user(provider_id));

INSERT INTO public.provider_email_campaign_templates (
  provider_id,
  app_key,
  template_key,
  campaign_type,
  audience,
  locale,
  subject,
  body,
  cta_label,
  cta_path,
  is_system_template,
  metadata
)
SELECT
  NULL,
  app.app_key,
  template.template_key,
  template.campaign_type,
  template.audience,
  locale.locale,
  CASE locale.locale
    WHEN 'pt' THEN replace(template.subject_pt, '{{brand}}', app.brand_name)
    WHEN 'es' THEN replace(template.subject_es, '{{brand}}', app.brand_name)
    ELSE replace(template.subject_en, '{{brand}}', app.brand_name)
  END,
  CASE locale.locale
    WHEN 'pt' THEN replace(template.body_pt, '{{brand}}', app.brand_name)
    WHEN 'es' THEN replace(template.body_es, '{{brand}}', app.brand_name)
    ELSE replace(template.body_en, '{{brand}}', app.brand_name)
  END,
  CASE locale.locale WHEN 'pt' THEN 'Abrir portal' WHEN 'es' THEN 'Abrir portal' ELSE 'Open portal' END,
  template.cta_path,
  true,
  jsonb_build_object('seeded', true, 'brand_domain', app.domain)
FROM (
  VALUES
    ('casa', 'Casa Baise', 'casabaise.com'),
    ('medical', 'Medical Baise', 'medicalbaise.com'),
    ('legal', 'Legal Baise', 'legalbaise.com')
) AS app(app_key, brand_name, domain)
CROSS JOIN (VALUES ('en'), ('es'), ('pt')) AS locale(locale)
CROSS JOIN (
  VALUES
    ('member_welcome', 'member_welcome', 'member',
      'Welcome to {{brand}}', 'Bienvenido a {{brand}}', 'Bem-vindo ao {{brand}}',
      'Your account is ready. Use the portal for requests, updates, messages, invoices, receipts, and service history.',
      'Tu cuenta esta lista. Usa el portal para solicitudes, actualizaciones, mensajes, facturas, recibos e historial.',
      'Sua conta esta pronta. Use o portal para solicitacoes, atualizacoes, mensagens, faturas, recibos e historico.',
      '/customer-dashboard'),
    ('case_study_delivery', 'case_study_delivery', 'member',
      'Your {{brand}} resource is ready', 'Tu recurso de {{brand}} esta listo', 'Seu recurso do {{brand}} esta pronto',
      'The resource you requested is ready in your portal, along with next steps and provider options.',
      'El recurso que solicitaste esta listo en tu portal, con proximos pasos y opciones de proveedores.',
      'O recurso solicitado esta pronto no portal, com proximos passos e opcoes de prestadores.',
      '/customer-dashboard'),
    ('webinar_invite', 'webinar_invite', 'member',
      'Join the next {{brand}} session', 'Unete a la proxima sesion de {{brand}}', 'Participe da proxima sessao do {{brand}}',
      'You are invited to a Baise session. Confirm inside the portal so reminders and materials stay connected.',
      'Estas invitado a una sesion Baise. Confirma en el portal para mantener recordatorios y materiales conectados.',
      'Voce foi convidado para uma sessao Baise. Confirme no portal para manter lembretes e materiais conectados.',
      '/customer-dashboard'),
    ('payment_received', 'payment_received', 'client',
      'Payment received on {{brand}}', 'Pago recibido en {{brand}}', 'Pagamento recebido no {{brand}}',
      'Your payment was recorded. Receipts, invoices, and transaction history are available in the portal.',
      'Tu pago fue registrado. Recibos, facturas e historial estan disponibles en el portal.',
      'Seu pagamento foi registrado. Recibos, faturas e historico estao disponiveis no portal.',
      '/customer-dashboard'),
    ('client_access_unlocked', 'client_access_unlocked', 'client',
      'Your {{brand}} access is unlocked', 'Tu acceso a {{brand}} esta desbloqueado', 'Seu acesso ao {{brand}} foi liberado',
      'Your client portal access is active. Sign in to view files, messages, quotes, invoices, and service history.',
      'Tu acceso de cliente esta activo. Entra para ver archivos, mensajes, presupuestos, facturas e historial.',
      'Seu acesso de cliente esta ativo. Entre para ver arquivos, mensagens, orcamentos, faturas e historico.',
      '/customer-dashboard'),
    ('service_onboarding', 'service_onboarding', 'client',
      'Next steps for your {{brand}} service', 'Proximos pasos para tu servicio en {{brand}}', 'Proximos passos para seu servico no {{brand}}',
      'Your onboarding steps are ready. Review required payments, signatures, documents, and schedule details in the portal.',
      'Tus pasos de inicio estan listos. Revisa pagos, firmas, documentos y agenda en el portal.',
      'Seus passos de inicio estao prontos. Revise pagamentos, assinaturas, documentos e agenda no portal.',
      '/customer-dashboard')
) AS template(template_key, campaign_type, audience, subject_en, subject_es, subject_pt, body_en, body_es, body_pt, cta_path)
ON CONFLICT (app_key, template_key, locale)
WHERE provider_id IS NULL
DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  cta_label = EXCLUDED.cta_label,
  cta_path = EXCLUDED.cta_path,
  is_system_template = true,
  is_active = true,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.log_member_lifecycle_event(
  target_provider_id uuid,
  target_contact_id uuid DEFAULT NULL,
  target_member_user_id uuid DEFAULT NULL,
  lifecycle_event_type text DEFAULT 'note',
  lifecycle_stage_value text DEFAULT 'member',
  conversion_reason_text text DEFAULT NULL,
  event_notes text DEFAULT NULL,
  event_metadata jsonb DEFAULT '{}'::jsonb,
  projected_ltv_value numeric DEFAULT 0,
  target_app_key text DEFAULT 'casa'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
  normalized_app text := COALESCE(NULLIF(target_app_key, ''), 'casa');
BEGIN
  IF NOT public.provider_owned_by_current_user(target_provider_id) THEN
    RAISE EXCEPTION 'Provider access denied';
  END IF;

  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  INSERT INTO public.member_lifecycle_events (
    provider_id,
    contact_id,
    member_user_id,
    actor_id,
    app_key,
    lifecycle_stage,
    event_type,
    conversion_reason,
    projected_ltv,
    notes,
    metadata
  )
  VALUES (
    target_provider_id,
    target_contact_id,
    target_member_user_id,
    auth.uid(),
    normalized_app,
    COALESCE(NULLIF(lifecycle_stage_value, ''), 'member'),
    COALESCE(NULLIF(lifecycle_event_type, ''), 'note'),
    NULLIF(conversion_reason_text, ''),
    GREATEST(COALESCE(projected_ltv_value, 0), 0),
    NULLIF(event_notes, ''),
    COALESCE(event_metadata, '{}'::jsonb)
  )
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_client_access(
  target_provider_id uuid,
  target_contact_id uuid DEFAULT NULL,
  target_client_user_id uuid DEFAULT NULL,
  access_level_value text DEFAULT 'client',
  access_source_value text DEFAULT 'portal',
  access_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entitlement_id uuid;
  contact_email text;
  contact_phone text;
  contact_name text;
BEGIN
  IF NOT public.provider_owned_by_current_user(target_provider_id) THEN
    RAISE EXCEPTION 'Provider access denied';
  END IF;

  IF target_contact_id IS NOT NULL THEN
    SELECT full_name, email, phone
    INTO contact_name, contact_email, contact_phone
    FROM public.provider_crm_contacts
    WHERE id = target_contact_id
      AND provider_id = target_provider_id;
  END IF;

  INSERT INTO public.provider_access_entitlements (
    provider_id,
    contact_id,
    client_user_id,
    granted_by,
    access_level,
    status,
    access_source,
    metadata
  )
  VALUES (
    target_provider_id,
    target_contact_id,
    target_client_user_id,
    auth.uid(),
    COALESCE(NULLIF(access_level_value, ''), 'client'),
    'active',
    COALESCE(NULLIF(access_source_value, ''), 'portal'),
    COALESCE(access_metadata, '{}'::jsonb) ||
      jsonb_build_object('contact_name', contact_name, 'contact_email', contact_email)
  )
  RETURNING id INTO entitlement_id;

  IF target_contact_id IS NOT NULL THEN
    UPDATE public.provider_crm_contacts
    SET relationship_type = CASE WHEN relationship_type = 'lead' THEN 'client' ELSE relationship_type END,
        status = CASE WHEN status IN ('new', 'contacted', 'qualified') THEN 'active' ELSE status END,
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('latest_access_entitlement_id', entitlement_id)
    WHERE id = target_contact_id
      AND provider_id = target_provider_id;
  END IF;

  PERFORM public.log_member_lifecycle_event(
    target_provider_id,
    target_contact_id,
    target_client_user_id,
    'access_granted',
    'client',
    NULL,
    'Client portal access granted.',
    jsonb_build_object('entitlement_id', entitlement_id, 'access_source', access_source_value, 'contact_phone', contact_phone),
    0,
    COALESCE(access_metadata ->> 'app_key', 'casa')
  );

  RETURN entitlement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upgrade_member_to_client(
  target_provider_id uuid,
  target_contact_id uuid,
  target_member_user_id uuid DEFAULT NULL,
  conversion_reason_text text DEFAULT NULL,
  projected_ltv_value numeric DEFAULT 0,
  conversion_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entitlement_id uuid;
BEGIN
  entitlement_id := public.grant_client_access(
    target_provider_id,
    target_contact_id,
    target_member_user_id,
    'client',
    'manual',
    COALESCE(conversion_metadata, '{}'::jsonb) ||
      jsonb_build_object('conversion_reason', conversion_reason_text)
  );

  UPDATE public.provider_access_entitlements
  SET upgraded_at = now()
  WHERE id = entitlement_id;

  PERFORM public.log_member_lifecycle_event(
    target_provider_id,
    target_contact_id,
    target_member_user_id,
    'upgraded_to_client',
    'client',
    conversion_reason_text,
    'Member upgraded to client.',
    COALESCE(conversion_metadata, '{}'::jsonb) || jsonb_build_object('entitlement_id', entitlement_id),
    projected_ltv_value,
    COALESCE(conversion_metadata ->> 'app_key', 'casa')
  );

  RETURN entitlement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_provider_engagement_gate(
  target_provider_id uuid,
  target_contact_id uuid DEFAULT NULL,
  target_client_user_id uuid DEFAULT NULL,
  gate_type_value text DEFAULT 'custom',
  gate_status_value text DEFAULT 'locked',
  required_action_text text DEFAULT NULL,
  client_message_text text DEFAULT NULL,
  resource_type_value text DEFAULT NULL,
  resource_uuid uuid DEFAULT NULL,
  gate_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gate_id uuid;
BEGIN
  IF NOT public.provider_owned_by_current_user(target_provider_id) THEN
    RAISE EXCEPTION 'Provider access denied';
  END IF;

  INSERT INTO public.provider_engagement_gates (
    provider_id,
    contact_id,
    client_user_id,
    gate_type,
    resource_type,
    resource_id,
    status,
    required_action,
    client_message,
    satisfied_at,
    paused_at,
    metadata
  )
  VALUES (
    target_provider_id,
    target_contact_id,
    target_client_user_id,
    COALESCE(NULLIF(gate_type_value, ''), 'custom'),
    NULLIF(resource_type_value, ''),
    resource_uuid,
    COALESCE(NULLIF(gate_status_value, ''), 'locked'),
    NULLIF(required_action_text, ''),
    NULLIF(client_message_text, ''),
    CASE WHEN gate_status_value IN ('unlocked', 'satisfied') THEN now() ELSE NULL END,
    CASE WHEN gate_status_value = 'paused' THEN now() ELSE NULL END,
    COALESCE(gate_metadata, '{}'::jsonb)
  )
  RETURNING id INTO gate_id;

  PERFORM public.log_member_lifecycle_event(
    target_provider_id,
    target_contact_id,
    target_client_user_id,
    CASE WHEN gate_type_value = 'payment' THEN 'payment_gate_updated' WHEN gate_type_value = 'signature' THEN 'signature_gate_updated' ELSE 'note' END,
    CASE WHEN gate_status_value IN ('unlocked', 'satisfied') THEN 'client' ELSE 'member' END,
    NULL,
    COALESCE(required_action_text, client_message_text),
    COALESCE(gate_metadata, '{}'::jsonb) || jsonb_build_object('gate_id', gate_id, 'gate_type', gate_type_value, 'gate_status', gate_status_value),
    0,
    COALESCE(gate_metadata ->> 'app_key', 'casa')
  );

  RETURN gate_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_document_vault_item(
  target_provider_id uuid,
  target_contact_id uuid DEFAULT NULL,
  target_client_user_id uuid DEFAULT NULL,
  item_category text DEFAULT 'general',
  item_title text DEFAULT 'Document',
  item_file_name text DEFAULT 'document',
  item_bucket_id text DEFAULT 'provider-document-vault',
  item_file_path text DEFAULT '',
  item_visibility text DEFAULT 'staff',
  item_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_id uuid;
BEGIN
  IF NOT public.provider_owned_by_current_user(target_provider_id) THEN
    RAISE EXCEPTION 'Provider access denied';
  END IF;

  IF length(trim(COALESCE(item_file_path, ''))) = 0 THEN
    RAISE EXCEPTION 'Document file path is required';
  END IF;

  INSERT INTO public.provider_document_vault_items (
    provider_id,
    contact_id,
    client_user_id,
    uploaded_by,
    category,
    title,
    file_name,
    bucket_id,
    file_path,
    visibility,
    metadata
  )
  VALUES (
    target_provider_id,
    target_contact_id,
    target_client_user_id,
    auth.uid(),
    COALESCE(NULLIF(item_category, ''), 'general'),
    COALESCE(NULLIF(item_title, ''), item_file_name, 'Document'),
    COALESCE(NULLIF(item_file_name, ''), 'document'),
    COALESCE(NULLIF(item_bucket_id, ''), 'provider-document-vault'),
    item_file_path,
    COALESCE(NULLIF(item_visibility, ''), 'staff'),
    COALESCE(item_metadata, '{}'::jsonb)
  )
  RETURNING id INTO item_id;

  PERFORM public.log_member_lifecycle_event(
    target_provider_id,
    target_contact_id,
    target_client_user_id,
    'document_uploaded',
    'client',
    NULL,
    'Document vault item created.',
    COALESCE(item_metadata, '{}'::jsonb) || jsonb_build_object('vault_item_id', item_id, 'category', item_category),
    0,
    COALESCE(item_metadata ->> 'app_key', 'casa')
  );

  RETURN item_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_provider_lifecycle_campaign_templates(
  target_provider_id uuid,
  target_app_key text DEFAULT 'casa'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer := 0;
  normalized_app text := COALESCE(NULLIF(target_app_key, ''), 'casa');
BEGIN
  IF NOT public.provider_owned_by_current_user(target_provider_id) THEN
    RAISE EXCEPTION 'Provider access denied';
  END IF;

  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  INSERT INTO public.provider_email_campaign_templates (
    provider_id,
    app_key,
    template_key,
    campaign_type,
    audience,
    locale,
    subject,
    body,
    cta_label,
    cta_path,
    is_system_template,
    metadata
  )
  SELECT
    target_provider_id,
    app_key,
    template_key,
    campaign_type,
    audience,
    locale,
    subject,
    body,
    cta_label,
    cta_path,
    false,
    metadata || jsonb_build_object('seeded_for_provider', true)
  FROM public.provider_email_campaign_templates
  WHERE provider_id IS NULL
    AND app_key = normalized_app
  ON CONFLICT (provider_id, app_key, template_key, locale)
  DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    cta_label = EXCLUDED.cta_label,
    cta_path = EXCLUDED.cta_path,
    is_active = true,
    updated_at = now();

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.queue_provider_campaign_template_send(
  target_provider_id uuid,
  target_template_id uuid,
  target_contact_id uuid DEFAULT NULL,
  target_recipient_user_id uuid DEFAULT NULL,
  target_recipient_email text DEFAULT NULL,
  send_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  send_id uuid;
  event_id uuid;
  template_record record;
  contact_customer_id uuid;
  contact_email text;
  contact_phone text;
  recipient_email text;
  recipient_phone text;
BEGIN
  IF NOT public.provider_owned_by_current_user(target_provider_id) THEN
    RAISE EXCEPTION 'Provider access denied';
  END IF;

  SELECT *
  INTO template_record
  FROM public.provider_email_campaign_templates
  WHERE id = target_template_id
    AND is_active = true
    AND (provider_id IS NULL OR provider_id = target_provider_id);

  IF template_record.id IS NULL THEN
    RAISE EXCEPTION 'Campaign template not found';
  END IF;

  IF target_contact_id IS NOT NULL THEN
    SELECT customer_id, email, phone
    INTO contact_customer_id, contact_email, contact_phone
    FROM public.provider_crm_contacts
    WHERE id = target_contact_id
      AND provider_id = target_provider_id;
  END IF;

  recipient_email := lower(trim(COALESCE(target_recipient_email, contact_email, '')));
  recipient_phone := contact_phone;

  IF target_recipient_user_id IS NULL THEN
    target_recipient_user_id := contact_customer_id;
  END IF;

  INSERT INTO public.provider_email_campaign_sends (
    provider_id,
    template_id,
    contact_id,
    recipient_user_id,
    recipient_email,
    recipient_phone,
    subject,
    body,
    status,
    metadata
  )
  VALUES (
    target_provider_id,
    target_template_id,
    target_contact_id,
    target_recipient_user_id,
    NULLIF(recipient_email, ''),
    NULLIF(recipient_phone, ''),
    template_record.subject,
    template_record.body,
    'queued',
    COALESCE(send_metadata, '{}'::jsonb)
  )
  RETURNING id INTO send_id;

  INSERT INTO public.provider_communication_events (
    provider_id,
    customer_id,
    created_by,
    purpose,
    channel,
    subject,
    message_body,
    scheduled_at,
    status,
    app_key,
    event_type,
    template_key,
    locale,
    is_transactional,
    delivery_policy,
    recipient_email,
    recipient_phone,
    metadata
  )
  VALUES (
    target_provider_id,
    target_recipient_user_id,
    auth.uid(),
    'campaign',
    'email',
    template_record.subject,
    template_record.body,
    now(),
    'queued',
    template_record.app_key,
    template_record.campaign_type,
    template_record.id::text,
    template_record.locale,
    false,
    'marketing',
    NULLIF(recipient_email, ''),
    NULLIF(recipient_phone, ''),
    COALESCE(send_metadata, '{}'::jsonb) ||
      jsonb_build_object(
        'campaign_send_id', send_id,
        'contact_id', target_contact_id,
        'action_url', COALESCE(template_record.cta_path, '/customer-dashboard')
      )
  )
  RETURNING id INTO event_id;

  UPDATE public.provider_email_campaign_sends
  SET provider_communication_event_id = event_id
  WHERE id = send_id;

  PERFORM public.log_member_lifecycle_event(
    target_provider_id,
    target_contact_id,
    target_recipient_user_id,
    'campaign_sent',
    CASE WHEN template_record.audience = 'member' THEN 'member' ELSE 'client' END,
    NULL,
    template_record.subject,
    COALESCE(send_metadata, '{}'::jsonb) || jsonb_build_object('campaign_send_id', send_id, 'communication_event_id', event_id),
    0,
    template_record.app_key
  );

  RETURN send_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_visibility_qa_check(
  target_provider_id uuid,
  target_app_key text,
  qa_check_type text,
  qa_status text,
  qa_title text,
  qa_detail text DEFAULT NULL,
  qa_evidence jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  check_id uuid;
  normalized_app text := COALESCE(NULLIF(target_app_key, ''), 'casa');
BEGIN
  IF target_provider_id IS NOT NULL AND NOT public.provider_owned_by_current_user(target_provider_id) THEN
    RAISE EXCEPTION 'Provider access denied';
  END IF;

  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  INSERT INTO public.provider_visibility_qa_checks (
    provider_id,
    checked_by,
    app_key,
    check_type,
    status,
    title,
    detail,
    evidence
  )
  VALUES (
    target_provider_id,
    auth.uid(),
    normalized_app,
    qa_check_type,
    qa_status,
    qa_title,
    qa_detail,
    COALESCE(qa_evidence, '{}'::jsonb)
  )
  RETURNING id INTO check_id;

  IF target_provider_id IS NOT NULL THEN
    PERFORM public.log_member_lifecycle_event(
      target_provider_id,
      NULL,
      NULL,
      'qa_checked',
      'member',
      NULL,
      qa_title,
      COALESCE(qa_evidence, '{}'::jsonb) || jsonb_build_object('qa_check_id', check_id, 'qa_status', qa_status),
      0,
      normalized_app
    );
  END IF;

  RETURN check_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_referral_invite(
  target_referrer_id uuid,
  target_referral_code text,
  target_referred_email text,
  target_referral_type text DEFAULT 'customer',
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_id uuid;
  normalized_email text := lower(trim(COALESCE(target_referred_email, '')));
  normalized_type text := COALESCE(NULLIF(target_referral_type, ''), 'customer');
BEGIN
  IF auth.uid() IS DISTINCT FROM target_referrer_id THEN
    RAISE EXCEPTION 'Referral access denied';
  END IF;

  IF normalized_type NOT IN ('customer', 'provider') THEN
    normalized_type := 'customer';
  END IF;

  IF length(normalized_email) = 0 THEN
    RAISE EXCEPTION 'Referred email is required';
  END IF;

  INSERT INTO public.referrals (
    referrer_id,
    referral_code,
    referral_type,
    status,
    referred_email,
    credit_amount,
    metadata
  )
  VALUES (
    target_referrer_id,
    target_referral_code,
    normalized_type,
    'pending',
    normalized_email,
    CASE WHEN normalized_type = 'provider' THEN 100 ELSE 20 END,
    COALESCE(target_metadata, '{}'::jsonb)
  )
  RETURNING id INTO referral_id;

  RETURN referral_id;
END;
$$;

REVOKE ALL ON FUNCTION public.provider_owned_by_current_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provider_owned_by_current_user(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_member_lifecycle_event(uuid, uuid, uuid, text, text, text, text, jsonb, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_member_lifecycle_event(uuid, uuid, uuid, text, text, text, text, jsonb, numeric, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.grant_client_access(uuid, uuid, uuid, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_client_access(uuid, uuid, uuid, text, text, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.upgrade_member_to_client(uuid, uuid, uuid, text, numeric, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upgrade_member_to_client(uuid, uuid, uuid, text, numeric, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_provider_engagement_gate(uuid, uuid, uuid, text, text, text, text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_provider_engagement_gate(uuid, uuid, uuid, text, text, text, text, text, uuid, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.create_document_vault_item(uuid, uuid, uuid, text, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_document_vault_item(uuid, uuid, uuid, text, text, text, text, text, text, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.seed_provider_lifecycle_campaign_templates(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_provider_lifecycle_campaign_templates(uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.queue_provider_campaign_template_send(uuid, uuid, uuid, uuid, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_provider_campaign_template_send(uuid, uuid, uuid, uuid, text, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_visibility_qa_check(uuid, text, text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_visibility_qa_check(uuid, text, text, text, text, text, jsonb) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.track_referral_invite(uuid, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_referral_invite(uuid, text, text, text, jsonb) TO authenticated, service_role;
