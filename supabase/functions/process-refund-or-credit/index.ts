import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";

type RefundBody = {
  transactionId: string;
  amount?: number;
  destination: "original_payment_method" | "service_credit" | "internal_balance";
  reason?: string;
};

const toCents = (amount: number) => Math.round(amount * 100);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as RefundBody;

    if (!body.transactionId || typeof body.transactionId !== "string") {
      return new Response(JSON.stringify({ error: "transactionId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: originalTransaction, error: transactionError } = await supabaseAdmin
      .from("provider_payment_transactions")
      .select("*, invoice:provider_invoices(*)")
      .eq("id", body.transactionId)
      .single();

    if (transactionError || !originalTransaction) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: provider } = await supabaseAdmin
      .from("providers")
      .select("id, user_id")
      .eq("id", originalTransaction.provider_id)
      .single();

    if (!provider || provider.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const originalAmount = Number(originalTransaction.amount || 0);
    const amount = body.amount ? Number(body.amount) : originalAmount;
    if (!Number.isFinite(amount) || amount <= 0 || amount > originalAmount) {
      return new Response(JSON.stringify({ error: "Refund amount is invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reason = body.reason ? escapeHtml(body.reason).slice(0, 500) : null;
    let stripeRefundId: string | null = null;
    let stripeRefundStatus: string | null = null;
    let paymentIntentId = originalTransaction.stripe_payment_intent_id as string | null;

    if (body.destination === "original_payment_method") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("Payment service not configured");

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      if (!paymentIntentId && originalTransaction.stripe_session_id) {
        const session = await stripe.checkout.sessions.retrieve(originalTransaction.stripe_session_id);
        paymentIntentId =
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
      }

      if (!paymentIntentId) {
        return new Response(
          JSON.stringify({ error: "Original payment intent is not available for card/wallet refund" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: toCents(amount),
        reason: "requested_by_customer",
        metadata: {
          provider_id: originalTransaction.provider_id,
          original_transaction_id: originalTransaction.id,
          invoice_id: originalTransaction.invoice_id || "",
          destination: body.destination,
          reason: reason || "",
        },
      });

      stripeRefundId = refund.id;
      stripeRefundStatus = refund.status || "processing";
    }

    const transactionType =
      body.destination === "service_credit" ? "service_credit" : "refund";
    const status =
      body.destination === "original_payment_method"
        ? stripeRefundStatus === "succeeded"
          ? "succeeded"
          : "processing"
        : "credited";

    const { data: adjustment, error: adjustmentError } = await supabaseAdmin
      .from("provider_payment_transactions")
      .insert({
        invoice_id: originalTransaction.invoice_id,
        provider_id: originalTransaction.provider_id,
        active_job_id: originalTransaction.active_job_id,
        subcontractor_id: originalTransaction.subcontractor_id,
        created_by: user.id,
        stripe_payment_intent_id: paymentIntentId,
        amount,
        currency: originalTransaction.currency,
        transaction_type: transactionType,
        payment_method:
          body.destination === "service_credit" ? "service_credit" : "manual",
        status,
        refund_destination: body.destination,
        service_credit_amount: body.destination === "service_credit" ? amount : 0,
        metadata: {
          original_transaction_id: originalTransaction.id,
          stripe_refund_id: stripeRefundId,
          reason,
        },
      })
      .select("id")
      .single();

    if (adjustmentError || !adjustment) throw adjustmentError;

    await supabaseAdmin.from("provider_ledger_entries").insert({
      provider_id: originalTransaction.provider_id,
      related_transaction_id: adjustment.id,
      invoice_id: originalTransaction.invoice_id,
      subcontractor_id: originalTransaction.subcontractor_id,
      entry_type: body.destination === "service_credit" ? "service_credit" : "refund",
      direction: "debit",
      amount,
      currency: originalTransaction.currency,
      memo: reason || `Payment adjustment for ${originalTransaction.id}`,
    });

    const invoice = originalTransaction.invoice as Record<string, unknown> | null;
    const customerId = invoice?.customer_id as string | null | undefined;
    if ((body.destination === "service_credit" || body.destination === "internal_balance") && customerId) {
      const { error: creditError } = await supabaseAdmin.rpc("increment_user_credits_balance", {
        target_user_id: customerId,
        credit_amount: amount,
      });

      if (creditError) throw creditError;
    }

    if (originalTransaction.invoice_id) {
      await supabaseAdmin
        .from("provider_invoices")
        .update({
          payment_status:
            amount >= originalAmount
              ? body.destination === "service_credit"
                ? "credited"
                : "refunded"
              : "partially_refunded",
        })
        .eq("id", originalTransaction.invoice_id);
    }

    return new Response(
      JSON.stringify({
        adjustmentId: adjustment.id,
        status,
        stripeRefundId,
        destination: body.destination,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "PROCESS-REFUND-OR-CREDIT");
  }
});
