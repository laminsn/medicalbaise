-- Communication orchestration: required transactional email, optional push/SMS/WhatsApp,
-- branded templates, and provider event fan-out for service, invoice, job, link, and request updates.

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS transactional_email_required boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_channel_preferences_acknowledged_at timestamptz;

UPDATE public.notification_preferences
SET email_enabled = true,
    transactional_email_required = true
WHERE email_enabled IS DISTINCT FROM true
   OR transactional_email_required IS DISTINCT FROM true;

ALTER TABLE public.notification_preferences
  DROP CONSTRAINT IF EXISTS notification_preferences_transactional_email_required_check;

ALTER TABLE public.notification_preferences
  ADD CONSTRAINT notification_preferences_transactional_email_required_check
  CHECK (email_enabled = true AND transactional_email_required = true);

ALTER TABLE public.provider_communication_events
  ADD COLUMN IF NOT EXISTS app_key text NOT NULL DEFAULT 'casa',
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS is_transactional boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_policy text NOT NULL DEFAULT 'transactional',
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS recipient_phone text;

ALTER TABLE public.provider_communication_events
  DROP CONSTRAINT IF EXISTS provider_communication_events_app_key_check;
ALTER TABLE public.provider_communication_events
  ADD CONSTRAINT provider_communication_events_app_key_check
  CHECK (app_key IN ('casa', 'medical', 'legal'));

ALTER TABLE public.provider_communication_events
  DROP CONSTRAINT IF EXISTS provider_communication_events_delivery_policy_check;
ALTER TABLE public.provider_communication_events
  ADD CONSTRAINT provider_communication_events_delivery_policy_check
  CHECK (delivery_policy IN ('transactional', 'marketing', 'system'));

ALTER TABLE public.provider_communication_campaigns
  DROP CONSTRAINT IF EXISTS provider_communication_campaigns_primary_channel_check;
ALTER TABLE public.provider_communication_campaigns
  ADD CONSTRAINT provider_communication_campaigns_primary_channel_check
  CHECK (primary_channel IN ('portal', 'email', 'whatsapp', 'sms', 'push'));

CREATE TABLE IF NOT EXISTS public.platform_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  event_type text NOT NULL,
  audience text NOT NULL DEFAULT 'client'
    CHECK (audience IN ('client', 'provider', 'staff', 'partner')),
  channel text NOT NULL
    CHECK (channel IN ('portal', 'email', 'push', 'whatsapp', 'sms')),
  locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es', 'pt')),
  subject text NOT NULL,
  body text NOT NULL,
  action_label text,
  is_transactional boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, event_type, audience, channel, locale)
);

ALTER TABLE public.platform_message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view active platform message templates" ON public.platform_message_templates;
CREATE POLICY "Authenticated users view active platform message templates"
ON public.platform_message_templates FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

DROP TRIGGER IF EXISTS update_platform_message_templates_updated_at ON public.platform_message_templates;
CREATE TRIGGER update_platform_message_templates_updated_at
  BEFORE UPDATE ON public.platform_message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_workflow_updated_at();

CREATE INDEX IF NOT EXISTS idx_platform_message_templates_lookup
  ON public.platform_message_templates(app_key, event_type, audience, channel, locale)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_provider_comm_events_event_type
  ON public.provider_communication_events(provider_id, event_type, status, scheduled_at);

INSERT INTO public.platform_message_templates (
  app_key,
  event_type,
  audience,
  channel,
  locale,
  subject,
  body,
  action_label,
  is_transactional,
  metadata
)
SELECT
  app.app_key,
  event.event_type,
  event.audience,
  channel.channel,
  locale.locale,
  CASE locale.locale
    WHEN 'pt' THEN replace(event.subject_pt, '{{brand}}', app.brand_name)
    WHEN 'es' THEN replace(event.subject_es, '{{brand}}', app.brand_name)
    ELSE replace(event.subject_en, '{{brand}}', app.brand_name)
  END AS subject,
  CASE locale.locale
    WHEN 'pt' THEN replace(event.body_pt, '{{brand}}', app.brand_name)
    WHEN 'es' THEN replace(event.body_es, '{{brand}}', app.brand_name)
    ELSE replace(event.body_en, '{{brand}}', app.brand_name)
  END AS body,
  CASE locale.locale
    WHEN 'pt' THEN 'Abrir portal'
    WHEN 'es' THEN 'Abrir portal'
    ELSE 'Open portal'
  END AS action_label,
  event.is_transactional,
  jsonb_build_object('seeded', true, 'brand_domain', app.domain)
FROM (
  VALUES
    ('casa', 'Casa Baise', 'casabaise.com'),
    ('medical', 'Medical Baise', 'medicalbaise.com'),
    ('legal', 'Legal Baise', 'legalbaise.com')
) AS app(app_key, brand_name, domain)
CROSS JOIN (
  VALUES
    ('portal'),
    ('email'),
    ('push'),
    ('whatsapp'),
    ('sms')
) AS channel(channel)
CROSS JOIN (
  VALUES
    ('en'),
    ('es'),
    ('pt')
) AS locale(locale)
CROSS JOIN (
  VALUES
    (
      'client_welcome',
      'client',
      true,
      'Welcome to {{brand}}',
      'Bienvenido a {{brand}}',
      'Bem-vindo ao {{brand}}',
      'Your Baise account is ready. Use the portal to find trusted providers, manage requests, review invoices, and keep every receipt in one place.',
      'Tu cuenta de Baise esta lista. Usa el portal para encontrar proveedores confiables, gestionar solicitudes, revisar facturas y guardar cada recibo en un solo lugar.',
      'Sua conta Baise esta pronta. Use o portal para encontrar prestadores confiaveis, gerenciar solicitacoes, revisar faturas e manter cada recibo em um so lugar.'
    ),
    (
      'provider_welcome',
      'provider',
      true,
      'Your provider workspace is ready on {{brand}}',
      'Tu espacio de proveedor esta listo en {{brand}}',
      'Seu espaco de prestador esta pronto no {{brand}}',
      'Your provider workspace is ready. Manage requests, quotes, bookings, invoices, payments, signatures, campaigns, reviews, and client records from the portal.',
      'Tu espacio de proveedor esta listo. Gestiona solicitudes, presupuestos, reservas, facturas, pagos, firmas, campanas, reseñas y registros de clientes desde el portal.',
      'Seu espaco de prestador esta pronto. Gerencie solicitacoes, orcamentos, reservas, faturas, pagamentos, assinaturas, campanhas, avaliacoes e registros de clientes pelo portal.'
    ),
    (
      'service_provided',
      'client',
      true,
      'Service update from {{brand}}',
      'Actualizacion de servicio de {{brand}}',
      'Atualizacao de servico de {{brand}}',
      'A service update is ready in your portal. Review the completed work, notes, photos, receipts, and next steps.',
      'Hay una actualizacion de servicio en tu portal. Revisa el trabajo realizado, notas, fotos, recibos y proximos pasos.',
      'Uma atualizacao de servico esta pronta no seu portal. Revise o trabalho concluido, notas, fotos, recibos e proximos passos.'
    ),
    (
      'invoice_created',
      'client',
      true,
      'New invoice from {{brand}}',
      'Nueva factura de {{brand}}',
      'Nova fatura de {{brand}}',
      'A new invoice is available. Open your portal to review the amount, service details, due date, and payment options.',
      'Hay una nueva factura disponible. Abre tu portal para revisar el valor, detalles del servicio, fecha de vencimiento y opciones de pago.',
      'Uma nova fatura esta disponivel. Abra o portal para revisar valor, detalhes do servico, vencimento e formas de pagamento.'
    ),
    (
      'new_link',
      'client',
      true,
      'New secure link from {{brand}}',
      'Nuevo enlace seguro de {{brand}}',
      'Novo link seguro de {{brand}}',
      'A secure link was added to your portal. Sign in to view the details and keep the full record in one place.',
      'Se agrego un enlace seguro a tu portal. Inicia sesion para ver los detalles y mantener el historial completo en un solo lugar.',
      'Um link seguro foi adicionado ao seu portal. Entre para ver os detalhes e manter o historico completo em um so lugar.'
    ),
    (
      'job_accepted',
      'client',
      true,
      'Your job was accepted on {{brand}}',
      'Tu trabajo fue aceptado en {{brand}}',
      'Seu trabalho foi aceito no {{brand}}',
      'Your job has been accepted. Open the portal to view the provider, schedule, payment records, and project next steps.',
      'Tu trabajo fue aceptado. Abre el portal para ver el proveedor, agenda, pagos y proximos pasos del proyecto.',
      'Seu trabalho foi aceito. Abra o portal para ver o prestador, agenda, pagamentos e proximos passos do projeto.'
    ),
    (
      'request_received',
      'provider',
      true,
      'New service request on {{brand}}',
      'Nueva solicitud de servicio en {{brand}}',
      'Nova solicitacao de servico no {{brand}}',
      'A new request is waiting in your provider portal. Review the client details, scope, timeline, and response options.',
      'Hay una nueva solicitud en tu portal de proveedor. Revisa cliente, alcance, plazo y opciones de respuesta.',
      'Uma nova solicitacao esta no seu portal de prestador. Revise cliente, escopo, prazo e opcoes de resposta.'
    ),
    (
      'payment_received',
      'client',
      true,
      'Payment received by {{brand}}',
      'Pago recibido por {{brand}}',
      'Pagamento recebido pelo {{brand}}',
      'Your payment was recorded. Your receipt, invoice, and full transaction history are available in the portal.',
      'Tu pago fue registrado. Tu recibo, factura e historial completo estan disponibles en el portal.',
      'Seu pagamento foi registrado. Recibo, fatura e historico completo estao disponiveis no portal.'
    ),
    (
      'signature_requested',
      'client',
      true,
      'Signature requested on {{brand}}',
      'Firma solicitada en {{brand}}',
      'Assinatura solicitada no {{brand}}',
      'A signature is needed before the next step. Open the portal to review the document, photos, and service details.',
      'Se necesita una firma antes del proximo paso. Abre el portal para revisar documento, fotos y detalles del servicio.',
      'Uma assinatura e necessaria antes do proximo passo. Abra o portal para revisar documento, fotos e detalhes do servico.'
    ),
    (
      'referral_invite',
      'client',
      false,
      'Your {{brand}} referral link is ready',
      'Tu enlace de referido de {{brand}} esta listo',
      'Seu link de indicacao do {{brand}} esta pronto',
      'Share your referral link with someone who needs a trusted provider. They can join and book directly through Baise.',
      'Comparte tu enlace de referido con alguien que necesita un proveedor confiable. Puede entrar y reservar por Baise.',
      'Compartilhe seu link de indicacao com alguem que precisa de um prestador confiavel. A pessoa pode entrar e reservar pelo Baise.'
    )
) AS event(
  event_type,
  audience,
  is_transactional,
  subject_en,
  subject_es,
  subject_pt,
  body_en,
  body_es,
  body_pt
)
ON CONFLICT (app_key, event_type, audience, channel, locale)
DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  action_label = EXCLUDED.action_label,
  is_transactional = EXCLUDED.is_transactional,
  is_active = true,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.queue_provider_update_notifications(
  target_provider_id uuid,
  target_user_id uuid,
  actor_id uuid,
  event_key text,
  event_subject text DEFAULT NULL,
  event_message text DEFAULT NULL,
  action_path text DEFAULT '/customer-dashboard',
  resource_kind text DEFAULT NULL,
  resource_uuid uuid DEFAULT NULL,
  event_metadata jsonb DEFAULT '{}'::jsonb,
  target_email text DEFAULT NULL,
  target_phone text DEFAULT NULL,
  target_app_key text DEFAULT 'casa',
  target_locale text DEFAULT 'en',
  target_audience text DEFAULT 'client'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  queued_count integer := 0;
  selected_template_id uuid;
  selected_template_subject text;
  selected_template_body text;
  selected_template_is_transactional boolean;
  target_channel text;
  target_purpose text;
  normalized_app text := COALESCE(NULLIF(target_app_key, ''), 'casa');
  normalized_locale text := COALESCE(NULLIF(target_locale, ''), 'en');
  normalized_audience text := COALESCE(NULLIF(target_audience, ''), 'client');
  normalized_event text := COALESCE(NULLIF(event_key, ''), 'custom');
  metadata_payload jsonb := COALESCE(event_metadata, '{}'::jsonb);
BEGIN
  IF target_provider_id IS NULL THEN
    RAISE EXCEPTION 'target_provider_id is required';
  END IF;

  IF target_user_id IS NULL AND (target_email IS NULL OR length(trim(target_email)) = 0) THEN
    RAISE EXCEPTION 'target_user_id or target_email is required';
  END IF;

  IF normalized_app NOT IN ('casa', 'medical', 'legal') THEN
    normalized_app := 'casa';
  END IF;

  IF normalized_locale NOT IN ('en', 'es', 'pt') THEN
    normalized_locale := 'en';
  END IF;

  IF normalized_audience NOT IN ('client', 'provider', 'staff', 'partner') THEN
    normalized_audience := 'client';
  END IF;

  target_purpose := CASE
    WHEN normalized_event IN ('invoice_created', 'payment_received') THEN 'payment_request'
    WHEN normalized_event = 'referral_invite' THEN 'campaign'
    WHEN normalized_event = 'job_accepted' THEN 'confirmation'
    ELSE 'notification'
  END;

  FOREACH target_channel IN ARRAY (
    CASE
    WHEN target_user_id IS NULL THEN ARRAY['email', 'whatsapp', 'sms']
    ELSE ARRAY['portal', 'email', 'push', 'whatsapp', 'sms']
    END
  )
  LOOP
    selected_template_id := NULL;
    selected_template_subject := NULL;
    selected_template_body := NULL;
    selected_template_is_transactional := NULL;

    SELECT id, subject, body, is_transactional
    INTO selected_template_id, selected_template_subject, selected_template_body, selected_template_is_transactional
    FROM public.platform_message_templates
    WHERE app_key = normalized_app
      AND event_type = normalized_event
      AND audience = normalized_audience
      AND channel = target_channel
      AND locale = normalized_locale
      AND is_active = true
    LIMIT 1;

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
      target_user_id,
      COALESCE(actor_id, target_user_id),
      target_purpose,
      target_channel,
      COALESCE(event_subject, selected_template_subject, 'Baise update'),
      COALESCE(event_message, selected_template_body, 'Open your Baise portal for the latest update.'),
      now(),
      'queued',
      normalized_app,
      normalized_event,
      CASE WHEN selected_template_id IS NULL THEN NULL ELSE selected_template_id::text END,
      normalized_locale,
      COALESCE(selected_template_is_transactional, true),
      CASE WHEN COALESCE(selected_template_is_transactional, true) THEN 'transactional' ELSE 'marketing' END,
      NULLIF(lower(trim(COALESCE(target_email, ''))), ''),
      NULLIF(trim(COALESCE(target_phone, '')), ''),
      metadata_payload ||
        jsonb_build_object(
          'action_url', COALESCE(action_path, '/customer-dashboard'),
          'resource_type', resource_kind,
          'resource_id', resource_uuid,
          'audience', normalized_audience,
          'fanout_source', 'queue_provider_update_notifications'
        )
    );

    queued_count := queued_count + 1;
  END LOOP;

  PERFORM public.log_provider_audit_event(
    target_provider_id,
    actor_id,
    COALESCE((metadata_payload ->> 'actor_role'), 'system'),
    'communication_notifications.queued',
    COALESCE(resource_kind, 'provider_communication_event'),
    resource_uuid,
    'info',
    metadata_payload ||
      jsonb_build_object(
        'event_type', normalized_event,
        'audience', normalized_audience,
        'channels', ARRAY['portal', 'email', 'push', 'whatsapp', 'sms'],
        'queued_count', queued_count
      )
  );

  RETURN queued_count;
END;
$$;

REVOKE ALL ON FUNCTION public.queue_provider_update_notifications(uuid, uuid, uuid, text, text, text, text, text, uuid, jsonb, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_provider_update_notifications(uuid, uuid, uuid, text, text, text, text, text, uuid, jsonb, text, text, text, text, text) TO authenticated, service_role;
