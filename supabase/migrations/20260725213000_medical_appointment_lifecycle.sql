-- Medical appointment lifecycle automation.
-- External delivery stays disabled until the patient explicitly consents.
-- Queue rows contain identifiers and lifecycle state only, never clinical notes.

BEGIN;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS appointment_timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS confirmation_responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_confirmation_status_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_confirmation_status_check
  CHECK (confirmation_status IN ('pending', 'confirmed', 'declined', 'reschedule_requested'));

CREATE INDEX IF NOT EXISTS idx_appointments_provider_schedule
  ON public.appointments(provider_id, preferred_datetime)
  WHERE provider_id IS NOT NULL AND status = 'scheduled';

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_provider_slot_unique
  ON public.appointments(provider_id, preferred_datetime)
  WHERE provider_id IS NOT NULL
    AND preferred_datetime IS NOT NULL
    AND status = 'scheduled';

CREATE OR REPLACE FUNCTION public.medical_timezone_is_valid(value text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_timezone_names
    WHERE name = value
  );
$$;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_timezone_check;
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_timezone_check
  CHECK (public.medical_timezone_is_valid(appointment_timezone));

CREATE TABLE IF NOT EXISTS public.medical_appointment_provider_preferences (
  provider_id uuid PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  reminder_offsets_minutes integer[] NOT NULL DEFAULT ARRAY[1440, 60],
  confirmation_enabled boolean NOT NULL DEFAULT true,
  follow_up_enabled boolean NOT NULL DEFAULT true,
  follow_up_delay_minutes integer NOT NULL DEFAULT 1440
    CHECK (follow_up_delay_minutes BETWEEN 15 AND 43200),
  thank_you_enabled boolean NOT NULL DEFAULT true,
  thank_you_delay_minutes integer NOT NULL DEFAULT 120
    CHECK (thank_you_delay_minutes BETWEEN 15 AND 10080),
  review_request_enabled boolean NOT NULL DEFAULT true,
  review_request_delay_minutes integer NOT NULL DEFAULT 2880
    CHECK (review_request_delay_minutes BETWEEN 60 AND 43200),
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (public.medical_timezone_is_valid(timezone))
);

CREATE TABLE IF NOT EXISTS public.medical_appointment_patient_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  communications_enabled boolean NOT NULL DEFAULT false,
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  reminders_enabled boolean NOT NULL DEFAULT true,
  follow_up_enabled boolean NOT NULL DEFAULT true,
  thank_you_enabled boolean NOT NULL DEFAULT true,
  review_requests_enabled boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  consented_at timestamptz,
  revoked_at timestamptz,
  consent_version text,
  locale text NOT NULL DEFAULT 'pt' CHECK (locale IN ('en', 'pt', 'es')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (public.medical_timezone_is_valid(timezone)),
  CHECK (
    (communications_enabled = false)
    OR (consented_at IS NOT NULL AND consent_version IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.medical_appointment_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  event_type text NOT NULL
    CHECK (event_type IN (
      'confirmation_request',
      'reminder',
      'follow_up',
      'thank_you',
      'review_request'
    )),
  scheduled_for timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'retry', 'sent', 'cancelled', 'failed')),
  dedupe_key text NOT NULL UNIQUE,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 10),
  next_attempt_at timestamptz,
  claim_token uuid,
  claimed_at timestamptz,
  sent_at timestamptz,
  callback_expires_at timestamptz,
  response_action text
    CHECK (response_action IS NULL OR response_action IN ('confirm', 'decline', 'reschedule')),
  responded_at timestamptz,
  provider_message_id text,
  last_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_appointment_events_due
  ON public.medical_appointment_lifecycle_events(status, scheduled_for, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_medical_appointment_events_appointment
  ON public.medical_appointment_lifecycle_events(appointment_id, event_type);

CREATE TABLE IF NOT EXISTS public.medical_appointment_lifecycle_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.medical_appointment_lifecycle_events(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email')),
  status text NOT NULL CHECK (status IN ('processing', 'sent', 'skipped', 'failed')),
  provider_message_id text,
  error_code text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (event_id, channel)
);

ALTER TABLE public.medical_appointment_provider_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_appointment_patient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_appointment_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_appointment_lifecycle_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.medical_appointment_provider_preferences FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.medical_appointment_patient_preferences FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.medical_appointment_lifecycle_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.medical_appointment_lifecycle_deliveries FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.medical_appointment_provider_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.medical_appointment_patient_preferences TO authenticated;
GRANT ALL ON TABLE public.medical_appointment_lifecycle_events TO service_role;
GRANT ALL ON TABLE public.medical_appointment_lifecycle_deliveries TO service_role;

DROP POLICY IF EXISTS "Providers manage own medical appointment preferences"
  ON public.medical_appointment_provider_preferences;
CREATE POLICY "Providers manage own medical appointment preferences"
ON public.medical_appointment_provider_preferences
FOR ALL
TO authenticated
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Patients manage own appointment communication preferences"
  ON public.medical_appointment_patient_preferences;
CREATE POLICY "Patients manage own appointment communication preferences"
ON public.medical_appointment_patient_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Assigned providers view private appointments"
  ON public.appointments;
CREATE POLICY "Assigned providers view private appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Assigned providers update private appointments"
  ON public.appointments;
CREATE POLICY "Assigned providers update private appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  provider_id IN (
    SELECT id FROM public.providers WHERE user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.normalize_medical_appointment_provider_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  normalized integer[];
BEGIN
  SELECT array_agg(value ORDER BY value DESC)
  INTO normalized
  FROM (
    SELECT DISTINCT value
    FROM unnest(COALESCE(NEW.reminder_offsets_minutes, ARRAY[1440, 60])) AS item(value)
    WHERE value BETWEEN 15 AND 10080
    LIMIT 6
  ) AS values_in_range;

  IF normalized IS NULL OR cardinality(normalized) = 0 THEN
    RAISE EXCEPTION 'At least one reminder offset between 15 minutes and 7 days is required';
  END IF;

  IF cardinality(normalized) <> cardinality(NEW.reminder_offsets_minutes) THEN
    RAISE EXCEPTION 'Reminder offsets must be unique values between 15 minutes and 7 days';
  END IF;

  NEW.reminder_offsets_minutes := normalized;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_medical_appointment_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.communications_enabled
     AND (TG_OP = 'INSERT' OR OLD.communications_enabled IS DISTINCT FROM true) THEN
    NEW.consented_at := now();
    NEW.revoked_at := NULL;
    NEW.consent_version := COALESCE(NULLIF(NEW.consent_version, ''), 'medical-appointments-v1');
  ELSIF NOT NEW.communications_enabled
        AND (TG_OP = 'INSERT' OR OLD.communications_enabled IS DISTINCT FROM false) THEN
    NEW.consented_at := NULL;
    NEW.revoked_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_medical_appointment_provider_preferences
  ON public.medical_appointment_provider_preferences;
CREATE TRIGGER normalize_medical_appointment_provider_preferences
BEFORE INSERT OR UPDATE ON public.medical_appointment_provider_preferences
FOR EACH ROW
EXECUTE FUNCTION public.normalize_medical_appointment_provider_preferences();

DROP TRIGGER IF EXISTS record_medical_appointment_consent
  ON public.medical_appointment_patient_preferences;
CREATE TRIGGER record_medical_appointment_consent
BEFORE INSERT OR UPDATE ON public.medical_appointment_patient_preferences
FOR EACH ROW
EXECUTE FUNCTION public.record_medical_appointment_consent();

CREATE OR REPLACE FUNCTION public.enqueue_medical_appointment_event(
  target_appointment_id uuid,
  target_patient_id uuid,
  target_provider_id uuid,
  target_event_type text,
  target_scheduled_for timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_dedupe_key text;
BEGIN
  IF target_scheduled_for < now() - interval '5 minutes' THEN
    RETURN;
  END IF;

  event_dedupe_key := concat_ws(
    ':',
    target_appointment_id::text,
    target_event_type,
    extract(epoch FROM target_scheduled_for)::bigint::text
  );

  INSERT INTO public.medical_appointment_lifecycle_events (
    appointment_id,
    patient_id,
    provider_id,
    event_type,
    scheduled_for,
    callback_expires_at,
    dedupe_key
  )
  VALUES (
    target_appointment_id,
    target_patient_id,
    target_provider_id,
    target_event_type,
    target_scheduled_for,
    CASE
      WHEN target_event_type = 'confirmation_request'
      THEN GREATEST(target_scheduled_for, now() + interval '24 hours')
      ELSE NULL
    END,
    event_dedupe_key
  )
  ON CONFLICT (dedupe_key) DO UPDATE
  SET
    status = CASE
      WHEN medical_appointment_lifecycle_events.status = 'sent' THEN 'sent'
      ELSE 'queued'
    END,
    next_attempt_at = NULL,
    claim_token = NULL,
    claimed_at = NULL,
    last_error_code = NULL,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_medical_appointment_lifecycle(
  target_appointment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_row public.appointments%ROWTYPE;
  provider_row public.medical_appointment_provider_preferences%ROWTYPE;
  patient_row public.medical_appointment_patient_preferences%ROWTYPE;
  reminder_offset integer;
  completion_time timestamptz;
BEGIN
  SELECT * INTO appointment_row
  FROM public.appointments
  WHERE id = target_appointment_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.medical_appointment_lifecycle_events
  SET status = 'cancelled',
      claim_token = NULL,
      claimed_at = NULL,
      updated_at = now()
  WHERE appointment_id = target_appointment_id
    AND status IN ('queued', 'processing', 'retry');

  IF appointment_row.user_id IS NULL OR appointment_row.provider_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO patient_row
  FROM public.medical_appointment_patient_preferences
  WHERE user_id = appointment_row.user_id;

  IF NOT FOUND
     OR NOT patient_row.communications_enabled
     OR patient_row.consented_at IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO provider_row
  FROM public.medical_appointment_provider_preferences
  WHERE provider_id = appointment_row.provider_id;

  IF NOT FOUND THEN
    provider_row.provider_id := appointment_row.provider_id;
    provider_row.enabled := true;
    provider_row.reminder_offsets_minutes := ARRAY[1440, 60];
    provider_row.confirmation_enabled := true;
    provider_row.follow_up_enabled := true;
    provider_row.follow_up_delay_minutes := 1440;
    provider_row.thank_you_enabled := true;
    provider_row.thank_you_delay_minutes := 120;
    provider_row.review_request_enabled := true;
    provider_row.review_request_delay_minutes := 2880;
  END IF;

  IF NOT provider_row.enabled THEN
    RETURN;
  END IF;

  IF appointment_row.status = 'scheduled'
     AND appointment_row.preferred_datetime IS NOT NULL
     AND appointment_row.preferred_datetime > now() THEN
    IF provider_row.confirmation_enabled THEN
      PERFORM public.enqueue_medical_appointment_event(
        appointment_row.id,
        appointment_row.user_id,
        appointment_row.provider_id,
        'confirmation_request',
        now()
      );
    END IF;

    IF patient_row.reminders_enabled THEN
      FOREACH reminder_offset IN ARRAY provider_row.reminder_offsets_minutes
      LOOP
        PERFORM public.enqueue_medical_appointment_event(
          appointment_row.id,
          appointment_row.user_id,
          appointment_row.provider_id,
          'reminder',
          appointment_row.preferred_datetime - make_interval(mins => reminder_offset)
        );
      END LOOP;
    END IF;
  ELSIF appointment_row.status = 'completed' THEN
    completion_time := COALESCE(appointment_row.completed_at, now());

    IF provider_row.thank_you_enabled AND patient_row.thank_you_enabled THEN
      PERFORM public.enqueue_medical_appointment_event(
        appointment_row.id,
        appointment_row.user_id,
        appointment_row.provider_id,
        'thank_you',
        completion_time + make_interval(mins => provider_row.thank_you_delay_minutes)
      );
    END IF;

    IF provider_row.follow_up_enabled AND patient_row.follow_up_enabled THEN
      PERFORM public.enqueue_medical_appointment_event(
        appointment_row.id,
        appointment_row.user_id,
        appointment_row.provider_id,
        'follow_up',
        completion_time + make_interval(mins => provider_row.follow_up_delay_minutes)
      );
    END IF;

    IF provider_row.review_request_enabled AND patient_row.review_requests_enabled THEN
      PERFORM public.enqueue_medical_appointment_event(
        appointment_row.id,
        appointment_row.user_id,
        appointment_row.provider_id,
        'review_request',
        completion_time + make_interval(mins => provider_row.review_request_delay_minutes)
      );
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_medical_appointment_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed')
     AND NEW.completed_at IS NULL THEN
    NEW.completed_at := now();
  ELSIF NEW.status IS DISTINCT FROM 'completed' THEN
    NEW.completed_at := NULL;
  END IF;

  IF TG_OP = 'INSERT'
     OR NEW.preferred_datetime IS DISTINCT FROM OLD.preferred_datetime THEN
    NEW.confirmation_status := 'pending';
    NEW.confirmation_responded_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_medical_appointment_lifecycle_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.refresh_medical_appointment_lifecycle(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_medical_appointment_lifecycle ON public.appointments;
CREATE TRIGGER prepare_medical_appointment_lifecycle
BEFORE INSERT OR UPDATE OF preferred_datetime, status, provider_id
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.prepare_medical_appointment_lifecycle();

DROP TRIGGER IF EXISTS refresh_medical_appointment_lifecycle ON public.appointments;
CREATE TRIGGER refresh_medical_appointment_lifecycle
AFTER INSERT OR UPDATE OF preferred_datetime, status, provider_id, user_id
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.refresh_medical_appointment_lifecycle_trigger();

CREATE OR REPLACE FUNCTION public.refresh_patient_medical_appointment_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_id_value uuid;
BEGIN
  FOR appointment_id_value IN
    SELECT id
    FROM public.appointments
    WHERE user_id = NEW.user_id
      AND status IN ('scheduled', 'completed')
  LOOP
    PERFORM public.refresh_medical_appointment_lifecycle(appointment_id_value);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_provider_medical_appointment_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_id_value uuid;
BEGIN
  FOR appointment_id_value IN
    SELECT id
    FROM public.appointments
    WHERE provider_id = NEW.provider_id
      AND status IN ('scheduled', 'completed')
  LOOP
    PERFORM public.refresh_medical_appointment_lifecycle(appointment_id_value);
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_patient_medical_appointment_lifecycle
  ON public.medical_appointment_patient_preferences;
CREATE TRIGGER refresh_patient_medical_appointment_lifecycle
AFTER INSERT OR UPDATE ON public.medical_appointment_patient_preferences
FOR EACH ROW
EXECUTE FUNCTION public.refresh_patient_medical_appointment_lifecycle();

DROP TRIGGER IF EXISTS refresh_provider_medical_appointment_lifecycle
  ON public.medical_appointment_provider_preferences;
CREATE TRIGGER refresh_provider_medical_appointment_lifecycle
AFTER INSERT OR UPDATE ON public.medical_appointment_provider_preferences
FOR EACH ROW
EXECUTE FUNCTION public.refresh_provider_medical_appointment_lifecycle();

CREATE OR REPLACE FUNCTION public.claim_due_medical_appointment_events(
  requested_limit integer,
  worker_token uuid
)
RETURNS TABLE (
  event_id uuid,
  appointment_id uuid,
  patient_id uuid,
  provider_id uuid,
  event_type text,
  scheduled_for timestamptz,
  callback_expires_at timestamptz,
  attempt_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;

  IF worker_token IS NULL THEN
    RAISE EXCEPTION 'worker token required';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT event.id
    FROM public.medical_appointment_lifecycle_events AS event
    WHERE (
      event.status IN ('queued', 'retry')
      AND event.scheduled_for <= now()
      AND (event.next_attempt_at IS NULL OR event.next_attempt_at <= now())
    ) OR (
      event.status = 'processing'
      AND event.claimed_at < now() - interval '15 minutes'
    )
    ORDER BY event.scheduled_for
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(requested_limit, 25), 1), 100)
  )
  UPDATE public.medical_appointment_lifecycle_events AS event
  SET
    status = 'processing',
    claim_token = worker_token,
    claimed_at = now(),
    attempt_count = event.attempt_count + 1,
    updated_at = now()
  FROM candidates
  WHERE event.id = candidates.id
  RETURNING
    event.id,
    event.appointment_id,
    event.patient_id,
    event.provider_id,
    event.event_type,
    event.scheduled_for,
    event.callback_expires_at,
    event.attempt_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_medical_appointment_event(
  target_event_id uuid,
  worker_token uuid,
  outcome text,
  safe_error_code text DEFAULT NULL,
  external_message_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;

  IF outcome NOT IN ('sent', 'retry', 'cancelled', 'failed') THEN
    RAISE EXCEPTION 'invalid lifecycle outcome';
  END IF;

  UPDATE public.medical_appointment_lifecycle_events
  SET
    status = outcome,
    sent_at = CASE WHEN outcome = 'sent' THEN now() ELSE sent_at END,
    next_attempt_at = CASE
      WHEN outcome = 'retry'
      THEN now() + make_interval(mins => LEAST(360, GREATEST(15, attempt_count * 15)))
      ELSE NULL
    END,
    claim_token = NULL,
    claimed_at = NULL,
    provider_message_id = CASE
      WHEN outcome = 'sent' THEN left(external_message_id, 200)
      ELSE provider_message_id
    END,
    last_error_code = CASE
      WHEN outcome IN ('retry', 'failed') THEN left(safe_error_code, 80)
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = target_event_id
    AND status = 'processing'
    AND claim_token = worker_token;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.deliver_medical_appointment_in_app(
  target_event_id uuid,
  worker_token uuid,
  notification_subject text,
  notification_body text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_row public.medical_appointment_lifecycle_events%ROWTYPE;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;

  IF length(notification_subject) > 160 OR length(notification_body) > 600 THEN
    RAISE EXCEPTION 'notification copy exceeds minimum-necessary bounds';
  END IF;

  SELECT * INTO event_row
  FROM public.medical_appointment_lifecycle_events
  WHERE id = target_event_id
    AND status = 'processing'
    AND claim_token = worker_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.medical_appointment_lifecycle_deliveries
    WHERE event_id = target_event_id
      AND channel = 'in_app'
      AND status = 'sent'
  ) THEN
    RETURN true;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    priority,
    action_url,
    metadata
  )
  VALUES (
    event_row.patient_id,
    notification_subject,
    notification_body,
    'appointment',
    'normal',
    '/profile?tab=appointments',
    jsonb_build_object(
      'medical_appointment_lifecycle_event_id', event_row.id,
      'event_type', event_row.event_type
    )
  );

  INSERT INTO public.medical_appointment_lifecycle_deliveries (
    event_id,
    channel,
    status,
    completed_at
  )
  VALUES (
    target_event_id,
    'in_app',
    'sent',
    now()
  )
  ON CONFLICT (event_id, channel) DO UPDATE
  SET
    status = 'sent',
    error_code = NULL,
    completed_at = now();

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_medical_appointment_confirmation(
  target_event_id uuid,
  requested_action text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_row public.medical_appointment_lifecycle_events%ROWTYPE;
  next_confirmation_status text;
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'service role required';
  END IF;

  IF requested_action NOT IN ('confirm', 'decline', 'reschedule') THEN
    RAISE EXCEPTION 'invalid response';
  END IF;

  SELECT * INTO event_row
  FROM public.medical_appointment_lifecycle_events
  WHERE id = target_event_id
    AND event_type = 'confirmation_request'
  FOR UPDATE;

  IF NOT FOUND
     OR event_row.callback_expires_at IS NULL
     OR event_row.callback_expires_at < now() THEN
    RAISE EXCEPTION 'invalid or expired response';
  END IF;

  IF event_row.response_action IS NOT NULL THEN
    IF event_row.response_action = requested_action THEN
      RETURN event_row.response_action;
    END IF;
    RAISE EXCEPTION 'response already recorded';
  END IF;

  next_confirmation_status := CASE requested_action
    WHEN 'confirm' THEN 'confirmed'
    WHEN 'decline' THEN 'declined'
    ELSE 'reschedule_requested'
  END;

  UPDATE public.appointments
  SET
    confirmation_status = next_confirmation_status,
    confirmation_responded_at = now(),
    status = CASE WHEN requested_action = 'decline' THEN 'cancelled' ELSE status END,
    updated_at = now()
  WHERE id = event_row.appointment_id
    AND user_id = event_row.patient_id
    AND provider_id = event_row.provider_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'appointment response target is unavailable';
  END IF;

  UPDATE public.medical_appointment_lifecycle_events
  SET
    response_action = requested_action,
    responded_at = now(),
    updated_at = now()
  WHERE id = target_event_id;

  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    event_row.patient_id,
    'appointment_confirmation_response',
    'medical_appointment_lifecycle_event',
    event_row.id,
    jsonb_build_object('response', requested_action)
  );

  RETURN requested_action;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_medical_appointment_event(uuid, uuid, uuid, text, timestamptz)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refresh_medical_appointment_lifecycle(uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_due_medical_appointment_events(integer, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_medical_appointment_event(uuid, uuid, text, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deliver_medical_appointment_in_app(uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.respond_to_medical_appointment_confirmation(uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_due_medical_appointment_events(integer, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_medical_appointment_event(uuid, uuid, text, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.deliver_medical_appointment_in_app(uuid, uuid, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.respond_to_medical_appointment_confirmation(uuid, text)
  TO service_role;

COMMENT ON TABLE public.medical_appointment_lifecycle_events IS
  'Private Medical Baise lifecycle queue. Contains no clinical notes, diagnosis, treatment, insurance, or free-form notification copy.';
COMMENT ON TABLE public.medical_appointment_lifecycle_deliveries IS
  'Idempotency ledger for minimum-necessary appointment notification delivery.';

COMMIT;
