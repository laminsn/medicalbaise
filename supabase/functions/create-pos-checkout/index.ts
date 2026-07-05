import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  getSafeOrigin,
  rejectNonPostMethod,
} from "../_shared/security.ts";

type PosCheckoutBody = {
  amount: number;
  currency?: string;
  clientName?: string;
  clientEmail?: string;
  serviceDescription: string;
  paymentMethod?: "hosted_checkout" | "card" | "wallet" | "pix" | "internal_balance";
  activeJobId?: string;
  subcontractorId?: string;
  releaseBenchmark?: string;
  collectedBySubcontractor?: boolean;
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
    const body = (await req.json()) as PosCheckoutBody;

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "A valid positive amount is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.serviceDescription || body.serviceDescription.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Service description is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currency = (body.currency || "brl").toLowerCase();
    const safeServiceDescription = escapeHtml(body.serviceDescription).slice(0, 500);
    const safeClientName = body.clientName ? escapeHtml(body.clientName).slice(0, 120) : null;
    const safeReleaseBenchmark = body.releaseBenchmark
      ? escapeHtml(body.releaseBenchmark).slice(0, 240)
      : null;
    const paymentMethod = body.paymentMethod || "hosted_checkout";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("id, business_name, user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (providerError || !provider) {
      return new Response(JSON.stringify({ error: "Provider account required for POS checkout" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("provider_invoices")
      .insert({
        provider_id: provider.id,
        active_job_id: body.activeJobId || null,
        subcontractor_id: body.subcontractorId || null,
        created_by: user.id,
        currency,
        subtotal: amount,
        total_amount: amount,
        service_description: safeServiceDescription,
        invoice_type: body.subcontractorId ? "subcontractor" : "pos",
        payment_status: paymentMethod === "internal_balance" ? "processing" : "pending",
        metadata: {
          client_name: safeClientName,
          client_email: body.clientEmail || null,
          collected_by_subcontractor: Boolean(body.collectedBySubcontractor),
          release_benchmark: safeReleaseBenchmark,
          baise_branding: "discreet_footer",
        },
      })
      .select("id, invoice_number, client_display_id")
      .single();

    if (invoiceError || !invoice) throw invoiceError;

    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("provider_payment_transactions")
      .insert({
        invoice_id: invoice.id,
        provider_id: provider.id,
        active_job_id: body.activeJobId || null,
        subcontractor_id: body.subcontractorId || null,
        created_by: user.id,
        amount,
        currency,
        transaction_type:
          paymentMethod === "internal_balance" ? "internal_balance_payment" : "pos_payment",
        payment_method: paymentMethod === "internal_balance" ? "internal_balance" : "hosted_checkout",
        status: paymentMethod === "internal_balance" ? "processing" : "pending",
        release_benchmark: safeReleaseBenchmark,
        collected_by_subcontractor: Boolean(body.collectedBySubcontractor),
        metadata: {
          invoice_number: invoice.invoice_number,
          client_display_id: invoice.client_display_id,
          requested_payment_method: paymentMethod,
        },
      })
      .select("id")
      .single();

    if (transactionError || !transaction) throw transactionError;

    await supabaseAdmin.from("provider_ledger_entries").insert({
      provider_id: provider.id,
      related_transaction_id: transaction.id,
      invoice_id: invoice.id,
      subcontractor_id: body.subcontractorId || null,
      entry_type: "payment_pending",
      direction: "credit",
      amount,
      currency,
      memo: `POS invoice ${invoice.invoice_number} created`,
    });

    if (paymentMethod === "internal_balance") {
      return new Response(
        JSON.stringify({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoice_number,
          clientId: invoice.client_display_id,
          transactionId: transaction.id,
          status: "internal_balance_processing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Payment service not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = getSafeOrigin(req);
    const paymentMethodTypes = paymentMethod === "pix" ? ["card", "pix"] : ["card"];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethodTypes,
      customer_email: body.clientEmail || undefined,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `${provider.business_name || "Baise Provider"} - ${invoice.invoice_number}`,
              description: safeServiceDescription.slice(0, 240),
            },
            unit_amount: toCents(amount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payments?pos_success=true&invoice=${invoice.invoice_number}`,
      cancel_url: `${origin}/payments?pos_canceled=true&invoice=${invoice.invoice_number}`,
      metadata: {
        type: "provider_pos",
        provider_id: provider.id,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number || "",
        client_display_id: invoice.client_display_id || "",
        transaction_id: transaction.id,
        active_job_id: body.activeJobId || "",
        subcontractor_id: body.subcontractorId || "",
        collected_by_subcontractor: String(Boolean(body.collectedBySubcontractor)),
        release_benchmark: safeReleaseBenchmark || "",
      },
    });

    await supabaseAdmin
      .from("provider_payment_transactions")
      .update({
        stripe_session_id: session.id,
        metadata: {
          invoice_number: invoice.invoice_number,
          client_display_id: invoice.client_display_id,
          requested_payment_method: paymentMethod,
          checkout_url_created: true,
        },
      })
      .eq("id", transaction.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientId: invoice.client_display_id,
        transactionId: transaction.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "CREATE-POS-CHECKOUT");
  }
});
