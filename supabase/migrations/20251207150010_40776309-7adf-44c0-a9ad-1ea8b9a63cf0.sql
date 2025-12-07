-- Add medical-specific columns to providers table
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS crm_number TEXT,
ADD COLUMN IF NOT EXISTS specialty_id UUID REFERENCES public.service_categories(id),
ADD COLUMN IF NOT EXISTS hospital_affiliations TEXT[],
ADD COLUMN IF NOT EXISTS accepted_insurance TEXT[],
ADD COLUMN IF NOT EXISTS teleconsultation_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS consultation_duration_minutes INTEGER DEFAULT 30;

-- Add medical-specific columns to provider_credentials for board certifications
-- The existing structure works well, just add specialty certification support

-- Create medical specialties data in service_categories
-- First, clear existing non-medical categories if they exist (or insert new ones)
INSERT INTO public.service_categories (id, name_en, name_pt, icon, color, order_index)
VALUES 
  (gen_random_uuid(), 'Cardiology', 'Cardiologia', 'Heart', 'hsl(0 84% 60%)', 1),
  (gen_random_uuid(), 'Dermatology', 'Dermatologia', 'Scan', 'hsl(25 90% 55%)', 2),
  (gen_random_uuid(), 'Pediatrics', 'Pediatria', 'Baby', 'hsl(200 85% 55%)', 3),
  (gen_random_uuid(), 'Orthopedics', 'Ortopedia', 'Bone', 'hsl(220 70% 50%)', 4),
  (gen_random_uuid(), 'Neurology', 'Neurologia', 'Brain', 'hsl(280 70% 60%)', 5),
  (gen_random_uuid(), 'Ophthalmology', 'Oftalmologia', 'Eye', 'hsl(150 70% 45%)', 6),
  (gen_random_uuid(), 'Psychiatry', 'Psiquiatria', 'HeartPulse', 'hsl(320 70% 55%)', 7),
  (gen_random_uuid(), 'Gynecology', 'Ginecologia', 'Heart', 'hsl(340 80% 60%)', 8),
  (gen_random_uuid(), 'Urology', 'Urologia', 'Stethoscope', 'hsl(200 60% 50%)', 9),
  (gen_random_uuid(), 'General Practice', 'Clínica Geral', 'Stethoscope', 'hsl(187 100% 42%)', 10),
  (gen_random_uuid(), 'Dentistry', 'Odontologia', 'Smile', 'hsl(45 90% 50%)', 11),
  (gen_random_uuid(), 'Physical Therapy', 'Fisioterapia', 'Activity', 'hsl(120 60% 45%)', 12),
  (gen_random_uuid(), 'Nutrition', 'Nutrição', 'Apple', 'hsl(100 70% 45%)', 13),
  (gen_random_uuid(), 'Psychology', 'Psicologia', 'Brain', 'hsl(260 60% 55%)', 14),
  (gen_random_uuid(), 'Endocrinology', 'Endocrinologia', 'Pill', 'hsl(30 80% 50%)', 15)
ON CONFLICT DO NOTHING;

-- Rename jobs_posted conceptually - add appointment-related columns
ALTER TABLE public.jobs_posted
ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'consultation',
ADD COLUMN IF NOT EXISTS patient_notes TEXT,
ADD COLUMN IF NOT EXISTS is_teleconsultation BOOLEAN DEFAULT false;

-- Add comment to document the medical context
COMMENT ON COLUMN public.providers.crm_number IS 'Medical license number (CRM in Brazil)';
COMMENT ON COLUMN public.providers.specialty_id IS 'Primary medical specialty';
COMMENT ON COLUMN public.providers.hospital_affiliations IS 'List of affiliated hospitals/clinics';
COMMENT ON COLUMN public.providers.accepted_insurance IS 'List of accepted insurance plans';
COMMENT ON COLUMN public.providers.teleconsultation_available IS 'Whether provider offers video consultations';
COMMENT ON COLUMN public.providers.consultation_duration_minutes IS 'Default consultation duration';