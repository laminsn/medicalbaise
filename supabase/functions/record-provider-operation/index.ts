import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";

type OperationBody = {
  action?: string;
  resourceType?: string;
  resourceId?: string | null;
  severity?: "info" | "warning" | "critical";
  metadata?: Record<string, unknown>;
};

const ALLOWED_RESOURCE_TYPES = new Set([
  "provider_calendar_event",
  "provider_communication_campaign",
  "provider_communication_event",
  "provider_ai_api_key",
  "provider_payment_plan",
  "provider_payment_plan_item",
  "provider_invoice",
  "provider_integration",
  "provider_crm_contact",
  "provider_crm_opportunity",
  "provider_quote_record",
  "provider_project",
  "provider_project_task",
  "provider_work_signoff",
  "provider_work_attachment",
]);

const isUuid = (value?: string | null) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

const normalizeToken = (value: unknown, maxLength: number) =>
  escapeHtml(String(value || ""))
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .slice(0, maxLength);

const sanitizeMetadataValue = (value: unknown, depth = 0): unknown => {
  if (depth > 3) return null;
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return escapeHtml(value).slice(0, 600);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 25).map((item) => sanitizeMetadataValue(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 35)
        .map(([key, item]) => [
          normalizeToken(key, 80),
          sanitizeMetadataValue(item, depth + 1),
        ]),
    );
  }
  return null;
};

const sanitizeMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const safe = sanitizeMetadataValue(metadata);
  const serialized = JSON.stringify(safe || {});
  if (serialized.length > 10_000) {
    return { truncated: true };
  }
  return safe as Record<string, unknown>;
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
    const body = (await req.json()) as OperationBody;
    const action = normalizeToken(body.action, 120);
    const resourceType = normalizeToken(body.resourceType, 100);
    const severity = body.severity || "info";
    const resourceId = isUuid(body.resourceId) ? body.resourceId : null;

    if (!action || !resourceType) {
      return new Response(JSON.stringify({ error: "action and resourceType are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_RESOURCE_TYPES.has(resourceType)) {
      return new Response(JSON.stringify({ error: "resourceType is not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["info", "warning", "critical"].includes(severity)) {
      return new Response(JSON.stringify({ error: "severity is not allowed" }), {
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

    const { data: auditId, error: auditError } = await supabaseAdmin.rpc("log_provider_audit_event", {
      target_provider_id: provider.id,
      actor_id: user.id,
      actor_kind: "owner",
      event_action: action,
      event_resource_type: resourceType,
      event_resource_id: resourceId,
      event_severity: severity,
      event_metadata: sanitizeMetadata(body.metadata),
    });

    if (auditError) throw auditError;

    return new Response(JSON.stringify({ auditEventId: auditId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "RECORD-PROVIDER-OPERATION");
  }
});
