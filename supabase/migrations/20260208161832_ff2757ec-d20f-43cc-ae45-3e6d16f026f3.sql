
-- Fix Security Definer Views: Recreate as SECURITY INVOKER
-- This ensures views use the caller's permissions (respecting RLS)

-- 1. Recreate profiles_public view as SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker = true) AS
SELECT id, user_id, user_type, avatar_url, first_name, last_name, city, state, bio
FROM public.profiles;

-- 2. Recreate providers_public view as SECURITY INVOKER
DROP VIEW IF EXISTS public.providers_public;
CREATE VIEW public.providers_public 
WITH (security_invoker = true) AS
SELECT id, user_id, business_name, tagline, bio, business_type,
  years_experience, service_radius_km, location_lat, location_lng,
  is_verified, is_licensed, is_insured, is_background_checked,
  avg_rating, total_reviews, total_jobs, response_time_hours,
  languages, subscription_tier, warranty_info, guarantee_info,
  meta_pixel_id, google_analytics_id, created_at, updated_at
FROM public.providers;

-- Grant SELECT on views to authenticated and anon roles
GRANT SELECT ON public.profiles_public TO authenticated, anon;
GRANT SELECT ON public.providers_public TO authenticated, anon;
