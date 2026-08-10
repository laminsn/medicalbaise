-- Agent spine: the API/MCP surface (§3.1, §3.2) and the request lifecycle (§3.6).
--
-- This migration is intentionally identical across Casa, Medical and Legal because
-- the three apps share one Supabase project, so it must run exactly once regardless
-- of which repo applies it.
--
-- SECURITY NOTE, read before extending anything here.
-- api-v1 and mcp-server authenticate by API key, not by Supabase JWT, so they must
-- use the service-role client — which BYPASSES every policy below. RLS therefore
-- protects the normal logged-in paths and does NOT protect the API path. The
-- enforcement point for API requests is scopedQuery() in _shared/api-auth.ts, which
-- every handler is required to go through. Do not add an API handler that queries a
-- table directly; the choke point is the control.

-- ---------------------------------------------------------------------------
-- 1 · API keys: two principal types, and write is no longer granted by default
-- ---------------------------------------------------------------------------

-- The table is named provider_ai_api_keys for historical reasons. It now holds both
-- provider-owned and client-owned keys. Renaming it would churn two live policies and
-- a mint function for cosmetic gain, so the name stays and this comment carries the truth.
COMMENT ON TABLE public.provider_ai_api_keys IS
  'Agent API keys. Holds BOTH provider-owned (provider_id) and client-owned (customer_id) keys; exactly one owner column is set. Name is historical.';

ALTER TABLE public.provider_ai_api_keys
  ALTER COLUMN provider_id DROP NOT NULL;

ALTER TABLE public.provider_ai_api_keys
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- The brand a key may act on. For provider keys this is cross-checked against
-- providers.platform at verification time and the database wins on mismatch. For
-- client keys there is no other authority, so this column IS the authority.
-- There must never be a request header that can influence this.
ALTER TABLE public.provider_ai_api_keys
  ADD COLUMN IF NOT EXISTS app_context text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_ai_api_keys_app_context_check'
  ) THEN
    ALTER TABLE public.provider_ai_api_keys
      ADD CONSTRAINT provider_ai_api_keys_app_context_check
      CHECK (app_context IS NULL OR app_context IN ('casa', 'medical', 'legal'));
  END IF;

  -- Exactly one owner. A key with both owners set could act as either principal;
  -- a key with neither would authenticate to nothing and fail confusingly.
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'provider_ai_api_keys_single_owner_check'
  ) THEN
    ALTER TABLE public.provider_ai_api_keys
      ADD CONSTRAINT provider_ai_api_keys_single_owner_check
      CHECK ((provider_id IS NOT NULL) <> (customer_id IS NOT NULL));
  END IF;
END $$;

-- Write was granted by DEFAULT until 2026-08-10. An agent that can message your
-- customers because it could also read your services is a wider blast radius than
-- anyone intends at mint time, so write scopes are now opt-in per key.
ALTER TABLE public.provider_ai_api_keys
  ALTER COLUMN scopes SET DEFAULT ARRAY['providers:read', 'services:read', 'requests:read']::text[];

CREATE INDEX IF NOT EXISTS provider_ai_api_keys_customer_idx
  ON public.provider_ai_api_keys (customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;

-- Client-owned keys need their own policies; the two existing policies are
-- predicated on provider ownership and would never match a client key.
DROP POLICY IF EXISTS "Clients view own AI API keys" ON public.provider_ai_api_keys;
CREATE POLICY "Clients view own AI API keys" ON public.provider_ai_api_keys
  FOR SELECT USING (customer_id IS NOT NULL AND customer_id = auth.uid());

DROP POLICY IF EXISTS "Clients revoke own AI API keys" ON public.provider_ai_api_keys;
CREATE POLICY "Clients revoke own AI API keys" ON public.provider_ai_api_keys
  FOR UPDATE USING (customer_id IS NOT NULL AND customer_id = auth.uid())
  WITH CHECK (customer_id IS NOT NULL AND customer_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 2 · Request lifecycle: one invitation row per (request, provider)
-- ---------------------------------------------------------------------------

-- quote_requests.provider_id targets exactly one provider and is left untouched.
-- Fanout, referral chains, reminders and escalation all live here instead, which
-- also gives an agent a per-provider state row it can reason about.
CREATE TABLE IF NOT EXISTS public.quote_request_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  app_context text NOT NULL CHECK (app_context IN ('casa', 'medical', 'legal')),

  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'viewed', 'accepted', 'declined', 'referred', 'expired')),

  -- SHA-256 hex of the token emailed to the provider. The token itself is never
  -- stored, exactly as the appointment-response flow does it.
  token_digest text NOT NULL UNIQUE,

  -- Referral chain. referred_to is who this provider passed it to; referred_from
  -- is the invitation that produced this one. Both nullable; a root invitation has
  -- neither, and a chain is walked by following referred_from upwards.
  referred_to_provider_id uuid REFERENCES public.providers(id) ON DELETE SET NULL,
  referred_from_invitation_id uuid REFERENCES public.quote_request_invitations(id) ON DELETE SET NULL,
  referral_note text,

  sent_at timestamptz NOT NULL DEFAULT now(),
  viewed_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  reminded_at timestamptz,

  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- A provider is invited to a given request once. A re-send updates the row
  -- rather than creating a second one, so the response token stays unambiguous.
  UNIQUE (request_id, provider_id)
);

CREATE INDEX IF NOT EXISTS quote_request_invitations_request_idx
  ON public.quote_request_invitations (request_id, status);
CREATE INDEX IF NOT EXISTS quote_request_invitations_provider_idx
  ON public.quote_request_invitations (provider_id, status, sent_at DESC);
CREATE INDEX IF NOT EXISTS quote_request_invitations_open_idx
  ON public.quote_request_invitations (expires_at)
  WHERE status IN ('sent', 'viewed');

ALTER TABLE public.quote_request_invitations ENABLE ROW LEVEL SECURITY;

-- Deny by default to anon/authenticated; the service role does the writing.
-- The provider-facing read below is the only direct client access.
REVOKE ALL ON public.quote_request_invitations FROM anon, authenticated;
GRANT SELECT ON public.quote_request_invitations TO authenticated;

DROP POLICY IF EXISTS "Providers view own invitations" ON public.quote_request_invitations;
CREATE POLICY "Providers view own invitations" ON public.quote_request_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = quote_request_invitations.provider_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers view invitations on own requests" ON public.quote_request_invitations;
CREATE POLICY "Customers view invitations on own requests" ON public.quote_request_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests q
      WHERE q.id = quote_request_invitations.request_id AND q.customer_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_quote_request_invitations_updated_at ON public.quote_request_invitations;
CREATE TRIGGER update_quote_request_invitations_updated_at
  BEFORE UPDATE ON public.quote_request_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_crm_updated_at();

-- ---------------------------------------------------------------------------
-- 3 · 'requests' becomes a suppression category
-- ---------------------------------------------------------------------------

-- A provider must be able to stop receiving request notifications without
-- unsubscribing from everything, so the fanout gates on this category the same way
-- the marketing senders gate on theirs.
ALTER TABLE public.email_suppressions
  DROP CONSTRAINT IF EXISTS email_suppressions_category_check;
ALTER TABLE public.email_suppressions
  ADD CONSTRAINT email_suppressions_category_check
  CHECK (category IN ('all', 'promotions', 'education', 'analytics', 'referral', 'product_updates', 'requests'));

ALTER TABLE public.email_consent_events
  DROP CONSTRAINT IF EXISTS email_consent_events_category_check;
ALTER TABLE public.email_consent_events
  ADD CONSTRAINT email_consent_events_category_check
  CHECK (category IN ('all', 'promotions', 'education', 'analytics', 'referral', 'product_updates', 'requests'));
