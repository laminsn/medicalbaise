-- Content campaign calendar for blog, promo, email, push, WhatsApp, SMS, and social scheduling.
-- Seeds a 54-week Tuesday 9 a.m. calendar and the current Influencer + Give a Month campaigns.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.content_campaign_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_key text NOT NULL DEFAULT 'casa'
    CHECK (app_key IN ('casa', 'medical', 'legal')),
  campaign_key text NOT NULL,
  campaign_type text NOT NULL
    CHECK (campaign_type IN ('blog_weekly', 'promo_launch', 'promo_announcement')),
  audience text NOT NULL DEFAULT 'all'
    CHECK (audience IN ('all', 'client', 'provider', 'partner', 'staff')),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  blog_slug text,
  partner_blog_slug text,
  client_blog_slug text,
  promo_key text,
  landing_page text,
  scheduled_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  cadence text NOT NULL DEFAULT 'weekly'
    CHECK (cadence IN ('one_time', 'weekly', 'monthly', 'custom')),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('draft', 'scheduled', 'running', 'sent', 'paused', 'cancelled', 'failed', 'archived')),
  cta_label text,
  cta_url text,
  product_key text,
  value_reason text,
  quote_attribution text,
  quote_text text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (app_key, campaign_key, audience)
);

CREATE INDEX IF NOT EXISTS idx_content_campaign_calendar_app_schedule
  ON public.content_campaign_calendar(app_key, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_content_campaign_calendar_type
  ON public.content_campaign_calendar(app_key, campaign_type, scheduled_at);

DROP TRIGGER IF EXISTS update_content_campaign_calendar_updated_at ON public.content_campaign_calendar;
CREATE TRIGGER update_content_campaign_calendar_updated_at
  BEFORE UPDATE ON public.content_campaign_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.content_campaign_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view active content campaign calendar" ON public.content_campaign_calendar;
CREATE POLICY "Authenticated users view active content campaign calendar"
ON public.content_campaign_calendar FOR SELECT TO authenticated
USING (status IN ('scheduled', 'running', 'sent') OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Admins manage content campaign calendar" ON public.content_campaign_calendar;
CREATE POLICY "Admins manage content campaign calendar"
ON public.content_campaign_calendar FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.content_campaign_channel_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.content_campaign_calendar(id) ON DELETE CASCADE,
  channel text NOT NULL
    CHECK (channel IN ('email', 'push', 'whatsapp', 'sms')),
  locale text NOT NULL DEFAULT 'en'
    CHECK (locale IN ('en', 'es', 'pt')),
  subject text NOT NULL,
  preview_text text,
  body text NOT NULL,
  cta_label text,
  cta_url text,
  delivery_policy text NOT NULL DEFAULT 'marketing'
    CHECK (delivery_policy IN ('marketing', 'transactional', 'system')),
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('draft', 'ready', 'scheduled', 'sent', 'paused', 'failed', 'archived')),
  external_template_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, channel, locale)
);

CREATE INDEX IF NOT EXISTS idx_content_campaign_channel_assets_channel
  ON public.content_campaign_channel_assets(channel, status);

DROP TRIGGER IF EXISTS update_content_campaign_channel_assets_updated_at ON public.content_campaign_channel_assets;
CREATE TRIGGER update_content_campaign_channel_assets_updated_at
  BEFORE UPDATE ON public.content_campaign_channel_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.content_campaign_channel_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view content campaign channel assets" ON public.content_campaign_channel_assets;
CREATE POLICY "Authenticated users view content campaign channel assets"
ON public.content_campaign_channel_assets FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.content_campaign_calendar c
    WHERE c.id = campaign_id
      AND (c.status IN ('scheduled', 'running', 'sent') OR public.is_admin_or_moderator())
  )
);

DROP POLICY IF EXISTS "Admins manage content campaign channel assets" ON public.content_campaign_channel_assets;
CREATE POLICY "Admins manage content campaign channel assets"
ON public.content_campaign_channel_assets FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.content_campaign_social_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.content_campaign_calendar(id) ON DELETE CASCADE,
  platform_format text NOT NULL
    CHECK (platform_format IN ('story', 'facebook_post', 'instagram_post')),
  size_label text NOT NULL,
  headline text NOT NULL,
  caption text NOT NULL,
  visual_prompt text NOT NULL,
  cta_url text,
  status text NOT NULL DEFAULT 'ready'
    CHECK (status IN ('draft', 'ready', 'scheduled', 'posted', 'paused', 'failed', 'archived')),
  postiz_post_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, platform_format)
);

CREATE INDEX IF NOT EXISTS idx_content_campaign_social_assets_format
  ON public.content_campaign_social_assets(platform_format, status);

DROP TRIGGER IF EXISTS update_content_campaign_social_assets_updated_at ON public.content_campaign_social_assets;
CREATE TRIGGER update_content_campaign_social_assets_updated_at
  BEFORE UPDATE ON public.content_campaign_social_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.content_campaign_social_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view content campaign social assets" ON public.content_campaign_social_assets;
CREATE POLICY "Authenticated users view content campaign social assets"
ON public.content_campaign_social_assets FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.content_campaign_calendar c
    WHERE c.id = campaign_id
      AND (c.status IN ('scheduled', 'running', 'sent') OR public.is_admin_or_moderator())
  )
);

DROP POLICY IF EXISTS "Admins manage content campaign social assets" ON public.content_campaign_social_assets;
CREATE POLICY "Admins manage content campaign social assets"
ON public.content_campaign_social_assets FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE TABLE IF NOT EXISTS public.content_campaign_dispatch_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.content_campaign_calendar(id) ON DELETE CASCADE,
  channel text NOT NULL
    CHECK (channel IN ('email', 'push', 'whatsapp', 'sms', 'postiz')),
  provider text,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'sent', 'partial', 'failed', 'skipped')),
  audience_count integer NOT NULL DEFAULT 0 CHECK (audience_count >= 0),
  sent_count integer NOT NULL DEFAULT 0 CHECK (sent_count >= 0),
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  skipped_count integer NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  external_batch_id text,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_campaign_dispatch_runs_campaign
  ON public.content_campaign_dispatch_runs(campaign_id, channel, status, created_at DESC);

ALTER TABLE public.content_campaign_dispatch_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage content campaign dispatch runs" ON public.content_campaign_dispatch_runs;
CREATE POLICY "Admins manage content campaign dispatch runs"
ON public.content_campaign_dispatch_runs FOR ALL TO authenticated
USING (public.is_admin_or_moderator())
WITH CHECK (public.is_admin_or_moderator());

CREATE OR REPLACE FUNCTION public.seed_baise_content_campaign_calendar(target_app_key text DEFAULT 'casa')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_app_key text := public.normalize_growth_app_key(target_app_key);
  week_index integer;
  week_number integer;
  campaign_record record;
  campaign_id uuid;
  scheduled_time timestamptz;
  seeded_campaigns integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin_or_moderator() THEN
    RAISE EXCEPTION 'Only admin or moderator users can seed content campaigns';
  END IF;

  FOR week_index IN 0..53 LOOP
    week_number := week_index + 1;
    scheduled_time := '2026-07-14 09:00:00-03'::timestamptz + (week_index * interval '7 days');

    INSERT INTO public.content_campaign_calendar (
      app_key,
      campaign_key,
      campaign_type,
      audience,
      title,
      description,
      scheduled_at,
      cadence,
      status,
      cta_label,
      cta_url,
      product_key,
      value_reason,
      quote_attribution,
      quote_text,
      metadata
    )
    VALUES (
      clean_app_key,
      'baise_blog_week_' || lpad(week_number::text, 2, '0'),
      'blog_weekly',
      'all',
      'Baise weekly blog campaign - Week ' || week_number,
      'Tuesday 9 a.m. weekly blog campaign with provider and client article versions, email, push, WhatsApp, SMS, and social assets.',
      scheduled_time,
      'weekly',
      'scheduled',
      'Read the weekly guide',
      '/blog',
      'content_growth_engine',
      'Education content should help clients choose better and help providers grow with clearer systems.',
      'Baise editorial desk',
      'Value grows when useful guidance leads to a clear next step.',
      jsonb_build_object(
        'week_number', week_number,
        'timezone', 'America/Sao_Paulo',
        'front_end_content_source', 'src/content/blogCampaignCalendar.ts',
        'provider_and_client_assets', true,
        'social_formats', ARRAY['story', 'facebook_post', 'instagram_post']
      )
    )
    ON CONFLICT (app_key, campaign_key, audience) DO UPDATE
    SET scheduled_at = EXCLUDED.scheduled_at,
        status = EXCLUDED.status,
        metadata = content_campaign_calendar.metadata || EXCLUDED.metadata,
        updated_at = now()
    RETURNING id INTO campaign_id;

    INSERT INTO public.content_campaign_channel_assets (
      campaign_id,
      channel,
      locale,
      subject,
      preview_text,
      body,
      cta_label,
      cta_url,
      delivery_policy,
      status,
      metadata
    )
    SELECT
      campaign_id,
      channel,
      'en',
      subject,
      preview_text,
      body,
      cta_label,
      cta_url,
      'marketing',
      'ready',
      jsonb_build_object('seeded', true, 'week_number', week_number)
    FROM (
      VALUES
        (
          'email',
          'This week on Baise: practical service guidance',
          'A provider guide and client guide with one clear next step.',
          'This week Baise is sending a provider guide and a client guide. The goal is practical education: help providers operate better, help clients choose trusted support, and tie both paths back to a useful portal action.',
          'Read the weekly guide',
          '/blog'
        ),
        (
          'push',
          'This week on Baise',
          'A new practical guide is ready.',
          'A new Baise guide is ready. Read it and take the next useful step in the portal.',
          'Read guide',
          '/blog'
        ),
        (
          'whatsapp',
          'Baise weekly guide',
          'This week: better service decisions and cleaner provider workflows.',
          'This week on Baise: practical guidance for trusted service decisions and stronger provider operations. Read the guide in the portal.',
          'Read guide',
          '/blog'
        ),
        (
          'sms',
          'Baise weekly guide',
          'A new guide is ready.',
          'Baise guide: practical service advice is ready. Read it here: /blog',
          'Read',
          '/blog'
        )
    ) AS assets(channel, subject, preview_text, body, cta_label, cta_url)
    ON CONFLICT (campaign_id, channel, locale) DO UPDATE
    SET subject = EXCLUDED.subject,
        preview_text = EXCLUDED.preview_text,
        body = EXCLUDED.body,
        cta_label = EXCLUDED.cta_label,
        cta_url = EXCLUDED.cta_url,
        status = EXCLUDED.status,
        metadata = content_campaign_channel_assets.metadata || EXCLUDED.metadata,
        updated_at = now();

    INSERT INTO public.content_campaign_social_assets (
      campaign_id,
      platform_format,
      size_label,
      headline,
      caption,
      visual_prompt,
      cta_url,
      status,
      metadata
    )
    SELECT
      campaign_id,
      platform_format,
      size_label,
      headline,
      caption,
      visual_prompt,
      '/blog',
      'ready',
      jsonb_build_object('seeded', true, 'week_number', week_number)
    FROM (
      VALUES
        (
          'story',
          '1080 x 1920 story',
          'This week on Baise',
          'A new practical guide is ready. Tap to read and take the next useful step.',
          'Vertical Baise story graphic with article headline area, trust signal, and read-now CTA.'
        ),
        (
          'facebook_post',
          '1200 x 630 Facebook post',
          'Practical service guidance from Baise',
          'This week Baise is sharing provider and client guidance that makes service decisions clearer.',
          'Facebook link-share graphic with Baise logo, weekly guide headline, and simple checklist motif.'
        ),
        (
          'instagram_post',
          '1080 x 1080 Instagram post',
          'Better service decisions start here',
          'Read this week''s Baise guide for practical support, trusted providers, and cleaner service records.',
          'Square Instagram graphic with concise headline, three value bullets, Baise logo, and CTA.'
        )
    ) AS social(platform_format, size_label, headline, caption, visual_prompt)
    ON CONFLICT (campaign_id, platform_format) DO UPDATE
    SET size_label = EXCLUDED.size_label,
        headline = EXCLUDED.headline,
        caption = EXCLUDED.caption,
        visual_prompt = EXCLUDED.visual_prompt,
        cta_url = EXCLUDED.cta_url,
        status = EXCLUDED.status,
        metadata = content_campaign_social_assets.metadata || EXCLUDED.metadata,
        updated_at = now();

    seeded_campaigns := seeded_campaigns + 1;
  END LOOP;

  FOR campaign_record IN
    SELECT *
    FROM (
      VALUES
        (
          'influencer_partners_launch',
          'promo_launch',
          'partner',
          'Influencer Partners is open for applications',
          'Launch campaign for creators with 5,000+ followers who help audiences find trusted support.',
          '/influencer-partners',
          'influencer_partners',
          'Baise Influencer Partner Program',
          'Approved creators can earn for approved posts, viral-view benchmarks, and tracked premium conversions.',
          'Apply to partner',
          '2026-07-14 09:00:00-03'::timestamptz
        ),
        (
          'give_a_month_get_a_month_launch',
          'promo_launch',
          'all',
          'Give a Month, Get a Month is live',
          'Launch campaign for premium users who refer eligible premium-level users during July and August.',
          '/give-a-month-get-a-month',
          'give_a_month_get_a_month',
          'Premium Referral Credit',
          'Premium users can earn one free month for each eligible premium referral, up to 12 free months in a calendar year.',
          'Share your referral',
          '2026-07-14 09:00:00-03'::timestamptz
        ),
        (
          'influencer_partners_announcement',
          'promo_announcement',
          'partner',
          'Creator reminder: Baise influencer applications are being reviewed',
          'Announcement reminder for creators who can make original content about trusted support.',
          '/influencer-partners',
          'influencer_partners',
          'Baise Influencer Partner Program',
          'Baise gives creators a practical campaign, a tracked link, and a clear way to earn from useful content.',
          'Apply within 48-hour review',
          '2026-07-21 09:00:00-03'::timestamptz
        ),
        (
          'give_a_month_get_a_month_announcement',
          'promo_announcement',
          'all',
          'Your Baise referral can pay for your next premium month',
          'Announcement reminder for clients and providers to share Baise with people who need trusted help.',
          '/give-a-month-get-a-month',
          'give_a_month_get_a_month',
          'Premium Referral Credit',
          'Give someone a trusted way to find help and earn a free premium month when eligibility is confirmed.',
          'Open referral campaign',
          '2026-07-21 09:00:00-03'::timestamptz
        )
    ) AS promo(
      campaign_key,
      campaign_type,
      audience,
      title,
      description,
      landing_page,
      promo_key,
      product_name,
      value_reason,
      cta_label,
      scheduled_at
    )
  LOOP
    INSERT INTO public.content_campaign_calendar (
      app_key,
      campaign_key,
      campaign_type,
      audience,
      title,
      description,
      promo_key,
      landing_page,
      scheduled_at,
      cadence,
      status,
      cta_label,
      cta_url,
      product_key,
      value_reason,
      quote_attribution,
      quote_text,
      metadata
    )
    VALUES (
      clean_app_key,
      campaign_record.campaign_key,
      campaign_record.campaign_type,
      campaign_record.audience,
      campaign_record.title,
      campaign_record.description,
      campaign_record.promo_key,
      campaign_record.landing_page,
      campaign_record.scheduled_at,
      'one_time',
      'scheduled',
      campaign_record.cta_label,
      campaign_record.landing_page,
      campaign_record.promo_key,
      campaign_record.value_reason,
      'Baise campaign desk',
      'The best campaigns make the next helpful step obvious.',
      jsonb_build_object('seeded', true, 'product_name', campaign_record.product_name)
    )
    ON CONFLICT (app_key, campaign_key, audience) DO UPDATE
    SET title = EXCLUDED.title,
        description = EXCLUDED.description,
        landing_page = EXCLUDED.landing_page,
        scheduled_at = EXCLUDED.scheduled_at,
        status = EXCLUDED.status,
        value_reason = EXCLUDED.value_reason,
        metadata = content_campaign_calendar.metadata || EXCLUDED.metadata,
        updated_at = now()
    RETURNING id INTO campaign_id;

    INSERT INTO public.content_campaign_channel_assets (
      campaign_id,
      channel,
      locale,
      subject,
      preview_text,
      body,
      cta_label,
      cta_url,
      delivery_policy,
      status,
      metadata
    )
    SELECT
      campaign_id,
      channel,
      'en',
      subject,
      campaign_record.value_reason,
      body,
      campaign_record.cta_label,
      campaign_record.landing_page,
      'marketing',
      'ready',
      jsonb_build_object('seeded', true, 'promo_key', campaign_record.promo_key)
    FROM (
      VALUES
        ('email', campaign_record.title, 'The campaign is live. ' || campaign_record.value_reason || ' Open the campaign page for the rules, CTA, and next step.'),
        ('push', campaign_record.title, campaign_record.value_reason),
        ('whatsapp', campaign_record.title, campaign_record.value_reason || ' Open: ' || campaign_record.landing_page),
        ('sms', campaign_record.title, campaign_record.title || '. ' || campaign_record.cta_label || ': ' || campaign_record.landing_page)
    ) AS assets(channel, subject, body)
    ON CONFLICT (campaign_id, channel, locale) DO UPDATE
    SET subject = EXCLUDED.subject,
        preview_text = EXCLUDED.preview_text,
        body = EXCLUDED.body,
        cta_label = EXCLUDED.cta_label,
        cta_url = EXCLUDED.cta_url,
        status = EXCLUDED.status,
        metadata = content_campaign_channel_assets.metadata || EXCLUDED.metadata,
        updated_at = now();

    INSERT INTO public.content_campaign_social_assets (
      campaign_id,
      platform_format,
      size_label,
      headline,
      caption,
      visual_prompt,
      cta_url,
      status,
      metadata
    )
    SELECT
      campaign_id,
      platform_format,
      size_label,
      campaign_record.title,
      campaign_record.value_reason,
      visual_prompt,
      campaign_record.landing_page,
      'ready',
      jsonb_build_object('seeded', true, 'promo_key', campaign_record.promo_key)
    FROM (
      VALUES
        ('story', '1080 x 1920 story', 'Premium Baise story creative with campaign headline, one benefit, and focused CTA.'),
        ('facebook_post', '1200 x 630 Facebook post', 'Facebook campaign graphic with Baise logo, value statement, and campaign CTA.'),
        ('instagram_post', '1080 x 1080 Instagram post', 'Square Instagram campaign graphic with concise benefit, rules hint, and CTA.')
    ) AS social(platform_format, size_label, visual_prompt)
    ON CONFLICT (campaign_id, platform_format) DO UPDATE
    SET size_label = EXCLUDED.size_label,
        headline = EXCLUDED.headline,
        caption = EXCLUDED.caption,
        visual_prompt = EXCLUDED.visual_prompt,
        cta_url = EXCLUDED.cta_url,
        status = EXCLUDED.status,
        metadata = content_campaign_social_assets.metadata || EXCLUDED.metadata,
        updated_at = now();

    seeded_campaigns := seeded_campaigns + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'app_key', clean_app_key,
    'seeded_campaigns', seeded_campaigns,
    'starts_at', '2026-07-14T09:00:00-03:00',
    'timezone', 'America/Sao_Paulo'
  );
END;
$$;

SELECT public.seed_baise_content_campaign_calendar('casa');
SELECT public.seed_baise_content_campaign_calendar('medical');
SELECT public.seed_baise_content_campaign_calendar('legal');
