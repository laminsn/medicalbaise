-- Product intelligence, value-focused upsells/downsell, and offer analytics.
-- Creates a product catalog that feeds promotions, staff recommendations,
-- client add-ons, partner recommendations, and retargeting campaigns.

CREATE TABLE IF NOT EXISTS public.platform_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  product_key text NOT NULL,
  name text NOT NULL,
  short_name text,
  description text,
  product_family text NOT NULL DEFAULT 'core'
    CHECK (product_family IN ('core', 'premium', 'provider_growth', 'payments', 'operations', 'marketing', 'verification', 'partner', 'legal', 'medical', 'custom')),
  audience text NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'client', 'provider', 'partner', 'staff')),
  tier_level text NOT NULL DEFAULT 'entry'
    CHECK (tier_level IN ('free', 'entry', 'growth', 'premium', 'advanced', 'enterprise')),
  price_amount numeric NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
  currency text NOT NULL DEFAULT 'BRL',
  billing_interval text NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('one_time', 'monthly', 'annual', 'usage', 'custom')),
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 100,
  value_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  use_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, product_key)
);

CREATE INDEX IF NOT EXISTS idx_platform_products_app_active
  ON public.platform_products(app_key, is_active, audience, display_order);

CREATE INDEX IF NOT EXISTS idx_platform_products_family
  ON public.platform_products(app_key, product_family, tier_level);

DROP TRIGGER IF EXISTS update_platform_products_updated_at ON public.platform_products;
CREATE TRIGGER update_platform_products_updated_at
  BEFORE UPDATE ON public.platform_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.platform_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view active platform products" ON public.platform_products;
CREATE POLICY "Authenticated users view active platform products"
ON public.platform_products FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage platform products" ON public.platform_products;
CREATE POLICY "Admins manage platform products"
ON public.platform_products FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.client_product_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  registration_type text NOT NULL DEFAULT 'self_serve'
    CHECK (registration_type IN ('self_serve', 'staff_added', 'partner_recommended', 'promo', 'migration', 'manual')),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'trial', 'active', 'paused', 'cancelled', 'expired', 'declined')),
  source text,
  source_table text,
  source_id text,
  started_at timestamptz,
  ended_at timestamptz,
  renewal_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_product_registrations_person
  ON public.client_product_registrations(app_key, person_id, status);

CREATE INDEX IF NOT EXISTS idx_client_product_registrations_user
  ON public.client_product_registrations(app_key, user_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_product_registrations_person_product_active
  ON public.client_product_registrations(app_key, person_id, product_key)
  WHERE person_id IS NOT NULL AND status IN ('requested', 'trial', 'active', 'paused');

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_product_registrations_user_product_active
  ON public.client_product_registrations(app_key, user_id, product_key)
  WHERE user_id IS NOT NULL AND status IN ('requested', 'trial', 'active', 'paused');

DROP TRIGGER IF EXISTS update_client_product_registrations_updated_at ON public.client_product_registrations;
CREATE TRIGGER update_client_product_registrations_updated_at
  BEFORE UPDATE ON public.client_product_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.client_product_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own product registrations" ON public.client_product_registrations;
CREATE POLICY "Users view own product registrations"
ON public.client_product_registrations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users request own product registrations" ON public.client_product_registrations;
CREATE POLICY "Users request own product registrations"
ON public.client_product_registrations FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage product registrations" ON public.client_product_registrations;
CREATE POLICY "Admins manage product registrations"
ON public.client_product_registrations FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.product_offer_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  rule_key text NOT NULL,
  name text NOT NULL,
  audience text NOT NULL DEFAULT 'client'
    CHECK (audience IN ('all', 'client', 'provider', 'partner', 'staff')),
  source_product_key text,
  recommended_product_key text NOT NULL,
  relation_type text NOT NULL DEFAULT 'cross_sell'
    CHECK (relation_type IN ('upsell', 'downsell', 'cross_sell', 'welcome', 'congrats', 'retargeting')),
  trigger_event text NOT NULL DEFAULT 'profile_created'
    CHECK (trigger_event IN ('profile_created', 'product_registered', 'promo_redeemed', 'service_completed', 'payment_success', 'partner_approved', 'manual')),
  priority integer NOT NULL DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
  cooldown_days integer NOT NULL DEFAULT 14 CHECK (cooldown_days >= 0),
  recommendation_title text NOT NULL,
  recommendation_reason text NOT NULL,
  value_message text NOT NULL,
  welcome_message text,
  congrats_message text,
  downsell_message text,
  email_subject text,
  email_body text,
  whatsapp_body text,
  eligibility_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, rule_key)
);

CREATE INDEX IF NOT EXISTS idx_product_offer_rules_app_active
  ON public.product_offer_rules(app_key, status, audience, priority DESC);

DROP TRIGGER IF EXISTS update_product_offer_rules_updated_at ON public.product_offer_rules;
CREATE TRIGGER update_product_offer_rules_updated_at
  BEFORE UPDATE ON public.product_offer_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_offer_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage product offer rules" ON public.product_offer_rules;
CREATE POLICY "Admins manage product offer rules"
ON public.product_offer_rules FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Authenticated users view active product offer rules" ON public.product_offer_rules;
CREATE POLICY "Authenticated users view active product offer rules"
ON public.product_offer_rules FOR SELECT TO authenticated
USING (status = 'active' OR public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.product_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  person_id uuid REFERENCES public.growth_people(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recommended_product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  recommended_product_key text NOT NULL,
  source_product_key text,
  offer_rule_id uuid REFERENCES public.product_offer_rules(id) ON DELETE SET NULL,
  relation_type text NOT NULL DEFAULT 'cross_sell'
    CHECK (relation_type IN ('upsell', 'downsell', 'cross_sell', 'welcome', 'congrats', 'retargeting')),
  priority integer NOT NULL DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'queued', 'sent', 'viewed', 'accepted', 'declined', 'dismissed', 'expired')),
  recommendation_title text NOT NULL,
  value_message text NOT NULL,
  next_step text NOT NULL DEFAULT 'Review recommendation',
  trigger_reason text,
  score integer NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  assigned_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_sent_at timestamptz,
  accepted_at timestamptz,
  dismissed_at timestamptz,
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_person
  ON public.product_recommendations(app_key, person_id, status, priority DESC);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_app_status
  ON public.product_recommendations(app_key, status, relation_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_recommendations_open_unique
  ON public.product_recommendations(app_key, person_id, recommended_product_key, relation_type)
  WHERE status IN ('pending', 'queued', 'sent', 'viewed');

DROP TRIGGER IF EXISTS update_product_recommendations_updated_at ON public.product_recommendations;
CREATE TRIGGER update_product_recommendations_updated_at
  BEFORE UPDATE ON public.product_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own product recommendations" ON public.product_recommendations;
CREATE POLICY "Users view own product recommendations"
ON public.product_recommendations FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage product recommendations" ON public.product_recommendations;
CREATE POLICY "Admins manage product recommendations"
ON public.product_recommendations FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.product_offer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  recommendation_id uuid REFERENCES public.product_recommendations(id) ON DELETE CASCADE,
  person_id uuid REFERENCES public.growth_people(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_key text NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('generated', 'queued', 'sent', 'viewed', 'clicked', 'requested', 'accepted', 'declined', 'dismissed', 'expired', 'note')),
  channel text DEFAULT 'portal'
    CHECK (channel IN ('portal', 'email', 'whatsapp', 'sms', 'push', 'staff', 'partner')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_offer_events_recommendation
  ON public.product_offer_events(recommendation_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_offer_events_app
  ON public.product_offer_events(app_key, event_type, occurred_at DESC);

ALTER TABLE public.product_offer_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage product offer events" ON public.product_offer_events;
CREATE POLICY "Admins manage product offer events"
ON public.product_offer_events FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Users view own product offer events" ON public.product_offer_events;
CREATE POLICY "Users view own product offer events"
ON public.product_offer_events FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin_or_moderator());

ALTER TABLE public.promotional_campaigns
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.platform_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_key text,
  ADD COLUMN IF NOT EXISTS offer_strategy text DEFAULT 'promotion'
    CHECK (offer_strategy IN ('promotion', 'upsell', 'downsell', 'cross_sell', 'welcome', 'congrats', 'retargeting'));

CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_product
  ON public.promotional_campaigns(app_key, product_key, offer_strategy);

CREATE OR REPLACE FUNCTION public.product_audience_for_person(person_type text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(person_type, 'unknown'))
    WHEN 'provider' THEN 'provider'
    WHEN 'partner' THEN 'partner'
    WHEN 'influencer' THEN 'partner'
    WHEN 'staff' THEN 'staff'
    ELSE 'client'
  END;
$$;

CREATE OR REPLACE FUNCTION public.register_person_product(
  target_person_id uuid,
  target_product_key text,
  target_status text DEFAULT 'requested',
  target_source text DEFAULT 'manual',
  target_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_record public.growth_people%ROWTYPE;
  product_record public.platform_products%ROWTYPE;
  clean_status text := lower(coalesce(nullif(target_status, ''), 'requested'));
  registration_id uuid;
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
    RAISE EXCEPTION 'Product registration access denied';
  END IF;

  IF clean_status NOT IN ('requested', 'trial', 'active', 'paused', 'cancelled', 'expired', 'declined') THEN
    clean_status := 'requested';
  END IF;

  SELECT *
  INTO product_record
  FROM public.platform_products
  WHERE app_key = person_record.app_key
    AND product_key = target_product_key
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active product was not found';
  END IF;

  INSERT INTO public.client_product_registrations (
    app_key,
    product_id,
    product_key,
    person_id,
    user_id,
    registration_type,
    status,
    source,
    started_at,
    metadata
  )
  VALUES (
    person_record.app_key,
    product_record.id,
    product_record.product_key,
    person_record.id,
    person_record.user_id,
    CASE WHEN target_source = 'partner' THEN 'partner_recommended' WHEN target_source = 'promo' THEN 'promo' ELSE 'staff_added' END,
    clean_status,
    target_source,
    CASE WHEN clean_status IN ('trial', 'active') THEN now() ELSE NULL END,
    coalesce(target_metadata, '{}'::jsonb)
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO registration_id;

  IF registration_id IS NULL THEN
    SELECT id
    INTO registration_id
    FROM public.client_product_registrations
    WHERE app_key = person_record.app_key
      AND person_id = person_record.id
      AND product_key = product_record.product_key
      AND status IN ('requested', 'trial', 'active', 'paused')
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  UPDATE public.product_recommendations
  SET
    status = 'accepted',
    accepted_at = now(),
    metadata = metadata || jsonb_build_object('accepted_from_registration_id', registration_id)
  WHERE app_key = person_record.app_key
    AND person_id = person_record.id
    AND recommended_product_key = product_record.product_key
    AND status IN ('pending', 'queued', 'sent', 'viewed');

  RETURN registration_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_recommendations_for_person(target_person_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  person_record public.growth_people%ROWTYPE;
  target_audience text;
  rule_record record;
  product_record public.platform_products%ROWTYPE;
  generated_count integer := 0;
  recommendation_id uuid;
BEGIN
  SELECT *
  INTO person_record
  FROM public.growth_people
  WHERE id = target_person_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND person_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Product recommendation access denied';
  END IF;

  target_audience := public.product_audience_for_person(person_record.person_type);

  FOR rule_record IN
    SELECT r.*
    FROM public.product_offer_rules r
    WHERE r.app_key = person_record.app_key
      AND r.status = 'active'
      AND r.audience IN ('all', target_audience)
      AND NOT EXISTS (
        SELECT 1
        FROM public.client_product_registrations cpr
        WHERE cpr.app_key = r.app_key
          AND cpr.person_id = person_record.id
          AND cpr.product_key = r.recommended_product_key
          AND cpr.status IN ('requested', 'trial', 'active', 'paused')
      )
      AND (
        r.source_product_key IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.client_product_registrations cpr
          WHERE cpr.app_key = r.app_key
            AND cpr.person_id = person_record.id
            AND cpr.product_key = r.source_product_key
            AND cpr.status IN ('trial', 'active', 'paused')
        )
      )
    ORDER BY r.priority DESC, r.created_at
  LOOP
    SELECT *
    INTO product_record
    FROM public.platform_products
    WHERE app_key = person_record.app_key
      AND product_key = rule_record.recommended_product_key
      AND is_active = true;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.product_recommendations pr
      WHERE pr.app_key = person_record.app_key
        AND pr.person_id = person_record.id
        AND pr.recommended_product_key = rule_record.recommended_product_key
        AND pr.relation_type = rule_record.relation_type
        AND pr.status IN ('pending', 'queued', 'sent', 'viewed')
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.product_recommendations (
      app_key,
      person_id,
      user_id,
      recommended_product_id,
      recommended_product_key,
      source_product_key,
      offer_rule_id,
      relation_type,
      priority,
      recommendation_title,
      value_message,
      next_step,
      trigger_reason,
      score,
      expires_at,
      metadata
    )
    VALUES (
      person_record.app_key,
      person_record.id,
      person_record.user_id,
      product_record.id,
      product_record.product_key,
      rule_record.source_product_key,
      rule_record.id,
      rule_record.relation_type,
      rule_record.priority,
      rule_record.recommendation_title,
      rule_record.value_message,
      CASE
        WHEN target_audience = 'provider' THEN 'Offer this as a business growth add-on'
        WHEN target_audience = 'partner' THEN 'Recommend this from the partner dashboard'
        ELSE 'Show why this improves their next service experience'
      END,
      rule_record.recommendation_reason,
      rule_record.priority,
      now() + make_interval(days => greatest(rule_record.cooldown_days, 7)),
      jsonb_build_object(
        'product_name', product_record.name,
        'product_family', product_record.product_family,
        'audience', target_audience,
        'email_subject', rule_record.email_subject,
        'email_body', rule_record.email_body,
        'whatsapp_body', rule_record.whatsapp_body,
        'welcome_message', rule_record.welcome_message,
        'congrats_message', rule_record.congrats_message,
        'downsell_message', rule_record.downsell_message
      )
    )
    RETURNING id INTO recommendation_id;

    INSERT INTO public.product_offer_events (
      app_key,
      recommendation_id,
      person_id,
      user_id,
      product_key,
      event_type,
      channel,
      metadata
    )
    VALUES (
      person_record.app_key,
      recommendation_id,
      person_record.id,
      person_record.user_id,
      product_record.product_key,
      'generated',
      'portal',
      jsonb_build_object('rule_key', rule_record.rule_key, 'relation_type', rule_record.relation_type)
    );

    generated_count := generated_count + 1;
  END LOOP;

  RETURN generated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_recommendations_for_app(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  people_processed integer,
  recommendations_generated integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  person_record record;
  people_count integer := 0;
  rec_count integer := 0;
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can sync product recommendations';
  END IF;

  FOR person_record IN
    SELECT id
    FROM public.growth_people
    WHERE app_key = clean_app_key
  LOOP
    rec_count := rec_count + public.sync_product_recommendations_for_person(person_record.id);
    people_count := people_count + 1;
  END LOOP;

  people_processed := people_count;
  recommendations_generated := rec_count;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_product_recommendations_from_person()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_product_recommendations_for_person(NEW.id);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_recommendations_from_person_sync ON public.growth_people;
CREATE TRIGGER product_recommendations_from_person_sync
  AFTER INSERT OR UPDATE OF person_type, lead_source, campaign_key, duplicate_warning
  ON public.growth_people
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_recommendations_from_person();

CREATE OR REPLACE FUNCTION public.sync_product_recommendations_from_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('requested', 'trial', 'active', 'paused') THEN
    UPDATE public.product_recommendations
    SET
      status = CASE WHEN NEW.status IN ('trial', 'active') THEN 'accepted' ELSE status END,
      accepted_at = CASE WHEN NEW.status IN ('trial', 'active') THEN coalesce(accepted_at, now()) ELSE accepted_at END,
      metadata = metadata || jsonb_build_object('linked_registration_id', NEW.id, 'registration_status', NEW.status)
    WHERE app_key = NEW.app_key
      AND person_id = NEW.person_id
      AND recommended_product_key = NEW.product_key
      AND status IN ('pending', 'queued', 'sent', 'viewed');

    IF NEW.person_id IS NOT NULL THEN
      PERFORM public.sync_product_recommendations_for_person(NEW.person_id);
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_recommendations_from_registration_sync ON public.client_product_registrations;
CREATE TRIGGER product_recommendations_from_registration_sync
  AFTER INSERT OR UPDATE OF status, product_key
  ON public.client_product_registrations
  FOR EACH ROW EXECUTE FUNCTION public.sync_product_recommendations_from_registration();

CREATE OR REPLACE FUNCTION public.mark_product_recommendation_status(
  target_recommendation_id uuid,
  next_status text,
  event_channel text DEFAULT 'staff',
  event_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.product_recommendations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_status text := lower(coalesce(next_status, 'queued'));
  clean_channel text := lower(coalesce(event_channel, 'staff'));
  recommendation_record public.product_recommendations%ROWTYPE;
BEGIN
  IF clean_status NOT IN ('pending', 'queued', 'sent', 'viewed', 'accepted', 'declined', 'dismissed', 'expired') THEN
    RAISE EXCEPTION 'Unsupported recommendation status';
  END IF;

  IF clean_channel NOT IN ('portal', 'email', 'whatsapp', 'sms', 'push', 'staff', 'partner') THEN
    clean_channel := 'staff';
  END IF;

  SELECT *
  INTO recommendation_record
  FROM public.product_recommendations
  WHERE id = target_recommendation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recommendation was not found';
  END IF;

  IF NOT public.is_admin_or_moderator()
    AND recommendation_record.user_id IS DISTINCT FROM auth.uid()
  THEN
    RAISE EXCEPTION 'Recommendation update access denied';
  END IF;

  UPDATE public.product_recommendations
  SET
    status = clean_status,
    last_sent_at = CASE WHEN clean_status = 'sent' THEN now() ELSE last_sent_at END,
    accepted_at = CASE WHEN clean_status = 'accepted' THEN coalesce(accepted_at, now()) ELSE accepted_at END,
    dismissed_at = CASE WHEN clean_status IN ('declined', 'dismissed', 'expired') THEN coalesce(dismissed_at, now()) ELSE dismissed_at END,
    metadata = metadata || coalesce(event_metadata, '{}'::jsonb)
  WHERE id = target_recommendation_id
  RETURNING * INTO recommendation_record;

  INSERT INTO public.product_offer_events (
    app_key,
    recommendation_id,
    person_id,
    user_id,
    product_key,
    event_type,
    channel,
    metadata
  )
  VALUES (
    recommendation_record.app_key,
    recommendation_record.id,
    recommendation_record.person_id,
    recommendation_record.user_id,
    recommendation_record.recommended_product_key,
    CASE
      WHEN clean_status = 'queued' THEN 'queued'
      WHEN clean_status = 'sent' THEN 'sent'
      WHEN clean_status = 'viewed' THEN 'viewed'
      WHEN clean_status = 'accepted' THEN 'accepted'
      WHEN clean_status = 'declined' THEN 'declined'
      WHEN clean_status = 'dismissed' THEN 'dismissed'
      WHEN clean_status = 'expired' THEN 'expired'
      ELSE 'note'
    END,
    clean_channel,
    coalesce(event_metadata, '{}'::jsonb)
  );

  RETURN recommendation_record;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_product_intelligence_summary(target_app_key text DEFAULT NULL)
RETURNS TABLE (
  metric_key text,
  metric_label text,
  metric_value numeric,
  detail text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
BEGIN
  IF NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can view product intelligence';
  END IF;

  RETURN QUERY
  SELECT 'active_products'::text, 'Active products'::text, count(*)::numeric, 'Products available to staff, partners, or clients'::text
  FROM public.platform_products p
  WHERE p.app_key = clean_app_key
    AND p.is_active = true;

  RETURN QUERY
  SELECT 'open_recommendations'::text, 'Open recommendations'::text, count(*)::numeric, 'Pending, queued, sent, or viewed product recommendations'::text
  FROM public.product_recommendations pr
  WHERE pr.app_key = clean_app_key
    AND pr.status IN ('pending', 'queued', 'sent', 'viewed');

  RETURN QUERY
  SELECT 'accepted_recommendations'::text, 'Accepted recommendations'::text, count(*)::numeric, 'Recommendations converted into requested, trial, or active products'::text
  FROM public.product_recommendations pr
  WHERE pr.app_key = clean_app_key
    AND pr.status = 'accepted';

  RETURN QUERY
  SELECT 'active_registrations'::text, 'Active product registrations'::text, count(*)::numeric, 'Client/provider products currently requested, trialing, or active'::text
  FROM public.client_product_registrations cpr
  WHERE cpr.app_key = clean_app_key
    AND cpr.status IN ('requested', 'trial', 'active');

  RETURN QUERY
  SELECT 'value_retargeting'::text, 'Value retargeting queue'::text, count(*)::numeric, 'Recommendations ready for value-focused email or WhatsApp follow-up'::text
  FROM public.product_recommendations pr
  WHERE pr.app_key = clean_app_key
    AND pr.relation_type IN ('upsell', 'cross_sell', 'retargeting')
    AND pr.status IN ('pending', 'queued');
END;
$$;

INSERT INTO public.platform_products (
  app_key,
  product_key,
  name,
  short_name,
  description,
  product_family,
  audience,
  tier_level,
  billing_interval,
  display_order,
  value_points,
  use_cases,
  tags,
  metadata
)
VALUES
  ('casa', 'casa_client_premium', 'Casa Baise Premium Access', 'Premium Access', 'Premium tools for service seekers who want clearer provider choice, service history, receipts, and support.', 'premium', 'client', 'entry', 'monthly', 10, '["Save service records and receipts in one place", "Reduce search time with trusted provider workflows", "Keep communication and payment history organized"]'::jsonb, '["Recurring home services", "Proof for taxes or reimbursements", "Families managing multiple providers"]'::jsonb, ARRAY['client','premium','marketplace'], '{}'::jsonb),
  ('casa', 'provider_premium_listing', 'Provider Premium Listing', 'Premium Listing', 'A stronger marketplace presence for service providers who want more trust signals and more qualified clients.', 'provider_growth', 'provider', 'entry', 'monthly', 20, '["Show stronger trust signals", "Improve visibility to qualified clients", "Centralize profile, reviews, and service proof"]'::jsonb, '["New providers", "Growing local businesses", "Providers ready for premium lead flow"]'::jsonb, ARRAY['provider','premium','listing'], '{}'::jsonb),
  ('casa', 'verified_provider_badge', 'Verified Provider Badge', 'Verified Badge', 'Background-check and rating-based verification to help clients choose with more confidence.', 'verification', 'provider', 'growth', 'monthly', 30, '["Build immediate trust", "Signal background-check status", "Support higher-converting profile views"]'::jsonb, '["Trust-sensitive services", "Providers competing on reliability", "Profiles with strong reviews"]'::jsonb, ARRAY['provider','verification','trust'], '{}'::jsonb),
  ('casa', 'provider_revenue_suite', 'Provider Revenue Suite', 'Revenue Suite', 'Business operating tools for quotes, invoices, POS, payments, receipts, refunds, and transaction records.', 'operations', 'provider', 'premium', 'monthly', 40, '["Run quotes, invoices, and payments in one place", "Keep receipts and transaction history organized", "Reduce admin time after each service"]'::jsonb, '["Providers taking payments", "Recurring services", "Teams with subcontractors"]'::jsonb, ARRAY['provider','payments','operations'], '{}'::jsonb),
  ('casa', 'provider_marketing_engine', 'Provider Marketing Engine', 'Marketing Engine', 'Campaign tools for email, WhatsApp, referrals, coupons, reviews, and content that converts.', 'marketing', 'provider', 'advanced', 'monthly', 50, '["Turn completed work into reviews and referrals", "Run value-focused campaigns", "Build repeat service relationships"]'::jsonb, '["Providers ready to grow", "Seasonal campaigns", "Referral-driven businesses"]'::jsonb, ARRAY['provider','marketing','campaigns'], '{}'::jsonb),
  ('casa', 'partner_influencer_campaign', 'Baise Partner and Influencer Campaign', 'Partner Campaign', 'Campaign access for approved partners and creators with links, QR codes, codes, rules, and payout tracking.', 'partner', 'partner', 'entry', 'monthly', 60, '["Track links, QR codes, and custom codes", "See leads, conversions, and payouts", "Promote trusted services with clear rules"]'::jsonb, '["Influencers", "Brokerages", "Community partners"]'::jsonb, ARRAY['partner','influencer','campaign'], '{}'::jsonb),

  ('legal', 'legal_client_premium', 'Legal Baise Premium Access', 'Legal Premium', 'Premium legal-service access for people who want organized provider search, records, documents, and service history.', 'legal', 'client', 'entry', 'monthly', 10, '["Organize legal provider search and service history", "Keep documents, invoices, and receipts together", "Reduce confusion when comparing legal support"]'::jsonb, '["Legal consultations", "Document-heavy matters", "Ongoing provider relationships"]'::jsonb, ARRAY['client','legal','premium'], '{}'::jsonb),
  ('legal', 'legal_document_vault', 'Legal Document Vault and Case Tracking', 'Document Vault', 'A secure structure for documents, sign-offs, notes, and status history tied to legal service workflows.', 'legal', 'client', 'growth', 'monthly', 20, '["Keep matter documents organized", "Track approvals and status", "Preserve proof for future needs"]'::jsonb, '["Contracts", "Immigration-style document packets", "Dispute support records"]'::jsonb, ARRAY['client','legal','documents'], '{}'::jsonb),
  ('legal', 'legal_provider_premium_listing', 'Legal Provider Premium Listing', 'Premium Listing', 'A stronger Legal Baise presence for legal service providers who want more trust and better lead quality.', 'provider_growth', 'provider', 'entry', 'monthly', 30, '["Improve visibility to legal service seekers", "Show stronger profile trust signals", "Connect reviews and services to one profile"]'::jsonb, '["Law firms", "Legal consultants", "Document-service providers"]'::jsonb, ARRAY['provider','legal','listing'], '{}'::jsonb),
  ('legal', 'legal_verified_provider_badge', 'Legal Verified Provider Badge', 'Verified Badge', 'Verification and trust signaling for legal service providers with strong ratings and account standing.', 'verification', 'provider', 'growth', 'monthly', 40, '["Increase client confidence", "Signal verified status", "Support higher-intent inquiries"]'::jsonb, '["Trust-sensitive legal services", "Premium providers", "Profiles with strong reviews"]'::jsonb, ARRAY['provider','legal','verification'], '{}'::jsonb),
  ('legal', 'legal_growth_suite', 'Legal Provider Growth Suite', 'Growth Suite', 'Legal provider tools for lead intake, quotes, invoices, reviews, campaigns, referrals, and client communication.', 'marketing', 'provider', 'premium', 'monthly', 50, '["Manage legal-service leads from one workspace", "Turn completed work into referrals and reviews", "Keep invoices and communications organized"]'::jsonb, '["Legal practices growing online", "Referral-heavy providers", "Providers offering recurring support"]'::jsonb, ARRAY['provider','legal','growth'], '{}'::jsonb),
  ('legal', 'legal_partner_campaign', 'Legal Baise Partner Campaign', 'Partner Campaign', 'Approved partner campaigns for tracked legal support referrals without promising legal outcomes.', 'partner', 'partner', 'entry', 'monthly', 60, '["Track link, QR, and code referrals", "Keep legal claims compliant", "Measure conversions and payout status"]'::jsonb, '["Legal creators", "Community partners", "Professional networks"]'::jsonb, ARRAY['partner','legal','campaign'], '{}'::jsonb),

  ('medical', 'medical_client_premium', 'Medical Baise Premium Access', 'Medical Premium', 'Premium support for people organizing provider search, appointments, records, receipts, and care-related history.', 'medical', 'client', 'entry', 'monthly', 10, '["Organize provider search and appointment history", "Keep service records and receipts together", "Reduce friction when managing ongoing care needs"]'::jsonb, '["Recurring appointments", "Medical support search", "Families coordinating care"]'::jsonb, ARRAY['client','medical','premium'], '{}'::jsonb),
  ('medical', 'medical_records_vault', 'Medical Records Vault and Appointment Tracking', 'Records Vault', 'A structured place for appointment history, uploads, proof, receipts, and care-related service records.', 'medical', 'client', 'growth', 'monthly', 20, '["Keep care documents and receipts organized", "Track appointments and follow-ups", "Preserve proof for reimbursements or future care"]'::jsonb, '["Ongoing care", "Specialist searches", "International patients"]'::jsonb, ARRAY['client','medical','records'], '{}'::jsonb),
  ('medical', 'medical_provider_premium_listing', 'Medical Provider Premium Listing', 'Premium Listing', 'A stronger MDBaise presence for medical providers who want trusted discovery and clearer client communication.', 'provider_growth', 'provider', 'entry', 'monthly', 30, '["Improve visibility to patients", "Show clear trust and service information", "Centralize profile, reviews, and service workflows"]'::jsonb, '["Clinics", "Specialists", "Medical service providers"]'::jsonb, ARRAY['provider','medical','listing'], '{}'::jsonb),
  ('medical', 'medical_verified_provider_badge', 'Medical Verified Provider Badge', 'Verified Badge', 'Verification and trust signaling for medical providers with strong ratings and account standing.', 'verification', 'provider', 'growth', 'monthly', 40, '["Increase patient confidence", "Signal verified status", "Support higher-intent appointment requests"]'::jsonb, '["Trust-sensitive care", "Premium profiles", "Providers with strong reviews"]'::jsonb, ARRAY['provider','medical','verification'], '{}'::jsonb),
  ('medical', 'medical_growth_suite', 'Medical Provider Growth Suite', 'Growth Suite', 'Medical provider tools for intake, appointments, quotes, invoices, reviews, campaigns, referrals, and patient communication.', 'marketing', 'provider', 'premium', 'monthly', 50, '["Manage patient acquisition from one workspace", "Turn completed appointments into reviews and referrals", "Keep payments and communications organized"]'::jsonb, '["Clinics growing online", "Recurring care providers", "Referral-driven practices"]'::jsonb, ARRAY['provider','medical','growth'], '{}'::jsonb),
  ('medical', 'medical_partner_campaign', 'Medical Baise Partner Campaign', 'Partner Campaign', 'Approved partner campaigns for tracked medical-support referrals without promising medical outcomes.', 'partner', 'partner', 'entry', 'monthly', 60, '["Track link, QR, and code referrals", "Keep medical claims compliant", "Measure conversions and payout status"]'::jsonb, '["Health creators", "Community partners", "Professional networks"]'::jsonb, ARRAY['partner','medical','campaign'], '{}'::jsonb)
ON CONFLICT (app_key, product_key)
DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  description = EXCLUDED.description,
  product_family = EXCLUDED.product_family,
  audience = EXCLUDED.audience,
  tier_level = EXCLUDED.tier_level,
  billing_interval = EXCLUDED.billing_interval,
  display_order = EXCLUDED.display_order,
  value_points = EXCLUDED.value_points,
  use_cases = EXCLUDED.use_cases,
  tags = EXCLUDED.tags,
  updated_at = now();

INSERT INTO public.product_offer_rules (
  app_key,
  rule_key,
  name,
  audience,
  source_product_key,
  recommended_product_key,
  relation_type,
  trigger_event,
  priority,
  recommendation_title,
  recommendation_reason,
  value_message,
  welcome_message,
  congrats_message,
  downsell_message,
  email_subject,
  email_body,
  whatsapp_body,
  metadata
)
VALUES
  ('casa', 'client_welcome_premium', 'Welcome client premium recommendation', 'client', NULL, 'casa_client_premium', 'welcome', 'profile_created', 60, 'Keep every service record in one place', 'This client is using Casa Baise and does not yet have premium access.', 'Premium access helps you keep provider communication, receipts, invoices, and service history organized so the next service is easier to manage.', 'Welcome to Casa Baise. Premium access is here when you want a cleaner way to manage service history, proof, and trusted provider records.', 'Congrats on joining Casa Baise. Your next layer is keeping every service record organized from the start.', 'Start with your first service request, then add premium when you want ongoing history and records.', 'A cleaner way to manage every service', 'Premium access is not about buying more. It is about making each service easier to compare, document, and manage from one trusted place.', 'Premium helps you keep service history, receipts, and provider records organized in Casa Baise.', '{}'::jsonb),
  ('casa', 'provider_listing_to_verified', 'Provider premium to verified badge', 'provider', 'provider_premium_listing', 'verified_provider_badge', 'upsell', 'product_registered', 75, 'Add verified trust to your premium listing', 'Provider has listing visibility but does not yet have the stronger trust badge.', 'A verified badge gives visitors a faster reason to trust your profile before they request a quote or book service.', 'Your listing is live. Verification is the next trust layer when you are ready.', 'Your premium listing is set. Verification can help convert more profile visits into serious inquiries.', 'Keep the premium listing active and collect more reviews before adding verification.', 'Make your profile easier to trust', 'You already have visibility. The verified badge adds confidence at the exact moment a client is deciding whether to contact you.', 'Your listing brings visibility. Verification adds trust when clients compare providers.', '{}'::jsonb),
  ('casa', 'provider_verified_to_revenue', 'Verified provider to revenue suite', 'provider', 'verified_provider_badge', 'provider_revenue_suite', 'upsell', 'product_registered', 80, 'Run payments, invoices, and receipts from one place', 'Verified provider has trust but may still be managing payment operations outside Baise.', 'The Revenue Suite helps you turn trust into smoother payment, invoicing, POS, receipts, refunds, and transaction records.', 'Your verification builds trust. The Revenue Suite helps turn that trust into organized operations.', 'You are verified. Now you can make quotes, payments, and receipts easier for every client.', 'Use verification first, then add operations when bookings and payments increase.', 'Turn trust into smoother payments', 'The Revenue Suite helps you manage quotes, POS, invoices, receipts, and payment records without leaving Baise.', 'Revenue Suite helps you run payments and invoices in the same place clients already trust you.', '{}'::jsonb),
  ('casa', 'provider_revenue_to_marketing', 'Revenue suite to marketing engine', 'provider', 'provider_revenue_suite', 'provider_marketing_engine', 'cross_sell', 'product_registered', 70, 'Turn completed work into repeat business', 'Provider has operations tools but not the campaign engine that turns good service into reviews and referrals.', 'Marketing Engine helps completed services become review requests, referral campaigns, coupons, and repeat-client campaigns.', 'Your operations are organized. Marketing Engine helps you keep the relationship active after the job.', 'You can now manage revenue. Marketing Engine helps create the next client conversation.', 'Stay with Revenue Suite until you have enough completed jobs to market from.', 'Create more value after every job', 'Marketing Engine is for turning completed work into reviews, referrals, and repeat services with value-focused campaigns.', 'Marketing Engine turns completed work into reviews, referrals, and repeat-service campaigns.', '{}'::jsonb),
  ('legal', 'legal_client_welcome_premium', 'Legal client premium recommendation', 'client', NULL, 'legal_client_premium', 'welcome', 'profile_created', 60, 'Keep your legal service path organized', 'Legal client does not yet have premium access.', 'Premium access helps organize legal provider search, documents, invoices, receipts, and service history so the process feels clearer.', 'Welcome to Legal Baise. Premium access helps keep your legal-service path organized from the first step.', 'Congrats on joining Legal Baise. Premium access can help reduce confusion as your service history grows.', 'Start with one request, then add premium when you want ongoing records and document organization.', 'A clearer way to manage legal-service records', 'Premium access helps you compare, organize, and preserve your legal-service history in one place.', 'Premium keeps your legal-service records, documents, and receipts organized.', '{}'::jsonb),
  ('legal', 'legal_premium_to_vault', 'Legal premium to document vault', 'client', 'legal_client_premium', 'legal_document_vault', 'upsell', 'product_registered', 80, 'Add document organization to your legal-service path', 'Client has premium access but not the document vault.', 'The Document Vault gives your documents, sign-offs, notes, receipts, and service history a structured place to live.', 'Premium access is active. The Document Vault is the next layer when your matter has documents to manage.', 'Your premium access is set. The vault helps preserve the details that matter later.', 'Stay with premium access until you have documents or sign-offs to organize.', 'Keep legal documents and service history together', 'The Document Vault adds structure for documents, sign-offs, receipts, and notes tied to your legal-service path.', 'Document Vault keeps your legal records organized as your service path grows.', '{}'::jsonb),
  ('legal', 'legal_provider_listing_to_verified', 'Legal provider listing to verification', 'provider', 'legal_provider_premium_listing', 'legal_verified_provider_badge', 'upsell', 'product_registered', 75, 'Add verified trust to your legal profile', 'Legal provider has premium listing but not verification.', 'Verification gives legal-service seekers a stronger trust signal before they request help.', 'Your legal listing is live. Verification is the next trust signal when you are ready.', 'Your premium listing is set. Verification can help convert more serious legal inquiries.', 'Keep the premium listing active and gather more reviews before adding verification.', 'Make your legal profile easier to trust', 'Verification adds confidence for people comparing legal-service providers.', 'Verification helps people feel more confident choosing your legal profile.', '{}'::jsonb),
  ('legal', 'legal_verified_to_growth', 'Legal verified provider to growth suite', 'provider', 'legal_verified_provider_badge', 'legal_growth_suite', 'upsell', 'product_registered', 80, 'Turn legal inquiries into organized client relationships', 'Legal provider has trust signals but not growth and campaign tools.', 'The Legal Growth Suite helps manage intake, quotes, invoices, reviews, referrals, campaigns, and client communication.', 'Verification builds trust. Growth Suite helps you operate and grow from that trust.', 'You are verified. Growth Suite helps manage the relationship after the inquiry.', 'Use verification first, then add Growth Suite as inquiries increase.', 'Turn trusted inquiries into organized growth', 'Growth Suite helps legal providers manage intake, reviews, referrals, campaigns, and client communication.', 'Growth Suite helps manage legal inquiries, reviews, referrals, and client communication.', '{}'::jsonb),
  ('medical', 'medical_client_welcome_premium', 'Medical client premium recommendation', 'client', NULL, 'medical_client_premium', 'welcome', 'profile_created', 60, 'Keep care-related service history organized', 'Medical client does not yet have premium access.', 'Premium access helps organize provider search, appointment history, receipts, and care-related records so ongoing needs are easier to manage.', 'Welcome to Medical Baise. Premium access helps keep provider search and care-related records organized.', 'Congrats on joining Medical Baise. Premium access can help you manage appointments and records with less friction.', 'Start with one request, then add premium when you want ongoing service history.', 'A clearer way to manage care-related service history', 'Premium access helps you organize provider search, appointment history, receipts, and service records.', 'Premium keeps provider search, appointments, receipts, and records easier to manage.', '{}'::jsonb),
  ('medical', 'medical_premium_to_records', 'Medical premium to records vault', 'client', 'medical_client_premium', 'medical_records_vault', 'upsell', 'product_registered', 80, 'Add records and appointment tracking', 'Client has premium access but not records vault.', 'Records Vault helps keep appointment history, uploads, receipts, and care-related service proof organized for future needs.', 'Premium access is active. Records Vault is the next layer for ongoing care records.', 'Your premium access is set. Records Vault helps preserve appointment and service details.', 'Stay with premium until appointments or uploads become frequent.', 'Keep medical records and receipts organized', 'Records Vault adds structure for appointments, uploads, receipts, and care-related service history.', 'Records Vault keeps appointment history, uploads, and receipts organized.', '{}'::jsonb),
  ('medical', 'medical_provider_listing_to_verified', 'Medical provider listing to verification', 'provider', 'medical_provider_premium_listing', 'medical_verified_provider_badge', 'upsell', 'product_registered', 75, 'Add verified trust to your medical profile', 'Medical provider has premium listing but not verification.', 'Verification gives people a stronger confidence signal before they request an appointment or service.', 'Your medical listing is live. Verification is the next trust layer when you are ready.', 'Your premium listing is set. Verification can help convert more serious appointment requests.', 'Keep the premium listing active and gather more reviews before adding verification.', 'Make your medical profile easier to trust', 'Verification adds confidence for people comparing medical providers.', 'Verification helps people feel more confident choosing your medical profile.', '{}'::jsonb),
  ('medical', 'medical_verified_to_growth', 'Medical verified provider to growth suite', 'provider', 'medical_verified_provider_badge', 'medical_growth_suite', 'upsell', 'product_registered', 80, 'Turn patient interest into organized growth', 'Medical provider has trust signals but not growth and campaign tools.', 'The Medical Growth Suite helps manage intake, appointments, invoices, reviews, referrals, campaigns, and patient communication.', 'Verification builds trust. Growth Suite helps you operate and grow from that trust.', 'You are verified. Growth Suite helps manage the relationship after the appointment request.', 'Use verification first, then add Growth Suite as appointment requests increase.', 'Turn trusted interest into organized growth', 'Growth Suite helps medical providers manage intake, reviews, referrals, campaigns, and patient communication.', 'Growth Suite helps manage patient interest, reviews, referrals, and communication.', '{}'::jsonb)
ON CONFLICT (app_key, rule_key)
DO UPDATE SET
  name = EXCLUDED.name,
  audience = EXCLUDED.audience,
  source_product_key = EXCLUDED.source_product_key,
  recommended_product_key = EXCLUDED.recommended_product_key,
  relation_type = EXCLUDED.relation_type,
  trigger_event = EXCLUDED.trigger_event,
  priority = EXCLUDED.priority,
  recommendation_title = EXCLUDED.recommendation_title,
  recommendation_reason = EXCLUDED.recommendation_reason,
  value_message = EXCLUDED.value_message,
  welcome_message = EXCLUDED.welcome_message,
  congrats_message = EXCLUDED.congrats_message,
  downsell_message = EXCLUDED.downsell_message,
  email_subject = EXCLUDED.email_subject,
  email_body = EXCLUDED.email_body,
  whatsapp_body = EXCLUDED.whatsapp_body,
  updated_at = now();

INSERT INTO public.platform_message_templates (
  app_key,
  event_type,
  audience,
  channel,
  locale,
  subject,
  body,
  action_label,
  is_transactional,
  metadata
)
SELECT
  app_key,
  'product_recommendation',
  audience,
  channel,
  locale,
  CASE locale
    WHEN 'pt' THEN 'Uma recomendação que pode agregar valor'
    WHEN 'es' THEN 'Una recomendación que puede agregar valor'
    ELSE 'A recommendation that may add real value'
  END,
  CASE locale
    WHEN 'pt' THEN 'Com base no que você já está usando, há uma próxima opção que pode ajudar a organizar melhor seu serviço, histórico, pagamentos ou crescimento. Revise a recomendação no seu portal.'
    WHEN 'es' THEN 'Según lo que ya estás usando, hay una próxima opción que puede ayudarte a organizar mejor tu servicio, historial, pagos o crecimiento. Revisa la recomendación en tu portal.'
    ELSE 'Based on what you already use, there is a next option that may help organize your service experience, history, payments, or growth. Review the recommendation in your portal.'
  END,
  CASE locale
    WHEN 'pt' THEN 'Ver recomendação'
    WHEN 'es' THEN 'Ver recomendación'
    ELSE 'View recommendation'
  END,
  false,
  jsonb_build_object('source', 'product_intelligence')
FROM (VALUES ('casa'), ('legal'), ('medical')) AS apps(app_key)
CROSS JOIN (VALUES ('client'), ('provider'), ('partner')) AS audiences(audience)
CROSS JOIN (VALUES ('email'), ('portal'), ('whatsapp')) AS channels(channel)
CROSS JOIN (VALUES ('en'), ('es'), ('pt')) AS locales(locale)
ON CONFLICT (app_key, event_type, audience, channel, locale)
DO UPDATE SET
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  action_label = EXCLUDED.action_label,
  is_transactional = EXCLUDED.is_transactional,
  metadata = public.platform_message_templates.metadata || EXCLUDED.metadata,
  updated_at = now();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_product_registrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_offer_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_offer_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_person_product(uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_product_recommendations_for_person(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_product_recommendations_for_app(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_product_recommendation_status(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_intelligence_summary(text) TO authenticated;
