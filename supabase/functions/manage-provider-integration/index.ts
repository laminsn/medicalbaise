import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";

type IntegrationAction = "connect" | "disconnect" | "mark_connected" | "sync";

type IntegrationBody = {
  action: IntegrationAction;
  integrationKey: string;
  displayName?: string;
  category?: "email" | "calendar" | "storage" | "productivity" | "ai" | "accounting" | "banking" | "payments" | "messaging";
  scopes?: string[];
  config?: Record<string, unknown>;
};

const INTEGRATION_CATALOG: Record<
  string,
  { displayName: string; category: IntegrationBody["category"]; scopes: string[]; envHint: string }
> = {
  gmail: {
    displayName: "Gmail",
    category: "email",
    scopes: ["email.send", "email.readonly"],
    envHint: "GOOGLE_CLIENT_ID",
  },
  google_calendar: {
    displayName: "Google Calendar",
    category: "calendar",
    scopes: ["calendar.events", "calendar.readonly"],
    envHint: "GOOGLE_CLIENT_ID",
  },
  google_drive: {
    displayName: "Google Drive",
    category: "storage",
    scopes: ["drive.file"],
    envHint: "GOOGLE_CLIENT_ID",
  },
  microsoft_office: {
    displayName: "Microsoft 365",
    category: "productivity",
    scopes: ["mail.send", "calendars.readwrite", "files.readwrite"],
    envHint: "MICROSOFT_CLIENT_ID",
  },
  openai_chatgpt: {
    displayName: "ChatGPT / OpenAI",
    category: "ai",
    scopes: ["assistant.tools", "content.generation"],
    envHint: "OPENAI_API_KEY",
  },
  anthropic_claude: {
    displayName: "Claude",
    category: "ai",
    scopes: ["assistant.tools", "content.generation"],
    envHint: "ANTHROPIC_API_KEY",
  },
  quickbooks: {
    displayName: "QuickBooks",
    category: "accounting",
    scopes: ["accounting.invoice", "accounting.customer", "accounting.payment"],
    envHint: "QUICKBOOKS_CLIENT_ID",
  },
  plaid: {
    displayName: "Plaid",
    category: "banking",
    scopes: ["transactions", "balance", "identity"],
    envHint: "PLAID_CLIENT_ID",
  },
  whatsapp_business: {
    displayName: "WhatsApp Business",
    category: "messaging",
    scopes: ["messages.send", "templates.manage"],
    envHint: "WHATSAPP_BUSINESS_TOKEN",
  },
};

const normalizeKey = (key: string) =>
  key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 80);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as IntegrationBody;
    const integrationKey = normalizeKey(body.integrationKey || "");

    if (!integrationKey) {
      return new Response(JSON.stringify({ error: "integrationKey is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const catalog = INTEGRATION_CATALOG[integrationKey];
    const displayName = escapeHtml(body.displayName || catalog?.displayName || integrationKey).slice(0, 120);
    const category = body.category || catalog?.category || "productivity";
    const scopes = body.scopes?.length ? body.scopes.map((scope) => escapeHtml(scope).slice(0, 80)) : catalog?.scopes || [];
    const envHint = catalog?.envHint;
    const isConfigured = envHint ? Boolean(Deno.env.get(envHint)) : false;

    if (body.action === "disconnect") {
      const { data, error } = await supabaseAdmin
        .from("provider_integrations")
        .upsert(
          {
            provider_id: provider.id,
            created_by: user.id,
            integration_key: integrationKey,
            display_name: displayName,
            category,
            scopes,
            status: "disabled",
            config: body.config || {},
            metadata: {
              disconnected_at: new Date().toISOString(),
              env_hint: envHint || null,
            },
          },
          { onConflict: "provider_id,integration_key" },
        )
        .select("id, status")
        .single();
      if (error) throw error;
      return new Response(JSON.stringify({ integration: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nextStatus =
      body.action === "mark_connected"
        ? "connected"
        : isConfigured
          ? "pending"
          : "needs_attention";

    const { data, error } = await supabaseAdmin
      .from("provider_integrations")
      .upsert(
        {
          provider_id: provider.id,
          created_by: user.id,
          integration_key: integrationKey,
          display_name: displayName,
          category,
          scopes,
          status: nextStatus,
          last_sync_at: body.action === "sync" ? new Date().toISOString() : null,
          config: body.config || {},
          metadata: {
            env_hint: envHint || null,
            configured: isConfigured,
            note: isConfigured
              ? "Integration credentials are configured. OAuth/token exchange can proceed from the provider portal."
              : "Add provider credentials or OAuth app settings before external API calls can run.",
          },
        },
        { onConflict: "provider_id,integration_key" },
      )
      .select("id, integration_key, display_name, category, status, scopes, last_sync_at, metadata")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        integration: data,
        requiresConfiguration: !isConfigured,
        envHint,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "MANAGE-PROVIDER-INTEGRATION");
  }
});
