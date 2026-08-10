import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";
import { normalizeAppKey } from "../_shared/brands.ts";

type ApiKeyBody = {
  action: "create" | "revoke";
  keyId?: string;
  keyName?: string;
  scopes?: string[];
  expiresAt?: string;
};

const encoder = new TextEncoder();

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");

const randomToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const binary = Array.from(bytes).map((byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const hashApiKey = async (apiKey: string) => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(apiKey));
  return toHex(digest);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as ApiKeyBody;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // A user without a providers row mints a CLIENT key rather than being refused.
    // Both principal types are first-class from 2026-08-10; see _shared/api-auth.ts.
    if (providerError) throw providerError;
    const isProviderPrincipal = Boolean(provider);
    const ownerFilter = isProviderPrincipal
      ? { column: "provider_id", value: String(provider!.id) }
      : { column: "customer_id", value: user.id };

    if (body.action === "revoke") {
      if (!isUuid(body.keyId)) {
        return new Response(JSON.stringify({ error: "Valid keyId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await supabaseAdmin
        .from("provider_ai_api_keys")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        })
        .eq("id", body.keyId)
        // Scoped to the caller's own keys. Filtering by id alone would let any
        // authenticated user revoke anyone's key.
        .eq(ownerFilter.column, ownerFilter.value)
        .select("id, status, revoked_at")
        .single();

      if (error) throw error;

      // The provider audit log is provider-scoped by design; a client key has no
      // provider to attribute the event to, so it is skipped rather than logged
      // against a fabricated provider id.
      if (isProviderPrincipal) {
        await supabaseAdmin.rpc("log_provider_audit_event", {
          target_provider_id: provider!.id,
          actor_id: user.id,
          actor_kind: "owner",
          event_action: "ai_api_key.revoked",
          event_resource_type: "provider_ai_api_key",
          event_resource_id: data.id,
          event_severity: "warning",
          event_metadata: {
            revoked_at: data.revoked_at,
          },
        });
      }

      return new Response(JSON.stringify({ apiKey: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyPrefix = "baise_ai";
    const apiKey = `${keyPrefix}_${randomToken()}`;
    const keyHash = await hashApiKey(apiKey);
    // Write is opt-in per key as of 2026-08-10.
    //
    // The previous default was ["ai.records.read", "ai.records.write"] — every key
    // ever minted could write. An agent that can message your customers because it
    // could also read your services is a wider blast radius than anyone intends at
    // mint time, so the default is now read-only and write must be asked for.
    //
    // Requested scopes are validated against the vocabulary rather than escaped and
    // stored: an unrecognised scope grants nothing in the verifier, so storing it
    // would only mislead whoever reads the key list later.
    const GRANTABLE_SCOPES = [
      "providers:read",
      "services:read",
      "services:write",
      "requests:read",
      "requests:write",
      "messages:read",
      "messages:write",
    ];
    const READ_ONLY_DEFAULT = ["providers:read", "services:read", "requests:read"];

    const requestedScopes = Array.isArray(body.scopes)
      ? body.scopes.map((scope) => String(scope)).filter((scope) => GRANTABLE_SCOPES.includes(scope))
      : [];
    const scopes = requestedScopes.length ? Array.from(new Set(requestedScopes)) : READ_ONLY_DEFAULT;
    const keyName = escapeHtml(body.keyName || "Provider AI key").slice(0, 120);
    const expiresAt = body.expiresAt && !Number.isNaN(Date.parse(body.expiresAt))
      ? new Date(body.expiresAt).toISOString()
      : null;

    const { data, error } = await supabaseAdmin
      .from("provider_ai_api_keys")
      .insert({
        // Exactly one owner column, enforced by a CHECK constraint.
        provider_id: isProviderPrincipal ? provider!.id : null,
        customer_id: isProviderPrincipal ? null : user.id,
        // The brand this key may act on. For a provider key the verifier cross-checks
        // it against providers.platform and the database wins on mismatch; for a
        // client key there is no other authority, so this column IS the authority.
        app_context: normalizeAppKey(Deno.env.get("BAISE_APP_KEY")),
        created_by: user.id,
        key_name: keyName,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        key_last_four: apiKey.slice(-4),
        scopes,
        expires_at: expiresAt,
        metadata: {
          one_time_reveal: true,
          created_from: "provider_portal",
        },
      })
      .select("id, key_name, key_prefix, key_last_four, scopes, status, created_at, expires_at")
      .single();

    if (error) throw error;

    // Provider-scoped audit log; a client key has no provider to attribute the event
    // to, so it is skipped rather than logged against a fabricated provider id.
    if (isProviderPrincipal) {
      await supabaseAdmin.rpc("log_provider_audit_event", {
        target_provider_id: provider!.id,
        actor_id: user.id,
        actor_kind: "owner",
        event_action: "ai_api_key.created",
        event_resource_type: "provider_ai_api_key",
        event_resource_id: data.id,
        event_severity: "warning",
        event_metadata: {
          key_name: data.key_name,
          key_last_four: data.key_last_four,
          scopes: data.scopes,
          expires_at: data.expires_at,
          one_time_reveal: true,
        },
      });
    }

    return new Response(JSON.stringify({ apiKey, record: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "MANAGE-PROVIDER-AI-API-KEY");
  }
});
