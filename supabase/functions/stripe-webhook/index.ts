import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";
import { getCorsHeaders } from "../_shared/security.ts";
import {
  MEDICAL_APP_KEY,
  SEEKER_ROLE,
  clientEmailFromMetadata,
  consumeSeekerPaidTransaction,
  isSeekerStripePlan,
  resolveSeekerUserId,
} from "../_shared/seekerSubscriptions.ts";

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

  const { data: existingInvoice } = await supabaseAdmin
    .from("provider_invoices")
    .select("customer_id, metadata")
    .eq("id", invoiceId)
    .maybeSingle();

  const seekerUserId = await resolveSeekerUserId(supabaseAdmin, {
    customerId: existingInvoice?.customer_id,
    email:
      clientEmailFromMetadata(existingInvoice?.metadata)
      || session.customer_email
      || session.customer_details?.email
      || metadata.client_email
      || null,
  });

  const { error: invoiceError } = await supabaseAdmin
    .from("provider_invoices")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
      ...(seekerUserId && !existingInvoice?.customer_id ? { customer_id: seekerUserId } : {}),
    })
    .eq("id", invoiceId);

  if (invoiceError) throw invoiceError;

  await consumeSeekerPaidTransaction(supabaseAdmin, seekerUserId);

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

  await supabaseAdmin.rpc("log_provider_audit_event", {
    target_provider_id: providerId,
    actor_id: null,
    actor_kind: "integration",
    event_action: "pos_payment.succeeded",
    event_resource_type: "provider_payment_transaction",
    event_resource_id: transactionId,
    event_severity: "info",
    event_metadata: {
      invoice_id: invoiceId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      balance_bucket: balanceBucket,
    },
  });
}

async function markProviderPaymentPlanItemPaid(
  supabaseAdmin: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  const metadata = session.metadata || {};
  if (metadata.type !== "provider_payment_plan_item") return;

  const providerId = metadata.provider_id;
  const planId = metadata.payment_plan_id;
  const itemId = metadata.payment_plan_item_id;
  const transactionId = metadata.transaction_id;
  const invoiceId = metadata.invoice_id || null;

  if (!providerId || !planId || !itemId || !transactionId) {
    throw new Error("Payment plan checkout metadata is incomplete");
  }

  const paymentIntentId = asPaymentIntentId(session.payment_intent);
  const amount = Number(session.amount_total || 0) / 100;
  const currency = (session.currency || "brl").toLowerCase();
  const releaseBenchmark = metadata.release_benchmark || "";
  const balanceBucket = releaseBenchmark ? "pending" : "available";
  const now = new Date().toISOString();

  const { error: transactionError } = await supabaseAdmin
    .from("provider_payment_transactions")
    .update({
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      status: "succeeded",
      processed_at: now,
      metadata: {
        ...metadata,
        checkout_completed: true,
        balance_bucket: balanceBucket,
      },
    })
    .eq("id", transactionId);

  if (transactionError) throw transactionError;

  const { error: itemError } = await supabaseAdmin
    .from("provider_payment_plan_items")
    .update({
      payment_transaction_id: transactionId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      status: "paid",
      paid_at: now,
      client_action_required: false,
      last_payment_error: null,
    })
    .eq("id", itemId);

  if (itemError) throw itemError;

  await supabaseAdmin
    .from("provider_recurring_payment_runs")
    .update({
      transaction_id: transactionId,
      status: "succeeded",
      completed_at: now,
      processor_reference: session.id,
      metadata: {
        stripe_payment_intent_id: paymentIntentId,
        checkout_completed: true,
      },
    })
    .eq("processor_reference", session.id);

  await supabaseAdmin.from("provider_ledger_entries").insert({
    provider_id: providerId,
    related_transaction_id: transactionId,
    invoice_id: invoiceId || null,
    subcontractor_id: metadata.subcontractor_id || null,
    entry_type: balanceBucket === "pending" ? "payment_pending" : "payment_available",
    direction: "credit",
    amount,
    currency,
    memo: releaseBenchmark
      ? `Payment plan item paid and held until benchmark: ${releaseBenchmark}`
      : `Payment plan item paid for invoice ${metadata.invoice_number || invoiceId || planId}`,
    metadata: {
      payment_plan_id: planId,
      payment_plan_item_id: itemId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    },
  });

  const { error: balanceError } = await supabaseAdmin.rpc("apply_provider_balance_delta", {
    target_provider_id: providerId,
    balance_bucket: balanceBucket,
    delta_amount: amount,
    balance_currency: currency,
  });

  if (balanceError) throw balanceError;

  const { data: remainingItems, error: remainingError } = await supabaseAdmin
    .from("provider_payment_plan_items")
    .select("id")
    .eq("payment_plan_id", planId)
    .not("status", "in", "(paid,released,cancelled)");

  if (remainingError) throw remainingError;

  const isPlanComplete = (remainingItems || []).length === 0;

  await supabaseAdmin
    .from("provider_payment_plans")
    .update({
      status: isPlanComplete ? "completed" : "active",
      last_billed_at: now,
      failure_count: 0,
      last_payment_error: null,
    })
    .eq("id", planId);

  const { data: plan } = await supabaseAdmin
    .from("provider_payment_plans")
    .select("customer_id, created_by, title, metadata")
    .eq("id", planId)
    .maybeSingle();

  if (invoiceId) {
    const { data: existingInvoice } = await supabaseAdmin
      .from("provider_invoices")
      .select("customer_id, metadata")
      .eq("id", invoiceId)
      .maybeSingle();
    const seekerUserId = await resolveSeekerUserId(supabaseAdmin, {
      customerId: existingInvoice?.customer_id || plan?.customer_id,
      email:
        clientEmailFromMetadata(existingInvoice?.metadata)
        || clientEmailFromMetadata(plan?.metadata)
        || session.customer_email
        || session.customer_details?.email
        || metadata.client_email
        || null,
    });
    await supabaseAdmin
      .from("provider_invoices")
      .update({
        payment_status: isPlanComplete ? "paid" : "processing",
        paid_at: isPlanComplete ? now : null,
        client_action_status: isPlanComplete ? "paid" : "accepted",
        ...(seekerUserId && !existingInvoice?.customer_id ? { customer_id: seekerUserId } : {}),
      })
      .eq("id", invoiceId);
    if (isPlanComplete) {
      await consumeSeekerPaidTransaction(supabaseAdmin, seekerUserId);
    }
  } else if (isPlanComplete) {
    const seekerUserId = await resolveSeekerUserId(supabaseAdmin, {
      customerId: plan?.customer_id,
      email:
        clientEmailFromMetadata(plan?.metadata)
        || session.customer_email
        || session.customer_details?.email
        || metadata.client_email
        || null,
    });
    await consumeSeekerPaidTransaction(supabaseAdmin, seekerUserId);
  }

  if (plan?.customer_id) {
    await supabaseAdmin.from("provider_communication_events").insert({
      provider_id: providerId,
      customer_id: plan.customer_id,
      created_by: plan.created_by,
      purpose: "receipt",
      channel: "portal",
      subject: "Payment received",
      message_body: `Payment received for ${plan.title || metadata.invoice_number || "your Baise service"}. Your receipt and invoice history are available in the portal.`,
      scheduled_at: now,
      sent_at: now,
      status: "sent",
      delivered_via: "portal",
      metadata: {
        invoice_id: invoiceId,
        payment_plan_id: planId,
        payment_plan_item_id: itemId,
        transaction_id: transactionId,
        stripe_session_id: session.id,
      },
    });

    await supabaseAdmin.from("notifications").insert({
      user_id: plan.customer_id,
      title: "Payment received",
      message: `Your payment for ${plan.title || "Baise service"} was recorded.`,
      type: "payment",
      priority: "normal",
      action_url: "/customer-dashboard",
      metadata: {
        invoice_id: invoiceId,
        payment_plan_id: planId,
        payment_plan_item_id: itemId,
        transaction_id: transactionId,
      },
    });

    await supabaseAdmin.rpc("queue_provider_update_notifications", {
      target_provider_id: providerId,
      target_user_id: plan.customer_id,
      actor_id: plan.created_by,
      event_key: "payment_received",
      event_subject: "Payment received",
      event_message: `Your payment for ${plan.title || metadata.invoice_number || "your Baise service"} was recorded. Your receipt, invoice, and transaction history are available in the portal.`,
      action_path: "/customer-dashboard",
      resource_kind: "provider_payment_transaction",
      resource_uuid: transactionId,
      event_metadata: {
        actor_role: "integration",
        invoice_id: invoiceId,
        payment_plan_id: planId,
        payment_plan_item_id: itemId,
        transaction_id: transactionId,
        stripe_session_id: session.id,
      },
      target_email: null,
      target_phone: null,
      target_app_key: Deno.env.get("BAISE_APP_KEY") || "casa",
      target_locale: "en",
      target_audience: "client",
    });
  }

  await supabaseAdmin.rpc("log_provider_audit_event", {
    target_provider_id: providerId,
    actor_id: null,
    actor_kind: "integration",
    event_action: "payment_plan_item.succeeded",
    event_resource_type: "provider_payment_plan_item",
    event_resource_id: itemId,
    event_severity: "info",
    event_metadata: {
      payment_plan_id: planId,
      invoice_id: invoiceId,
      transaction_id: transactionId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      balance_bucket: balanceBucket,
      plan_completed: isPlanComplete,
    },
  });
}

async function markProviderPaymentPlanItemFailed(
  supabaseAdmin: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
  reason: string,
) {
  const metadata = session.metadata || {};
  if (metadata.type !== "provider_payment_plan_item") return;

  const providerId = metadata.provider_id;
  const planId = metadata.payment_plan_id;
  const itemId = metadata.payment_plan_item_id;
  const transactionId = metadata.transaction_id;
  if (!providerId || !planId || !itemId) return;

  const now = new Date().toISOString();
  const retryAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("provider_payment_plan_items")
    .update({
      status: "retry_due",
      client_action_required: true,
      next_attempt_at: retryAt,
      last_payment_error: reason,
    })
    .eq("id", itemId);

  await supabaseAdmin
    .from("provider_payment_plans")
    .update({
      status: "past_due",
      last_payment_error: reason,
    })
    .eq("id", planId);

  if (transactionId) {
    await supabaseAdmin
      .from("provider_payment_transactions")
      .update({
        status: "failed",
        processed_at: now,
        metadata: {
          ...metadata,
          failure_reason: reason,
        },
      })
      .eq("id", transactionId);
  }

  await supabaseAdmin
    .from("provider_recurring_payment_runs")
    .update({
      status: "failed",
      completed_at: now,
      error_message: reason,
      next_attempt_at: retryAt,
    })
    .eq("processor_reference", session.id);

  await supabaseAdmin.rpc("log_provider_audit_event", {
    target_provider_id: providerId,
    actor_id: null,
    actor_kind: "integration",
    event_action: "payment_plan_item.failed",
    event_resource_type: "provider_payment_plan_item",
    event_resource_id: itemId,
    event_severity: "warning",
    event_metadata: {
      payment_plan_id: planId,
      transaction_id: transactionId || null,
      stripe_session_id: session.id,
      reason,
    },
  });
}

function unixToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function subscriptionPeriod(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const start = unixToIso(
    (subscription as Stripe.Subscription & { current_period_start?: number }).current_period_start
      ?? item?.current_period_start,
  );
  const end = unixToIso(
    (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
      ?? item?.current_period_end,
  );
  return { start, end };
}

function seekerMetadata(source: { metadata?: Stripe.Metadata | null } | null | undefined) {
  return source?.metadata || {};
}

async function writeSeekerSubscription(
  supabaseAdmin: ReturnType<typeof createClient>,
  input: {
    userId: string;
    plan: "lifestyle" | "project";
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    stripePriceId: string | null;
    periodStart: string | null;
    periodEnd: string | null;
    cancelAtPeriodEnd?: boolean;
    resetCount?: boolean;
  },
) {
  const { data: existing } = await supabaseAdmin
    .from("seeker_subscriptions")
    .select("id, transaction_count, current_period_start")
    .eq("user_id", input.userId)
    .eq("app_key", MEDICAL_APP_KEY)
    .maybeSingle();

  const periodChanged = Boolean(
    existing?.current_period_start
    && input.periodStart
    && existing.current_period_start !== input.periodStart,
  );
  const transactionCount = input.resetCount || periodChanged ? 0 : existing?.transaction_count ?? 0;

  const row = {
    user_id: input.userId,
    app_key: MEDICAL_APP_KEY,
    plan: input.plan,
    status: input.status,
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    stripe_price_id: input.stripePriceId,
    current_period_start: input.periodStart,
    current_period_end: input.periodEnd,
    cancel_at_period_end: Boolean(input.cancelAtPeriodEnd),
    transaction_count: transactionCount,
  };

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from("seeker_subscriptions")
      .update(row)
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabaseAdmin.from("seeker_subscriptions").insert(row);
  if (error) throw error;
}

async function applySeekerCheckoutSession(
  supabaseAdmin: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<boolean> {
  const metadata = seekerMetadata(session);
  if (metadata.role !== SEEKER_ROLE) return false;
  if (metadata.app_key !== MEDICAL_APP_KEY) {
    console.error("seeker checkout fail-closed: app_key");
    return true;
  }
  if (!isSeekerStripePlan(metadata.plan) || !metadata.user_id || !session.subscription) {
    console.error("seeker checkout fail-closed: plan or user");
    return true;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  const period = subscriptionPeriod(subscription);
  await writeSeekerSubscription(supabaseAdmin, {
    userId: metadata.user_id,
    plan: metadata.plan,
    status: subscription.status === "active" ? "active" : subscription.status,
    stripeCustomerId: (session.customer as string) || null,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price?.id || null,
    periodStart: period.start,
    periodEnd: period.end,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    resetCount: true,
  });
  return true;
}

async function applySeekerSubscriptionLifecycle(
  supabaseAdmin: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
  deleted: boolean,
): Promise<boolean> {
  const metadata = seekerMetadata(subscription);
  const { data: existing } = await supabaseAdmin
    .from("seeker_subscriptions")
    .select("id, user_id, plan")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (metadata.role !== SEEKER_ROLE && !existing) return false;

  const appKey = metadata.app_key || (existing ? MEDICAL_APP_KEY : "");
  if (appKey !== MEDICAL_APP_KEY) {
    console.error("seeker subscription fail-closed: app_key");
    return true;
  }

  const userId = metadata.user_id || existing?.user_id;
  if (!userId) {
    console.error("seeker subscription fail-closed: user");
    return true;
  }

  if (deleted) {
    const { error } = await supabaseAdmin
      .from("seeker_subscriptions")
      .update({
        plan: "flex",
        status: "canceled",
        stripe_subscription_id: null,
        stripe_price_id: null,
        cancel_at_period_end: false,
      })
      .eq("user_id", userId)
      .eq("app_key", MEDICAL_APP_KEY);
    if (error) throw error;
    return true;
  }

  const plan = isSeekerStripePlan(metadata.plan) ? metadata.plan : existing?.plan;
  if (!isSeekerStripePlan(plan)) {
    console.error("seeker subscription fail-closed: plan");
    return true;
  }

  const period = subscriptionPeriod(subscription);
  await writeSeekerSubscription(supabaseAdmin, {
    userId,
    plan,
    status: subscription.status === "active" ? "active" : subscription.status,
    stripeCustomerId: (subscription.customer as string) || null,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price?.id || null,
    periodStart: period.start,
    periodEnd: period.end,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  });
  return true;
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
        await markProviderPaymentPlanItemPaid(supabaseAdmin, session);
        const seekerHandled = await applySeekerCheckoutSession(supabaseAdmin, stripe, session);
        if (!seekerHandled) {
          await updateProviderSubscription(supabaseAdmin, stripe, session);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await markProviderPaymentPlanItemFailed(supabaseAdmin, session, "Checkout session expired");
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const seekerHandled = await applySeekerSubscriptionLifecycle(
          supabaseAdmin,
          subscription,
          false,
        );
        if (seekerHandled) break;
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
        const seekerHandled = await applySeekerSubscriptionLifecycle(
          supabaseAdmin,
          subscription,
          true,
        );
        if (seekerHandled) break;
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
