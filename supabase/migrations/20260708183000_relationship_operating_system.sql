-- Relationship Operating System.
-- Adds Relationship 360, unified timelines, next-best-action queues,
-- saved views, notes, and readiness scoring on top of Growth Hub.

CREATE TABLE IF NOT EXISTS public.relationship_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  person_id uuid NOT NULL REFERENCES public.growth_people(id) ON DELETE CASCADE,
  author_id uuid DEFAULT auth.uid(),
  note_type text NOT NULL DEFAULT 'general'
    CHECK (note_type IN ('general', 'call', 'email', 'whatsapp', 'approval', 'risk', 'handoff', 'task')),
  visibility text NOT NULL DEFAULT 'internal'
    CHECK (visibility IN ('internal', 'client_visible', 'partner_visible')),
  body text NOT NULL CHECK (length(trim(body)) > 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relationship_notes_person
  ON public.relationship_notes(person_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_relationship_notes_app
  ON public.relationship_notes(app_key, note_type, created_at DESC);

DROP TRIGGER IF EXISTS update_relationship_notes_updated_at ON public.relationship_notes;
CREATE TRIGGER update_relationship_notes_updated_at
  BEFORE UPDATE ON public.relationship_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.relationship_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage relationship notes" ON public.relationship_notes;
CREATE POLICY "Admins manage relationship notes"
ON public.relationship_notes FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users view visible relationship notes" ON public.relationship_notes;
CREATE POLICY "Users view visible relationship notes"
ON public.relationship_notes FOR SELECT TO authenticated
USING (
  visibility <> 'internal'
  AND EXISTS (
    SELECT 1
    FROM public.growth_people gp
    WHERE gp.id = relationship_notes.person_id
      AND gp.user_id = auth.uid()
  )
);

CREATE TABLE IF NOT EXISTS public.relationship_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  view_key text NOT NULL,
  name text NOT NULL,
  description text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort jsonb NOT NULL DEFAULT '{"field":"created_at","direction":"desc"}'::jsonb,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_relationship_saved_views_shared_unique
  ON public.relationship_saved_views(app_key, view_key)
  WHERE owner_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_relationship_saved_views_owner_unique
  ON public.relationship_saved_views(app_key, owner_id, view_key)
  WHERE owner_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_relationship_saved_views_updated_at ON public.relationship_saved_views;
CREATE TRIGGER update_relationship_saved_views_updated_at
  BEFORE UPDATE ON public.relationship_saved_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.relationship_saved_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage relationship saved views" ON public.relationship_saved_views;
CREATE POLICY "Admins manage relationship saved views"
ON public.relationship_saved_views FOR ALL TO authenticated
USING (public.is_admin_or_moderator() OR owner_id = auth.uid())
WITH CHECK (public.is_admin_or_moderator() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Staff view shared relationship saved views" ON public.relationship_saved_views;
CREATE POLICY "Staff view shared relationship saved views"
ON public.relationship_saved_views FOR SELECT TO authenticated
USING (is_shared = true OR owner_id = auth.uid() OR public.is_admin_or_moderator());

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
FROM public.relationship_notes rn;

GRANT SELECT ON public.relationship_timeline TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_relationship_next_action_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_task_type text;
  next_title text;
  next_priority text := 'normal';
  next_due_at timestamptz := NEW.due_at;
  next_metadata jsonb := '{}'::jsonb;
  existing_task_id uuid;
BEGIN
  IF NEW.duplicate_warning THEN
    next_task_type := 'fraud_review';
    next_title := 'Review duplicate warning before credit or payout';
    next_priority := 'urgent';
  ELSIF NEW.intake_type = 'partner_application'
    AND NEW.status IN ('submitted', 'under_review')
  THEN
    next_task_type := 'review';
    next_title := 'Review partner application';
    next_priority := 'high';
    next_due_at := coalesce(NEW.due_at, now() + interval '48 hours');
  ELSIF NEW.intake_type = 'testimonial'
    AND NEW.status = 'pending_review'
  THEN
    next_task_type := 'approve';
    next_title := 'Review testimonial credit';
    next_priority := 'high';
  ELSIF NEW.intake_type = 'referral'
    AND NEW.status IN ('pending', 'active')
  THEN
    next_task_type := CASE WHEN NEW.status = 'active' THEN 'credit' ELSE 'follow_up' END;
    next_title := CASE WHEN NEW.status = 'active' THEN 'Approve referral credit' ELSE 'Follow up on referral' END;
    next_priority := CASE WHEN NEW.status = 'active' THEN 'high' ELSE 'normal' END;
  ELSIF NEW.intake_type = 'payout'
    AND NEW.status IN ('scheduled', 'processing')
  THEN
    next_task_type := 'payout';
    next_title := 'Process partner payout';
    next_priority := 'high';
  ELSIF NEW.intake_type = 'promo_lead'
    AND NEW.status IN ('new', 'redeemed')
  THEN
    next_task_type := 'follow_up';
    next_title := 'Follow up with promo lead';
    next_priority := 'normal';
  END IF;

  IF next_task_type IS NULL THEN
    RETURN NEW;
  END IF;

  next_metadata := jsonb_build_object(
    'source', 'relationship_next_action_engine',
    'intake_type', NEW.intake_type,
    'stage', NEW.stage,
    'status', NEW.status,
    'why_it_matters', CASE
      WHEN next_task_type = 'fraud_review' THEN 'Duplicate warnings must be cleared before credits or payouts are released.'
      WHEN next_task_type = 'review' THEN 'Partner approvals unlock campaign access and referral tracking.'
      WHEN next_task_type = 'approve' THEN 'Approval controls testimonial credit issuance and marketing reuse.'
      WHEN next_task_type = 'credit' THEN 'Credits should be issued quickly once referral eligibility is confirmed.'
      WHEN next_task_type = 'payout' THEN 'Payouts keep partner trust high and receipts accurate.'
      ELSE 'Timely follow-up keeps the relationship moving.'
    END
  );

  UPDATE public.growth_followup_tasks
  SET
    assigned_to = coalesce(NEW.assigned_owner_id, public.growth_followup_tasks.assigned_to),
    priority = next_priority,
    due_at = coalesce(next_due_at, public.growth_followup_tasks.due_at),
    metadata = public.growth_followup_tasks.metadata || next_metadata,
    updated_at = now()
  WHERE intake_id = NEW.id
    AND task_type = next_task_type
    AND title = next_title
    AND status IN ('open', 'in_progress', 'waiting')
  RETURNING id INTO existing_task_id;

  IF existing_task_id IS NULL THEN
    INSERT INTO public.growth_followup_tasks (
      app_key,
      intake_id,
      assigned_to,
      task_type,
      title,
      status,
      priority,
      due_at,
      metadata
    )
    VALUES (
      NEW.app_key,
      NEW.id,
      NEW.assigned_owner_id,
      next_task_type,
      next_title,
      'open',
      next_priority,
      next_due_at,
      next_metadata
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS relationship_next_action_task_sync ON public.growth_campaign_intakes;
CREATE TRIGGER relationship_next_action_task_sync
  AFTER INSERT OR UPDATE ON public.growth_campaign_intakes
  FOR EACH ROW EXECUTE FUNCTION public.sync_relationship_next_action_task();

CREATE OR REPLACE FUNCTION public.get_relationship_next_actions(
  target_app_key text DEFAULT NULL,
  target_person_id uuid DEFAULT NULL
)
RETURNS TABLE (
  action_id text,
  app_key text,
  person_id uuid,
  intake_id uuid,
  task_id uuid,
  action_type text,
  title text,
  priority text,
  owner_id uuid,
  why_it_matters text,
  consequence text,
  unlocks text,
  due_at timestamptz,
  status text,
  source_table text,
  source_id text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    IF target_person_id IS NULL THEN
      RAISE EXCEPTION 'Only admin or moderator users can view global next-best-action queues';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.growth_people gp
      WHERE gp.id = target_person_id
        AND gp.user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Next-best-action access denied';
    END IF;
  END IF;

  RETURN QUERY
  SELECT *
  FROM (
    SELECT
      ('task:' || gt.id::text) AS action_id,
      gt.app_key,
      gi.person_id,
      gt.intake_id,
      gt.id AS task_id,
      gt.task_type AS action_type,
      gt.title,
      gt.priority,
      gt.assigned_to AS owner_id,
      coalesce(gt.metadata->>'why_it_matters', 'This task keeps the relationship moving.') AS why_it_matters,
      CASE
        WHEN gt.priority = 'urgent' THEN 'If ignored, money, access, or trust may remain blocked.'
        WHEN gt.task_type = 'payout' THEN 'If ignored, partner trust and tax records fall behind.'
        WHEN gt.task_type = 'approve' THEN 'If ignored, credits or testimonials remain stuck.'
        ELSE 'If ignored, the relationship may stall.'
      END AS consequence,
      CASE
        WHEN gt.task_type = 'review' THEN 'Campaign access and partner dashboard confidence'
        WHEN gt.task_type = 'credit' THEN 'Client credit and referral goodwill'
        WHEN gt.task_type = 'payout' THEN 'Partner payment history and payout receipts'
        WHEN gt.task_type = 'approve' THEN 'Credit issuance and marketing library use'
        ELSE 'The next clean status update'
      END AS unlocks,
      gt.due_at,
      gt.status,
      'growth_followup_tasks'::text AS source_table,
      gt.id::text AS source_id,
      gt.created_at
    FROM public.growth_followup_tasks gt
    LEFT JOIN public.growth_campaign_intakes gi ON gi.id = gt.intake_id
    WHERE gt.app_key = clean_app_key
      AND gt.status IN ('open', 'in_progress', 'waiting')
      AND (target_person_id IS NULL OR gi.person_id = target_person_id)

    UNION ALL

    SELECT
      ('intake:' || gi.id::text || ':duplicate-review') AS action_id,
      gi.app_key,
      gi.person_id,
      gi.id AS intake_id,
      NULL::uuid AS task_id,
      'duplicate_review'::text AS action_type,
      'Clear duplicate warning before approval'::text AS title,
      'urgent'::text AS priority,
      gi.assigned_owner_id AS owner_id,
      'Duplicate warnings prevent accidental payouts, credits, or duplicate records.'::text AS why_it_matters,
      'If ignored, the platform may pay or credit the wrong relationship.'::text AS consequence,
      'Safe payout, credit, and approval decisions'::text AS unlocks,
      gi.due_at,
      gi.status,
      gi.source_table,
      gi.source_id,
      gi.created_at
    FROM public.growth_campaign_intakes gi
    WHERE gi.app_key = clean_app_key
      AND gi.duplicate_warning = true
      AND (target_person_id IS NULL OR gi.person_id = target_person_id)

    UNION ALL

    SELECT
      ('intake:' || gi.id::text || ':partner-review') AS action_id,
      gi.app_key,
      gi.person_id,
      gi.id AS intake_id,
      NULL::uuid AS task_id,
      'partner_approval'::text AS action_type,
      'Review partner application'::text AS title,
      'high'::text AS priority,
      gi.assigned_owner_id AS owner_id,
      'Partner approval unlocks the dashboard, campaigns, links, QR codes, and payout tracking.'::text AS why_it_matters,
      'If ignored, qualified partners cannot promote or track conversions.'::text AS consequence,
      'Partner campaign access and referral attribution'::text AS unlocks,
      gi.due_at,
      gi.status,
      gi.source_table,
      gi.source_id,
      gi.created_at
    FROM public.growth_campaign_intakes gi
    WHERE gi.app_key = clean_app_key
      AND gi.intake_type = 'partner_application'
      AND gi.status IN ('submitted', 'under_review')
      AND (target_person_id IS NULL OR gi.person_id = target_person_id)

    UNION ALL

    SELECT
      ('intake:' || gi.id::text || ':testimonial-review') AS action_id,
      gi.app_key,
      gi.person_id,
      gi.id AS intake_id,
      NULL::uuid AS task_id,
      'testimonial_approval'::text AS action_type,
      'Review testimonial credit'::text AS title,
      'high'::text AS priority,
      gi.assigned_owner_id AS owner_id,
      'Approved testimonials issue credits and can become reusable proof for the brand.'::text AS why_it_matters,
      'If ignored, clients wait for credits and the reputation library stays stale.'::text AS consequence,
      'Client credit and testimonial reuse'::text AS unlocks,
      gi.due_at,
      gi.status,
      gi.source_table,
      gi.source_id,
      gi.created_at
    FROM public.growth_campaign_intakes gi
    WHERE gi.app_key = clean_app_key
      AND gi.intake_type = 'testimonial'
      AND gi.status = 'pending_review'
      AND (target_person_id IS NULL OR gi.person_id = target_person_id)

    UNION ALL

    SELECT
      ('intake:' || gi.id::text || ':referral-credit') AS action_id,
      gi.app_key,
      gi.person_id,
      gi.id AS intake_id,
      NULL::uuid AS task_id,
      CASE WHEN gi.status = 'active' THEN 'referral_credit' ELSE 'referral_follow_up' END AS action_type,
      CASE WHEN gi.status = 'active' THEN 'Approve referral credit' ELSE 'Follow up on referral' END AS title,
      CASE WHEN gi.status = 'active' THEN 'high' ELSE 'normal' END AS priority,
      gi.assigned_owner_id AS owner_id,
      'Referral momentum should be visible to the referrer and owned by staff.'::text AS why_it_matters,
      'If ignored, referrers lose trust and the referred lead may go cold.'::text AS consequence,
      'Clear referral status, credit approval, and follow-up ownership'::text AS unlocks,
      gi.due_at,
      gi.status,
      gi.source_table,
      gi.source_id,
      gi.created_at
    FROM public.growth_campaign_intakes gi
    WHERE gi.app_key = clean_app_key
      AND gi.intake_type = 'referral'
      AND gi.status IN ('pending', 'active')
      AND (target_person_id IS NULL OR gi.person_id = target_person_id)

    UNION ALL

    SELECT
      ('intake:' || gi.id::text || ':payout') AS action_id,
      gi.app_key,
      gi.person_id,
      gi.id AS intake_id,
      NULL::uuid AS task_id,
      'partner_payout'::text AS action_type,
      'Process partner payout'::text AS title,
      'high'::text AS priority,
      gi.assigned_owner_id AS owner_id,
      'Payouts must stay simple and visible for partners.'::text AS why_it_matters,
      'If ignored, partner confidence and receipt history are damaged.'::text AS consequence,
      'Payout receipt and clean partner dashboard status'::text AS unlocks,
      gi.due_at,
      gi.status,
      gi.source_table,
      gi.source_id,
      gi.created_at
    FROM public.growth_campaign_intakes gi
    WHERE gi.app_key = clean_app_key
      AND gi.intake_type = 'payout'
      AND gi.status IN ('scheduled', 'processing')
      AND (target_person_id IS NULL OR gi.person_id = target_person_id)
  ) queued_actions
  ORDER BY
    CASE queued_actions.priority
      WHEN 'urgent' THEN 0
      WHEN 'high' THEN 1
      WHEN 'normal' THEN 2
      ELSE 3
    END,
    queued_actions.due_at NULLS LAST,
    queued_actions.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_relationship_quality_score(target_person_id uuid)
RETURNS TABLE (
  score integer,
  strengths text[],
  gaps text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_record public.growth_people%ROWTYPE;
  score_value integer := 0;
  strength_list text[] := ARRAY[]::text[];
  gap_list text[] := ARRAY[]::text[];
  timeline_count integer := 0;
  open_task_count integer := 0;
  intake_count integer := 0;
BEGIN
  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE id = target_person_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship profile was not found';
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND person_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Relationship quality access denied';
  END IF;

  SELECT count(*) INTO timeline_count
  FROM public.relationship_timeline rt
  WHERE rt.person_id = target_person_id;

  SELECT count(*) INTO intake_count
  FROM public.growth_campaign_intakes gi
  WHERE gi.person_id = target_person_id;

  SELECT count(*) INTO open_task_count
  FROM public.growth_followup_tasks gt
  JOIN public.growth_campaign_intakes gi ON gi.id = gt.intake_id
  WHERE gi.person_id = target_person_id
    AND gt.status IN ('open', 'in_progress', 'waiting');

  IF person_record.email IS NOT NULL OR person_record.phone IS NOT NULL THEN
    score_value := score_value + 15;
    strength_list := array_append(strength_list, 'Contact method captured');
  ELSE
    gap_list := array_append(gap_list, 'Add email or phone');
  END IF;

  IF person_record.lead_source IS NOT NULL OR person_record.campaign_key IS NOT NULL THEN
    score_value := score_value + 15;
    strength_list := array_append(strength_list, 'Source is known');
  ELSE
    gap_list := array_append(gap_list, 'Capture lead source or campaign');
  END IF;

  IF intake_count > 0 THEN
    score_value := score_value + 15;
    strength_list := array_append(strength_list, 'Connected to an active workflow');
  ELSE
    gap_list := array_append(gap_list, 'Connect this person to a workflow');
  END IF;

  IF open_task_count > 0 THEN
    score_value := score_value + 15;
    strength_list := array_append(strength_list, 'Next action assigned');
  ELSE
    gap_list := array_append(gap_list, 'Assign the next best action');
  END IF;

  IF person_record.preferred_locale IS NOT NULL THEN
    score_value := score_value + 10;
    strength_list := array_append(strength_list, 'Language preference set');
  ELSE
    gap_list := array_append(gap_list, 'Set language preference');
  END IF;

  IF person_record.duplicate_warning IS FALSE THEN
    score_value := score_value + 10;
    strength_list := array_append(strength_list, 'No duplicate warning');
  ELSE
    gap_list := array_append(gap_list, 'Clear duplicate warning');
  END IF;

  IF person_record.consent <> '{}'::jsonb OR person_record.communication_preferences <> '{}'::jsonb THEN
    score_value := score_value + 10;
    strength_list := array_append(strength_list, 'Consent or communication preferences captured');
  ELSE
    gap_list := array_append(gap_list, 'Capture consent or communication preference');
  END IF;

  IF timeline_count >= 2 THEN
    score_value := score_value + 10;
    strength_list := array_append(strength_list, 'Timeline has useful history');
  ELSE
    gap_list := array_append(gap_list, 'Build more timeline history');
  END IF;

  score := least(score_value, 100);
  strengths := strength_list;
  gaps := gap_list;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_relationship_360(target_person_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_record public.growth_people%ROWTYPE;
  quality_record record;
  timeline_payload jsonb;
  actions_payload jsonb;
  notes_payload jsonb;
  counts_payload jsonb;
  financials_payload jsonb;
BEGIN
  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE id = target_person_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Relationship profile was not found';
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND person_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Relationship 360 access denied';
  END IF;

  SELECT *
  INTO quality_record
  FROM public.compute_relationship_quality_score(target_person_id);

  SELECT coalesce(jsonb_agg(to_jsonb(rt) ORDER BY rt.timeline_at DESC), '[]'::jsonb)
  INTO timeline_payload
  FROM (
    SELECT *
    FROM public.relationship_timeline rt
    WHERE rt.person_id = target_person_id
    ORDER BY rt.timeline_at DESC
    LIMIT 50
  ) rt;

  SELECT coalesce(jsonb_agg(to_jsonb(na)), '[]'::jsonb)
  INTO actions_payload
  FROM (
    SELECT *
    FROM public.get_relationship_next_actions(person_record.app_key, target_person_id)
    LIMIT 20
  ) na;

  SELECT coalesce(jsonb_agg(to_jsonb(rn) ORDER BY rn.created_at DESC), '[]'::jsonb)
  INTO notes_payload
  FROM (
    SELECT *
    FROM public.relationship_notes rn
    WHERE rn.person_id = target_person_id
    ORDER BY rn.created_at DESC
    LIMIT 20
  ) rn;

  SELECT jsonb_build_object(
    'intakes', count(DISTINCT gi.id),
    'open_tasks', count(gt.id) FILTER (WHERE gt.status IN ('open', 'in_progress', 'waiting')),
    'events', (
      SELECT count(*)
      FROM public.growth_events ge
      WHERE ge.person_id = target_person_id
    )
  )
  INTO counts_payload
  FROM public.growth_campaign_intakes gi
  LEFT JOIN public.growth_followup_tasks gt ON gt.intake_id = gi.id
  WHERE gi.person_id = target_person_id;

  SELECT jsonb_build_object(
    'credits', coalesce(sum(gi.credit_amount), 0),
    'payouts', coalesce(sum(gi.payout_amount), 0),
    'value', coalesce(sum(gi.value_amount), 0),
    'currency', coalesce(max(gi.currency), 'BRL')
  )
  INTO financials_payload
  FROM public.growth_campaign_intakes gi
  WHERE gi.person_id = target_person_id;

  RETURN jsonb_build_object(
    'profile', to_jsonb(person_record),
    'quality', jsonb_build_object(
      'score', quality_record.score,
      'strengths', quality_record.strengths,
      'gaps', quality_record.gaps
    ),
    'counts', counts_payload,
    'financials', financials_payload,
    'timeline', timeline_payload,
    'next_actions', actions_payload,
    'notes', notes_payload
  );
END;
$$;

INSERT INTO public.relationship_saved_views (
  app_key,
  owner_id,
  view_key,
  name,
  description,
  filters,
  is_shared
)
SELECT
  app.app_key,
  NULL,
  view_data.view_key,
  view_data.name,
  view_data.description,
  view_data.filters,
  true
FROM (VALUES ('casa'), ('medical'), ('legal')) AS app(app_key)
CROSS JOIN (
  VALUES
    ('hot_promo_leads', 'Hot promo leads', 'Promo leads that need human follow-up.', '{"intake_type":"promo_lead","status":["new","redeemed"]}'::jsonb),
    ('partners_pending_approval', 'Partners pending approval', 'Influencers and partners waiting for staff review.', '{"intake_type":"partner_application","status":["submitted","under_review"]}'::jsonb),
    ('referral_credits_pending', 'Referral credits pending payment', 'Referrals that may need credit approval or payout review.', '{"intake_type":"referral","status":["active","credited"]}'::jsonb),
    ('testimonials_needing_approval', 'Testimonials needing approval', 'Google review and video testimonial credits awaiting review.', '{"intake_type":"testimonial","status":["pending_review"]}'::jsonb),
    ('duplicate_warnings', 'Duplicate warnings', 'Records that must be cleared before payout or credit.', '{"duplicate_warning":true}'::jsonb),
    ('portuguese_leads_this_week', 'Portuguese leads this week', 'Portuguese-language leads captured this week.', '{"language":"pt","date_range":"this_week"}'::jsonb)
) AS view_data(view_key, name, description, filters)
ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relationship_saved_views TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relationship_next_actions(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_relationship_quality_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_relationship_360(uuid) TO authenticated;
