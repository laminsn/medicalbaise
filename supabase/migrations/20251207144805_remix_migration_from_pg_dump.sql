CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: bid_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.bid_status AS ENUM (
    'submitted',
    'under_review',
    'accepted',
    'declined',
    'withdrawn',
    'expired'
);


--
-- Name: job_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.job_status AS ENUM (
    'accepting_bids',
    'bid_accepted',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending_deposit',
    'deposit_received',
    'full_payment_held',
    'milestone_partial',
    'completed'
);


--
-- Name: subscription_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.subscription_tier AS ENUM (
    'free',
    'pro',
    'elite',
    'enterprise'
);


--
-- Name: urgency_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.urgency_level AS ENUM (
    'emergency',
    'asap',
    'flexible',
    'scheduled'
);


--
-- Name: user_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_type AS ENUM (
    'customer',
    'provider'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    UPPER(SUBSTRING(COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'USER'), 1, 5) || '-' || SUBSTRING(NEW.id::text, 1, 5))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: active_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    bid_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    agreed_price numeric NOT NULL,
    payment_structure text DEFAULT 'deposit_balance'::text NOT NULL,
    payment_status text DEFAULT 'pending_deposit'::text NOT NULL,
    job_status text DEFAULT 'pending_start'::text NOT NULL,
    start_date date,
    expected_completion_date date,
    actual_completion_date date,
    contract_signed boolean DEFAULT false,
    contract_signed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT active_jobs_job_status_check CHECK ((job_status = ANY (ARRAY['pending_start'::text, 'in_progress'::text, 'paused'::text, 'completed'::text, 'disputed'::text, 'cancelled'::text]))),
    CONSTRAINT active_jobs_payment_status_check CHECK ((payment_status = ANY (ARRAY['pending_deposit'::text, 'deposit_received'::text, 'full_payment_held'::text, 'milestone_partial'::text, 'completed'::text]))),
    CONSTRAINT active_jobs_payment_structure_check CHECK ((payment_structure = ANY (ARRAY['deposit_balance'::text, 'full_upfront'::text, 'pay_on_completion'::text, 'milestone'::text, 'custom'::text])))
);


--
-- Name: analytics_report_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_report_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    email text NOT NULL,
    frequency text DEFAULT 'weekly'::text NOT NULL,
    day_of_week integer,
    day_of_month integer,
    is_active boolean DEFAULT true NOT NULL,
    last_sent_at timestamp with time zone,
    next_send_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bid_portfolio_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bid_portfolio_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bid_id uuid NOT NULL,
    portfolio_item_id uuid NOT NULL,
    order_index integer DEFAULT 0
);


--
-- Name: bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bids (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    quoted_price numeric NOT NULL,
    price_breakdown jsonb,
    timeline_start_date date,
    timeline_duration_days integer,
    materials_included boolean DEFAULT false,
    warranty_details text,
    proposal_text text NOT NULL,
    status public.bid_status DEFAULT 'submitted'::public.bid_status,
    submitted_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone
);


--
-- Name: change_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.change_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    active_job_id uuid NOT NULL,
    requested_by text NOT NULL,
    description text NOT NULL,
    additional_cost numeric DEFAULT 0,
    timeline_impact integer DEFAULT 0,
    status text DEFAULT 'proposed'::text NOT NULL,
    proposed_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    CONSTRAINT change_orders_requested_by_check CHECK ((requested_by = ANY (ARRAY['customer'::text, 'provider'::text]))),
    CONSTRAINT change_orders_status_check CHECK ((status = ANY (ARRAY['proposed'::text, 'approved'::text, 'declined'::text])))
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    job_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: conversion_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversion_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    event_type text NOT NULL,
    event_name text NOT NULL,
    source text,
    visitor_id text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: follows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid NOT NULL,
    following_provider_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: job_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid NOT NULL,
    media_type text NOT NULL,
    media_url text NOT NULL,
    thumbnail_url text,
    order_index integer DEFAULT 0,
    uploaded_at timestamp with time zone DEFAULT now(),
    CONSTRAINT job_media_media_type_check CHECK ((media_type = ANY (ARRAY['photo'::text, 'video'::text])))
);


--
-- Name: job_updates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_updates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    active_job_id uuid NOT NULL,
    posted_by uuid NOT NULL,
    update_type text NOT NULL,
    update_text text,
    media_urls jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT job_updates_update_type_check CHECK ((update_type = ANY (ARRAY['status_change'::text, 'message'::text, 'photo'::text, 'milestone'::text, 'completion'::text])))
);


--
-- Name: jobs_posted; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs_posted (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    category_id uuid,
    location_address text,
    location_lat numeric,
    location_lng numeric,
    budget_min numeric,
    budget_max numeric,
    budget_disclosed boolean DEFAULT true,
    urgency public.urgency_level DEFAULT 'flexible'::public.urgency_level,
    preferred_start_date date,
    preferred_end_date date,
    materials_included text DEFAULT 'negotiable'::text,
    insurance_required boolean DEFAULT false,
    license_required boolean DEFAULT false,
    max_bids integer DEFAULT 5,
    bid_deadline timestamp with time zone,
    status public.job_status DEFAULT 'accepting_bids'::public.job_status,
    is_featured boolean DEFAULT false,
    is_urgent boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    in_app_enabled boolean DEFAULT true NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    reminder_lead_time integer DEFAULT 24 NOT NULL,
    quiet_hours_start time without time zone,
    quiet_hours_end time without time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'general'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    action_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);


--
-- Name: payment_milestones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_milestones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    active_job_id uuid NOT NULL,
    milestone_name text NOT NULL,
    milestone_description text,
    amount numeric NOT NULL,
    order_index integer DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    due_date date,
    completed_at timestamp with time zone,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payment_milestones_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'approved'::text, 'paid'::text])))
);


--
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    category_id uuid,
    media_url text NOT NULL,
    media_type text DEFAULT 'image'::text,
    caption text,
    is_featured boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: post_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: post_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profile_views; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_views (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    viewer_id uuid,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    source text DEFAULT 'browse'::text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    user_type public.user_type DEFAULT 'customer'::public.user_type NOT NULL,
    first_name text,
    last_name text,
    email text,
    phone text,
    avatar_url text,
    city text,
    state text,
    referral_code text,
    credits_balance numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text,
    bio text,
    languages text[] DEFAULT ARRAY[]::text[]
);


--
-- Name: profiles_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.profiles_public WITH (security_invoker='false') AS
 SELECT id,
    user_id,
    avatar_url,
    first_name,
    last_name,
    user_type,
    city,
    state,
    bio
   FROM public.profiles;


--
-- Name: promoted_ads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promoted_ads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    post_id uuid,
    ad_type text DEFAULT 'boost'::text NOT NULL,
    title text,
    description text,
    media_url text,
    media_type text DEFAULT 'image'::text,
    target_audience jsonb,
    budget numeric DEFAULT 0 NOT NULL,
    spent numeric DEFAULT 0,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: provider_addons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_addons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: provider_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    day_of_week integer NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT provider_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: provider_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    credential_type text NOT NULL,
    title text NOT NULL,
    issuing_authority text,
    license_number text,
    issue_date date,
    expiration_date date,
    coverage_amount numeric,
    document_url text,
    is_verified boolean DEFAULT false,
    verified_at timestamp with time zone,
    verified_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT provider_credentials_credential_type_check CHECK ((credential_type = ANY (ARRAY['license'::text, 'certification'::text, 'insurance'::text, 'background_check'::text])))
);


--
-- Name: provider_faqs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_faqs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: provider_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.provider_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    category_id uuid NOT NULL,
    subcategory_id uuid,
    hourly_rate numeric,
    fixed_price numeric,
    is_quote_based boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: providers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    business_type text DEFAULT 'individual'::text,
    tagline text,
    bio text,
    years_experience integer DEFAULT 0,
    subscription_tier public.subscription_tier DEFAULT 'free'::public.subscription_tier,
    service_radius_km integer DEFAULT 20,
    location_lat numeric,
    location_lng numeric,
    address text,
    languages text[] DEFAULT ARRAY['Portuguese'::text],
    avg_rating numeric DEFAULT 0,
    total_reviews integer DEFAULT 0,
    total_jobs integer DEFAULT 0,
    response_time_hours integer DEFAULT 24,
    is_verified boolean DEFAULT false,
    is_background_checked boolean DEFAULT false,
    is_insured boolean DEFAULT false,
    is_licensed boolean DEFAULT false,
    bids_remaining_this_month integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cpf_cnpj text,
    id_type text DEFAULT 'cpf_cnpj'::text,
    passport_number text,
    contact_phone text,
    contact_email text,
    requires_background_check boolean DEFAULT false,
    meta_pixel_id text,
    google_analytics_id text,
    warranty_info text,
    guarantee_info text
);


--
-- Name: providers_public; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.providers_public WITH (security_invoker='false') AS
 SELECT id,
    user_id,
    business_name,
    tagline,
    bio,
    business_type,
    years_experience,
    service_radius_km,
    location_lat,
    location_lng,
    is_verified,
    is_licensed,
    is_insured,
    is_background_checked,
    avg_rating,
    total_reviews,
    total_jobs,
    response_time_hours,
    languages,
    subscription_tier,
    warranty_info,
    guarantee_info,
    meta_pixel_id,
    google_analytics_id,
    created_at,
    updated_at
   FROM public.providers;


--
-- Name: quote_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quote_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    provider_id uuid,
    category_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    budget_min numeric,
    budget_max numeric,
    preferred_start_date date,
    timeline_flexibility text DEFAULT 'flexible'::text,
    location_address text,
    location_lat numeric,
    location_lng numeric,
    urgency text DEFAULT 'normal'::text,
    status text DEFAULT 'pending'::text NOT NULL,
    customer_phone text,
    customer_email text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    responded_at timestamp with time zone,
    response_message text,
    quoted_price numeric
);


--
-- Name: referral_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    reward_type text NOT NULL,
    amount numeric DEFAULT 0 NOT NULL,
    description text,
    milestone_count integer,
    status text DEFAULT 'pending'::text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    credited_at timestamp with time zone,
    CONSTRAINT referral_rewards_reward_type_check CHECK ((reward_type = ANY (ARRAY['milestone_bonus'::text, 'commission'::text, 'vip_status'::text, 'subscription_credit'::text]))),
    CONSTRAINT referral_rewards_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'credited'::text, 'expired'::text])))
);


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id uuid NOT NULL,
    referred_user_id uuid,
    referral_code text NOT NULL,
    referral_type text DEFAULT 'customer'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    credit_amount numeric DEFAULT 20,
    bonus_credit numeric DEFAULT 0,
    referred_email text,
    created_at timestamp with time zone DEFAULT now(),
    activated_at timestamp with time zone,
    credited_at timestamp with time zone,
    CONSTRAINT referrals_referral_type_check CHECK ((referral_type = ANY (ARRAY['customer'::text, 'provider'::text]))),
    CONSTRAINT referrals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'credited'::text, 'expired'::text, 'voided'::text])))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    job_id uuid,
    overall_rating integer NOT NULL,
    quality_rating integer,
    professionalism_rating integer,
    punctuality_rating integer,
    communication_rating integer,
    value_rating integer,
    comment text,
    provider_response text,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reviews_communication_rating_check CHECK (((communication_rating >= 1) AND (communication_rating <= 5))),
    CONSTRAINT reviews_overall_rating_check CHECK (((overall_rating >= 1) AND (overall_rating <= 5))),
    CONSTRAINT reviews_professionalism_rating_check CHECK (((professionalism_rating >= 1) AND (professionalism_rating <= 5))),
    CONSTRAINT reviews_punctuality_rating_check CHECK (((punctuality_rating >= 1) AND (punctuality_rating <= 5))),
    CONSTRAINT reviews_quality_rating_check CHECK (((quality_rating >= 1) AND (quality_rating <= 5))),
    CONSTRAINT reviews_value_rating_check CHECK (((value_rating >= 1) AND (value_rating <= 5)))
);


--
-- Name: scheduled_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    reminder_type text DEFAULT 'custom'::text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    repeat_interval text,
    is_active boolean DEFAULT true NOT NULL,
    last_triggered_at timestamp with time zone,
    next_trigger_at timestamp with time zone,
    related_job_id uuid,
    related_provider_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: scheduled_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduled_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    service_id uuid,
    title text NOT NULL,
    description text,
    frequency text DEFAULT 'weekly'::text NOT NULL,
    day_of_week integer,
    day_of_month integer,
    preferred_time time without time zone,
    duration_minutes integer DEFAULT 60,
    price_per_visit numeric,
    status text DEFAULT 'active'::text NOT NULL,
    next_scheduled_date date,
    last_completed_date date,
    total_visits integer DEFAULT 0,
    start_date date NOT NULL,
    end_date date,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name_pt text NOT NULL,
    name_en text NOT NULL,
    icon text,
    color text,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    scheduled_service_id uuid NOT NULL,
    scheduled_date date NOT NULL,
    scheduled_time time without time zone,
    status text DEFAULT 'scheduled'::text NOT NULL,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: service_subcategories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name_pt text NOT NULL,
    name_en text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_warranties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_warranties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    warranty_type text DEFAULT 'warranty'::text NOT NULL,
    duration_months integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: social_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    content text,
    media_url text NOT NULL,
    media_type text DEFAULT 'image'::text NOT NULL,
    thumbnail_url text,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    is_promoted boolean DEFAULT false,
    promotion_budget numeric,
    promotion_start_date timestamp with time zone,
    promotion_end_date timestamp with time zone,
    promotion_status text DEFAULT 'inactive'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    show_book_now boolean DEFAULT true NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL
);


--
-- Name: video_meetings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_meetings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    job_id uuid,
    active_job_id uuid,
    host_user_id uuid NOT NULL,
    guest_user_id uuid,
    meeting_type text DEFAULT 'zoom'::text NOT NULL,
    meeting_url text,
    meeting_id text,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 30,
    status text DEFAULT 'scheduled'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: video_testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video_testimonials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    job_id uuid,
    video_url text NOT NULL,
    thumbnail_url text,
    title text,
    description text,
    duration_seconds integer,
    is_approved boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone
);


--
-- Name: work_approval_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_approval_media (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    active_job_id uuid NOT NULL,
    uploaded_by uuid NOT NULL,
    media_url text NOT NULL,
    media_type text DEFAULT 'image'::text NOT NULL,
    thumbnail_url text,
    caption text,
    status text DEFAULT 'pending'::text NOT NULL,
    customer_feedback text,
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: active_jobs active_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_jobs
    ADD CONSTRAINT active_jobs_pkey PRIMARY KEY (id);


--
-- Name: analytics_report_schedules analytics_report_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_report_schedules
    ADD CONSTRAINT analytics_report_schedules_pkey PRIMARY KEY (id);


--
-- Name: analytics_report_schedules analytics_report_schedules_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_report_schedules
    ADD CONSTRAINT analytics_report_schedules_provider_id_key UNIQUE (provider_id);


--
-- Name: bid_portfolio_items bid_portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bid_portfolio_items
    ADD CONSTRAINT bid_portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: bids bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_pkey PRIMARY KEY (id);


--
-- Name: change_orders change_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_orders
    ADD CONSTRAINT change_orders_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_customer_id_provider_id_job_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_customer_id_provider_id_job_id_key UNIQUE (customer_id, provider_id, job_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: conversion_events conversion_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_events
    ADD CONSTRAINT conversion_events_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_provider_id_key UNIQUE (user_id, provider_id);


--
-- Name: follows follows_follower_id_following_provider_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_following_provider_id_key UNIQUE (follower_id, following_provider_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: job_media job_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_media
    ADD CONSTRAINT job_media_pkey PRIMARY KEY (id);


--
-- Name: job_updates job_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_updates
    ADD CONSTRAINT job_updates_pkey PRIMARY KEY (id);


--
-- Name: jobs_posted jobs_posted_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs_posted
    ADD CONSTRAINT jobs_posted_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: payment_milestones payment_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_milestones
    ADD CONSTRAINT payment_milestones_pkey PRIMARY KEY (id);


--
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: post_comments post_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);


--
-- Name: post_likes post_likes_post_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);


--
-- Name: profile_views profile_views_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_referral_code_key UNIQUE (referral_code);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: promoted_ads promoted_ads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promoted_ads
    ADD CONSTRAINT promoted_ads_pkey PRIMARY KEY (id);


--
-- Name: provider_addons provider_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_addons
    ADD CONSTRAINT provider_addons_pkey PRIMARY KEY (id);


--
-- Name: provider_availability provider_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT provider_availability_pkey PRIMARY KEY (id);


--
-- Name: provider_availability provider_availability_provider_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT provider_availability_provider_id_day_of_week_key UNIQUE (provider_id, day_of_week);


--
-- Name: provider_credentials provider_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_credentials
    ADD CONSTRAINT provider_credentials_pkey PRIMARY KEY (id);


--
-- Name: provider_faqs provider_faqs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_faqs
    ADD CONSTRAINT provider_faqs_pkey PRIMARY KEY (id);


--
-- Name: provider_services provider_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_pkey PRIMARY KEY (id);


--
-- Name: providers providers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_pkey PRIMARY KEY (id);


--
-- Name: providers providers_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_key UNIQUE (user_id);


--
-- Name: quote_requests quote_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_requests
    ADD CONSTRAINT quote_requests_pkey PRIMARY KEY (id);


--
-- Name: referral_rewards referral_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_pkey PRIMARY KEY (id);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: scheduled_reminders scheduled_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_pkey PRIMARY KEY (id);


--
-- Name: scheduled_services scheduled_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_services
    ADD CONSTRAINT scheduled_services_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_instances service_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_instances
    ADD CONSTRAINT service_instances_pkey PRIMARY KEY (id);


--
-- Name: service_subcategories service_subcategories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_subcategories
    ADD CONSTRAINT service_subcategories_pkey PRIMARY KEY (id);


--
-- Name: service_warranties service_warranties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_warranties
    ADD CONSTRAINT service_warranties_pkey PRIMARY KEY (id);


--
-- Name: social_posts social_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: video_meetings video_meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_meetings
    ADD CONSTRAINT video_meetings_pkey PRIMARY KEY (id);


--
-- Name: video_testimonials video_testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_testimonials
    ADD CONSTRAINT video_testimonials_pkey PRIMARY KEY (id);


--
-- Name: work_approval_media work_approval_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_approval_media
    ADD CONSTRAINT work_approval_media_pkey PRIMARY KEY (id);


--
-- Name: idx_conversations_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_customer_id ON public.conversations USING btree (customer_id);


--
-- Name: idx_conversations_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversations_provider_id ON public.conversations USING btree (provider_id);


--
-- Name: idx_conversion_events_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversion_events_created_at ON public.conversion_events USING btree (created_at);


--
-- Name: idx_conversion_events_event_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversion_events_event_type ON public.conversion_events USING btree (event_type);


--
-- Name: idx_conversion_events_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversion_events_provider_id ON public.conversion_events USING btree (provider_id);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_is_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_profile_views_provider_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_views_provider_id ON public.profile_views USING btree (provider_id);


--
-- Name: idx_profile_views_viewed_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_views_viewed_at ON public.profile_views USING btree (viewed_at);


--
-- Name: idx_reminders_scheduled_for; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_scheduled_for ON public.scheduled_reminders USING btree (scheduled_for);


--
-- Name: idx_reminders_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reminders_user_id ON public.scheduled_reminders USING btree (user_id);


--
-- Name: idx_scheduled_services_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_services_customer ON public.scheduled_services USING btree (customer_id);


--
-- Name: idx_scheduled_services_next_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_services_next_date ON public.scheduled_services USING btree (next_scheduled_date);


--
-- Name: idx_scheduled_services_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_services_provider ON public.scheduled_services USING btree (provider_id);


--
-- Name: idx_scheduled_services_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduled_services_status ON public.scheduled_services USING btree (status);


--
-- Name: idx_service_instances_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_instances_date ON public.service_instances USING btree (scheduled_date);


--
-- Name: idx_service_instances_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_instances_scheduled ON public.service_instances USING btree (scheduled_service_id);


--
-- Name: idx_service_instances_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_instances_status ON public.service_instances USING btree (status);


--
-- Name: idx_service_warranties_service_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_service_warranties_service_id ON public.service_warranties USING btree (service_id);


--
-- Name: idx_video_meetings_host; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_meetings_host ON public.video_meetings USING btree (host_user_id);


--
-- Name: idx_video_meetings_scheduled; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_meetings_scheduled ON public.video_meetings USING btree (scheduled_at);


--
-- Name: idx_video_testimonials_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_testimonials_approved ON public.video_testimonials USING btree (is_approved) WHERE (is_approved = true);


--
-- Name: idx_video_testimonials_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_video_testimonials_provider ON public.video_testimonials USING btree (provider_id);


--
-- Name: idx_work_approval_media_job; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_approval_media_job ON public.work_approval_media USING btree (active_job_id);


--
-- Name: idx_work_approval_media_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_work_approval_media_status ON public.work_approval_media USING btree (status);


--
-- Name: active_jobs update_active_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_active_jobs_updated_at BEFORE UPDATE ON public.active_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: analytics_report_schedules update_analytics_report_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_analytics_report_schedules_updated_at BEFORE UPDATE ON public.analytics_report_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: jobs_posted update_jobs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs_posted FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: notification_preferences update_notification_preferences_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: provider_addons update_provider_addons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_provider_addons_updated_at BEFORE UPDATE ON public.provider_addons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: providers update_providers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON public.providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: quote_requests update_quote_requests_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_quote_requests_updated_at BEFORE UPDATE ON public.quote_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_reminders update_scheduled_reminders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_reminders_updated_at BEFORE UPDATE ON public.scheduled_reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_services update_scheduled_services_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduled_services_updated_at BEFORE UPDATE ON public.scheduled_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: service_instances update_service_instances_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_service_instances_updated_at BEFORE UPDATE ON public.service_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: video_meetings update_video_meetings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_video_meetings_updated_at BEFORE UPDATE ON public.video_meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: work_approval_media update_work_approval_media_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_work_approval_media_updated_at BEFORE UPDATE ON public.work_approval_media FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: active_jobs active_jobs_bid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_jobs
    ADD CONSTRAINT active_jobs_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id);


--
-- Name: active_jobs active_jobs_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_jobs
    ADD CONSTRAINT active_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs_posted(id);


--
-- Name: analytics_report_schedules analytics_report_schedules_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_report_schedules
    ADD CONSTRAINT analytics_report_schedules_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: bid_portfolio_items bid_portfolio_items_bid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bid_portfolio_items
    ADD CONSTRAINT bid_portfolio_items_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.bids(id) ON DELETE CASCADE;


--
-- Name: bid_portfolio_items bid_portfolio_items_portfolio_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bid_portfolio_items
    ADD CONSTRAINT bid_portfolio_items_portfolio_item_id_fkey FOREIGN KEY (portfolio_item_id) REFERENCES public.portfolio_items(id) ON DELETE CASCADE;


--
-- Name: bids bids_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs_posted(id) ON DELETE CASCADE;


--
-- Name: bids bids_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: change_orders change_orders_active_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_orders
    ADD CONSTRAINT change_orders_active_job_id_fkey FOREIGN KEY (active_job_id) REFERENCES public.active_jobs(id) ON DELETE CASCADE;


--
-- Name: conversations conversations_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs_posted(id) ON DELETE SET NULL;


--
-- Name: conversations conversations_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: conversion_events conversion_events_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversion_events
    ADD CONSTRAINT conversion_events_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: follows follows_following_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_following_provider_id_fkey FOREIGN KEY (following_provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: job_media job_media_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_media
    ADD CONSTRAINT job_media_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs_posted(id) ON DELETE CASCADE;


--
-- Name: job_updates job_updates_active_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_updates
    ADD CONSTRAINT job_updates_active_job_id_fkey FOREIGN KEY (active_job_id) REFERENCES public.active_jobs(id) ON DELETE CASCADE;


--
-- Name: jobs_posted jobs_posted_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs_posted
    ADD CONSTRAINT jobs_posted_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- Name: jobs_posted jobs_posted_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs_posted
    ADD CONSTRAINT jobs_posted_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: payment_milestones payment_milestones_active_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_milestones
    ADD CONSTRAINT payment_milestones_active_job_id_fkey FOREIGN KEY (active_job_id) REFERENCES public.active_jobs(id) ON DELETE CASCADE;


--
-- Name: portfolio_items portfolio_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- Name: portfolio_items portfolio_items_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: post_comments post_comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;


--
-- Name: post_likes post_likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE CASCADE;


--
-- Name: profile_views profile_views_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_views
    ADD CONSTRAINT profile_views_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: promoted_ads promoted_ads_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promoted_ads
    ADD CONSTRAINT promoted_ads_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.social_posts(id) ON DELETE SET NULL;


--
-- Name: promoted_ads promoted_ads_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promoted_ads
    ADD CONSTRAINT promoted_ads_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_addons provider_addons_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_addons
    ADD CONSTRAINT provider_addons_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_availability provider_availability_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_availability
    ADD CONSTRAINT provider_availability_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_credentials provider_credentials_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_credentials
    ADD CONSTRAINT provider_credentials_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_faqs provider_faqs_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_faqs
    ADD CONSTRAINT provider_faqs_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_services provider_services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;


--
-- Name: provider_services provider_services_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: provider_services provider_services_subcategory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.provider_services
    ADD CONSTRAINT provider_services_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.service_subcategories(id);


--
-- Name: providers providers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.providers
    ADD CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quote_requests quote_requests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_requests
    ADD CONSTRAINT quote_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- Name: quote_requests quote_requests_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quote_requests
    ADD CONSTRAINT quote_requests_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id);


--
-- Name: referrals referrals_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: reviews reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs_posted(id);


--
-- Name: reviews reviews_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: scheduled_reminders scheduled_reminders_related_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_related_job_id_fkey FOREIGN KEY (related_job_id) REFERENCES public.jobs_posted(id) ON DELETE SET NULL;


--
-- Name: scheduled_reminders scheduled_reminders_related_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_reminders
    ADD CONSTRAINT scheduled_reminders_related_provider_id_fkey FOREIGN KEY (related_provider_id) REFERENCES public.providers(id) ON DELETE SET NULL;


--
-- Name: scheduled_services scheduled_services_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_services
    ADD CONSTRAINT scheduled_services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: scheduled_services scheduled_services_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduled_services
    ADD CONSTRAINT scheduled_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.provider_services(id) ON DELETE SET NULL;


--
-- Name: service_instances service_instances_scheduled_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_instances
    ADD CONSTRAINT service_instances_scheduled_service_id_fkey FOREIGN KEY (scheduled_service_id) REFERENCES public.scheduled_services(id) ON DELETE CASCADE;


--
-- Name: service_subcategories service_subcategories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_subcategories
    ADD CONSTRAINT service_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;


--
-- Name: service_warranties service_warranties_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_warranties
    ADD CONSTRAINT service_warranties_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.provider_services(id) ON DELETE CASCADE;


--
-- Name: social_posts social_posts_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: video_meetings video_meetings_active_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_meetings
    ADD CONSTRAINT video_meetings_active_job_id_fkey FOREIGN KEY (active_job_id) REFERENCES public.active_jobs(id) ON DELETE SET NULL;


--
-- Name: video_meetings video_meetings_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_meetings
    ADD CONSTRAINT video_meetings_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs_posted(id) ON DELETE SET NULL;


--
-- Name: video_testimonials video_testimonials_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_testimonials
    ADD CONSTRAINT video_testimonials_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs_posted(id) ON DELETE SET NULL;


--
-- Name: video_testimonials video_testimonials_provider_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video_testimonials
    ADD CONSTRAINT video_testimonials_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;


--
-- Name: work_approval_media work_approval_media_active_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_approval_media
    ADD CONSTRAINT work_approval_media_active_job_id_fkey FOREIGN KEY (active_job_id) REFERENCES public.active_jobs(id) ON DELETE CASCADE;


--
-- Name: active_jobs Active jobs viewable by participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active jobs viewable by participants" ON public.active_jobs FOR SELECT USING (((customer_id = auth.uid()) OR (provider_id = auth.uid())));


--
-- Name: conversion_events Anyone can insert conversion events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can insert conversion events" ON public.conversion_events FOR INSERT WITH CHECK (true);


--
-- Name: profile_views Anyone can track profile views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can track profile views" ON public.profile_views FOR INSERT WITH CHECK (true);


--
-- Name: promoted_ads Anyone can view active ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active ads" ON public.promoted_ads FOR SELECT USING (((status = 'active'::text) OR (EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = promoted_ads.provider_id) AND (providers.user_id = auth.uid()))))));


--
-- Name: post_comments Anyone can view comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view comments" ON public.post_comments FOR SELECT USING (true);


--
-- Name: follows Anyone can view follows; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);


--
-- Name: post_likes Anyone can view likes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view likes" ON public.post_likes FOR SELECT USING (true);


--
-- Name: social_posts Anyone can view posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view posts" ON public.social_posts FOR SELECT USING (true);


--
-- Name: video_testimonials Approved testimonials viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved testimonials viewable by everyone" ON public.video_testimonials FOR SELECT USING ((is_approved = true));


--
-- Name: post_comments Authenticated users can comment; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can comment" ON public.post_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: follows Authenticated users can follow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can follow" ON public.follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));


--
-- Name: post_likes Authenticated users can like; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can like" ON public.post_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Authenticated users can view profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);


--
-- Name: providers Authenticated users can view providers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view providers" ON public.providers FOR SELECT TO authenticated USING (true);


--
-- Name: provider_availability Availability viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Availability viewable by everyone" ON public.provider_availability FOR SELECT USING (true);


--
-- Name: bid_portfolio_items Bid portfolio viewable by job owner and bidder; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Bid portfolio viewable by job owner and bidder" ON public.bid_portfolio_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.bids b
     JOIN public.jobs_posted j ON ((j.id = b.job_id)))
     JOIN public.providers p ON ((p.id = b.provider_id)))
  WHERE ((b.id = bid_portfolio_items.bid_id) AND ((j.customer_id = auth.uid()) OR (p.user_id = auth.uid()))))));


--
-- Name: service_categories Categories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Categories viewable by everyone" ON public.service_categories FOR SELECT USING (true);


--
-- Name: change_orders Change orders viewable by participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Change orders viewable by participants" ON public.change_orders FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.active_jobs
  WHERE ((active_jobs.id = change_orders.active_job_id) AND ((active_jobs.customer_id = auth.uid()) OR (active_jobs.provider_id = auth.uid()))))));


--
-- Name: provider_credentials Credentials viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Credentials viewable by everyone" ON public.provider_credentials FOR SELECT USING (true);


--
-- Name: payment_milestones Customer can manage milestones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customer can manage milestones" ON public.payment_milestones USING ((EXISTS ( SELECT 1
   FROM public.active_jobs
  WHERE ((active_jobs.id = payment_milestones.active_job_id) AND (active_jobs.customer_id = auth.uid())))));


--
-- Name: work_approval_media Customers can approve or reject; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can approve or reject" ON public.work_approval_media FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.active_jobs aj
  WHERE ((aj.id = work_approval_media.active_job_id) AND (aj.customer_id = auth.uid())))));


--
-- Name: jobs_posted Customers can create jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create jobs" ON public.jobs_posted FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: quote_requests Customers can create quote requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create quote requests" ON public.quote_requests FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: reviews Customers can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: scheduled_services Customers can create scheduled services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create scheduled services" ON public.scheduled_services FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: video_testimonials Customers can create testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can create testimonials" ON public.video_testimonials FOR INSERT WITH CHECK ((auth.uid() = customer_id));


--
-- Name: scheduled_services Customers can delete own scheduled services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can delete own scheduled services" ON public.scheduled_services FOR DELETE USING ((auth.uid() = customer_id));


--
-- Name: video_testimonials Customers can delete own testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can delete own testimonials" ON public.video_testimonials FOR DELETE USING ((auth.uid() = customer_id));


--
-- Name: jobs_posted Customers can update own jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can update own jobs" ON public.jobs_posted FOR UPDATE USING ((auth.uid() = customer_id));


--
-- Name: scheduled_services Customers can update own scheduled services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can update own scheduled services" ON public.scheduled_services FOR UPDATE USING ((auth.uid() = customer_id));


--
-- Name: video_testimonials Customers can update own testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can update own testimonials" ON public.video_testimonials FOR UPDATE USING ((auth.uid() = customer_id));


--
-- Name: provider_addons Customers can view active provider addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can view active provider addons" ON public.provider_addons FOR SELECT USING ((is_active = true));


--
-- Name: quote_requests Customers can view own quote requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can view own quote requests" ON public.quote_requests FOR SELECT USING ((auth.uid() = customer_id));


--
-- Name: scheduled_services Customers can view own scheduled services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can view own scheduled services" ON public.scheduled_services FOR SELECT USING ((auth.uid() = customer_id));


--
-- Name: video_testimonials Customers can view own testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Customers can view own testimonials" ON public.video_testimonials FOR SELECT USING ((auth.uid() = customer_id));


--
-- Name: provider_faqs FAQs viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "FAQs viewable by everyone" ON public.provider_faqs FOR SELECT USING (true);


--
-- Name: video_meetings Host can create meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Host can create meetings" ON public.video_meetings FOR INSERT WITH CHECK ((auth.uid() = host_user_id));


--
-- Name: video_meetings Host can delete meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Host can delete meetings" ON public.video_meetings FOR DELETE USING ((auth.uid() = host_user_id));


--
-- Name: video_meetings Host can update meetings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Host can update meetings" ON public.video_meetings FOR UPDATE USING ((auth.uid() = host_user_id));


--
-- Name: job_media Job media viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Job media viewable by everyone" ON public.job_media FOR SELECT USING (true);


--
-- Name: job_media Job owner can manage media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Job owner can manage media" ON public.job_media USING ((EXISTS ( SELECT 1
   FROM public.jobs_posted
  WHERE ((jobs_posted.id = job_media.job_id) AND (jobs_posted.customer_id = auth.uid())))));


--
-- Name: bids Job owner can view all bids on their job; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Job owner can view all bids on their job" ON public.bids FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.jobs_posted
  WHERE ((jobs_posted.id = bids.job_id) AND (jobs_posted.customer_id = auth.uid())))));


--
-- Name: work_approval_media Job participants can view approval media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Job participants can view approval media" ON public.work_approval_media FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.active_jobs aj
  WHERE ((aj.id = work_approval_media.active_job_id) AND ((aj.customer_id = auth.uid()) OR (aj.provider_id = auth.uid()))))));


--
-- Name: jobs_posted Jobs viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Jobs viewable by everyone" ON public.jobs_posted FOR SELECT USING (true);


--
-- Name: video_meetings Meeting participants can view; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Meeting participants can view" ON public.video_meetings FOR SELECT USING (((auth.uid() = host_user_id) OR (auth.uid() = guest_user_id)));


--
-- Name: payment_milestones Milestones viewable by job participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Milestones viewable by job participants" ON public.payment_milestones FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.active_jobs
  WHERE ((active_jobs.id = payment_milestones.active_job_id) AND ((active_jobs.customer_id = auth.uid()) OR (active_jobs.provider_id = auth.uid()))))));


--
-- Name: change_orders Participants can create change orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can create change orders" ON public.change_orders FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.active_jobs
  WHERE ((active_jobs.id = change_orders.active_job_id) AND ((active_jobs.customer_id = auth.uid()) OR (active_jobs.provider_id = auth.uid()))))));


--
-- Name: job_updates Participants can post updates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can post updates" ON public.job_updates FOR INSERT WITH CHECK (((posted_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.active_jobs
  WHERE ((active_jobs.id = job_updates.active_job_id) AND ((active_jobs.customer_id = auth.uid()) OR (active_jobs.provider_id = auth.uid())))))));


--
-- Name: active_jobs Participants can update active jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can update active jobs" ON public.active_jobs FOR UPDATE USING (((customer_id = auth.uid()) OR (provider_id = auth.uid())));


--
-- Name: change_orders Participants can update change orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can update change orders" ON public.change_orders FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.active_jobs
  WHERE ((active_jobs.id = change_orders.active_job_id) AND ((active_jobs.customer_id = auth.uid()) OR (active_jobs.provider_id = auth.uid()))))));


--
-- Name: service_instances Participants can update service instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can update service instances" ON public.service_instances FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.scheduled_services ss
  WHERE ((ss.id = service_instances.scheduled_service_id) AND ((ss.customer_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.providers p
          WHERE ((p.id = ss.provider_id) AND (p.user_id = auth.uid())))))))));


--
-- Name: service_instances Participants can view service instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Participants can view service instances" ON public.service_instances FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.scheduled_services ss
  WHERE ((ss.id = service_instances.scheduled_service_id) AND ((ss.customer_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.providers p
          WHERE ((p.id = ss.provider_id) AND (p.user_id = auth.uid())))))))));


--
-- Name: portfolio_items Portfolio viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Portfolio viewable by everyone" ON public.portfolio_items FOR SELECT USING (true);


--
-- Name: bid_portfolio_items Provider can manage bid portfolio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Provider can manage bid portfolio" ON public.bid_portfolio_items USING ((EXISTS ( SELECT 1
   FROM (public.bids b
     JOIN public.providers p ON ((p.id = b.provider_id)))
  WHERE ((b.id = bid_portfolio_items.bid_id) AND (p.user_id = auth.uid())))));


--
-- Name: provider_services Provider services viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Provider services viewable by everyone" ON public.provider_services FOR SELECT USING (true);


--
-- Name: promoted_ads Providers can create ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create ads" ON public.promoted_ads FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = promoted_ads.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: bids Providers can create bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create bids" ON public.bids FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = bids.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: analytics_report_schedules Providers can create own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create own schedule" ON public.analytics_report_schedules FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = analytics_report_schedules.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: social_posts Providers can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create posts" ON public.social_posts FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = social_posts.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: provider_addons Providers can create their own addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can create their own addons" ON public.provider_addons FOR INSERT WITH CHECK ((provider_id IN ( SELECT providers.id
   FROM public.providers
  WHERE (providers.user_id = auth.uid()))));


--
-- Name: promoted_ads Providers can delete own ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can delete own ads" ON public.promoted_ads FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = promoted_ads.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: social_posts Providers can delete own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can delete own posts" ON public.social_posts FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = social_posts.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: analytics_report_schedules Providers can delete own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can delete own schedule" ON public.analytics_report_schedules FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = analytics_report_schedules.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: work_approval_media Providers can delete pending uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can delete pending uploads" ON public.work_approval_media FOR DELETE USING (((uploaded_by = auth.uid()) AND (status = 'pending'::text)));


--
-- Name: provider_addons Providers can delete their own addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can delete their own addons" ON public.provider_addons FOR DELETE USING ((provider_id IN ( SELECT providers.id
   FROM public.providers
  WHERE (providers.user_id = auth.uid()))));


--
-- Name: provider_faqs Providers can manage own FAQs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can manage own FAQs" ON public.provider_faqs USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = provider_faqs.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: provider_availability Providers can manage own availability; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can manage own availability" ON public.provider_availability USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = provider_availability.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: provider_credentials Providers can manage own credentials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can manage own credentials" ON public.provider_credentials USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = provider_credentials.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: provider_services Providers can manage own services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can manage own services" ON public.provider_services USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = provider_services.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: portfolio_items Providers can manage portfolio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can manage portfolio" ON public.portfolio_items USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = portfolio_items.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: service_warranties Providers can manage their service warranties; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can manage their service warranties" ON public.service_warranties USING ((EXISTS ( SELECT 1
   FROM (public.provider_services ps
     JOIN public.providers p ON ((p.id = ps.provider_id)))
  WHERE ((ps.id = service_warranties.service_id) AND (p.user_id = auth.uid())))));


--
-- Name: bids Providers can only view their own bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can only view their own bids" ON public.bids FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = bids.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: quote_requests Providers can respond to quote requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can respond to quote requests" ON public.quote_requests FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = quote_requests.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: promoted_ads Providers can update own ads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update own ads" ON public.promoted_ads FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = promoted_ads.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: bids Providers can update own bids; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update own bids" ON public.bids FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = bids.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: social_posts Providers can update own posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update own posts" ON public.social_posts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = social_posts.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: providers Providers can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update own profile" ON public.providers FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: analytics_report_schedules Providers can update own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update own schedule" ON public.analytics_report_schedules FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = analytics_report_schedules.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: work_approval_media Providers can update own uploads; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update own uploads" ON public.work_approval_media FOR UPDATE USING ((uploaded_by = auth.uid()));


--
-- Name: provider_addons Providers can update their own addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update their own addons" ON public.provider_addons FOR UPDATE USING ((provider_id IN ( SELECT providers.id
   FROM public.providers
  WHERE (providers.user_id = auth.uid()))));


--
-- Name: scheduled_services Providers can update their scheduled services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can update their scheduled services" ON public.scheduled_services FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = scheduled_services.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: work_approval_media Providers can upload approval media; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can upload approval media" ON public.work_approval_media FOR INSERT WITH CHECK (((uploaded_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.active_jobs aj
  WHERE ((aj.id = work_approval_media.active_job_id) AND (aj.provider_id = auth.uid()))))));


--
-- Name: analytics_report_schedules Providers can view own schedule; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view own schedule" ON public.analytics_report_schedules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = analytics_report_schedules.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: provider_addons Providers can view their own addons; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their own addons" ON public.provider_addons FOR SELECT USING ((provider_id IN ( SELECT providers.id
   FROM public.providers
  WHERE (providers.user_id = auth.uid()))));


--
-- Name: conversion_events Providers can view their own conversion events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their own conversion events" ON public.conversion_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = conversion_events.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: profile_views Providers can view their profile views; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their profile views" ON public.profile_views FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = profile_views.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: quote_requests Providers can view their quote requests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their quote requests" ON public.quote_requests FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = quote_requests.provider_id) AND (providers.user_id = auth.uid())))));


--
-- Name: scheduled_services Providers can view their scheduled services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their scheduled services" ON public.scheduled_services FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = scheduled_services.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: video_testimonials Providers can view their testimonials; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Providers can view their testimonials" ON public.video_testimonials FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.providers p
  WHERE ((p.id = video_testimonials.provider_id) AND (p.user_id = auth.uid())))));


--
-- Name: reviews Reviews viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);


--
-- Name: service_warranties Service warranties viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service warranties viewable by everyone" ON public.service_warranties FOR SELECT USING (true);


--
-- Name: service_subcategories Subcategories viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Subcategories viewable by everyone" ON public.service_subcategories FOR SELECT USING (true);


--
-- Name: active_jobs System can create active jobs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create active jobs" ON public.active_jobs FOR INSERT WITH CHECK ((customer_id = auth.uid()));


--
-- Name: notifications System can create notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: service_instances System can create service instances; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can create service instances" ON public.service_instances FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.scheduled_services ss
  WHERE ((ss.id = service_instances.scheduled_service_id) AND ((ss.customer_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.providers p
          WHERE ((p.id = ss.provider_id) AND (p.user_id = auth.uid())))))))));


--
-- Name: job_updates Updates viewable by job participants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Updates viewable by job participants" ON public.job_updates FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.active_jobs
  WHERE ((active_jobs.id = job_updates.active_job_id) AND ((active_jobs.customer_id = auth.uid()) OR (active_jobs.provider_id = auth.uid()))))));


--
-- Name: favorites Users can add favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add favorites" ON public.favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: conversations Users can create conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK ((customer_id = auth.uid()));


--
-- Name: notification_preferences Users can create own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own preferences" ON public.notification_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: scheduled_reminders Users can create own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own reminders" ON public.scheduled_reminders FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: providers Users can create provider profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create provider profile" ON public.providers FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: referrals Users can create referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT WITH CHECK ((referrer_id = auth.uid()));


--
-- Name: post_comments Users can delete own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own comments" ON public.post_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can delete own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: scheduled_reminders Users can delete own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own reminders" ON public.scheduled_reminders FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorites Users can remove favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove favorites" ON public.favorites FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: messages Users can send messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can send messages in their conversations" ON public.messages FOR INSERT WITH CHECK (((sender_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.customer_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.providers
          WHERE ((providers.id = c.provider_id) AND (providers.user_id = auth.uid()))))))))));


--
-- Name: follows Users can unfollow; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING ((auth.uid() = follower_id));


--
-- Name: post_likes Users can unlike; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike" ON public.post_likes FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: notification_preferences Users can update own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: scheduled_reminders Users can update own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reminders" ON public.scheduled_reminders FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: messages Users can update their own messages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING ((sender_id = auth.uid()));


--
-- Name: messages Users can view messages in their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.customer_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.providers
          WHERE ((providers.id = c.provider_id) AND (providers.user_id = auth.uid())))))))));


--
-- Name: favorites Users can view own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own favorites" ON public.favorites FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_preferences Users can view own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referrals Users can view own referrals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (((referrer_id = auth.uid()) OR (referred_user_id = auth.uid())));


--
-- Name: scheduled_reminders Users can view own reminders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own reminders" ON public.scheduled_reminders FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: referral_rewards Users can view own rewards; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own rewards" ON public.referral_rewards FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: conversations Users can view their conversations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (((customer_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.providers
  WHERE ((providers.id = conversations.provider_id) AND (providers.user_id = auth.uid()))))));


--
-- Name: active_jobs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.active_jobs ENABLE ROW LEVEL SECURITY;

--
-- Name: analytics_report_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_report_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: bid_portfolio_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bid_portfolio_items ENABLE ROW LEVEL SECURITY;

--
-- Name: bids; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

--
-- Name: change_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.change_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: conversion_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

--
-- Name: job_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_media ENABLE ROW LEVEL SECURITY;

--
-- Name: job_updates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.job_updates ENABLE ROW LEVEL SECURITY;

--
-- Name: jobs_posted; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.jobs_posted ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_milestones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;

--
-- Name: portfolio_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

--
-- Name: post_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: post_likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

--
-- Name: profile_views; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: promoted_ads; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.promoted_ads ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_addons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_addons ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_availability; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_credentials ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_faqs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_faqs ENABLE ROW LEVEL SECURITY;

--
-- Name: provider_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

--
-- Name: providers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

--
-- Name: quote_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: referral_rewards; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

--
-- Name: referrals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_reminders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_reminders ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduled_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduled_services ENABLE ROW LEVEL SECURITY;

--
-- Name: service_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: service_instances; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_instances ENABLE ROW LEVEL SECURITY;

--
-- Name: service_subcategories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_subcategories ENABLE ROW LEVEL SECURITY;

--
-- Name: service_warranties; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.service_warranties ENABLE ROW LEVEL SECURITY;

--
-- Name: social_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: video_meetings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_meetings ENABLE ROW LEVEL SECURITY;

--
-- Name: video_testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video_testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: work_approval_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.work_approval_media ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


