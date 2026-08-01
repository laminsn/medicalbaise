import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import webPush from "npm:web-push@3.6.7";
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
  provider_calendar_event_id: string | null;
  appointment_automation_kind: string | null;
  created_by: string;
  purpose: string;
  channel: "portal" | "email" | "whatsapp" | "push" | "sms";
  subject: string | null;
  message_body: string;
  delivery_attempts: number | null;
  metadata: Record<string, unknown> | null;
  app_key: "casa" | "medical" | "legal";
  event_type: string;
  locale: string;
  is_transactional: boolean | null;
  delivery_policy: "transactional" | "marketing" | "system" | null;
  recipient_email: string | null;
  recipient_phone: string | null;
};

type ProfileTarget = {
  email: string | null;
  phone: string | null;
};

type NotificationPreferences = {
  in_app_enabled: boolean | null;
  email_enabled: boolean | null;
  push_enabled: boolean | null;
  sms_enabled: boolean | null;
  whatsapp_enabled: boolean | null;
  marketing_email_enabled: boolean | null;
};

type DeliveryResult = {
  ok: boolean;
  deliveredVia?: string;
  externalId?: string | null;
  deferred?: boolean;
  skipped?: boolean;
  error?: string;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER");
const TWILIO_WHATSAPP_FROM_NUMBER = Deno.env.get("TWILIO_WHATSAPP_FROM_NUMBER");
const WHATSAPP_ACCESS_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
const APPOINTMENT_CALLBACK_SECRET = Deno.env.get("APPOINTMENT_CALLBACK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

const APP_BRANDS = {
  casa: {
    name: "Casa Baise",
    domain: "casabaise.com",
    url: "https://casabaise.com",
    color: "#1dbf73",
    from: "Casa Baise <support@support.casabaise.com>",
  },
  medical: {
    name: "Medical Baise",
    domain: "medicalbaise.com",
    url: "https://medicalbaise.com",
    color: "#00b8d4",
    from: "Medical Baise <support@support.mdbaise.com>",
  },
  legal: {
    name: "Legal Baise",
    domain: "legalbaise.com",
    url: "https://legalbaise.com",
    color: "#7c3aed",
    // INTERIM: legalbaise.com and support.legalbaise.com are not verified in
    // Resend, so anything sent from them 403s and never leaves -- no bounce, no
    // retry. Sending from the verified Baise domain with Legal Baise as the
    // display name keeps this mailbox alive. Revert to
    // support@support.legalbaise.com the moment the DKIM/SPF records verify.
    from: "Legal Baise <support@support.casabaise.com>",
  },
} as const;

const nowIso = () => new Date().toISOString();

const getBrand = (appKey?: string) => {
  if (appKey === "medical" || appKey === "legal" || appKey === "casa") return APP_BRANDS[appKey];
  return APP_BRANDS.casa;
};

const metadataString = (metadata: Record<string, unknown> | null, key: string) => {
  const value = metadata?.[key];
  return typeof value === "string" ? value : "";
};

const normalizeSmsPhone = (phone: string) => {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
};

const normalizeWhatsAppPhone = (phone: string) => normalizeSmsPhone(phone).replace(/^\+/, "");

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");

const signAppointmentCallback = async (event: CommunicationEvent): Promise<string | null> => {
  if (
    !APPOINTMENT_CALLBACK_SECRET
    || APPOINTMENT_CALLBACK_SECRET.length < 32
    || !SUPABASE_URL
    || !event.provider_calendar_event_id
    || !event.customer_id
    || !["confirmation", "reminder"].includes(event.appointment_automation_kind || "")
  ) {
    return null;
  }

  const expires = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const payload = [
    event.id,
    event.provider_calendar_event_id,
    event.customer_id,
    String(expires),
  ].join(".");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(APPOINTMENT_CALLBACK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = toHex(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)),
  );
  const query = new URLSearchParams({
    communication: event.id,
    appointment: event.provider_calendar_event_id,
    customer: event.customer_id,
    expires: String(expires),
    signature,
  });
  return `${SUPABASE_URL}/functions/v1/appointment-response?${query.toString()}`;
};

const buildEmailHtml = (brand: typeof APP_BRANDS.casa, subject: string, body: string, actionUrl: string) => {
  const callbackBase = `${SUPABASE_URL}/functions/v1/appointment-response?`;
  const safeActionUrl = actionUrl.startsWith("/")
    ? `${brand.url}${actionUrl}`
    : actionUrl.startsWith(callbackBase)
      ? actionUrl
      : brand.url;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:${brand.color};padding:24px 32px;color:#ffffff;">
          <h1 style="margin:0;font-size:24px;font-weight:700;">${escapeHtml(brand.name)}</h1>
          <p style="margin:4px 0 0;font-size:14px;opacity:0.92;">Secure portal update</p>
        </td></tr>
        <tr><td style="padding:32px;color:#111111;line-height:1.6;">
          <h2 style="margin:0 0 16px;font-size:22px;">${escapeHtml(subject)}</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#334155;">${escapeHtml(body)}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${escapeHtml(safeActionUrl)}" style="display:inline-block;background:${brand.color};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">Open portal</a>
          </div>
          <p style="margin:24px 0 0;font-size:13px;color:#64748b;">
            Keep messages, receipts, signatures, files, and service history inside your Baise portal.
          </p>
        </td></tr>
        <tr><td style="background:#f7f7f7;padding:16px 32px;font-size:12px;color:#888888;text-align:center;">
          ${escapeHtml(brand.name)} · ${escapeHtml(brand.domain)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
};

async function sendEmail(
  to: string,
  subject: string,
  body: string,
  appKey: string,
  actionUrl: string,
  eventId: string,
): Promise<DeliveryResult> {
  if (!RESEND_API_KEY) {
    return { ok: false, deferred: true, error: "Email service is not configured" };
  }

  const brand = getBrand(appKey);
  const configuredFromName = Deno.env.get("BAISE_EMAIL_FROM_NAME");
  const configuredFromAddress = Deno.env.get("BAISE_EMAIL_FROM_ADDRESS");
  const from = configuredFromName && configuredFromAddress
    ? `${configuredFromName} <${configuredFromAddress}>`
    : brand.from;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Idempotency-Key": `provider-communication/${eventId}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html: buildEmailHtml(brand, subject, body, actionUrl),
    }),
  });

  if (!res.ok) {
    return { ok: false, error: `Resend error ${res.status}: ${(await res.text()).slice(0, 240)}` };
  }

  const data = await res.json();
  return { ok: true, deliveredVia: "email", externalId: data?.id || null };
}

async function sendSms(to: string, body: string): Promise<DeliveryResult> {
  const normalizedTo = normalizeSmsPhone(to);
  if (!normalizedTo) return { ok: false, error: "Recipient phone number is not available" };
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { ok: false, deferred: true, error: "SMS delivery requires Twilio credentials" };
  }

  const params = new URLSearchParams();
  params.set("To", normalizedTo);
  params.set("From", TWILIO_FROM_NUMBER);
  params.set("Body", body.slice(0, 1500));

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!res.ok) {
    return { ok: false, error: `Twilio SMS error ${res.status}: ${(await res.text()).slice(0, 240)}` };
  }

  const data = await res.json();
  return { ok: true, deliveredVia: "sms", externalId: data?.sid || null };
}

async function sendWhatsApp(to: string, body: string): Promise<DeliveryResult> {
  const normalizedTo = normalizeWhatsAppPhone(to);
  if (!normalizedTo) return { ok: false, error: "Recipient WhatsApp phone number is not available" };

  if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
    const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: {
          preview_url: true,
          body: body.slice(0, 4000),
        },
      }),
    });

    if (!res.ok) {
      return { ok: false, error: `WhatsApp Cloud error ${res.status}: ${(await res.text()).slice(0, 240)}` };
    }

    const data = await res.json();
    return { ok: true, deliveredVia: "whatsapp_cloud", externalId: data?.messages?.[0]?.id || null };
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_WHATSAPP_FROM_NUMBER) {
    const params = new URLSearchParams();
    params.set("To", `whatsapp:${normalizeSmsPhone(to)}`);
    params.set("From", `whatsapp:${TWILIO_WHATSAPP_FROM_NUMBER}`);
    params.set("Body", body.slice(0, 1500));

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!res.ok) {
      return { ok: false, error: `Twilio WhatsApp error ${res.status}: ${(await res.text()).slice(0, 240)}` };
    }

    const data = await res.json();
    return { ok: true, deliveredVia: "twilio_whatsapp", externalId: data?.sid || null };
  }

  return { ok: false, deferred: true, error: "WhatsApp delivery requires WhatsApp Cloud or Twilio credentials" };
}

async function sendPush(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  subject: string,
  body: string,
  actionUrl: string,
  metadata: Record<string, unknown>,
): Promise<DeliveryResult> {
  const publicKey = Deno.env.get("WEB_PUSH_PUBLIC_KEY") || Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("WEB_PUSH_PRIVATE_KEY") || Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("WEB_PUSH_SUBJECT") || "mailto:support@baise.com";

  if (!publicKey || !privateKey) {
    return { ok: false, deferred: true, error: "Web push VAPID keys are not configured" };
  }

  const { data: subscriptions, error } = await supabaseAdmin
    .from("web_push_subscriptions")
    .select("id, endpoint, p256dh, auth, subscription_json")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw error;
  if (!subscriptions?.length) return { ok: false, skipped: true, error: "No active push subscriptions" };

  webPush.setVapidDetails(vapidSubject, publicKey, privateKey);

  const payload = JSON.stringify({
    title: subject.slice(0, 120),
    body: body.slice(0, 240),
    url: actionUrl.startsWith("/") ? actionUrl : "/notifications",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    metadata,
  });

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      const pushSubscription = subscription.subscription_json || {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      await webPush.sendNotification(pushSubscription, payload);
      sent += 1;

      await supabaseAdmin
        .from("web_push_subscriptions")
        .update({ last_success_at: nowIso(), failure_count: 0 })
        .eq("id", subscription.id);

      await supabaseAdmin.from("push_notification_deliveries").insert({
        user_id: userId,
        subscription_id: subscription.id,
        status: "sent",
        sent_at: nowIso(),
        metadata,
      });
    } catch (pushError) {
      failed += 1;
      const statusCode = typeof pushError === "object" && pushError && "statusCode" in pushError
        ? Number((pushError as { statusCode?: number }).statusCode)
        : 0;

      await supabaseAdmin
        .from("web_push_subscriptions")
        .update({
          is_active: statusCode === 404 || statusCode === 410 ? false : true,
          last_failure_at: nowIso(),
          failure_count: 1,
        })
        .eq("id", subscription.id);

      await supabaseAdmin.from("push_notification_deliveries").insert({
        user_id: userId,
        subscription_id: subscription.id,
        status: "failed",
        error_message: pushError instanceof Error ? pushError.message.slice(0, 300) : "Push send failed",
        metadata: {
          status_code: statusCode || null,
          ...metadata,
        },
      });
    }
  }

  if (sent === 0 && failed > 0) return { ok: false, error: "All push notifications failed" };
  return { ok: true, deliveredVia: "web_push", externalId: `${sent}_subscriptions` };
}

const isOptedOut = (
  channel: CommunicationEvent["channel"],
  prefs: NotificationPreferences | null,
  isTransactional: boolean,
) => {
  if (!prefs) {
    return (
      channel === "push"
      || channel === "sms"
      || channel === "whatsapp"
      || (channel === "email" && !isTransactional)
    );
  }
  if (channel === "portal") return prefs.in_app_enabled === false;
  if (channel === "push") return prefs.push_enabled === false;
  if (channel === "sms") return prefs.sms_enabled !== true;
  if (channel === "whatsapp") return prefs.whatsapp_enabled !== true;
  if (channel === "email" && !isTransactional) {
    return prefs.email_enabled === false || prefs.marketing_email_enabled === false;
  }
  return false;
};

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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authorization = req.headers.get("authorization") || "";
    const isServiceRoleCron = Boolean(
      serviceRoleKey && authorization === `Bearer ${serviceRoleKey}`,
    );
    const isCron = Boolean(
      isServiceRoleCron || (cronSecret && requestSecret === cronSecret),
    );
    let providerIdFromAuth: string | null = null;
    let actorId: string | null = null;

    const body = (await req.json().catch(() => ({}))) as DispatchBody;
    const limit = Math.max(1, Math.min(100, Number(body.limit || 25)));

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey,
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

    const targetProviderId =
      body.providerId && isCron ? body.providerId : providerIdFromAuth;
    const { data: events, error } = await supabaseAdmin.rpc(
      "claim_due_provider_communication_events",
      {
        target_provider_id: targetProviderId,
        target_limit: limit,
      },
    );
    if (error) throw error;

    let sent = 0;
    let deferred = 0;
    let failed = 0;
    let skipped = 0;

    for (const event of (events || []) as CommunicationEvent[]) {
      const attemptStartedAt = nowIso();
      const attempts = Number(event.delivery_attempts || 1);
      const subject = event.subject || "Baise update";
      const message = event.message_body || "Open Baise for the latest update.";
      let actionUrl = metadataString(event.metadata, "action_url") || "/notifications";
      const isTransactional = event.delivery_policy === "transactional" || event.is_transactional !== false;

      try {
        let profile: ProfileTarget | null = null;
        let prefs: NotificationPreferences | null = null;

        if (event.customer_id) {
          const { data: profileData } = await supabaseAdmin
            .from("profiles")
            .select("email, phone")
            .eq("user_id", event.customer_id)
            .maybeSingle();
          profile = profileData as ProfileTarget | null;

          const { data: prefsData } = await supabaseAdmin
            .from("notification_preferences")
            .select("in_app_enabled, email_enabled, push_enabled, sms_enabled, whatsapp_enabled, marketing_email_enabled")
            .eq("user_id", event.customer_id)
            .maybeSingle();
          prefs = prefsData as NotificationPreferences | null;
        }

        if (
          ["email", "sms", "whatsapp"].includes(event.channel)
          && ["confirmation", "reminder"].includes(event.appointment_automation_kind || "")
        ) {
          const callbackUrl = await signAppointmentCallback(event);
          if (!callbackUrl) {
            throw new Error("Appointment callback signing is not configured");
          }
          actionUrl = callbackUrl;
        }

        if (isOptedOut(event.channel, prefs, isTransactional)) {
          const { error: optOutUpdateError } = await supabaseAdmin
            .from("provider_communication_events")
            .update({
              status: "cancelled",
              delivery_attempts: attempts,
              last_attempt_at: attemptStartedAt,
              delivery_error: `${event.channel}_opted_out`,
            })
            .eq("id", event.id);
          if (optOutUpdateError) throw optOutUpdateError;
          skipped += 1;
          continue;
        }

        let result: DeliveryResult;

        if (event.channel === "portal") {
          if (!event.customer_id) throw new Error("No customer account is attached to this portal event");
          const { error: portalError } = await supabaseAdmin.from("notifications").upsert({
            provider_communication_event_id: event.id,
            user_id: event.customer_id,
            title: subject,
            message,
            type: event.purpose === "payment_request" ? "payment" : event.event_type === "job_accepted" ? "job_update" : "reminder",
            priority: event.purpose === "payment_request" ? "high" : "normal",
            action_url: actionUrl.startsWith("/") ? actionUrl : "/notifications",
            metadata: {
              provider_communication_event_id: event.id,
              event_type: event.event_type,
              app_key: event.app_key,
              ...(event.metadata || {}),
            },
          }, {
            onConflict: "provider_communication_event_id",
            ignoreDuplicates: true,
          });
          if (portalError) throw portalError;
          result = { ok: true, deliveredVia: "portal" };
        } else if (event.channel === "email") {
          const email = event.recipient_email || profile?.email;
          if (!email) throw new Error("Recipient email is not available");
          result = await sendEmail(email, subject, message, event.app_key, actionUrl, event.id);
        } else if (event.channel === "push") {
          if (!event.customer_id) throw new Error("No customer account is attached to this push event");
          result = await sendPush(supabaseAdmin, event.customer_id, subject, message, actionUrl, {
            provider_communication_event_id: event.id,
            event_type: event.event_type,
            app_key: event.app_key,
            ...(event.metadata || {}),
          });
        } else if (event.channel === "sms") {
          const phone = event.recipient_phone || profile?.phone;
          result = await sendSms(phone || "", `${subject}\n${message}\n${actionUrl}`);
        } else {
          const phone = event.recipient_phone || profile?.phone;
          result = await sendWhatsApp(phone || "", `${subject}\n${message}\n${actionUrl}`);
        }

        if (!result.ok) {
          const status = result.skipped ? "cancelled" : attempts < 3 ? "deferred" : "failed";
          const nextAttemptAt = status === "deferred"
            ? new Date(Date.now() + attempts * 30 * 60 * 1000).toISOString()
            : null;

          const { error: deliveryStateError } = await supabaseAdmin
            .from("provider_communication_events")
            .update({
              status,
              delivery_attempts: attempts,
              last_attempt_at: attemptStartedAt,
              next_attempt_at: nextAttemptAt,
              delivery_error: (result.error || "Delivery did not complete").slice(0, 500),
            })
            .eq("id", event.id)
            .eq("status", "processing")
            .eq("delivery_attempts", attempts);
          if (deliveryStateError) throw deliveryStateError;

          if (status === "failed") failed += 1;
          else if (status === "cancelled") skipped += 1;
          else deferred += 1;
          continue;
        }

        const { data: finalizedEvent, error: finalizeError } = await supabaseAdmin
          .from("provider_communication_events")
          .update({
            status: "sent",
            sent_at: nowIso(),
            delivered_via: result.deliveredVia || event.channel,
            external_message_id: result.externalId || null,
            delivery_error: null,
          })
          .eq("id", event.id)
          .eq("status", "processing")
          .eq("delivery_attempts", attempts)
          .select("id")
          .maybeSingle();
        if (finalizeError) throw finalizeError;
        if (!finalizedEvent) {
          skipped += 1;
          continue;
        }

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
            delivered_via: result.deliveredVia || event.channel,
            event_type: event.event_type,
            transactional: isTransactional,
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

        const { error: failureStateError } = await supabaseAdmin
          .from("provider_communication_events")
          .update({
            status,
            delivery_attempts: attempts,
            last_attempt_at: attemptStartedAt,
            next_attempt_at: nextAttemptAt,
            delivery_error: messageText.slice(0, 500),
          })
          .eq("id", event.id)
          .eq("status", "processing")
          .eq("delivery_attempts", attempts);
        if (failureStateError) {
          console.error("Unable to persist provider communication failure state", failureStateError);
        }

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
            event_type: event.event_type,
            attempts,
            error: messageText,
          },
        });

        if (status === "failed") failed += 1;
        else deferred += 1;
      }
    }

    return new Response(JSON.stringify({ processed: events?.length || 0, sent, deferred, failed, skipped }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "DISPATCH-PROVIDER-COMMUNICATION-EVENTS");
  }
});
