-- Medical feedback is private by default. It is never a public review, never
-- incentivized, and never stored in the shared public testimonials bucket.

BEGIN;

CREATE TABLE IF NOT EXISTS public.medical_private_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'medical' CHECK (app_key = 'medical'),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  job_id uuid NULL REFERENCES public.jobs_posted(id) ON DELETE SET NULL,
  title text NULL CHECK (char_length(title) <= 120),
  feedback_text text NOT NULL CHECK (
    char_length(feedback_text) BETWEEN 1 AND 4000
  ),
  video_object_path text NULL CHECK (
    video_object_path IS NULL
    OR video_object_path LIKE customer_id::text || '/%'
  ),
  status text NOT NULL DEFAULT 'pending_moderation' CHECK (
    status IN ('pending_moderation', 'reviewed', 'withdrawn')
  ),
  publication_consent boolean NOT NULL DEFAULT false CHECK (
    publication_consent = false
  ),
  moderation_notes text NULL,
  reviewed_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz NULL,
  withdrawn_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_private_feedback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_medical_private_feedback_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.providers p
    WHERE p.id = NEW.provider_id
      AND p.platform = 'medical'::public.baise_platform
  ) THEN
    RAISE EXCEPTION 'Medical feedback requires a Medical Baise provider';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_medical_private_feedback_scope()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_medical_private_feedback_scope
  ON public.medical_private_feedback;
CREATE TRIGGER enforce_medical_private_feedback_scope
BEFORE INSERT OR UPDATE OF provider_id, app_key
ON public.medical_private_feedback
FOR EACH ROW
EXECUTE FUNCTION public.enforce_medical_private_feedback_scope();

DROP POLICY IF EXISTS "Medical clients create private feedback"
  ON public.medical_private_feedback;
CREATE POLICY "Medical clients create private feedback"
ON public.medical_private_feedback
FOR INSERT
TO authenticated
WITH CHECK (
  customer_id = auth.uid()
  AND app_key = 'medical'
  AND status = 'pending_moderation'
  AND publication_consent = false
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND withdrawn_at IS NULL
);

DROP POLICY IF EXISTS "Medical clients read own private feedback"
  ON public.medical_private_feedback;
CREATE POLICY "Medical clients read own private feedback"
ON public.medical_private_feedback
FOR SELECT
TO authenticated
USING (
  customer_id = auth.uid()
  OR public.is_admin_or_moderator()
);

DROP POLICY IF EXISTS "Medical clients withdraw own private feedback"
  ON public.medical_private_feedback;
CREATE POLICY "Medical clients withdraw own private feedback"
ON public.medical_private_feedback
FOR UPDATE
TO authenticated
USING (customer_id = auth.uid() AND status = 'pending_moderation')
WITH CHECK (
  customer_id = auth.uid()
  AND app_key = 'medical'
  AND status = 'withdrawn'
  AND publication_consent = false
  AND withdrawn_at IS NOT NULL
);

DROP POLICY IF EXISTS "Medical clients delete own private feedback"
  ON public.medical_private_feedback;
CREATE POLICY "Medical clients delete own private feedback"
ON public.medical_private_feedback
FOR DELETE
TO authenticated
USING (
  customer_id = auth.uid()
  OR public.is_admin_or_moderator()
);

DROP POLICY IF EXISTS "Medical moderators review private feedback"
  ON public.medical_private_feedback;
CREATE POLICY "Medical moderators review private feedback"
ON public.medical_private_feedback
FOR UPDATE
TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (
  app_key = 'medical'
  AND publication_consent = false
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-private-feedback',
  'medical-private-feedback',
  false,
  52428800,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Medical clients upload own private feedback media"
  ON storage.objects;
CREATE POLICY "Medical clients upload own private feedback media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-private-feedback'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Medical clients read own private feedback media"
  ON storage.objects;
CREATE POLICY "Medical clients read own private feedback media"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-private-feedback'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin_or_moderator()
  )
);

DROP POLICY IF EXISTS "Medical clients delete own private feedback media"
  ON storage.objects;
CREATE POLICY "Medical clients delete own private feedback media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-private-feedback'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.is_admin_or_moderator()
  )
);

COMMENT ON TABLE public.medical_private_feedback IS
  'Private, non-incentivized Medical Baise feedback. No row is publicly readable and publication consent is forced false.';

COMMIT;
