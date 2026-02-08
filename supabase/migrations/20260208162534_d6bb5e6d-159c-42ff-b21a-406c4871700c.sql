
-- ============================================================
-- SECURITY HARDENING: Final round
-- ============================================================

-- 1. PROVIDERS: Restrict direct table access to owner-only
-- Public browsing should use providers_public view (already security invoker)
DROP POLICY IF EXISTS "Authenticated users can view providers" ON public.providers;
CREATE POLICY "Providers can view own profile" ON public.providers FOR SELECT USING (auth.uid() = user_id);
-- Keep existing insert/update policies (already restricted to owner)

-- 2. CONVERSATIONS: Already has proper RLS (verified above) ✓

-- 3. VIDEO SESSIONS: Clean up duplicate policies
DROP POLICY IF EXISTS "Patients can view their video sessions" ON public.video_sessions;
-- "Participants can view video sessions" already covers patient access

-- 4. QUOTE REQUESTS: Restrict contact fields by ensuring only participants see them
-- Already has proper RLS ✓ (customer can view own, provider can view theirs)

-- 5. PROVIDER CREDENTIALS: Restrict document_url to authenticated users only
DROP POLICY IF EXISTS "Credentials viewable by everyone" ON public.provider_credentials;
CREATE POLICY "Credentials viewable by authenticated" ON public.provider_credentials 
FOR SELECT TO authenticated USING (true);

-- 6. REVIEWS: Only show verified reviews publicly  
DROP POLICY IF EXISTS "Reviews viewable by everyone" ON public.reviews;
CREATE POLICY "Verified reviews viewable by everyone" ON public.reviews 
FOR SELECT USING (is_verified = true OR auth.uid() = customer_id);

-- 7. Add unique handle column to profiles for shareable URLs
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle text UNIQUE;

-- 8. Create function to generate unique handle from name
CREATE OR REPLACE FUNCTION public.generate_unique_handle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle text;
  new_handle text;
  counter integer := 0;
BEGIN
  -- Build base handle from first_name or email
  base_handle := lower(regexp_replace(
    coalesce(NEW.first_name, split_part(NEW.email, '@', 1), 'user'),
    '[^a-z0-9]', '', 'g'
  ));
  
  -- Ensure minimum length
  IF length(base_handle) < 3 THEN
    base_handle := 'user';
  END IF;
  
  -- Try base handle, then add numbers until unique
  new_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = new_handle AND id != NEW.id) LOOP
    counter := counter + 1;
    new_handle := base_handle || counter::text;
  END LOOP;
  
  NEW.handle := new_handle;
  RETURN NEW;
END;
$$;

-- 9. Add trigger for auto-generating handle on insert (if handle is null)
CREATE OR REPLACE TRIGGER set_profile_handle
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.handle IS NULL)
  EXECUTE FUNCTION public.generate_unique_handle();

-- 10. Generate handles for existing profiles that don't have one
UPDATE public.profiles 
SET handle = lower(regexp_replace(
  coalesce(first_name, split_part(email, '@', 1), 'user'),
  '[^a-z0-9]', '', 'g'
)) || '-' || substring(id::text, 1, 5)
WHERE handle IS NULL;
