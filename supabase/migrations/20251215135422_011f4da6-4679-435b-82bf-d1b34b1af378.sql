-- Add healthcare-specific columns to providers table
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'home_service',
ADD COLUMN IF NOT EXISTS consultation_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS category_id TEXT,
ADD COLUMN IF NOT EXISTS emergency_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS consultation_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS insurance_accepted TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accepts_new_patients BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS total_patients INTEGER DEFAULT 0;

-- Index for healthcare providers
CREATE INDEX IF NOT EXISTS idx_providers_healthcare 
ON providers(provider_type, avg_rating DESC) 
WHERE provider_type = 'healthcare';

-- Index for active providers
CREATE INDEX IF NOT EXISTS idx_providers_active 
ON providers(is_active, avg_rating DESC);

-- Index for location filtering
CREATE INDEX IF NOT EXISTS idx_providers_location 
ON providers(state, city);