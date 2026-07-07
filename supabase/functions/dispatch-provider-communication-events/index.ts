import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";

type DispatchBody = {
  limit?: number;
  providerId?: string;
};

type CommunicationEvent = {
  id: string;
  provider_id: string;
  customer_id: string | null;
  created_by: string;
  purpose: string;
  channel: "portal" | "email" | "whatsapp" | "push" | "sms";
  subject: string | null;
  message_body: string;
  delivery_attempts: number | null;
  metadata: Record<string, unknown> | null;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM_NAME = Deno.env.get("BAISE_EMAIL_FROM_NAME") || "Baise";
const EMAIL_FROM_ADDRESS = Deno.env.get("BAISE_EMAIL_FROM_ADDRESS") || "noreply@baise.com";

const isDue = `and(status.in.(queued,deferred,failed),or(scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}),or(next_attempt_at.is.null,next_attempt_at.lte.${new Date().toISOString()}))`;

async function sendEmail(to: string, subject: string, body: string) {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "Email service is not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      to: [to],
      subject,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h1 style="font-size:20px;line-height:1.3;color:#0f172a;">${escapeHtml(subject)}</h1>
          <p style="font-size:15px;line-height:1.6;color:#334155;">${escapeHtml(body)}</p>
          <p style="font-size:13px;line-height:1.5;color:#64748b;margin-top:24px;">
            Open your Baise portal for full details, receipts, messages, and service history.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `Resend error ${res.status}` };
  }

  const data = await res.json();
  return { ok: true, externalId: data?.id as string | undefined };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const cronSecret = Deno.env.get("PROVIDER_WORKFLOW_CRON_SECRET");
    const requestSecret = req.headers.get("x-cron-secret");
    const isCron = Boolean(cronSecret && requestSecret === cronSecret);
    let providerIdFromAuth: string | null = null;
    let actorId: string | null = null;

    const body = (await req.json().catch(() => ({}))) as DispatchBody;
    const limit = Math.max(1, Math.min(100, Number(body.limit || 25)));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    if (!isCron) {
      const { user } = await authenticateRequest(req);
      actorId = user.id;
      const { data: provider } = await supabaseAdmin
        .from("providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!provider) {
        return new Response(JSON.stringify({ error: "Provider account required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      providerIdFromAuth = provider.id;
    }

    let query = supabaseAdmin
      .from("provider_communication_events")
      .select("id, provider_id, customer_id, created_by, purpose, channel, subject, message_body, delivery_attempts, metadata")
      .or(isDue)
      .order("scheduled_at", { ascending: true, nullsFirst: true })
      .limit(limit);

    if (body.providerId && isCron) {
      query = query.eq("provider_id", body.providerId);
    } else if (providerIdFromAuth) {
      query = query.eq("provider_id", providerIdFromAuth);
    }

    const { data: events, error } = await query;
    if (error) throw error;

    let sent = 0;
    let deferred = 0;
    let failed = 0;

    for (const event of (events || []) as CommunicationEvent[]) {
      const now = new Date().toISOString();
      const attempts = Number(event.delivery_attempts || 0) + 1;
      const subject = event.subject || "Baise update";
      const message = event.message_body || "Open Baise for the latest update.";

      await supabaseAdmin
        .from("provider_communication_events")
        .update({
          status: "processing",
          delivery_attempts: attempts,
          last_attempt_at: now,
          delivery_error: null,
        })
        .eq("id", event.id);

      try {
        if (!event.customer_id) {
          throw new Error("No customer account is attached to this event");
        }

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("user_id", event.customer_id)
          .maybeSingle();

        const { data: prefs } = await supabaseAdmin
          .from("notification_preferences")
          .select("in_app_enabled, email_enabled, push_enabled")
          .eq("user_id", event.customer_id)
          .maybeSingle();

        let deliveredVia = "portal";
        let externalMessageId: string | null = null;

        if (event.channel === "portal" || event.channel === "push") {
          if (!prefs || prefs.in_app_enabled !== false) {
            await supabaseAdmin.from("notifications").insert({
              user_id: event.customer_id,
              title: subject,
              message,
              type: event.purpose === "payment_request" ? "payment" : "reminder",
              priority: event.purpose === "payment_request" ? "high" : "normal",
              action_url: event.purpose === "payment_request" ? "/customer-dashboard" : "/notifications",
              metadata: {
                provider_communication_event_id: event.id,
                ...(event.metadata || {}),
              },
            });
          }
          deliveredVia = event.channel === "push" ? "portal_push_ready" : "portal";
        } else if (event.channel === "email") {
          if (prefs && prefs.email_enabled === false) {
            throw new Error("Customer email notifications are disabled");
          }
          if (!profile?.email) {
            throw new Error("Customer email is not available");
          }
          const result = await sendEmail(profile.email, subject, message);
          if (!result.ok) throw new Error(result.error || "Email send failed");
          deliveredVia = "email";
          externalMessageId = result.externalId || null;
        } else {
          const nextAttemptAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
          await supabaseAdmin
            .from("provider_communication_events")
            .update({
              status: "deferred",
              delivery_attempts: attempts,
              last_attempt_at: now,
              next_attempt_at: nextAttemptAt,
              delivery_error: `${event.channel.toUpperCase()} delivery requires a connected messaging provider`,
            })
            .eq("id", event.id);

          deferred += 1;
          continue;
        }

        await supabaseAdmin
          .from("provider_communication_events")
          .update({
            status: "sent",
            sent_at: now,
            delivered_via: deliveredVia,
            external_message_id: externalMessageId,
            delivery_error: null,
          })
          .eq("id", event.id);

        await supabaseAdmin.rpc("log_provider_audit_event", {
          target_provider_id: event.provider_id,
          actor_id: actorId,
          actor_kind: isCron ? "system" : "owner",
          event_action: "communication_event.sent",
          event_resource_type: "provider_communication_event",
          event_resource_id: event.id,
          event_severity: "info",
          event_metadata: {
            channel: event.channel,
            delivered_via: deliveredVia,
            attempts,
          },
        });

        sent += 1;
      } catch (eventError) {
        const messageText = eventError instanceof Error ? eventError.message : "Delivery failed";
        const status = attempts >= 3 ? "failed" : "deferred";
        const nextAttemptAt = status === "failed"
          ? null
          : new Date(Date.now() + attempts * 30 * 60 * 1000).toISOString();

        await supabaseAdmin
          .from("provider_communication_events")
          .update({
            status,
            delivery_attempts: attempts,
            last_attempt_at: now,
            next_attempt_at: nextAttemptAt,
            delivery_error: messageText.slice(0, 500),
          })
          .eq("id", event.id);

        await supabaseAdmin.rpc("log_provider_audit_event", {
          target_provider_id: event.provider_id,
          actor_id: actorId,
          actor_kind: isCron ? "system" : "owner",
          event_action: "communication_event.delivery_issue",
          event_resource_type: "provider_communication_event",
          event_resource_id: event.id,
          event_severity: status === "failed" ? "warning" : "info",
          event_metadata: {
            channel: event.channel,
            attempts,
            error: messageText,
          },
        });

        if (status === "failed") failed += 1;
        else deferred += 1;
      }
    }

    return new Response(JSON.stringify({ processed: events?.length || 0, sent, deferred, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "DISPATCH-PROVIDER-COMMUNICATION-EVENTS");
  }
});
