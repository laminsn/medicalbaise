-- Create appointments table for medical consultations
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL,
  location TEXT,
  consultation_fee_min DECIMAL(10,2),
  consultation_fee_max DECIMAL(10,2),
  urgency TEXT CHECK (urgency IN ('emergency', 'urgent', 'routine', 'follow-up')) DEFAULT 'routine',
  status TEXT CHECK (status IN ('open', 'scheduled', 'completed', 'cancelled')) DEFAULT 'open',
  available_slots INTEGER DEFAULT 0,
  preferred_datetime TIMESTAMP WITH TIME ZONE,
  appointment_type TEXT,
  insurance_provider TEXT,
  chief_complaint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_status ON public.appointments(status, created_at DESC);
CREATE INDEX idx_appointments_category ON public.appointments(category_id);
CREATE INDEX idx_appointments_user ON public.appointments(user_id);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view open appointments"
ON public.appointments FOR SELECT
USING (status = 'open');

CREATE POLICY "Authenticated users can view their own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();