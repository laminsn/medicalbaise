-- Add address fields to profiles table for patient addresses
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS address_cep TEXT,
ADD COLUMN IF NOT EXISTS address_lat NUMERIC,
ADD COLUMN IF NOT EXISTS address_lng NUMERIC;

-- Create index on CEP for faster searches
CREATE INDEX IF NOT EXISTS idx_profiles_cep ON public.profiles(address_cep);

-- Create index on city/state for location filtering  
CREATE INDEX IF NOT EXISTS idx_profiles_city_state ON public.profiles(city, state);