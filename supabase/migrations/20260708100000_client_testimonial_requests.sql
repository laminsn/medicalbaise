-- Client testimonial request and reward tracking.
-- Supports post-service and monthly testimonial requests with one Google review
-- credit and one video testimonial credit per client per Baise app.

CREATE TABLE IF NOT EXISTS public.client_testimonial_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  job_id uuid REFERENCES public.jobs_posted(id) ON DELETE SET NULL,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  recipient_email text,
  recipient_name text,
  request_source text NOT NULL DEFAULT 'service_completion'
    CHECK (request_source IN ('service_completion', 'monthly_reminder', 'manual')),
  google_review_url text,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('draft', 'queued', 'sent', 'opened', 'completed', 'cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  monthly_reminder_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_testimonial_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.client_testimonial_requests(id) ON DELETE SET NULL,
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  customer_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs_posted(id) ON DELETE SET NULL,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  reward_type text NOT NULL
    CHECK (reward_type IN ('google_review', 'video_testimonial')),
  amount_brl numeric(10,2) NOT NULL
    CHECK (amount_brl IN (50, 100)),
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'approved', 'credited', 'rejected', 'cancelled')),
  approved_by uuid,
  approved_at timestamptz,
  credited_at timestamptz,
  rejection_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_testimonial_request_job_once
  ON public.client_testimonial_requests(app_key, customer_id, provider_id, job_id)
  WHERE job_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_testimonial_reward_once_per_client
  ON public.client_testimonial_rewards(app_key, customer_id, reward_type);

CREATE INDEX IF NOT EXISTS idx_client_testimonial_requests_provider
  ON public.client_testimonial_requests(provider_id, status, last_sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_testimonial_rewards_provider
  ON public.client_testimonial_rewards(provider_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_testimonial_rewards_customer
  ON public.client_testimonial_rewards(customer_id, app_key, reward_type);

DROP TRIGGER IF EXISTS update_client_testimonial_requests_updated_at ON public.client_testimonial_requests;
CREATE TRIGGER update_client_testimonial_requests_updated_at
  BEFORE UPDATE ON public.client_testimonial_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_testimonial_rewards_updated_at ON public.client_testimonial_rewards;
CREATE TRIGGER update_client_testimonial_rewards_updated_at
  BEFORE UPDATE ON public.client_testimonial_rewards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_testimonial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_testimonial_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers view own testimonial requests" ON public.client_testimonial_requests;
CREATE POLICY "Customers view own testimonial requests"
ON public.client_testimonial_requests FOR SELECT
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Providers view their testimonial requests" ON public.client_testimonial_requests;
CREATE POLICY "Providers view their testimonial requests"
ON public.client_testimonial_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.providers p
    WHERE p.id = client_testimonial_requests.provider_id
      AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Customers create own testimonial requests" ON public.client_testimonial_requests;
CREATE POLICY "Customers create own testimonial requests"
ON public.client_testimonial_requests FOR INSERT
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Providers create testimonial requests" ON public.client_testimonial_requests;
CREATE POLICY "Providers create testimonial requests"
ON public.client_testimonial_requests FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.providers p
    WHERE p.id = client_testimonial_requests.provider_id
      AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Customers view own testimonial rewards" ON public.client_testimonial_rewards;
CREATE POLICY "Customers view own testimonial rewards"
ON public.client_testimonial_rewards FOR SELECT
USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Providers view their testimonial rewards" ON public.client_testimonial_rewards;
CREATE POLICY "Providers view their testimonial rewards"
ON public.client_testimonial_rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.providers p
    WHERE p.id = client_testimonial_rewards.provider_id
      AND p.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Customers create own pending testimonial rewards" ON public.client_testimonial_rewards;
CREATE POLICY "Customers create own pending testimonial rewards"
ON public.client_testimonial_rewards FOR INSERT
WITH CHECK (
  customer_id = auth.uid()
  AND status = 'pending_review'
  AND (
    (reward_type = 'google_review' AND amount_brl = 50)
    OR (reward_type = 'video_testimonial' AND amount_brl = 100)
  )
);

DROP POLICY IF EXISTS "Admins manage testimonial rewards" ON public.client_testimonial_rewards;
CREATE POLICY "Admins manage testimonial rewards"
ON public.client_testimonial_rewards FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.approve_client_testimonial_reward(target_reward_id uuid)
RETURNS public.client_testimonial_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reward_record public.client_testimonial_rewards;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve testimonial rewards';
  END IF;

  SELECT *
  INTO reward_record
  FROM public.client_testimonial_rewards
  WHERE id = target_reward_id
  FOR UPDATE;

  IF reward_record.id IS NULL THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  IF reward_record.status = 'credited' THEN
    RETURN reward_record;
  END IF;

  UPDATE public.client_testimonial_rewards
  SET status = 'credited',
      approved_by = auth.uid(),
      approved_at = COALESCE(approved_at, now()),
      credited_at = now(),
      updated_at = now()
  WHERE id = target_reward_id
  RETURNING * INTO reward_record;

  UPDATE public.profiles
  SET credits_balance = COALESCE(credits_balance, 0) + reward_record.amount_brl
  WHERE user_id = reward_record.customer_id;

  RETURN reward_record;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_client_testimonial_reward(uuid) TO authenticated;

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
  'testimonial_request',
  'client',
  channel.channel,
  locale.locale,
  CASE locale.locale
    WHEN 'pt' THEN replace('Compartilhe sua experiencia no {{brand}}', '{{brand}}', app.brand_name)
    WHEN 'es' THEN replace('Comparte tu experiencia en {{brand}}', '{{brand}}', app.brand_name)
    ELSE replace('Share your experience on {{brand}}', '{{brand}}', app.brand_name)
  END,
  CASE locale.locale
    WHEN 'pt' THEN 'Seu servico foi concluido. Envie uma avaliacao no Google ou um video depoimento e ganhe ate R$150 em credito para servicos futuros apos aprovacao.'
    WHEN 'es' THEN 'Tu servicio fue completado. Envia una reseña de Google o un video testimonial y gana hasta R$150 en credito para servicios futuros despues de la aprobacion.'
    ELSE 'Your service was completed. Submit a Google review or video testimonial and earn up to R$150 in future service credit after approval.'
  END,
  CASE locale.locale
    WHEN 'pt' THEN 'Enviar depoimento'
    WHEN 'es' THEN 'Enviar testimonio'
    ELSE 'Submit testimonial'
  END,
  true,
  jsonb_build_object('seeded', true, 'credit_total_brl', 150, 'google_credit_brl', 50, 'video_credit_brl', 100)
FROM (
  VALUES
    ('casa', 'Casa Baise'),
    ('medical', 'Medical Baise'),
    ('legal', 'Legal Baise')
) AS app(app_key, brand_name)
CROSS JOIN (
  VALUES ('portal'), ('email'), ('push'), ('whatsapp'), ('sms')
) AS channel(channel)
CROSS JOIN (
  VALUES ('en'), ('es'), ('pt')
) AS locale(locale)
ON CONFLICT (app_key, event_type, audience, channel, locale)
DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  action_label = EXCLUDED.action_label,
  is_transactional = true,
  is_active = true,
  metadata = public.platform_message_templates.metadata || EXCLUDED.metadata,
  updated_at = now();
