import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";

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

    if (providerError || !provider) {
      return new Response(JSON.stringify({ error: "Provider account required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        .eq("provider_id", provider.id)
        .select("id, status, revoked_at")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ apiKey: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyPrefix = "baise_ai";
    const apiKey = `${keyPrefix}_${randomToken()}`;
    const keyHash = await hashApiKey(apiKey);
    const scopes = Array.isArray(body.scopes) && body.scopes.length
      ? body.scopes.map((scope) => escapeHtml(String(scope)).slice(0, 80)).slice(0, 20)
      : ["ai.records.read", "ai.records.write"];
    const keyName = escapeHtml(body.keyName || "Provider AI key").slice(0, 120);
    const expiresAt = body.expiresAt && !Number.isNaN(Date.parse(body.expiresAt))
      ? new Date(body.expiresAt).toISOString()
      : null;

    const { data, error } = await supabaseAdmin
      .from("provider_ai_api_keys")
      .insert({
        provider_id: provider.id,
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

    return new Response(JSON.stringify({ apiKey, record: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "MANAGE-PROVIDER-AI-API-KEY");
  }
});
