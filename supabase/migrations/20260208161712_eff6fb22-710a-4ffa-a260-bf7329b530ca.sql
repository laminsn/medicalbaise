
-- ============================================================
-- CRITICAL SECURITY FIX: Lock down exposed sensitive data
-- ============================================================

-- 1. PROFILES: Restrict to owner-only (use profiles_public view for public data)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);

-- 2. PROVIDERS: Create restrictive SELECT (only basic info public, sensitive fields hidden via view)
-- providers_public view already exists for safe public access

-- 3. MEDICAL RECORDS: Patient + authorized provider only
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patients can view their medical records" ON public.medical_records;
DROP POLICY IF EXISTS "Providers can manage patient records" ON public.medical_records;
CREATE POLICY "Patients can view their medical records" ON public.medical_records FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Providers can manage patient records" ON public.medical_records FOR ALL USING (
  provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
);

-- 4. PATIENT CONSENTS: Patient + authorized provider only
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patients can manage own consents" ON public.patient_consents;
DROP POLICY IF EXISTS "Providers can view patient consents" ON public.patient_consents;
CREATE POLICY "Patients can manage own consents" ON public.patient_consents FOR ALL USING (auth.uid() = patient_id);
CREATE POLICY "Providers can view patient consents" ON public.patient_consents FOR SELECT USING (
  provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
);

-- 5. APPOINTMENTS: Owner only + provider respondents
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Appointments viewable by everyone" ON public.appointments;
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);

-- 6. NOTIFICATIONS: Owner only
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Notifications viewable by everyone" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- 7. APPOINTMENT REMINDERS: Patient + provider only
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Patients can view their reminders" ON public.appointment_reminders;
DROP POLICY IF EXISTS "Providers can manage reminders" ON public.appointment_reminders;
CREATE POLICY "Patients can view their reminders" ON public.appointment_reminders FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Providers can manage reminders" ON public.appointment_reminders FOR ALL USING (
  provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
);

-- 8. USER_ROLES: Protect against privilege escalation
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Only admins can manage roles" ON public.user_roles FOR ALL USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 9. AUDIT LOGS: Make append-only, admin-viewable + self-viewable
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (
  auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role)
);
-- Audit log inserts via security definer function only (log_audit_event)

-- 10. VIDEO SESSIONS: Participants only
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'video_sessions' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Video sessions viewable by everyone" ON public.video_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "Participants can view video sessions" ON public.video_sessions';
    EXECUTE 'CREATE POLICY "Participants can view video sessions" ON public.video_sessions FOR SELECT USING (
      auth.uid() = patient_id OR auth.uid() = provider_id OR
      provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    )';
  END IF;
END $$;

-- 11. PAYMENT MILESTONES: Participants only
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Payment milestones viewable by everyone" ON public.payment_milestones;
DROP POLICY IF EXISTS "Participants can view payment milestones" ON public.payment_milestones;
DROP POLICY IF EXISTS "Participants can manage payment milestones" ON public.payment_milestones;
CREATE POLICY "Participants can view payment milestones" ON public.payment_milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM active_jobs WHERE active_jobs.id = payment_milestones.active_job_id 
    AND (active_jobs.customer_id = auth.uid() OR active_jobs.provider_id = auth.uid()))
);
CREATE POLICY "Participants can manage payment milestones" ON public.payment_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM active_jobs WHERE active_jobs.id = payment_milestones.active_job_id 
    AND (active_jobs.customer_id = auth.uid() OR active_jobs.provider_id = auth.uid()))
);

-- 12. CONVERSION EVENTS: Provider-only access
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can view own events" ON public.conversion_events;
DROP POLICY IF EXISTS "Anyone can create events" ON public.conversion_events;
CREATE POLICY "Providers can view own events" ON public.conversion_events FOR SELECT USING (
  provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
);
CREATE POLICY "Anyone can create events" ON public.conversion_events FOR INSERT WITH CHECK (true);

-- 13. PROVIDER ADDONS: Public read, owner manage
ALTER TABLE public.provider_addons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active addons" ON public.provider_addons;
DROP POLICY IF EXISTS "Providers can manage own addons" ON public.provider_addons;
CREATE POLICY "Anyone can view active addons" ON public.provider_addons FOR SELECT USING (is_active = true);
CREATE POLICY "Providers can manage own addons" ON public.provider_addons FOR ALL USING (
  provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
);
