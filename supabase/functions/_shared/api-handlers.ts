// Agent API handlers (§3.1, §3.2) — the single authorisation path.
//
// Byte-identical across Casa, Medical and Legal.
//
// These live in _shared, not inside api-v1, because mcp-server imports them too and
// api-v1/index.ts calls Deno.serve() at module scope — importing that file would
// start a second server inside the MCP function.
//
// There is exactly one implementation of each operation. A second one in mcp-server
// would be a second set of authorisation bugs, and the two would drift.
//
// Every read goes through scopedQuery(). The callers hold the service role, so RLS
// does not apply to anything here; scopedQuery is the substitute control and it is
// only a control if nothing bypasses it.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import {
  type ApiPrincipal,
  ApiAuthError,
  requirePrincipalType,
  requireScope,
  scopedQuery,
} from "./api-auth.ts";

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

function clampLimit(raw: unknown): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.trunc(value), MAX_PAGE_SIZE);
}

/** Bounds a free-text search term and strips PostgREST filter metacharacters. */
function safeSearchTerm(raw: unknown): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return value.replace(/[%,()*]/g, " ").slice(0, 80);
}

// ---------------------------------------------------------------------------
// Handlers — shared with mcp-server
// ---------------------------------------------------------------------------

export interface HandlerContext {
  admin: SupabaseClient;
  principal: ApiPrincipal;
}

export async function searchProviders(
  ctx: HandlerContext,
  params: { query?: string; categoryId?: string; limit?: number },
) {
  requireScope(ctx.principal, "providers:read");

  let query = scopedQuery(
    ctx.admin,
    ctx.principal,
    "providers",
    "id, business_name, tagline, bio, years_experience, avg_rating, total_reviews, total_jobs, is_verified",
  )
    .eq("governance_status", "active")
    .order("avg_rating", { ascending: false })
    .limit(clampLimit(params.limit));

  const term = safeSearchTerm(params.query);
  if (term) query = query.ilike("business_name", `%${term}%`);

  const { data, error } = await query;
  if (error) throw error;

  // A category filter is applied after the scoped fetch rather than as a join,
  // because provider_services is scoped separately and joining here would widen
  // what a client principal can see.
  if (!params.categoryId) return { providers: data ?? [] };

  const { data: services, error: servicesError } = await ctx.admin
    .from("provider_services")
    .select("provider_id")
    .eq("category_id", params.categoryId);
  if (servicesError) throw servicesError;

  const allowed = new Set((services ?? []).map((row) => String(row.provider_id)));
  return { providers: (data ?? []).filter((row) => allowed.has(String(row.id))) };
}

export async function getProvider(ctx: HandlerContext, params: { providerId: string }) {
  requireScope(ctx.principal, "providers:read");

  const { data, error } = await scopedQuery(
    ctx.admin,
    ctx.principal,
    "providers",
    "id, business_name, tagline, bio, years_experience, avg_rating, total_reviews, total_jobs, is_verified, languages",
  )
    .eq("id", params.providerId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { provider: null };
  return { provider: data };
}

export async function listRequests(ctx: HandlerContext, params: { status?: string; limit?: number }) {
  requireScope(ctx.principal, "requests:read");

  let query = scopedQuery(
    ctx.admin,
    ctx.principal,
    "quote_requests",
    "id, title, description, status, urgency, budget_min, budget_max, preferred_start_date, created_at",
  )
    .order("created_at", { ascending: false })
    .limit(clampLimit(params.limit));

  if (params.status) query = query.eq("status", String(params.status).slice(0, 40));

  const { data, error } = await query;
  if (error) throw error;
  return { requests: data ?? [] };
}

export async function createRequest(
  ctx: HandlerContext,
  params: {
    title: string;
    description: string;
    categoryId?: string;
    budgetMin?: number;
    budgetMax?: number;
    urgency?: string;
  },
) {
  // Only a client files a request. A provider key filing requests on a customer's
  // behalf would create records attributed to a user who never asked for anything.
  requirePrincipalType(ctx.principal, "client");
  requireScope(ctx.principal, "requests:write");

  const title = String(params.title ?? "").trim().slice(0, 200);
  const description = String(params.description ?? "").trim().slice(0, 5000);
  if (!title || !description) throw new ApiAuthError(400);

  const { data, error } = await ctx.admin
    .from("quote_requests")
    .insert({
      customer_id: ctx.principal.userId,
      category_id: params.categoryId ?? null,
      title,
      description,
      budget_min: Number.isFinite(Number(params.budgetMin)) ? Number(params.budgetMin) : null,
      budget_max: Number.isFinite(Number(params.budgetMax)) ? Number(params.budgetMax) : null,
      urgency: ["low", "normal", "high", "urgent"].includes(String(params.urgency))
        ? String(params.urgency)
        : "normal",
      status: "pending",
    })
    .select("id, title, status, created_at")
    .single();

  if (error) throw error;
  return { request: data };
}

export async function listInvitations(ctx: HandlerContext, params: { status?: string; limit?: number }) {
  requireScope(ctx.principal, "requests:read");

  let query = scopedQuery(
    ctx.admin,
    ctx.principal,
    "quote_request_invitations",
    "id, request_id, provider_id, status, sent_at, responded_at, expires_at",
  )
    .order("sent_at", { ascending: false })
    .limit(clampLimit(params.limit));

  if (params.status) query = query.eq("status", String(params.status).slice(0, 20));

  const { data, error } = await query;
  if (error) throw error;
  return { invitations: data ?? [] };
}

export async function respondToInvitation(
  ctx: HandlerContext,
  params: { invitationId: string; response: string; referToProviderId?: string; note?: string },
) {
  requirePrincipalType(ctx.principal, "provider");
  requireScope(ctx.principal, "requests:write");

  const response = String(params.response ?? "");
  if (!["accepted", "declined", "referred"].includes(response)) throw new ApiAuthError(400);

  // Re-scope on update as well as read. Filtering by invitation id alone would let
  // any provider key move any provider's invitation.
  const { data: invitation, error: lookupError } = await ctx.admin
    .from("quote_request_invitations")
    .select("id, request_id, status, expires_at")
    .eq("id", params.invitationId)
    .eq("provider_id", ctx.principal.providerId as string)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!invitation) throw new ApiAuthError(404);
  if (!["sent", "viewed"].includes(String(invitation.status))) throw new ApiAuthError(409);
  if (invitation.expires_at && Date.parse(String(invitation.expires_at)) <= Date.now()) {
    throw new ApiAuthError(409);
  }

  const { error } = await ctx.admin
    .from("quote_request_invitations")
    .update({
      status: response,
      responded_at: new Date().toISOString(),
      referred_to_provider_id: response === "referred" ? (params.referToProviderId ?? null) : null,
      referral_note: params.note ? String(params.note).slice(0, 500) : null,
    })
    .eq("id", invitation.id)
    .eq("provider_id", ctx.principal.providerId as string);

  if (error) throw error;
  return { invitationId: invitation.id, status: response };
}

export async function listServices(ctx: HandlerContext, params: { limit?: number }) {
  requireScope(ctx.principal, "services:read");

  const { data, error } = await scopedQuery(
    ctx.admin,
    ctx.principal,
    "provider_services",
    "id, provider_id, category_id, subcategory_id, hourly_rate, fixed_price, is_quote_based, description",
  ).limit(clampLimit(params.limit));

  if (error) throw error;
  return { services: data ?? [] };
}

export async function updateService(
  ctx: HandlerContext,
  params: { serviceId: string; hourlyRate?: number; fixedPrice?: number; description?: string },
) {
  requirePrincipalType(ctx.principal, "provider");
  requireScope(ctx.principal, "services:write");

  const patch: Record<string, unknown> = {};
  if (Number.isFinite(Number(params.hourlyRate))) patch.hourly_rate = Number(params.hourlyRate);
  if (Number.isFinite(Number(params.fixedPrice))) patch.fixed_price = Number(params.fixedPrice);
  if (typeof params.description === "string") patch.description = params.description.slice(0, 2000);
  if (!Object.keys(patch).length) throw new ApiAuthError(400);

  const { data, error } = await ctx.admin
    .from("provider_services")
    .update(patch)
    .eq("id", params.serviceId)
    .eq("provider_id", ctx.principal.providerId as string)
    .select("id, hourly_rate, fixed_price, description")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new ApiAuthError(404);
  return { service: data };
}
