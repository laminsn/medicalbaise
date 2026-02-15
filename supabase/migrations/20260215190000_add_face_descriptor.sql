-- Add face_descriptor column to profiles table for face authentication
-- Stores the 128-dimensional face descriptor vector as JSON text
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS face_descriptor text;

-- Add a comment explaining the column
COMMENT ON COLUMN public.profiles.face_descriptor IS 'JSON-encoded 128-dimensional face descriptor array for face authentication. NULL if not enrolled.';

-- Create an index for quick lookup of enrolled faces
CREATE INDEX IF NOT EXISTS idx_profiles_face_enrolled
  ON public.profiles (user_id)
  WHERE face_descriptor IS NOT NULL;
