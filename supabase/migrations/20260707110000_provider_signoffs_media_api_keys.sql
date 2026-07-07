-- Client sign-offs, proof media, and provider-scoped AI API keys.

CREATE TABLE IF NOT EXISTS public.provider_work_signoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.provider_quote_records(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.provider_projects(id) ON DELETE SET NULL,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  customer_id uuid,
  requested_by uuid NOT NULL,
  signed_by uuid,
  title text NOT NULL,
  signoff_type text NOT NULL DEFAULT 'work_completed'
    CHECK (signoff_type IN ('quote_acceptance', 'estimate_approval', 'work_completed', 'milestone', 'problem_acknowledgement', 'change_order', 'proof_review')),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('draft', 'requested', 'signed', 'declined', 'void')),
  signer_name text,
  signer_email text,
  signature_data_url text,
  signature_text text,
  signature_method text NOT NULL DEFAULT 'drawn'
    CHECK (signature_method IN ('drawn', 'typed', 'uploaded', 'onsite')),
  signed_at timestamptz,
  signed_ip inet,
  signed_user_agent text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_work_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.provider_quote_records(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.provider_projects(id) ON DELETE SET NULL,
  signoff_id uuid REFERENCES public.provider_work_signoffs(id) ON DELETE SET NULL,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  customer_id uuid,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  bucket_id text NOT NULL DEFAULT 'provider-work-media',
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  attachment_type text NOT NULL DEFAULT 'proof'
    CHECK (attachment_type IN ('completed_work', 'unexpected_problem', 'proof', 'quote_attachment', 'estimate_attachment', 'before', 'after', 'signature', 'other')),
  caption text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived', 'deleted')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_ai_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  key_name text NOT NULL,
  key_prefix text NOT NULL DEFAULT 'baise_ai',
  key_hash text NOT NULL UNIQUE,
  key_last_four text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY['ai.records.read', 'ai.records.write']::text[],
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked')),
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-work-media',
  'provider-work-media',
  false,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE INDEX IF NOT EXISTS idx_provider_work_signoffs_provider ON public.provider_work_signoffs(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_work_signoffs_customer ON public.provider_work_signoffs(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_work_signoffs_quote ON public.provider_work_signoffs(quote_id);
CREATE INDEX IF NOT EXISTS idx_provider_work_signoffs_project ON public.provider_work_signoffs(project_id);
CREATE INDEX IF NOT EXISTS idx_provider_work_attachments_provider ON public.provider_work_attachments(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_work_attachments_customer ON public.provider_work_attachments(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_work_attachments_signoff ON public.provider_work_attachments(signoff_id);
CREATE INDEX IF NOT EXISTS idx_provider_ai_api_keys_provider ON public.provider_ai_api_keys(provider_id, created_at DESC);

DROP TRIGGER IF EXISTS update_provider_work_signoffs_updated_at ON public.provider_work_signoffs;
CREATE TRIGGER update_provider_work_signoffs_updated_at
  BEFORE UPDATE ON public.provider_work_signoffs
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS update_provider_work_attachments_updated_at ON public.provider_work_attachments;
CREATE TRIGGER update_provider_work_attachments_updated_at
  BEFORE UPDATE ON public.provider_work_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS update_provider_ai_api_keys_updated_at ON public.provider_ai_api_keys;
CREATE TRIGGER update_provider_ai_api_keys_updated_at
  BEFORE UPDATE ON public.provider_ai_api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

ALTER TABLE public.provider_work_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_work_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_ai_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own work signoffs" ON public.provider_work_signoffs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_work_signoffs.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_work_signoffs.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Customers view own work signoffs" ON public.provider_work_signoffs
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers sign own work signoffs" ON public.provider_work_signoffs
  FOR UPDATE USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Providers manage own work attachments" ON public.provider_work_attachments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_work_attachments.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_work_attachments.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Customers view own work attachments" ON public.provider_work_attachments
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers upload own work attachments" ON public.provider_work_attachments
  FOR INSERT WITH CHECK (customer_id = auth.uid() AND uploaded_by = auth.uid());

CREATE POLICY "Providers view own AI API keys" ON public.provider_ai_api_keys
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_ai_api_keys.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers revoke own AI API keys" ON public.provider_ai_api_keys
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_ai_api_keys.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_ai_api_keys.provider_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Provider work media users upload own folder" ON storage.objects;
CREATE POLICY "Provider work media users upload own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provider-work-media'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Provider work media participants can view" ON storage.objects;
CREATE POLICY "Provider work media participants can view"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provider-work-media'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1
      FROM public.provider_work_attachments a
      WHERE a.bucket_id = 'provider-work-media'
        AND a.file_path = storage.objects.name
        AND (
          a.uploaded_by = auth.uid()
          OR a.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM public.providers p WHERE p.id = a.provider_id AND p.user_id = auth.uid())
        )
    )
  )
);

DROP POLICY IF EXISTS "Provider work media users update own folder" ON storage.objects;
CREATE POLICY "Provider work media users update own folder"
ON storage.objects FOR UPDATE
USING (bucket_id = 'provider-work-media' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Provider work media users delete own folder" ON storage.objects;
CREATE POLICY "Provider work media users delete own folder"
ON storage.objects FOR DELETE
USING (bucket_id = 'provider-work-media' AND (storage.foldername(name))[1] = auth.uid()::text);
