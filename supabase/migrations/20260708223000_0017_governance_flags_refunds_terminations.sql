-- 0017 Governance flags, refund reviews, terminations, and archives.
-- Adds staff/super-admin controls for member, client, partner, account, and
-- relationship lifecycle risk actions inside the Relationship OS.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.growth_people
  ADD COLUMN IF NOT EXISTS governance_status text NOT NULL DEFAULT 'clear'
    CHECK (governance_status IN ('clear', 'flagged', 'refund_review', 'terminated', 'archived')),
  ADD COLUMN IF NOT EXISTS governance_reason text,
  ADD COLUMN IF NOT EXISTS governance_notes text,
  ADD COLUMN IF NOT EXISTS governance_last_action_id uuid,
  ADD COLUMN IF NOT EXISTS governance_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS terminated_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE TABLE IF NOT EXISTS public.cqa_governance_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  person_type text,
  target_kind text NOT NULL DEFAULT 'profile'
    CHECK (target_kind IN (
      'profile',
      'member',
      'client',
      'partner',
      'retainer',
      'partnership',
      'client_engagement',
      'membership',
      'account',
      'related_record',
      'all'
    )),
  target_id text,
  action_type text NOT NULL
    CHECK (action_type IN ('flag', 'refund_review', 'terminate', 'archive')),
  reason text NOT NULL
    CHECK (reason IN (
      'unethical',
      'disrespectful',
      'fraud',
      'dishonesty',
      'criminal_background',
      'owner_discretion',
      'billing_error',
      'client_request',
      'duplicate_payment',
      'service_not_delivered',
      'partial_service',
      'chargeback_risk',
      'nonpayment',
      'inactive',
      'duplicate_record',
      'migrated',
      'resolved'
    )),
  notes text NOT NULL CHECK (length(trim(notes)) > 0),
  refund_amount numeric CHECK (refund_amount IS NULL OR refund_amount > 0),
  currency text NOT NULL DEFAULT 'BRL',
  termination_scope text CHECK (
    termination_scope IS NULL OR termination_scope IN (
      'retainer',
      'partnership',
      'client_engagement',
      'membership',
      'account',
      'all'
    )
  ),
  archive_scope text CHECK (
    archive_scope IS NULL OR archive_scope IN (
      'profile',
      'membership',
      'partnership',
      'client_engagement',
      'account',
      'all'
    )
  ),
  status text NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'active', 'pending_review', 'completed', 'cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cqa_governance_actions_app_created
  ON public.cqa_governance_actions(app_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cqa_governance_actions_person
  ON public.cqa_governance_actions(person_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cqa_governance_actions_action_status
  ON public.cqa_governance_actions(app_key, action_type, status, created_at DESC);

DROP TRIGGER IF EXISTS update_cqa_governance_actions_updated_at ON public.cqa_governance_actions;
CREATE TRIGGER update_cqa_governance_actions_updated_at
  BEFORE UPDATE ON public.cqa_governance_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cqa_governance_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage governance actions" ON public.cqa_governance_actions;
CREATE POLICY "Admins manage governance actions"
ON public.cqa_governance_actions FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cqa_governance_actions TO authenticated;

ALTER TABLE public.growth_events
  DROP CONSTRAINT IF EXISTS growth_events_event_family_check;

ALTER TABLE public.growth_events
  ADD CONSTRAINT growth_events_event_family_check
  CHECK (event_family IN ('partner', 'referral', 'promotion', 'testimonial', 'payout', 'credit', 'email', 'system', 'governance'));

CREATE OR REPLACE VIEW public.relationship_timeline
WITH (security_invoker = true)
AS
SELECT
  ge.id,
  ge.app_key,
  ge.person_id,
  ge.intake_id,
  'event'::text AS item_kind,
  ge.event_family AS category,
  ge.event_type AS title,
  ge.action_taken AS description,
  ge.status,
  ge.amount,
  ge.currency,
  ge.metadata,
  ge.occurred_at AS timeline_at,
  ge.created_at
FROM public.growth_events ge
WHERE ge.person_id IS NOT NULL

UNION ALL

SELECT
  gi.id,
  gi.app_key,
  gi.person_id,
  gi.id AS intake_id,
  'intake'::text AS item_kind,
  gi.intake_type AS category,
  coalesce(gi.campaign_name, gi.campaign_key, gi.intake_type) AS title,
  concat_ws(' - ', gi.stage, gi.source, gi.landing_page) AS description,
  gi.status,
  greatest(gi.value_amount, gi.credit_amount, gi.payout_amount) AS amount,
  gi.currency,
  gi.metadata,
  gi.created_at AS timeline_at,
  gi.created_at
FROM public.growth_campaign_intakes gi
WHERE gi.person_id IS NOT NULL

UNION ALL

SELECT
  gt.id,
  gt.app_key,
  gi.person_id,
  gt.intake_id,
  'task'::text AS item_kind,
  gt.task_type AS category,
  gt.title,
  concat_ws(' - ', gt.priority, gt.status) AS description,
  gt.status,
  NULL::numeric AS amount,
  'BRL'::text AS currency,
  gt.metadata,
  coalesce(gt.due_at, gt.created_at) AS timeline_at,
  gt.created_at
FROM public.growth_followup_tasks gt
LEFT JOIN public.growth_campaign_intakes gi ON gi.id = gt.intake_id
WHERE gi.person_id IS NOT NULL

UNION ALL

SELECT
  rn.id,
  rn.app_key,
  rn.person_id,
  NULL::uuid AS intake_id,
  'note'::text AS item_kind,
  rn.note_type AS category,
  rn.note_type AS title,
  rn.body AS description,
  rn.visibility AS status,
  NULL::numeric AS amount,
  'BRL'::text AS currency,
  rn.metadata,
  rn.created_at AS timeline_at,
  rn.created_at
FROM public.relationship_notes rn

UNION ALL

SELECT
  ga.id,
  ga.app_key,
  ga.person_id,
  NULL::uuid AS intake_id,
  'governance'::text AS item_kind,
  ga.action_type AS category,
  concat('Governance ', replace(ga.action_type, '_', ' ')) AS title,
  concat_ws(' - ', replace(ga.reason, '_', ' '), ga.notes) AS description,
  ga.status,
  ga.refund_amount AS amount,
  ga.currency,
  ga.metadata || jsonb_build_object(
    'target_kind', ga.target_kind,
    'target_id', ga.target_id,
    'termination_scope', ga.termination_scope,
    'archive_scope', ga.archive_scope
  ) AS metadata,
  ga.created_at AS timeline_at,
  ga.created_at
FROM public.cqa_governance_actions ga
WHERE ga.person_id IS NOT NULL;

GRANT SELECT ON public.relationship_timeline TO authenticated;
