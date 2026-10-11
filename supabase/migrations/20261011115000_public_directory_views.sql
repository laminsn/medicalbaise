-- Public directory views for the shared project xpcoaedbfmtyzvkwhaav.
-- Apply BEFORE 20261011120000_security_batches_1_3_private_buckets.sql so
-- that MD / Casa / Legal public listings keep working once the base
-- providers / profiles tables are locked to owner/admin.
--
-- 1) providers_public: append non-sensitive listing columns MD /browse
--    filters on. Still NO passport_number, cpf_cnpj, contact_phone,
--    contact_email, address, location_lat/lng, stripe_customer_id,
--    pixel/analytics IDs, face data or credentials.
-- 2) profiles_public: security_invoker -> definer, narrow column list
--    (+ handle for /u/:handle), signed-in users only (anon gets []),
--    test-realm aware. Never exposes face_descriptor, email, phone, CPF.
-- 3) Revoke write privileges on all three directory views. providers_public
--    is a SECURITY DEFINER auto-updatable view and anon/authenticated held
--    INSERT/UPDATE/DELETE on it, i.e. anyone could PATCH/DELETE non-test
--    provider rows through /rest/v1/providers_public.
-- Rollback: supabase/rollbacks/20261011115000_public_directory_views.rollback.sql

BEGIN;

CREATE OR REPLACE VIEW public.providers_public AS
SELECT
  p.id, p.user_id, p.business_name, p.business_type, p.tagline, p.bio,
  p.years_experience, p.subscription_tier, p.service_radius_km, p.city,
  p.state, p.languages, p.avg_rating, p.total_reviews, p.total_jobs,
  p.response_time_hours, p.is_verified, p.is_background_checked,
  p.is_insured, p.is_licensed, p.warranty_info, p.guarantee_info,
  p.crm_number, p.specialty_id, p.hospital_affiliations,
  p.teleconsultation_available, p.consultation_fee, p.consultation_types,
  p.emergency_available, p.accepts_new_patients, p.total_patients,
  p.avatar_url, p.platform, p.created_at,
  -- appended 2026-10-11 (non-sensitive listing fields)
  p.provider_type, p.is_active, p.category_id, p.languages_spoken,
  p.insurance_accepted, p.accepted_insurance, p.consultation_duration_minutes
FROM public.providers p
WHERE p.is_test_account = false
   OR public.current_user_is_test_cohort_peer(p.platform)
   OR public.has_role(auth.uid(), 'admin'::app_role);

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  pr.id, pr.user_id, pr.user_type, pr.avatar_url, pr.first_name,
  pr.last_name, pr.city, pr.state, pr.bio,
  -- appended 2026-10-11
  pr.handle
FROM public.profiles pr
WHERE auth.uid() IS NOT NULL
  AND (
    pr.is_test_account = false
    OR pr.user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (
      public.current_user_is_test_account()
      AND public.current_user_test_cohort_app_key() IS NOT DISTINCT FROM pr.test_cohort_app_key
    )
  );

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.providers_public, public.profiles_public, public.jobs_marketplace_public
  FROM anon, authenticated, PUBLIC;
GRANT SELECT ON public.providers_public, public.profiles_public, public.jobs_marketplace_public
  TO anon, authenticated;

COMMIT;
