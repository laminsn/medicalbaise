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

type CheckoutBody = {
  paymentPlanItemId: string;
};

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

const toCents = (amount: number) => Math.round(amount * 100);

const asMetadataString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value);
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
    const body = (await req.json()) as CheckoutBody;

    if (!isUuid(body.paymentPlanItemId)) {
      return new Response(JSON.stringify({ error: "A valid payment plan item is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Payment service not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: item, error: itemError } = await supabaseAdmin
      .from("provider_payment_plan_items")
      .select("*")
      .eq("id", body.paymentPlanItemId)
      .maybeSingle();

    if (itemError || !item) {
      return new Response(JSON.stringify({ error: "Payment schedule item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (["paid", "released", "cancelled"].includes(item.status)) {
      return new Response(JSON.stringify({ error: "This payment item is already closed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: plan }, { data: provider }, { data: invoice }] = await Promise.all([
      supabaseAdmin
        .from("provider_payment_plans")
        .select("*")
        .eq("id", item.payment_plan_id)
        .maybeSingle(),
      supabaseAdmin
        .from("providers")
        .select("id, business_name, user_id")
        .eq("id", item.provider_id)
        .maybeSingle(),
      item.invoice_id
        ? supabaseAdmin
            .from("provider_invoices")
            .select("*")
            .eq("id", item.invoice_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!plan || !provider) throw new Error("Payment plan is incomplete");

    const clientEmail = asMetadataString(plan.metadata?.client_email || invoice?.metadata?.client_email).toLowerCase();
    const isProviderOwner = provider.user_id === user.id;
    const isPlanCustomer = Boolean(plan.customer_id && plan.customer_id === user.id);
    const isInvoiceCustomer = Boolean(invoice?.customer_id && invoice.customer_id === user.id);
    const isEmailClaim = Boolean(clientEmail && clientEmail === user.email.toLowerCase());

    if (!isProviderOwner && !isPlanCustomer && !isInvoiceCustomer && !isEmailClaim) {
      return new Response(JSON.stringify({ error: "You do not have access to this payment request" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (isEmailClaim && !plan.customer_id) {
      await supabaseAdmin
        .from("provider_payment_plans")
        .update({ customer_id: user.id })
        .eq("id", plan.id);
    }

    if (isEmailClaim && invoice && !invoice.customer_id) {
      await supabaseAdmin
        .from("provider_invoices")
        .update({ customer_id: user.id })
        .eq("id", invoice.id);
    }

    const amount = Number(item.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: "Payment amount is invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentMethod = plan.payment_method === "superwall_stripe" ? "superwall_stripe" : "hosted_checkout";
    const processor = plan.payment_method === "superwall_stripe" ? "superwall_stripe" : "stripe";
    const actorRole = isProviderOwner ? "owner" : "client";

    let transactionId = item.payment_transaction_id as string | null;
    if (!transactionId) {
      const { data: transaction, error: transactionError } = await supabaseAdmin
        .from("provider_payment_transactions")
        .insert({
          invoice_id: item.invoice_id,
          provider_id: item.provider_id,
          active_job_id: plan.active_job_id || null,
          subcontractor_id: plan.subcontractor_id || null,
          created_by: user.id,
          amount,
          currency: item.currency || plan.currency || "brl",
          transaction_type: "invoice_payment",
          payment_method: paymentMethod,
          status: "pending",
          release_benchmark: item.release_benchmark || null,
          metadata: {
            type: "provider_payment_plan_item",
            payment_plan_id: plan.id,
            payment_plan_item_id: item.id,
            invoice_number: invoice?.invoice_number || item.metadata?.invoice_number || "",
            client_display_id: invoice?.client_display_id || item.metadata?.client_display_id || "",
            actor_role: actorRole,
            payment_route: processor,
          },
        })
        .select("id")
        .single();

      if (transactionError || !transaction) throw transactionError;
      transactionId = transaction.id;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const origin = getSafeOrigin(req);
    const successPath = isProviderOwner
      ? `/payments?plan_item_success=true&item=${item.id}`
      : `/customer-dashboard?payment_success=true&item=${item.id}`;
    const cancelPath = isProviderOwner
      ? `/payments?plan_item_canceled=true&item=${item.id}`
      : `/customer-dashboard?payment_canceled=true&item=${item.id}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: clientEmail || user.email,
      line_items: [
        {
          price_data: {
            currency: (item.currency || plan.currency || "brl").toLowerCase(),
            product_data: {
              name: `${provider.business_name || "Baise Provider"} - ${item.label}`,
              description: escapeHtml(plan.title || invoice?.service_description || "Baise service payment").slice(0, 240),
            },
            unit_amount: toCents(amount),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata: {
        type: "provider_payment_plan_item",
        provider_id: item.provider_id,
        payment_plan_id: plan.id,
        payment_plan_item_id: item.id,
        transaction_id: transactionId,
        invoice_id: item.invoice_id || "",
        invoice_number: invoice?.invoice_number || item.metadata?.invoice_number || "",
        client_display_id: invoice?.client_display_id || item.metadata?.client_display_id || "",
        release_benchmark: item.release_benchmark || "",
        requested_payment_method: plan.payment_method || "hosted_checkout",
        payment_route: processor,
        actor_role: actorRole,
      },
    });

    const checkoutExpiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null;

    await supabaseAdmin
      .from("provider_payment_plan_items")
      .update({
        payment_transaction_id: transactionId,
        stripe_session_id: session.id,
        checkout_url: session.url,
        checkout_expires_at: checkoutExpiresAt,
        processor,
        status: "pending",
        client_action_required: true,
        attempt_count: Number(item.attempt_count || 0) + 1,
        last_attempt_at: new Date().toISOString(),
        last_payment_error: null,
      })
      .eq("id", item.id);

    await supabaseAdmin
      .from("provider_payment_transactions")
      .update({
        stripe_session_id: session.id,
        status: "pending",
        metadata: {
          type: "provider_payment_plan_item",
          payment_plan_id: plan.id,
          payment_plan_item_id: item.id,
          invoice_number: invoice?.invoice_number || item.metadata?.invoice_number || "",
          client_display_id: invoice?.client_display_id || item.metadata?.client_display_id || "",
          actor_role: actorRole,
          payment_route: processor,
          checkout_url_created: true,
        },
      })
      .eq("id", transactionId);

    await supabaseAdmin.from("provider_recurring_payment_runs").insert({
      provider_id: item.provider_id,
      payment_plan_id: plan.id,
      payment_plan_item_id: item.id,
      transaction_id: transactionId,
      processor,
      scheduled_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      status: "running",
      attempt_number: Number(item.attempt_count || 0) + 1,
      processor_reference: session.id,
      metadata: {
        checkout_url_created: true,
        actor_role: actorRole,
      },
    });

    await supabaseAdmin.rpc("log_provider_audit_event", {
      target_provider_id: item.provider_id,
      actor_id: user.id,
      actor_kind: actorRole,
      event_action: "payment_plan_item.checkout_created",
      event_resource_type: "provider_payment_plan_item",
      event_resource_id: item.id,
      event_severity: "info",
      event_metadata: {
        payment_plan_id: plan.id,
        transaction_id: transactionId,
        stripe_session_id: session.id,
        processor,
      },
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        stripeSessionId: session.id,
        paymentPlanItemId: item.id,
        transactionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "CREATE-PAYMENT-PLAN-ITEM-CHECKOUT");
  }
});
