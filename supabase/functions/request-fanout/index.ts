// request-fanout (§3.6) — turn a new quote request into provider invitations.
//
// Byte-identical across Casa, Medical and Legal.
//
// This is the first half of the request lifecycle: a client files a request, eligible
// providers are invited, and each invitation carries a single-use token that lets the
// provider Accept / Decline / Refer from the email without logging in
// (see request-response).
//
// Cron-gated like account-purge: it is invoked by a scheduler or by an authenticated
// staff caller, never by an anonymous request.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getCorsHeaders, rejectNonPostMethod, parseRequestBody, escapeHtml } from "../_shared/security.ts";
import { getAppBrand, normalizeAppKey, senderWithDisplayName, type AppKey } from "../_shared/brands.ts";
import {
  getOrCreateUnsubscribeToken,
  isSuppressed,
  unsubscribeFooter,
  unsubscribeHeaders,
} from "../_shared/email-consent.ts";

// A request is not blasted to everyone who happens to match. A bounded fanout keeps
// the invitation meaningful to the provider and keeps the customer from fielding
// fifty replies.
const MAX_INVITES_PER_REQUEST = 8;
const INVITE_TTL_DAYS = 7;

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");

/** The token is emailed; only its digest is stored. Same shape as appointment-response. */
async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(Array.from(bytes).map((byte) => String.fromCharCode(byte)).join(""))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

interface EligibleProvider {
  id: string;
  business_name: string;
  user_id: string;
}

/**
 * Eligibility is category + brand + active status. It is deliberately NOT distance.
 *
 * providers.location_lat / location_lng are read across the app but never written
 * (RESTORE-RUNBOOK §5b). A radius filter would compare against nulls and silently
 * return nobody, which is the worst possible failure for a fanout — it looks like
 * "no providers available" rather than a bug. Distance matching is a TODO gated on
 * §5b being fixed, and it is stated here rather than quietly omitted.
 */
async function findEligibleProviders(
  admin: SupabaseClient,
  categoryId: string | null,
  brand: AppKey,
  excludeProviderIds: string[],
): Promise<EligibleProvider[]> {
  let query = admin
    .from("providers")
    .select("id, business_name, user_id, provider_services!inner(category_id)")
    .eq("platform", `${brand}_baise`)
    .eq("governance_status", "active")
    .order("avg_rating", { ascending: false })
    .limit(MAX_INVITES_PER_REQUEST * 3);

  if (categoryId) query = query.eq("provider_services.category_id", categoryId);

  const { data, error } = await query;
  if (error) throw error;

  const excluded = new Set(excludeProviderIds);
  const seen = new Set<string>();
  const eligible: EligibleProvider[] = [];

  for (const row of data ?? []) {
    const id = String(row.id);
    // The join returns one row per matching service, so a provider offering three
    // services in the category would otherwise be invited three times.
    if (excluded.has(id) || seen.has(id)) continue;
    seen.add(id);
    eligible.push({ id, business_name: String(row.business_name ?? ""), user_id: String(row.user_id) });
    if (eligible.length >= MAX_INVITES_PER_REQUEST) break;
  }

  return eligible;
}

async function providerEmail(admin: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email ?? null;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const methodRejection = rejectNonPostMethod(req, corsHeaders);
  if (methodRejection) return methodRejection;

  try {
    // Same gate as account-purge: a cron secret compared in constant time. Without
    // this, anyone who learns a request id could trigger a mail-out on it.
    const expectedSecret = Deno.env.get("CRON_SECRET");
    if (!expectedSecret || !timingSafeEqual(req.headers.get("x-cron-secret"), expectedSecret)) {
      return new Response(
        JSON.stringify({ error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await parseRequestBody<{ requestId?: string }>(req, 2048).catch(() => ({}));
    const requestId = String(body.requestId ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(requestId)) {
      return new Response(
        JSON.stringify({ error: "invalid_request_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = adminClient();

    const { data: request, error: requestError } = await admin
      .from("quote_requests")
      .select("id, title, description, category_id, urgency, budget_min, budget_max, provider_id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError) throw requestError;
    if (!request) {
      return new Response(
        JSON.stringify({ error: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brand = normalizeAppKey(Deno.env.get("BAISE_APP_KEY"));
    const appBrand = getAppBrand(brand);

    // Providers already invited are excluded so a re-run tops up rather than
    // duplicating. The UNIQUE (request_id, provider_id) constraint is the backstop.
    const { data: existing } = await admin
      .from("quote_request_invitations")
      .select("provider_id")
      .eq("request_id", requestId);
    const alreadyInvited = (existing ?? []).map((row) => String(row.provider_id));

    const providers = await findEligibleProviders(
      admin,
      request.category_id ? String(request.category_id) : null,
      brand,
      alreadyInvited,
    );

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const functionsUrl = Deno.env.get("FUNCTIONS_URL") ?? "";
    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000).toISOString();

    let invited = 0;
    let suppressed = 0;
    let failed = 0;

    for (const provider of providers) {
      const email = await providerEmail(admin, provider.user_id);
      if (!email) { failed += 1; continue; }

      // Consume W1's suppression rather than rebuilding the hole it closed. A
      // provider who opted out of request notifications does not get one, and the
      // check happens BEFORE the invitation row is written so we do not record an
      // invitation nobody was told about.
      if (await isSuppressed(admin, email, brand, "requests")) {
        suppressed += 1;
        continue;
      }

      const token = randomToken();
      const tokenDigest = await sha256Hex(token);

      const { data: invitation, error: inviteError } = await admin
        .from("quote_request_invitations")
        .insert({
          request_id: requestId,
          provider_id: provider.id,
          app_context: brand,
          token_digest: tokenDigest,
          expires_at: expiresAt,
        })
        .select("id")
        .maybeSingle();

      // 23505 means another run already invited this provider — not an error.
      if (inviteError) {
        if (inviteError.code !== "23505") failed += 1;
        continue;
      }
      if (!invitation) { failed += 1; continue; }

      if (!resendKey) { invited += 1; continue; }

      const respondUrl = `${functionsUrl}/request-response?token=${encodeURIComponent(token)}`;
      const unsubscribeToken = await getOrCreateUnsubscribeToken(admin, email, brand);

      const budget = request.budget_min || request.budget_max
        ? `<p style="margin:0 0 12px"><strong>Budget:</strong> ${escapeHtml(String(request.budget_min ?? "—"))} – ${escapeHtml(String(request.budget_max ?? "—"))}</p>`
        : "";

      const html = `
        <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#13171e">
          <h1 style="font-size:20px;margin:0 0 4px">New request for you</h1>
          <p style="margin:0 0 20px;color:#59616f">${escapeHtml(appBrand.name)}</p>
          <div style="border:1px solid #e1e5ea;border-radius:6px;padding:16px;margin-bottom:20px">
            <h2 style="font-size:16px;margin:0 0 8px">${escapeHtml(String(request.title ?? ""))}</h2>
            <p style="margin:0 0 12px;white-space:pre-wrap">${escapeHtml(String(request.description ?? "").slice(0, 600))}</p>
            ${budget}
            <p style="margin:0;color:#59616f;font-size:14px">Urgency: ${escapeHtml(String(request.urgency ?? "normal"))}</p>
          </div>
          <p style="margin:0 0 20px">
            <a href="${respondUrl}" style="display:inline-block;background:${appBrand.color};color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">Review this request</a>
          </p>
          <p style="margin:0 0 20px;color:#59616f;font-size:14px">
            You can accept it, decline it, or refer it to another provider. This link expires in ${INVITE_TTL_DAYS} days.
          </p>
          ${unsubscribeFooter(unsubscribeToken, appBrand, "en")}
        </div>`;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: senderWithDisplayName(appBrand.name, appBrand),
          to: [email],
          subject: `New request: ${String(request.title ?? "").slice(0, 80)}`,
          html,
          headers: unsubscribeHeaders(unsubscribeToken, appBrand),
        }),
      });

      if (!response.ok) {
        // The invitation row stays: the provider can still respond from the portal,
        // and a reminder job can retry the mail. Deleting it would lose the token.
        console.error("[request-fanout] resend failed", response.status);
        failed += 1;
        continue;
      }

      invited += 1;
    }

    return new Response(
      JSON.stringify({ requestId, eligible: providers.length, invited, suppressed, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[request-fanout] failed", error instanceof Error ? error.message : "unknown");
    return new Response(
      JSON.stringify({ error: "internal_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
