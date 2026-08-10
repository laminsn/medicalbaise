// Agent API authentication (§3.1) — shared by api-v1 and mcp-server.
//
// Byte-identical across Casa, Medical and Legal. Modelled on _shared/brands.ts and
// _shared/security.ts; do not fork it per app.
//
// ---------------------------------------------------------------------------
// READ THIS BEFORE CHANGING ANYTHING IN THIS FILE
//
// Both functions that use this run with `verify_jwt = false`, because an API key is
// not a Supabase JWT. That makes this file the ONLY gate in front of them. There is
// no second check behind it. Every failure path must throw; an error path that
// returns instead of throwing is a vulnerability, not a style choice.
//
// It also means the callers use the service-role client, which BYPASSES RLS. The
// policies in the database protect the normal logged-in paths and do NOT protect
// this one. scopedQuery() below is the enforcement point for API requests. A handler
// that builds its own query against a table has silently opted out of the only
// control there is.
// ---------------------------------------------------------------------------

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { type AppKey, normalizeAppKey } from "./brands.ts";

export type PrincipalType = "provider" | "client";

export type ApiScope =
  | "providers:read"
  | "services:read"
  | "services:write"
  | "requests:read"
  | "requests:write"
  | "messages:read"
  | "messages:write";

const KNOWN_SCOPES: ReadonlySet<string> = new Set<ApiScope>([
  "providers:read",
  "services:read",
  "services:write",
  "requests:read",
  "requests:write",
  "messages:read",
  "messages:write",
]);

export interface ApiPrincipal {
  type: PrincipalType;
  /** The owning auth user. Always present, for both principal types. */
  userId: string;
  /** Present only when type === "provider". */
  providerId?: string;
  brand: AppKey;
  scopes: ApiScope[];
  keyId: string;
}

/**
 * Every authentication failure raises this, and every one of them renders the same
 * body. Unknown key, expired key, revoked key, malformed header and brand mismatch
 * are deliberately indistinguishable — telling a caller which of those it was tells
 * an attacker which of their guesses was a real key.
 */
export class ApiAuthError extends Error {
  readonly status: number;
  constructor(status = 401) {
    super("Unauthorized");
    this.name = "ApiAuthError";
    this.status = status;
  }
}

export class ApiScopeError extends Error {
  readonly status = 403;
  readonly missingScope: ApiScope;
  constructor(missingScope: ApiScope) {
    super(`Missing required scope: ${missingScope}`);
    this.name = "ApiScopeError";
    this.missingScope = missingScope;
  }
}

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");

/**
 * Hashes the FULL presented key, prefix included.
 *
 * manage-provider-ai-api-key builds `baise_ai_<base64url>` and hashes that whole
 * string (see its hashApiKey). If this ever hashes a substring instead, the two
 * halves stop matching and every key silently 401s with nothing in the logs to
 * explain it.
 */
async function hashApiKey(presented: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(presented)));
}

/**
 * Extracts the bearer token. Accepts only `Authorization: Bearer <key>` — no query
 * parameter fallback, because query strings land in access logs, browser history and
 * referer headers.
 */
function extractBearer(req: Request): string {
  const header = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!header) throw new ApiAuthError();

  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!match) throw new ApiAuthError();

  const token = match[1];
  // Bound the input before it reaches the hash. A megabyte "key" is not a key.
  if (token.length < 16 || token.length > 512) throw new ApiAuthError();
  return token;
}

/**
 * Scopes stored on the row that are not in the current vocabulary grant nothing.
 *
 * Rows minted before 2026-08-10 carry `ai.records.read` / `ai.records.write`, which
 * this deliberately does not map. Those keys have never opened anything — nothing in
 * the codebase read them — so failing them closed changes no working behaviour, and
 * inventing a mapping would silently grant write to keys issued under the old
 * write-by-default.
 */
function parseScopes(raw: unknown): ApiScope[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((value) => String(value))
    .filter((value): value is ApiScope => KNOWN_SCOPES.has(value));
}

interface KeyRow {
  id: string;
  provider_id: string | null;
  customer_id: string | null;
  created_by: string;
  scopes: unknown;
  status: string;
  expires_at: string | null;
  app_context: string | null;
}

/**
 * Verifies an API key and resolves the principal it acts as.
 *
 * Throws ApiAuthError on absent, malformed, unknown, expired, revoked, ownerless or
 * brand-mismatched keys. Never returns null, and never returns a partially-resolved
 * principal.
 */
export async function authenticateApiKey(
  req: Request,
  admin: SupabaseClient,
): Promise<ApiPrincipal> {
  const presented = extractBearer(req);

  // Hash first, then look up by hash. Never look up by key_prefix and compare the
  // remainder: that is a timing oracle, and key_prefix is identical across every key
  // ever minted ("baise_ai"), so it identifies nothing. key_prefix and key_last_four
  // exist to render a key in a list and must never participate in authentication.
  const keyHash = await hashApiKey(presented);

  const { data, error } = await admin
    .from("provider_ai_api_keys")
    .select("id, provider_id, customer_id, created_by, scopes, status, expires_at, app_context")
    .eq("key_hash", keyHash)
    .maybeSingle();

  // A database failure is not an authentication success. Fail closed.
  if (error) throw new ApiAuthError();
  if (!data) throw new ApiAuthError();

  const row = data as KeyRow;

  if (row.status !== "active") throw new ApiAuthError();

  // expires_at has existed and been populated since the table was created, and until
  // now nothing enforced it. This is that enforcement.
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) throw new ApiAuthError();

  const scopes = parseScopes(row.scopes);

  // Exactly one owner column is set (enforced by a CHECK constraint, re-checked here
  // because a constraint added later cannot fix rows written earlier).
  const hasProvider = Boolean(row.provider_id);
  const hasCustomer = Boolean(row.customer_id);
  if (hasProvider === hasCustomer) throw new ApiAuthError();

  if (hasProvider) {
    // The brand comes from the database, never from a request header. A header would
    // let any key act on any product; there must not be one anywhere in this codebase.
    const { data: providerRow, error: providerError } = await admin
      .from("providers")
      .select("id, user_id, platform")
      .eq("id", row.provider_id as string)
      .maybeSingle();

    if (providerError || !providerRow) throw new ApiAuthError();

    const providerBrand = normalizeAppKey(String(providerRow.platform ?? ""));

    // The key records the brand it was minted under; the provider row records the
    // brand it belongs to. If those disagree the key is not trustworthy for either.
    if (row.app_context) {
      const keyBrand = normalizeAppKey(row.app_context);
      if (keyBrand !== providerBrand) throw new ApiAuthError();
    }

    return {
      type: "provider",
      userId: String(providerRow.user_id),
      providerId: String(providerRow.id),
      brand: providerBrand,
      scopes,
      keyId: row.id,
    };
  }

  // Client keys have no providers row to appeal to, so app_context IS the authority
  // and its absence is a defect rather than a default worth guessing at.
  if (!row.app_context) throw new ApiAuthError();

  return {
    type: "client",
    userId: String(row.customer_id),
    brand: normalizeAppKey(row.app_context),
    scopes,
    keyId: row.id,
  };
}

/** Throws ApiScopeError unless the principal holds the scope. */
export function requireScope(principal: ApiPrincipal, scope: ApiScope): void {
  if (!principal.scopes.includes(scope)) throw new ApiScopeError(scope);
}

export function hasScope(principal: ApiPrincipal, scope: ApiScope): boolean {
  return principal.scopes.includes(scope);
}

/** Throws unless the principal is of the given type. */
export function requirePrincipalType(principal: ApiPrincipal, type: PrincipalType): void {
  if (principal.type !== type) throw new ApiAuthError(403);
}

// ---------------------------------------------------------------------------
// scopedQuery — the enforcement point
// ---------------------------------------------------------------------------

export type ScopedTable =
  | "providers"
  | "provider_services"
  | "quote_requests"
  | "quote_request_invitations";

/**
 * Returns a query builder already constrained to what this principal may see.
 *
 * Because the callers hold the service role, RLS is not applied to anything they do.
 * This function is the substitute, and it is only a control if it is the ONLY way
 * handlers reach the database. A table absent from the switch below throws rather
 * than falling through to an unfiltered query — adding a table to the API is a
 * deliberate act, never a default.
 *
 * Every branch is written so the constraint cannot be forgotten: the filter is
 * applied here, not by the caller.
 */
export function scopedQuery(
  admin: SupabaseClient,
  principal: ApiPrincipal,
  table: ScopedTable,
  columns: string,
) {
  switch (table) {
    // Provider discovery is intentionally cross-principal: both a client searching
    // for help and a provider looking for a referral target need to see providers.
    // It is still bounded by brand, so a Casa key never sees Legal providers.
    case "providers":
      return admin.from(table).select(columns).eq("platform", `${principal.brand}_baise`);

    case "provider_services":
      return principal.type === "provider"
        ? admin.from(table).select(columns).eq("provider_id", principal.providerId as string)
        : admin.from(table).select(columns);

    // A client sees the requests they filed. A provider sees only requests they were
    // actually invited to — never the open market, which would leak every customer's
    // job description to anyone holding any provider key.
    //
    // The provider branch uses an INNER JOIN rather than a subquery: supabase-js
    // cannot take a query builder as an argument to .in(), so a subquery here would
    // compile and then fail at runtime.
    case "quote_requests":
      return principal.type === "client"
        ? admin.from(table).select(columns).eq("customer_id", principal.userId)
        : admin
          .from(table)
          .select(`${columns}, quote_request_invitations!inner(provider_id)`)
          .eq("quote_request_invitations.provider_id", principal.providerId as string);

    case "quote_request_invitations":
      return principal.type === "provider"
        ? admin.from(table).select(columns).eq("provider_id", principal.providerId as string)
        : admin
          .from(table)
          .select(`${columns}, quote_requests!inner(customer_id)`)
          .eq("quote_requests.customer_id", principal.userId);

    default: {
      // Exhaustiveness guard. If a ScopedTable is added without a case here, this
      // throws instead of returning an unfiltered query.
      const _exhaustive: never = table;
      void _exhaustive;
      throw new ApiAuthError(403);
    }
  }
}

/** Uniform error response for both api-v1 and mcp-server. */
export function apiErrorResponse(
  error: unknown,
  corsHeaders: Record<string, string>,
): Response {
  if (error instanceof ApiScopeError) {
    return new Response(
      JSON.stringify({ error: "forbidden", detail: error.message }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (error instanceof ApiAuthError) {
    return new Response(
      JSON.stringify({ error: "unauthorized" }),
      {
        status: error.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "WWW-Authenticate": "Bearer",
        },
      },
    );
  }

  // Never echo an internal error to the caller: messages leak table names, column
  // names and occasionally values. Log it, return nothing.
  console.error("[api] unhandled error", error instanceof Error ? error.message : "unknown");
  return new Response(
    JSON.stringify({ error: "internal_error" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
