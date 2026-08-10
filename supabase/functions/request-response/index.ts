// request-response (§3.6) — the provider's Accept / Decline / Refer page.
//
// Byte-identical across Casa, Medical and Legal.
//
// Second half of the request lifecycle. A provider clicks the link in the fanout
// email and lands here with a single-use token; no login is required, which is the
// entire point — a provider deciding on a job in ten seconds from their phone is the
// behaviour this exists to enable.
//
// Modelled directly on appointment-response: `verify_jwt = false`, SHA-256 token
// digest compared against the stored value, its own strict CSP, and a three-button
// POST form. Do not invent a second tokenized-response pattern.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { escapeHtml } from "../_shared/security.ts";
import { getAppBrand, normalizeAppKey } from "../_shared/brands.ts";

const encoder = new TextEncoder();

// This page is served to a browser, not to an API client, and it renders no external
// resources. Everything is denied except the inline styles it ships with.
const PAGE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, "0")).join("");

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

function renderPage(title: string, message: string, bodyHtml = "", status = 200): Response {
  const brand = getAppBrand(normalizeAppKey(Deno.env.get("BAISE_APP_KEY")));
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body{margin:0;background:#f4f5f7;color:#13171e;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6}
  .card{max-width:560px;margin:48px auto;background:#fff;border:1px solid #e1e5ea;border-radius:8px;padding:32px}
  h1{font-size:22px;margin:0 0 8px;letter-spacing:-.02em}
  .brand{color:#59616f;font-size:14px;margin:0 0 24px}
  .detail{border:1px solid #e1e5ea;border-radius:6px;padding:16px;margin:0 0 24px}
  .detail h2{font-size:16px;margin:0 0 8px}
  .detail p{margin:0;white-space:pre-wrap}
  form{display:grid;gap:12px;margin-top:24px}
  .actions{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  button{padding:12px 16px;border-radius:6px;border:1px solid #e1e5ea;font-size:15px;font-weight:600;cursor:pointer}
  .accept{background:${brand.color};border-color:${brand.color};color:#fff}
  .decline{background:#fff;color:#13171e}
  .refer{background:#fff;color:#13171e}
  label{font-size:14px;color:#59616f;display:block;margin-bottom:4px}
  input{width:100%;padding:10px;border:1px solid #e1e5ea;border-radius:6px;font-size:15px;box-sizing:border-box}
  .safety{font-size:13px;color:#59616f;margin-top:24px}
  button:focus-visible,input:focus-visible{outline:2px solid ${brand.color};outline-offset:2px}
  @media(max-width:560px){.actions{grid-template-columns:1fr}.card{margin:16px;padding:24px}}
</style></head><body><main class="card">
<h1>${escapeHtml(title)}</h1><p class="brand">${escapeHtml(brand.name)}</p>
<p>${escapeHtml(message)}</p>${bodyHtml}
<p class="safety">If you did not expect this email, you can ignore it. This link works once and then expires.</p>
</main></body></html>`,
    { status, headers: PAGE_HEADERS },
  );
}

interface InvitationRow {
  id: string;
  request_id: string;
  provider_id: string;
  status: string;
  expires_at: string | null;
}

/**
 * Resolves the token to an invitation.
 *
 * Returns null for unknown, expired and already-answered tokens alike — the page
 * that follows says the same thing for all three. Distinguishing them would let
 * someone with a guessed token learn whether it was real.
 */
async function resolveInvitation(
  admin: SupabaseClient,
  token: string,
): Promise<InvitationRow | null> {
  if (!token || token.length < 16 || token.length > 512) return null;

  const digest = await sha256Hex(token);
  const { data, error } = await admin
    .from("quote_request_invitations")
    .select("id, request_id, provider_id, status, expires_at")
    .eq("token_digest", digest)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as InvitationRow;
  if (!["sent", "viewed"].includes(row.status)) return null;
  if (row.expires_at && Date.parse(row.expires_at) <= Date.now()) return null;

  return row;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const admin = adminClient();

    if (req.method === "GET") {
      const invitation = await resolveInvitation(admin, url.searchParams.get("token") ?? "");
      if (!invitation) {
        return renderPage(
          "This link is no longer active",
          "It may have expired, or you may have already responded to this request.",
          "",
          410,
        );
      }

      const { data: request } = await admin
        .from("quote_requests")
        .select("title, description, urgency, budget_min, budget_max")
        .eq("id", invitation.request_id)
        .maybeSingle();

      // Mark viewed on open. It distinguishes "never saw it" from "saw it and did
      // not answer", which is what a reminder job needs to know.
      if (invitation.status === "sent") {
        await admin
          .from("quote_request_invitations")
          .update({ status: "viewed", viewed_at: new Date().toISOString() })
          .eq("id", invitation.id)
          .eq("status", "sent");
      }

      const token = escapeHtml(url.searchParams.get("token") ?? "");
      const detail = request
        ? `<div class="detail"><h2>${escapeHtml(String(request.title ?? ""))}</h2>
<p>${escapeHtml(String(request.description ?? "").slice(0, 1200))}</p></div>`
        : "";

      return renderPage(
        "A new request for you",
        "Accept it, decline it, or refer it to another provider you trust.",
        `${detail}
<form method="post" action="?token=${token}">
  <div class="actions">
    <button class="accept" name="response" value="accepted" type="submit">Accept</button>
    <button class="decline" name="response" value="declined" type="submit">Decline</button>
    <button class="refer" name="response" value="referred" type="submit">Refer</button>
  </div>
  <div>
    <label for="referral">Referring? Add the provider's name or email (optional)</label>
    <input id="referral" name="referral_note" maxlength="200" autocomplete="off">
  </div>
</form>`,
      );
    }

    if (req.method !== "POST") {
      return renderPage("Not allowed", "This page only accepts a response.", "", 405);
    }

    const invitation = await resolveInvitation(admin, url.searchParams.get("token") ?? "");
    if (!invitation) {
      return renderPage(
        "This link is no longer active",
        "It may have expired, or you may have already responded to this request.",
        "",
        410,
      );
    }

    const form = await req.formData();
    const response = String(form.get("response") ?? "");
    if (!["accepted", "declined", "referred"].includes(response)) {
      return renderPage("Something went wrong", "That response was not recognised.", "", 400);
    }

    const referralNote = String(form.get("referral_note") ?? "").slice(0, 200) || null;

    // Guarded on the current status so a double submit — a refresh, a mail client
    // pre-fetching the link — cannot overwrite the first answer.
    const { data: updated, error } = await admin
      .from("quote_request_invitations")
      .update({
        status: response,
        responded_at: new Date().toISOString(),
        referral_note: response === "referred" ? referralNote : null,
      })
      .eq("id", invitation.id)
      .in("status", ["sent", "viewed"])
      .select("id")
      .maybeSingle();

    if (error) throw error;
    if (!updated) {
      return renderPage(
        "Already answered",
        "This request has already had a response recorded.",
        "",
        409,
      );
    }

    if (response === "accepted") {
      return renderPage(
        "Accepted",
        "Thank you. The customer has been told you are interested, and you will find this request in your dashboard.",
      );
    }
    if (response === "declined") {
      return renderPage(
        "Declined",
        "Thank you for letting us know. You will not be reminded about this request again.",
      );
    }
    return renderPage(
      "Referred",
      "Thank you. We have recorded your referral and will follow up with the provider you named.",
    );
  } catch (error) {
    console.error("[request-response] failed", error instanceof Error ? error.message : "unknown");
    return renderPage("Something went wrong", "Please try the link again in a moment.", "", 500);
  }
});
