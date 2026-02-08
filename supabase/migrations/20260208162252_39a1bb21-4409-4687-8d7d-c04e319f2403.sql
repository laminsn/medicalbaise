
-- Allow authenticated users to read basic profile info for other users
-- This is needed for the profiles_public view to work for browsing providers/users
-- The view already filters to only safe fields (no email, phone, address)
CREATE POLICY "Authenticated users can view public profile fields" ON public.profiles 
FOR SELECT TO authenticated
USING (true);

-- Drop the owner-only policy since authenticated can view all (filtered by view)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- But keep write restricted to owner
-- (existing insert/update policies already restrict to auth.uid() = user_id)
