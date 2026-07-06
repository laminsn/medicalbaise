-- Provider CRM, quote management, project management, and browser push subscription foundation.

CREATE OR REPLACE FUNCTION public.update_provider_crm_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.provider_crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_id uuid,
  created_by uuid NOT NULL,
  full_name text NOT NULL,
  company_name text,
  email text,
  phone text,
  relationship_type text NOT NULL DEFAULT 'lead'
    CHECK (relationship_type IN ('lead', 'client', 'past_client', 'partner', 'vendor', 'sponsor', 'other')),
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'active', 'won', 'lost', 'inactive')),
  source text NOT NULL DEFAULT 'portal'
    CHECK (source IN ('portal', 'referral', 'google', 'social', 'campaign', 'repeat', 'manual', 'other')),
  priority text NOT NULL DEFAULT 'warm'
    CHECK (priority IN ('cold', 'warm', 'hot', 'urgent', 'vip')),
  preferred_channel text NOT NULL DEFAULT 'portal'
    CHECK (preferred_channel IN ('portal', 'email', 'whatsapp', 'phone', 'sms')),
  estimated_value numeric NOT NULL DEFAULT 0 CHECK (estimated_value >= 0),
  lifetime_value numeric NOT NULL DEFAULT 0 CHECK (lifetime_value >= 0),
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_crm_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  stage text NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new', 'qualified', 'estimate', 'proposal', 'negotiation', 'won', 'lost', 'paused')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'won', 'lost', 'paused', 'archived')),
  estimated_value numeric NOT NULL DEFAULT 0 CHECK (estimated_value >= 0),
  probability integer NOT NULL DEFAULT 25 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date date,
  next_step text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_quote_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.provider_crm_opportunities(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  quote_number text,
  title text NOT NULL,
  service_scope text NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount numeric NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  tax_amount numeric NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted')),
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS public.provider_quote_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.set_provider_quote_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.quote_number IS NULL OR length(trim(NEW.quote_number)) = 0 THEN
    NEW.quote_number := 'QUOTE-' || to_char(now(), 'YYYYMMDD') || '-' ||
      lpad(nextval('public.provider_quote_number_seq')::text, 6, '0');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.provider_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.provider_quote_records(id) ON DELETE SET NULL,
  active_job_id uuid REFERENCES public.active_jobs(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  project_name text NOT NULL,
  description text,
  project_status text NOT NULL DEFAULT 'planning'
    CHECK (project_status IN ('planning', 'scheduled', 'in_progress', 'waiting_client', 'on_hold', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  budget numeric NOT NULL DEFAULT 0 CHECK (budget >= 0),
  spent_amount numeric NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
  completion_percent integer NOT NULL DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  start_date date,
  due_date date,
  next_milestone text,
  risk_level text NOT NULL DEFAULT 'normal'
    CHECK (risk_level IN ('low', 'normal', 'watch', 'high')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.provider_projects(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  task_status text NOT NULL DEFAULT 'todo'
    CHECK (task_status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.provider_crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.provider_crm_contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.provider_crm_opportunities(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES public.provider_quote_records(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.provider_projects(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'note'
    CHECK (activity_type IN ('note', 'call', 'email', 'whatsapp', 'portal_message', 'meeting', 'task', 'follow_up', 'campaign', 'payment', 'review_request')),
  subject text NOT NULL,
  body text,
  channel text NOT NULL DEFAULT 'portal'
    CHECK (channel IN ('portal', 'email', 'whatsapp', 'phone', 'sms')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'scheduled', 'completed', 'cancelled')),
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  subscription_json jsonb NOT NULL,
  user_agent text,
  device_label text,
  is_active boolean NOT NULL DEFAULT true,
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.push_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.web_push_subscriptions(id) ON DELETE SET NULL,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error_message text,
  sent_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_integrations DROP CONSTRAINT IF EXISTS provider_integrations_category_check;
ALTER TABLE public.provider_integrations
  ADD CONSTRAINT provider_integrations_category_check
  CHECK (category IN ('email', 'calendar', 'storage', 'productivity', 'ai', 'accounting', 'banking', 'payments', 'messaging', 'social'));

CREATE INDEX IF NOT EXISTS idx_provider_crm_contacts_provider ON public.provider_crm_contacts(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_crm_contacts_next_followup ON public.provider_crm_contacts(provider_id, next_follow_up_at);
CREATE INDEX IF NOT EXISTS idx_provider_crm_opportunities_provider ON public.provider_crm_opportunities(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_quote_records_provider ON public.provider_quote_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_projects_provider ON public.provider_projects(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_project_tasks_project ON public.provider_project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_provider_crm_activities_provider ON public.provider_crm_activities(provider_id, due_at);
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_user ON public.web_push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_notification_deliveries_user ON public.push_notification_deliveries(user_id);

DROP TRIGGER IF EXISTS update_provider_crm_contacts_updated_at ON public.provider_crm_contacts;
CREATE TRIGGER update_provider_crm_contacts_updated_at
  BEFORE UPDATE ON public.provider_crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS update_provider_crm_opportunities_updated_at ON public.provider_crm_opportunities;
CREATE TRIGGER update_provider_crm_opportunities_updated_at
  BEFORE UPDATE ON public.provider_crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS set_provider_quote_number_trigger ON public.provider_quote_records;
CREATE TRIGGER set_provider_quote_number_trigger
  BEFORE INSERT ON public.provider_quote_records
  FOR EACH ROW EXECUTE FUNCTION public.set_provider_quote_number();

DROP TRIGGER IF EXISTS update_provider_quote_records_updated_at ON public.provider_quote_records;
CREATE TRIGGER update_provider_quote_records_updated_at
  BEFORE UPDATE ON public.provider_quote_records
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS update_provider_projects_updated_at ON public.provider_projects;
CREATE TRIGGER update_provider_projects_updated_at
  BEFORE UPDATE ON public.provider_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS update_provider_project_tasks_updated_at ON public.provider_project_tasks;
CREATE TRIGGER update_provider_project_tasks_updated_at
  BEFORE UPDATE ON public.provider_project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS update_provider_crm_activities_updated_at ON public.provider_crm_activities;
CREATE TRIGGER update_provider_crm_activities_updated_at
  BEFORE UPDATE ON public.provider_crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

DROP TRIGGER IF EXISTS update_web_push_subscriptions_updated_at ON public.web_push_subscriptions;
CREATE TRIGGER update_web_push_subscriptions_updated_at
  BEFORE UPDATE ON public.web_push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

ALTER TABLE public.provider_crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_quote_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own CRM contacts" ON public.provider_crm_contacts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_crm_contacts.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_crm_contacts.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own CRM opportunities" ON public.provider_crm_opportunities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_crm_opportunities.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_crm_opportunities.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own quote records" ON public.provider_quote_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_quote_records.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_quote_records.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own projects" ON public.provider_projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_projects.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_projects.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own project tasks" ON public.provider_project_tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_project_tasks.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_project_tasks.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Providers manage own CRM activities" ON public.provider_crm_activities
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_crm_activities.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_crm_activities.provider_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Users manage own web push subscriptions" ON public.web_push_subscriptions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view own push delivery records" ON public.push_notification_deliveries
  FOR SELECT USING (user_id = auth.uid());
