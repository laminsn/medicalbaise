import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";

type PaymentPlanType = "one_time" | "recurring" | "subscription" | "milestone" | "split";
type PaymentCadence =
  | "one_time"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "custom";

type MilestoneInput = {
  label?: string;
  amount: number;
  dueAt?: string;
  releaseBenchmark?: string;
};

type PaymentPlanBody = {
  title: string;
  serviceDescription?: string;
  totalAmount: number;
  depositAmount?: number;
  currency?: string;
  planType: PaymentPlanType;
  cadence?: PaymentCadence;
  installmentCount?: number;
  startDate?: string;
  endDate?: string;
  clientName?: string;
  clientEmail?: string;
  activeJobId?: string;
  subcontractorId?: string;
  paymentMethod?: "hosted_checkout" | "card" | "wallet" | "pix" | "internal_balance" | "service_credit" | "manual" | "superwall_stripe";
  autopayEnabled?: boolean;
  milestones?: MilestoneInput[];
};

const hashInviteToken = async (token: string) => {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const addCadence = (date: Date, cadence: PaymentCadence, index: number) => {
  const next = new Date(date);
  if (cadence === "daily") next.setDate(next.getDate() + index);
  else if (cadence === "weekly") next.setDate(next.getDate() + index * 7);
  else if (cadence === "biweekly") next.setDate(next.getDate() + index * 14);
  else if (cadence === "monthly") next.setMonth(next.getMonth() + index);
  else if (cadence === "quarterly") next.setMonth(next.getMonth() + index * 3);
  else if (cadence === "annual") next.setFullYear(next.getFullYear() + index);
  else next.setDate(next.getDate() + index * 30);
  return next;
};

const roundMoney = (amount: number) => Math.round(amount * 100) / 100;

const parseStartDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();
  date.setHours(12, 0, 0, 0);
  return date;
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
    const body = (await req.json()) as PaymentPlanBody;

    const title = escapeHtml(body.title || "").slice(0, 160);
    const serviceDescription = escapeHtml(body.serviceDescription || body.title || "").slice(0, 700);
    const totalAmount = Number(body.totalAmount);
    const depositAmount = Number(body.depositAmount || 0);
    const installmentCount = Math.max(1, Math.min(60, Number(body.installmentCount || 1)));
    const currency = (body.currency || "brl").toLowerCase();
    const planType = body.planType || "one_time";
    const cadence = body.cadence || (planType === "one_time" ? "one_time" : "monthly");
    const paymentMethod = body.paymentMethod || "hosted_checkout";
    const paymentRoute = paymentMethod === "superwall_stripe" ? "superwall_app_to_stripe" : paymentMethod;
    const startDate = parseStartDate(body.startDate);

    if (!title || title.length < 3) {
      return new Response(JSON.stringify({ error: "A plan title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return new Response(JSON.stringify({ error: "A valid total amount is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (depositAmount < 0 || depositAmount > totalAmount) {
      return new Response(JSON.stringify({ error: "Deposit amount is invalid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      return new Response(JSON.stringify({ error: "Provider account required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerId: string | null = null;
    if (body.clientEmail) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", body.clientEmail)
        .maybeSingle();
      customerId = profile?.user_id || null;
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("provider_invoices")
      .insert({
        provider_id: provider.id,
        active_job_id: body.activeJobId || null,
        customer_id: customerId,
        subcontractor_id: body.subcontractorId || null,
        created_by: user.id,
        currency,
        subtotal: totalAmount,
        total_amount: totalAmount,
        service_description: serviceDescription,
        invoice_type: planType === "milestone" ? "milestone" : "standard",
        payment_status: "pending",
        metadata: {
          client_name: body.clientName ? escapeHtml(body.clientName).slice(0, 120) : null,
          client_email: body.clientEmail || null,
          payment_plan_type: planType,
          cadence,
          requested_payment_method: paymentMethod,
          payment_route: paymentRoute,
          baise_branding: "discreet_footer",
        },
      })
      .select("id, invoice_number, client_display_id")
      .single();

    if (invoiceError || !invoice) throw invoiceError;

    const { data: paymentPlan, error: planError } = await supabaseAdmin
      .from("provider_payment_plans")
      .insert({
        provider_id: provider.id,
        invoice_id: invoice.id,
        customer_id: customerId,
        active_job_id: body.activeJobId || null,
        subcontractor_id: body.subcontractorId || null,
        created_by: user.id,
        plan_type: planType,
        cadence,
        title,
        description: serviceDescription,
        currency,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        installment_count: installmentCount,
        autopay_enabled: Boolean(body.autopayEnabled),
        payment_method: paymentMethod,
        start_date: startDate.toISOString().slice(0, 10),
        end_date: body.endDate || null,
        status: "active",
        metadata: {
          invoice_number: invoice.invoice_number,
          client_display_id: invoice.client_display_id,
          client_name: body.clientName ? escapeHtml(body.clientName).slice(0, 120) : null,
          client_email: body.clientEmail || null,
          requested_payment_method: paymentMethod,
          payment_route: paymentRoute,
          superwall_app_to_stripe: paymentMethod === "superwall_stripe",
        },
      })
      .select("id")
      .single();

    if (planError || !paymentPlan) throw planError;

    await supabaseAdmin
      .from("provider_invoices")
      .update({
        payment_plan_id: paymentPlan.id,
        client_action_status: body.clientEmail ? "sent" : "not_sent",
        last_sent_at: body.clientEmail ? new Date().toISOString() : null,
      })
      .eq("id", invoice.id);

    const itemInputs: Array<{ label: string; amount: number; dueAt: Date; releaseBenchmark?: string }> = [];
    if (Array.isArray(body.milestones) && body.milestones.length > 0) {
      for (const [index, milestone] of body.milestones.entries()) {
        const amount = Number(milestone.amount);
        if (!Number.isFinite(amount) || amount <= 0) continue;
        itemInputs.push({
          label: escapeHtml(milestone.label || `Milestone ${index + 1}`).slice(0, 160),
          amount: roundMoney(amount),
          dueAt: parseStartDate(milestone.dueAt) || addCadence(startDate, "monthly", index),
          releaseBenchmark: milestone.releaseBenchmark
            ? escapeHtml(milestone.releaseBenchmark).slice(0, 240)
            : undefined,
        });
      }
    } else {
      if (depositAmount > 0) {
        itemInputs.push({
          label: "Deposit",
          amount: roundMoney(depositAmount),
          dueAt: startDate,
          releaseBenchmark: "Deposit collected",
        });
      }
      const remaining = roundMoney(totalAmount - depositAmount);
      const count = planType === "one_time" && depositAmount === 0 ? 1 : installmentCount;
      const perInstallment = roundMoney(remaining / count);
      for (let i = 0; i < count; i += 1) {
        const isLast = i === count - 1;
        const prior = perInstallment * i;
        const amount = isLast ? roundMoney(remaining - prior) : perInstallment;
        if (amount <= 0) continue;
        itemInputs.push({
          label: count === 1 ? "Payment" : `Payment ${i + 1} of ${count}`,
          amount,
          dueAt: addCadence(startDate, cadence, depositAmount > 0 ? i + 1 : i),
          releaseBenchmark:
            planType === "milestone" ? `Benchmark ${i + 1} approved` : undefined,
        });
      }
    }

    const totalScheduled = roundMoney(itemInputs.reduce((sum, item) => sum + item.amount, 0));
    if (Math.abs(totalScheduled - totalAmount) > 0.02) {
      return new Response(
        JSON.stringify({
          error: `Scheduled payments must equal total amount. Scheduled ${totalScheduled}, expected ${totalAmount}.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const items = itemInputs.map((item, index) => ({
      payment_plan_id: paymentPlan.id,
      provider_id: provider.id,
      invoice_id: invoice.id,
      sequence_number: index + 1,
      label: item.label,
      amount: item.amount,
      currency,
      due_at: item.dueAt.toISOString(),
      release_benchmark: item.releaseBenchmark || null,
      status: index === 0 && planType === "one_time" ? "pending" : "scheduled",
      metadata: {
        invoice_number: invoice.invoice_number,
        client_display_id: invoice.client_display_id,
        requested_payment_method: paymentMethod,
        payment_route: paymentRoute,
      },
    }));

    const { data: createdItems, error: itemError } = await supabaseAdmin
      .from("provider_payment_plan_items")
      .insert(items)
      .select("id, label, amount, due_at");

    if (itemError) throw itemError;

    const calendarEvents = items.map((item) => ({
      provider_id: provider.id,
      customer_id: customerId,
      active_job_id: body.activeJobId || null,
      payment_plan_id: paymentPlan.id,
      created_by: user.id,
      event_type: "payment_due",
      title: `${item.label} due`,
      description: `${title} payment due for ${invoice.invoice_number}`,
      start_at: item.due_at,
      status: "scheduled",
      notification_offsets_minutes: [1440, 120],
      channel_preferences: ["portal", "email", "whatsapp"],
      portal_first: true,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        payment_plan_item_label: item.label,
        requested_payment_method: paymentMethod,
        payment_route: paymentRoute,
      },
    }));

    await supabaseAdmin.from("provider_calendar_events").insert(calendarEvents);

    const communicationEvents = items.map((item) => {
      const scheduledAt = new Date(item.due_at);
      scheduledAt.setDate(scheduledAt.getDate() - 1);
      return {
        provider_id: provider.id,
        customer_id: customerId,
        created_by: user.id,
        purpose: "payment_request",
        channel: "portal",
        subject: `${item.label} reminder`,
        message_body: `${item.label} for ${title} is due on ${new Date(item.due_at).toLocaleDateString("en-US")}. Keep payment and receipts inside the portal.`,
        scheduled_at: scheduledAt.toISOString(),
        status: "queued",
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          payment_plan_id: paymentPlan.id,
          portal_first: true,
          requested_payment_method: paymentMethod,
          payment_route: paymentRoute,
          fallback_channels: ["email", "whatsapp"],
        },
      };
    });

    await supabaseAdmin.from("provider_communication_events").insert(communicationEvents);

    if (body.clientEmail) {
      const inviteToken = crypto.randomUUID();
      const tokenHash = await hashInviteToken(inviteToken);

      await supabaseAdmin.from("provider_client_portal_invites").insert({
        provider_id: provider.id,
        customer_id: customerId,
        invited_by: user.id,
        invite_type: "payment_request",
        resource_type: "payment_plan",
        resource_id: paymentPlan.id,
        email: body.clientEmail.toLowerCase(),
        token_hash: tokenHash,
        metadata: {
          account_required: true,
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_display_id: invoice.client_display_id,
          sign_in_path: "/auth",
          customer_dashboard_path: "/customer-dashboard",
        },
      });
    }

    await supabaseAdmin.rpc("log_provider_audit_event", {
      target_provider_id: provider.id,
      actor_id: user.id,
      actor_kind: "owner",
      event_action: "payment_plan.created",
      event_resource_type: "provider_payment_plan",
      event_resource_id: paymentPlan.id,
      event_severity: "info",
      event_metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        plan_type: planType,
        cadence,
        installment_count: items.length,
        payment_method: paymentMethod,
      },
    });

    return new Response(
      JSON.stringify({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        clientId: invoice.client_display_id,
        paymentPlanId: paymentPlan.id,
        scheduledItems: createdItems || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "CREATE-PROVIDER-PAYMENT-PLAN");
  }
});
