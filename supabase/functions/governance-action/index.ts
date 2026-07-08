import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  getCorsHeaders,
  parseRequestBody,
  rejectNonPostMethod,
  serverRateLimit,
} from "../_shared/security.ts";

type GovernanceActionType = "flag" | "refund_review" | "terminate" | "archive";

type GovernanceActionPayload = {
  appKey?: string;
  personId?: string;
  personType?: string;
  targetKind?: string;
  targetId?: string;
  actionType?: GovernanceActionType;
  reason?: string;
  notes?: string;
  refundAmount?: number | string | null;
  currency?: string;
  terminationScope?: string | null;
  archiveScope?: string | null;
  metadata?: Record<string, unknown>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const allowedAppKeys = new Set(["casa", "medical", "legal"]);
const allowedTargetKinds = new Set([
  "profile",
  "member",
  "client",
  "partner",
  "retainer",
  "partnership",
  "client_engagement",
  "membership",
  "account",
  "related_record",
  "all",
]);

const allowedReasons: Record<GovernanceActionType, Set<string>> = {
  flag: new Set(["unethical", "disrespectful", "fraud", "dishonesty", "criminal_background", "owner_discretion"]),
  refund_review: new Set([
    "billing_error",
    "client_request",
    "duplicate_payment",
    "service_not_delivered",
    "partial_service",
    "chargeback_risk",
    "owner_discretion",
    "fraud",
  ]),
  terminate: new Set([
    "unethical",
    "disrespectful",
    "fraud",
    "dishonesty",
    "criminal_background",
    "nonpayment",
    "client_request",
    "owner_discretion",
  ]),
  archive: new Set(["inactive", "duplicate_record", "client_request", "owner_discretion", "migrated", "resolved"]),
};

const allowedTerminationScopes = new Set(["retainer", "partnership", "client_engagement", "membership", "account", "all"]);
const allowedArchiveScopes = new Set(["profile", "membership", "partnership", "client_engagement", "account", "all"]);

function jsonResponse(body: unknown, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeAppKey(value?: string) {
  const appKey = String(value || "casa").toLowerCase();
  return allowedAppKeys.has(appKey) ? appKey : "casa";
}

function normalizeReason(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function statusForAction(actionType: GovernanceActionType) {
  if (actionType === "flag") return "active";
  if (actionType === "refund_review") return "pending_review";
  return "completed";
}

function governanceStatusForAction(actionType: GovernanceActionType) {
  if (actionType === "refund_review") return "refund_review";
  if (actionType === "terminate") return "terminated";
  if (actionType === "archive") return "archived";
  return "flagged";
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const { user } = await authenticateRequest(req);

    if (!serverRateLimit(`governance:${user.id}`, 40, 60_000)) {
      return jsonResponse({ error: "Too many governance requests. Try again shortly." }, 429, corsHeaders);
    }

    const body = await parseRequestBody<GovernanceActionPayload>(req, 1024 * 24);
    const appKey = normalizeAppKey(body.appKey);
    const personId = String(body.personId || "");
    const actionType = body.actionType;
    const reason = normalizeReason(body.reason);
    const notes = String(body.notes || "").trim();
    const targetKind = String(body.targetKind || "profile").trim();
    const targetId = body.targetId ? String(body.targetId).trim() : null;
    const currency = String(body.currency || "BRL").trim().toUpperCase();
    const refundAmount = body.refundAmount === null || body.refundAmount === undefined || body.refundAmount === ""
      ? null
      : Number(body.refundAmount);

    if (!uuidPattern.test(personId)) {
      return jsonResponse({ error: "A valid relationship person is required." }, 400, corsHeaders);
    }
    if (!actionType || !["flag", "refund_review", "terminate", "archive"].includes(actionType)) {
      return jsonResponse({ error: "A valid governance action type is required." }, 400, corsHeaders);
    }
    if (!allowedTargetKinds.has(targetKind)) {
      return jsonResponse({ error: "A valid target kind is required." }, 400, corsHeaders);
    }
    if (!allowedReasons[actionType].has(reason)) {
      return jsonResponse({ error: "A valid reason is required for this governance action." }, 400, corsHeaders);
    }
    if (notes.length < 8) {
      return jsonResponse({ error: "Notes are required and must explain the decision." }, 400, corsHeaders);
    }
    if (actionType === "refund_review" && (!refundAmount || Number.isNaN(refundAmount) || refundAmount <= 0)) {
      return jsonResponse({ error: "Refund review actions require a valid refund amount." }, 400, corsHeaders);
    }
    if (actionType === "terminate" && !allowedTerminationScopes.has(String(body.terminationScope || ""))) {
      return jsonResponse({ error: "Termination actions require a valid scope." }, 400, corsHeaders);
    }
    if (actionType === "archive" && !allowedArchiveScopes.has(String(body.archiveScope || ""))) {
      return jsonResponse({ error: "Archive actions require a valid scope." }, 400, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ error: "Server is not configured for governance actions." }, 500, corsHeaders);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: roles, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"]);

    if (roleError) throw roleError;
    if (!roles || roles.length === 0) {
      return jsonResponse({ error: "Staff or super-admin access is required." }, 403, corsHeaders);
    }

    const { data: person, error: personError } = await supabaseAdmin
      .from("growth_people")
      .select("id, app_key, user_id, person_type, full_name, email, phone, metadata")
      .eq("id", personId)
      .eq("app_key", appKey)
      .single();

    if (personError || !person) {
      return jsonResponse({ error: "Relationship profile not found." }, 404, corsHeaders);
    }

    const status = statusForAction(actionType);
    const governanceStatus = governanceStatusForAction(actionType);
    const metadata = {
      ...(body.metadata || {}),
      source: "relationship_os_governance_controls",
      actor_email: user.email,
      target_kind: targetKind,
      target_id: targetId,
      previous_person_metadata: {
        governance: (person.metadata as Record<string, unknown> | null | undefined)?.governance || null,
      },
    };

    const { data: action, error: actionError } = await supabaseAdmin
      .from("cqa_governance_actions")
      .insert({
        app_key: appKey,
        person_id: personId,
        actor_id: user.id,
        person_type: body.personType || person.person_type,
        target_kind: targetKind,
        target_id: targetId,
        action_type: actionType,
        reason,
        notes,
        refund_amount: actionType === "refund_review" ? refundAmount : null,
        currency,
        termination_scope: actionType === "terminate" ? body.terminationScope : null,
        archive_scope: actionType === "archive" ? body.archiveScope : null,
        status,
        metadata,
      })
      .select("id, created_at")
      .single();

    if (actionError || !action) throw actionError || new Error("Unable to create governance action.");

    const nextPersonMetadata = {
      ...((person.metadata as Record<string, unknown>) || {}),
      governance: {
        status: governanceStatus,
        action_type: actionType,
        reason,
        action_id: action.id,
        updated_at: new Date().toISOString(),
        target_kind: targetKind,
        target_id: targetId,
      },
    };

    const personUpdate: Record<string, unknown> = {
      governance_status: governanceStatus,
      governance_reason: reason,
      governance_notes: notes,
      governance_last_action_id: action.id,
      governance_updated_at: new Date().toISOString(),
      metadata: nextPersonMetadata,
    };

    if (actionType === "terminate") personUpdate.terminated_at = new Date().toISOString();
    if (actionType === "archive") personUpdate.archived_at = new Date().toISOString();

    const { error: personUpdateError } = await supabaseAdmin
      .from("growth_people")
      .update(personUpdate)
      .eq("id", personId);

    if (personUpdateError) throw personUpdateError;

    const { data: event, error: eventError } = await supabaseAdmin
      .from("growth_events")
      .insert({
        app_key: appKey,
        person_id: personId,
        user_id: person.user_id,
        event_family: "governance",
        event_type: actionType,
        action_taken: `${reason}: ${notes}`,
        source_table: "cqa_governance_actions",
        source_id: action.id,
        status,
        amount: actionType === "refund_review" ? refundAmount : null,
        currency,
        metadata: {
          governance_action_id: action.id,
          target_kind: targetKind,
          target_id: targetId,
          termination_scope: actionType === "terminate" ? body.terminationScope : null,
          archive_scope: actionType === "archive" ? body.archiveScope : null,
        },
      })
      .select("id")
      .single();

    if (eventError) throw eventError;

    await supabaseAdmin.from("relationship_notes").insert({
      app_key: appKey,
      person_id: personId,
      author_id: user.id,
      note_type: actionType === "flag" ? "risk" : "approval",
      visibility: "internal",
      body: `Governance ${actionType.replace("_", " ")} - ${reason.replaceAll("_", " ")}: ${notes}`,
      metadata: {
        governance_action_id: action.id,
        event_id: event?.id || null,
        target_kind: targetKind,
        target_id: targetId,
      },
    });

    if (actionType === "refund_review" || reason === "fraud" || actionType === "terminate") {
      await supabaseAdmin.from("growth_followup_tasks").insert({
        app_key: appKey,
        event_id: event?.id || null,
        task_type: reason === "fraud" ? "fraud_review" : "review",
        title: actionType === "refund_review" ? "Review governance refund action" : "Review governance action",
        status: "open",
        priority: reason === "fraud" || actionType === "terminate" ? "urgent" : "high",
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          source: "governance_action",
          governance_action_id: action.id,
          person_id: personId,
          action_type: actionType,
          reason,
        },
      });
    }

    return jsonResponse({ ok: true, actionId: action.id, status, governanceStatus }, 200, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record governance action.";
    const status = message.toLowerCase().includes("auth") ? 401 : 500;
    return jsonResponse({ error: message }, status, corsHeaders);
  }
});
