-- Medical Baise review requests must be voluntary and never tied to credits.
-- This blocks new Medical reward rows and prevents legacy rows from being
-- approved or credited while preserving cancellation/rejection cleanup.

BEGIN;

CREATE OR REPLACE FUNCTION public.reject_medical_testimonial_incentive()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.app_key = 'medical'
     AND (TG_OP = 'INSERT' OR NEW.status IN ('approved', 'credited')) THEN
    RAISE EXCEPTION 'Medical Baise testimonial incentives are disabled';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reject_medical_testimonial_incentive
  ON public.client_testimonial_rewards;

CREATE TRIGGER reject_medical_testimonial_incentive
BEFORE INSERT OR UPDATE ON public.client_testimonial_rewards
FOR EACH ROW
EXECUTE FUNCTION public.reject_medical_testimonial_incentive();

UPDATE public.platform_message_templates
SET
  subject = CASE locale
    WHEN 'pt' THEN 'Compartilhe sua experiência na Medical Baise'
    WHEN 'es' THEN 'Comparte tu experiencia en Medical Baise'
    ELSE 'Share your experience on Medical Baise'
  END,
  body = CASE locale
    WHEN 'pt' THEN 'Seu atendimento foi concluído. Se quiser, compartilhe uma avaliação honesta. Não inclua sintomas, diagnósticos, tratamentos, dados de seguro ou detalhes da consulta em uma avaliação pública.'
    WHEN 'es' THEN 'Tu atención fue completada. Si deseas, comparte una reseña honesta. No incluyas síntomas, diagnósticos, tratamientos, datos del seguro ni detalles de la cita en una reseña pública.'
    ELSE 'Your appointment is complete. If you choose, share honest feedback. Do not include symptoms, diagnoses, treatment, insurance information, or appointment details in a public review.'
  END,
  action_label = CASE locale
    WHEN 'pt' THEN 'Compartilhar feedback'
    WHEN 'es' THEN 'Compartir comentarios'
    ELSE 'Share feedback'
  END,
  is_transactional = false,
  metadata = (
    metadata
      - ARRAY['credit_total_brl', 'google_credit_brl', 'video_credit_brl']
  ) || jsonb_build_object(
    'incentive_disabled', true,
    'medical_privacy_notice', true
  ),
  updated_at = now()
WHERE app_key = 'medical'
  AND event_type = 'testimonial_request';

COMMENT ON TABLE public.client_testimonial_rewards IS
  'Legacy cross-app reward records. A scoped trigger blocks Medical Baise inserts, approvals, and credits without replacing other brands'' policies.';

COMMIT;
