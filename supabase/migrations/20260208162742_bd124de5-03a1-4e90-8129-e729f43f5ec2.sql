
-- Fix providers SELECT policy: Authenticated users need to browse providers
-- Sensitive fields (CPF, CNPJ, passport) are only in the base table, not in providers_public view
-- Allow authenticated users to read all providers (for marketplace browsing)
DROP POLICY IF EXISTS "Providers can view own profile" ON public.providers;
CREATE POLICY "Authenticated users can view providers" ON public.providers FOR SELECT TO authenticated USING (true);
-- Anonymous users should use providers_public view instead (no direct table access)
