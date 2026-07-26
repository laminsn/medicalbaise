import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  AuthError,
  authenticateRequest,
  getCorsHeaders,
  rejectNonPostMethod,
  serverRateLimit,
} from "../_shared/security.ts";

const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const hashToken = async (token: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const { user } = await authenticateRequest(req);
    if (!serverRateLimit(`invoice-claim:${user.id}`, 10, 60_000)) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as { token?: string };
    const token = String(body.token || "").trim();
    if (!TOKEN_PATTERN.test(token)) {
      return new Response(JSON.stringify({ error: "Invoice invitation unavailable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );
    const tokenHash = await hashToken(token);
    const { data: invite, error: inviteLookupError } = await admin
      .from("provider_client_portal_invites")
      .select("id, customer_id, claimed_by, invite_type, resource_type, resource_id, email, status, expires_at, metadata")
      .eq("token_hash", tokenHash)
      .eq("invite_type", "payment_request")
      .maybeSingle();
    if (inviteLookupError) throw inviteLookupError;

    const emailMatches = Boolean(user.email)
      && invite?.email?.trim().toLowerCase() === user.email?.trim().toLowerCase();
    const usable = invite
      && ["pending", "claimed"].includes(invite.status)
      && new Date(invite.expires_at).getTime() > Date.now()
      && emailMatches
      && (!invite.claimed_by || invite.claimed_by === user.id)
      && (!invite.customer_id || invite.customer_id === user.id);

    if (!usable) {
      return new Response(JSON.stringify({ error: "Invoice invitation unavailable" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invoiceId = typeof invite.metadata?.invoice_id === "string"
      ? invite.metadata.invoice_id
      : null;
    if (!invoiceId) throw new Error("Invoice invitation is incomplete");

    const { data: invoice, error: invoiceLookupError } = await admin
      .from("provider_invoices")
      .select("id, customer_id")
      .eq("id", invoiceId)
      .maybeSingle();
    if (invoiceLookupError) throw invoiceLookupError;
    if (!invoice || (invoice.customer_id && invoice.customer_id !== user.id)) {
      return new Response(JSON.stringify({ error: "Invoice invitation unavailable" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!invoice.customer_id) {
      const { data: claimedInvoice, error: invoiceClaimError } = await admin
        .from("provider_invoices")
        .update({ customer_id: user.id })
        .eq("id", invoice.id)
        .is("customer_id", null)
        .select("id")
        .maybeSingle();
      if (invoiceClaimError || !claimedInvoice) {
        throw invoiceClaimError || new Error("Invoice invitation was already claimed");
      }
    }

    if (invite.resource_type === "payment_plan" && invite.resource_id) {
      const { data: claimedPlan, error: planClaimError } = await admin
        .from("provider_payment_plans")
        .update({ customer_id: user.id })
        .eq("id", invite.resource_id)
        .or(`customer_id.is.null,customer_id.eq.${user.id}`)
        .select("id")
        .maybeSingle();
      if (planClaimError || !claimedPlan) {
        throw planClaimError || new Error("Payment plan invitation was already claimed");
      }
    }

    const { data: claimedInvite, error: inviteClaimError } = await admin
      .from("provider_client_portal_invites")
      .update({
        customer_id: user.id,
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        status: "claimed",
      })
      .eq("id", invite.id)
      .or(`claimed_by.is.null,claimed_by.eq.${user.id}`)
      .select("id")
      .maybeSingle();
    if (inviteClaimError || !claimedInvite) {
      throw inviteClaimError || new Error("Invoice invitation was already claimed");
    }

    return new Response(JSON.stringify({
      redirectTo: `/customer-dashboard?invoice=${encodeURIComponent(invoice.id)}`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    return new Response(JSON.stringify({ error: status === 401 ? "Sign in required" : "Unable to open invoice" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
});
