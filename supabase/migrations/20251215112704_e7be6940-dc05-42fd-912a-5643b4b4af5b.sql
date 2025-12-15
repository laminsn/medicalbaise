-- HIPAA Compliance: Audit Logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- HIPAA Compliance: Patient Consent Forms
CREATE TABLE public.patient_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  signature_data TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prescription Management
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.jobs_posted(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  instructions TEXT,
  refills_allowed INTEGER DEFAULT 0,
  refills_used INTEGER DEFAULT 0,
  prescribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  pharmacy_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Medical Records
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  is_confidential BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  record_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Appointment Reminders
CREATE TABLE public.appointment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs_posted(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  message TEXT,
  channel TEXT DEFAULT 'email',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insurance Verification
CREATE TABLE public.insurance_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  insurance_provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  group_number TEXT,
  member_id TEXT,
  card_front_url TEXT,
  card_back_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_status TEXT DEFAULT 'pending',
  eligibility_data JSONB DEFAULT '{}',
  coverage_details JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Video Consultation Sessions (enhance existing teleconsultation)
CREATE TABLE public.video_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES public.jobs_posted(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'scheduled',
  session_notes TEXT,
  recording_url TEXT,
  recording_consent BOOLEAN DEFAULT false,
  technical_quality_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (read-only for own logs, admins can see all)
CREATE POLICY "Users can view their own audit logs"
ON public.audit_logs FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for patient_consents
CREATE POLICY "Patients can view their own consents"
ON public.patient_consents FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own consents"
ON public.patient_consents FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Providers can view consents for their patients"
ON public.patient_consents FOR SELECT
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view their prescriptions"
ON public.prescriptions FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Providers can manage prescriptions they created"
ON public.prescriptions FOR ALL
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- RLS Policies for medical_records
CREATE POLICY "Patients can view their medical records"
ON public.medical_records FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can upload their medical records"
ON public.medical_records FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Providers can view records for their patients"
ON public.medical_records FOR SELECT
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- RLS Policies for appointment_reminders
CREATE POLICY "Patients can view their reminders"
ON public.appointment_reminders FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Providers can manage reminders"
ON public.appointment_reminders FOR ALL
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- RLS Policies for insurance_verifications
CREATE POLICY "Patients can manage their insurance"
ON public.insurance_verifications FOR ALL
USING (auth.uid() = patient_id);

CREATE POLICY "Providers can view patient insurance"
ON public.insurance_verifications FOR SELECT
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- RLS Policies for video_sessions
CREATE POLICY "Patients can view their video sessions"
ON public.video_sessions FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Providers can manage video sessions"
ON public.video_sessions FOR ALL
USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- Create storage bucket for medical documents
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

-- Storage policies for medical documents
CREATE POLICY "Users can upload their own medical documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own medical documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'medical-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_patient_consents_updated_at
BEFORE UPDATE ON public.patient_consents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at
BEFORE UPDATE ON public.medical_records
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_verifications_updated_at
BEFORE UPDATE ON public.insurance_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_sessions_updated_at
BEFORE UPDATE ON public.video_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();