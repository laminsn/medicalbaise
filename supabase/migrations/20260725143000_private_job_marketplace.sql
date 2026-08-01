-- Keep exact addresses, coordinates, private notes, and client identity out of
-- public marketplace responses. Participants retain access to the complete
-- base record through RLS; discovery reads use the sanitized view below.

CREATE OR REPLACE FUNCTION public.is_job_participant(_job_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT _user_id IS NOT NULL AND (
    EXISTS (
      SELECT 1
      FROM public.jobs_posted AS job
      WHERE job.id = _job_id
        AND job.customer_id = _user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.active_jobs AS active_job
      WHERE active_job.job_id = _job_id
        AND active_job.provider_id = _user_id
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_job_request_detail(_job_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_job_participant(_job_id, _user_id)
    OR EXISTS (
      SELECT 1
      FROM public.providers AS provider
      JOIN public.jobs_posted AS job ON job.id = _job_id
      WHERE provider.user_id = _user_id
        AND provider.is_active IS TRUE
        AND provider.platform = job.platform
    );
$$;

DROP POLICY IF EXISTS "Jobs viewable by everyone" ON public.jobs_posted;
DROP POLICY IF EXISTS "Job participants can view exact job details" ON public.jobs_posted;

CREATE POLICY "Job participants can view exact job details"
ON public.jobs_posted
FOR SELECT
USING (public.is_job_participant(id, auth.uid()));

DROP VIEW IF EXISTS public.jobs_marketplace_public;
CREATE VIEW public.jobs_marketplace_public
WITH (security_barrier = true)
AS
SELECT
  job.id,
  CASE
    WHEN public.is_job_participant(job.id, auth.uid()) THEN job.customer_id
    ELSE NULL
  END AS customer_id,
  CASE
    WHEN public.can_view_job_request_detail(job.id, auth.uid()) THEN job.title
    WHEN job.platform = 'medical_baise' THEN 'Private medical request'
    WHEN job.platform = 'legal_baise' THEN 'Private legal request'
    ELSE 'Home service request'
  END AS title,
  CASE
    WHEN public.can_view_job_request_detail(job.id, auth.uid()) THEN job.description
    ELSE 'Sign in as an active provider to review the request details.'
  END AS description,
  job.category_id,
  CASE
    WHEN public.is_job_participant(job.id, auth.uid()) THEN job.location_address
    ELSE NULL
  END AS location_address,
  CASE
    WHEN public.is_job_participant(job.id, auth.uid()) THEN job.location_lat
    ELSE NULL
  END AS location_lat,
  CASE
    WHEN public.is_job_participant(job.id, auth.uid()) THEN job.location_lng
    ELSE NULL
  END AS location_lng,
  job.budget_min,
  job.budget_max,
  job.budget_disclosed,
  job.urgency,
  job.preferred_start_date,
  job.preferred_end_date,
  job.materials_included,
  job.insurance_required,
  job.license_required,
  job.max_bids,
  job.bid_deadline,
  job.status,
  job.is_featured,
  job.is_urgent,
  job.created_at,
  job.updated_at,
  job.appointment_type,
  job.is_teleconsultation,
  CASE
    WHEN public.is_job_participant(job.id, auth.uid()) THEN job.patient_notes
    ELSE NULL
  END AS patient_notes,
  job.platform
FROM public.jobs_posted AS job;

REVOKE ALL ON public.jobs_marketplace_public FROM PUBLIC;
GRANT SELECT ON public.jobs_marketplace_public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_job_participant(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_job_request_detail(uuid, uuid) TO anon, authenticated;

