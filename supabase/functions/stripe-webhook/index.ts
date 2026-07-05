import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";
import { getCorsHeaders } from "../_shared/security.ts";

const TIER_BY_PRODUCT_ID: Record<string, string> = {
  prod_TwTARyUfpaG4ct: "pro",
  prod_TwTBPPowJkNd38: "elite",
  prod_TwTBPPFYSvdcUa: "enterprise",
};

const asPaymentIntentId = (paymentIntent: string | Stripe.PaymentIntent | null) =>
  typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id || null;

async function markProviderPosPaid(
  supabaseAdmin: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  const metadata = session.metadata || {};
  if (metadata.type !== "provider_pos") return;

  const transactionId = metadata.transaction_id;
  const invoiceId = metadata.invoice_id;
  const providerId = metadata.provider_id;
  if (!transactionId || !invoiceId || !providerId) {
    throw new Error("Provider POS checkout metadata is incomplete");
  }

  const paymentIntentId = asPaymentIntentId(session.payment_intent);
  const amount = Number(session.amount_total || 0) / 100;
  const currency = (session.currency || "brl").toLowerCase();
  const releaseBenchmark = metadata.release_benchmark || "";
  const balanceBucket = releaseBenchmark ? "pending" : "available";

  const { error: transactionError } = await supabaseAdmin
    .from("provider_payment_transactions")
    .update({
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      status: "succeeded",
      processed_at: new Date().toISOString(),
      metadata: {
        ...metadata,
        checkout_completed: true,
        balance_bucket: balanceBucket,
      },
    })
    .eq("id", transactionId);

  if (transactionError) throw transactionError;

  const { error: invoiceError } = await supabaseAdmin
    .from("provider_invoices")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", invoiceId);

  if (invoiceError) throw invoiceError;

  await supabaseAdmin.from("provider_ledger_entries").insert({
    provider_id: providerId,
    related_transaction_id: transactionId,
    invoice_id: invoiceId,
    subcontractor_id: metadata.subcontractor_id || null,
    entry_type: balanceBucket === "pending" ? "payment_pending" : "payment_available",
    direction: "credit",
    amount,
    currency,
    memo: releaseBenchmark
      ? `Payment captured and held until benchmark: ${releaseBenchmark}`
      : `Payment captured and available for invoice ${metadata.invoice_number || invoiceId}`,
    metadata: {
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      collected_by_subcontractor: metadata.collected_by_subcontractor === "true",
    },
  });

  const { error: balanceError } = await supabaseAdmin.rpc("apply_provider_balance_delta", {
    target_provider_id: providerId,
    balance_bucket: balanceBucket,
    delta_amount: amount,
    balance_currency: currency,
  });

  if (balanceError) throw balanceError;
}

async function updateProviderSubscription(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail || !session.subscription) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const productId = subscription.items.data[0]?.price?.product as string;
  const tier = TIER_BY_PRODUCT_ID[productId] || "pro";

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("email", customerEmail)
    .single();

  if (!profile) return;

  await supabaseAdmin
    .from("providers")
    .update({
      subscription_tier: tier,
      stripe_customer_id: session.customer as string,
    })
    .eq("user_id", profile.user_id);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markProviderPosPaid(supabaseAdmin, session);
        await updateProviderSubscription(supabaseAdmin, stripe, session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        if (subscription.status === "active") {
          const productId = subscription.items.data[0]?.price?.product as string;
          const tier = TIER_BY_PRODUCT_ID[productId] || "pro";
          await supabaseAdmin
            .from("providers")
            .update({ subscription_tier: tier })
            .eq("stripe_customer_id", customerId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from("providers")
          .update({ subscription_tier: "free" })
          .eq("stripe_customer_id", subscription.customer as string);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn("Payment failed for customer:", invoice.customer);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
