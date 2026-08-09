import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  CONFIRMATION_ACTIONS,
  createConfirmationToken,
  minimumNecessaryCopy,
  type ConfirmationAction,
} from "../_shared/medical-appointment-lifecycle.ts";

type LifecycleEvent = {
  event_id: string;
  appointment_id: string;
  patient_id: string;
  provider_id: string;
  event_type: "confirmation_request" | "reminder" | "follow_up" | "thank_you" | "review_request";
  scheduled_for: string;
  callback_expires_at: string | null;
  attempt_count: number;
};

type PatientPreferences = {
  communications_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
  reminders_enabled: boolean;
  follow_up_enabled: boolean;
  thank_you_enabled: boolean;
  review_requests_enabled: boolean;
  consented_at: string | null;
  locale: "en" | "pt" | "es";
};

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const requiredEnv = (name: string): string => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
};

const constantTimeEqual = (left: string, right: string): boolean => {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let mismatch = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }
  return mismatch === 0;
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character] || character));

const eligibleForEvent = (
  eventType: LifecycleEvent["event_type"],
  appointmentStatus: string,
  preferences: PatientPreferences,
): boolean => {
  if (!preferences.communications_enabled || !preferences.consented_at) return false;
  if (eventType === "confirmation_request") return appointmentStatus === "scheduled";
  if (eventType === "reminder") {
    return appointmentStatus === "scheduled" && preferences.reminders_enabled;
  }
  if (eventType === "follow_up") {
    return appointmentStatus === "completed" && preferences.follow_up_enabled;
  }
  if (eventType === "thank_you") {
    return appointmentStatus === "completed" && preferences.thank_you_enabled;
  }
  return appointmentStatus === "completed" && preferences.review_requests_enabled;
};

const safePortalUrl = (): string => {
  const fallback = "https://www.mdbaise.com/profile?tab=appointments";
  const configured = Deno.env.get("MEDICAL_APP_URL")?.trim();
  if (!configured) return fallback;
  try {
    const url = new URL(configured);
    if (
      url.protocol === "https:" &&
      ["mdbaise.com", "www.mdbaise.com", "medicalbaise.com", "www.medicalbaise.com"].includes(url.hostname)
    ) {
      url.pathname = "/profile";
      url.search = "?tab=appointments";
      url.hash = "";
      return url.toString();
    }
  } catch {
    // Fail closed to the owned production portal.
  }
  return fallback;
};

const buildEmailHtml = (
  subject: string,
  body: string,
  portalUrl: string,
  confirmationLinks: Partial<Record<ConfirmationAction, string>>,
): string => {
  const responseButtons = CONFIRMATION_ACTIONS
    .filter((action) => confirmationLinks[action])
    .map((action) => {
      const labels = {
        confirm: "Confirm",
        decline: "Cannot attend",
        reschedule: "Request a new time",
      };
      const color = action === "confirm" ? "#00b8d4" : "#334155";
      return `<a href="${escapeHtml(confirmationLinks[action] || portalUrl)}" style="display:inline-block;margin:6px;padding:12px 18px;border-radius:8px;background:${color};color:#fff;text-decoration:none;font-weight:700">${labels[action]}</a>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#102a2e">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#00b8d4;color:#fff;padding:24px 28px"><strong style="font-size:22px">MD Baise</strong></td></tr>
        <tr><td style="padding:28px">
          <h1 style="font-size:22px;margin:0 0 16px">${escapeHtml(subject)}</h1>
          <p style="line-height:1.6;margin:0 0 22px">${escapeHtml(body)}</p>
          ${responseButtons ? `<div style="margin:18px 0">${responseButtons}</div>` : ""}
          <p><a href="${escapeHtml(portalUrl)}" style="color:#007f91;font-weight:700">Open the secure portal</a></p>
          <p style="font-size:13px;line-height:1.5;color:#64748b;margin-top:26px">
            Medical information is intentionally excluded from email. If you did not expect this message,
            do not use its response buttons; sign in directly or contact MD Baise support.
          </p>
          <p style="font-size:12px;color:#64748b">
            Appointment communications can be changed at any time in Settings.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404,
      headers: jsonHeaders,
    });
  }

  try {
    const expectedCronSecret = requiredEnv("MEDICAL_APPOINTMENT_CRON_SECRET");
    const suppliedCronSecret = request.headers.get("x-cron-secret") || "";
    if (!constantTimeEqual(suppliedCronSecret, expectedCronSecret)) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const signingSecret = requiredEnv("MEDICAL_APPOINTMENT_CALLBACK_SECRET");
    const resendApiKey = requiredEnv("RESEND_API_KEY");
    const emailFrom = requiredEnv("MEDICAL_APPOINTMENT_EMAIL_FROM");
    if (signingSecret.length < 32) throw new Error("callback_secret_too_short");

    const payload = await request.json().catch(() => ({})) as { limit?: number };
    const limit = Math.min(100, Math.max(1, Number(payload.limit) || 25));
    const workerToken = crypto.randomUUID();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: claimed, error: claimError } = await admin.rpc(
      "claim_due_medical_appointment_events",
      { requested_limit: limit, worker_token: workerToken },
    );
    if (claimError) throw new Error("claim_failed");

    let sent = 0;
    let retried = 0;
    let cancelled = 0;
    let failed = 0;
    const portalUrl = safePortalUrl();

    for (const event of (claimed || []) as LifecycleEvent[]) {
      let outcome: "sent" | "retry" | "cancelled" | "failed" = "cancelled";
      let safeErrorCode: string | null = null;
      let providerMessageId: string | null = null;

      try {
        if (event.attempt_count > 5) {
          outcome = "failed";
          safeErrorCode = "attempt_limit_reached";
        } else {
          const [{ data: appointment }, { data: preferences }, { data: profile }] = await Promise.all([
            admin
              .from("appointments")
              .select("status")
              .eq("id", event.appointment_id)
              .eq("user_id", event.patient_id)
              .eq("provider_id", event.provider_id)
              .maybeSingle(),
            admin
              .from("medical_appointment_patient_preferences")
              .select("communications_enabled, in_app_enabled, email_enabled, reminders_enabled, follow_up_enabled, thank_you_enabled, review_requests_enabled, consented_at, locale")
              .eq("user_id", event.patient_id)
              .maybeSingle(),
            admin
              .from("profiles")
              .select("email")
              .eq("user_id", event.patient_id)
              .maybeSingle(),
          ]);

          if (
            !appointment ||
            !preferences ||
            !eligibleForEvent(event.event_type, appointment.status, preferences as PatientPreferences)
          ) {
            outcome = "cancelled";
          } else {
            const patientPreferences = preferences as PatientPreferences;
            const locale = ["en", "pt", "es"].includes(patientPreferences.locale)
              ? patientPreferences.locale
              : "pt";
            const copy = minimumNecessaryCopy(event.event_type, locale);
            let delivered = false;
            let emailFailed = false;

            if (patientPreferences.in_app_enabled) {
              const { error: portalError } = await admin.rpc(
                "deliver_medical_appointment_in_app",
                {
                  target_event_id: event.event_id,
                  worker_token: workerToken,
                  notification_subject: copy.subject,
                  notification_body: copy.body,
                },
              );
              if (!portalError) delivered = true;
            }

            if (patientPreferences.email_enabled && profile?.email) {
              const confirmationLinks: Partial<Record<ConfirmationAction, string>> = {};
              if (event.event_type === "confirmation_request") {
                const expiration = Math.floor(
                  new Date(event.callback_expires_at || Date.now() + 86400000).getTime() / 1000,
                );
                for (const action of CONFIRMATION_ACTIONS) {
                  const token = await createConfirmationToken(
                    { eventId: event.event_id, action, expiresAt: expiration },
                    signingSecret,
                  );
                  confirmationLinks[action] =
                    `${supabaseUrl}/functions/v1/medical-appointment-response?token=${encodeURIComponent(token)}`;
                }
              }

              await admin.from("medical_appointment_lifecycle_deliveries").upsert({
                event_id: event.event_id,
                channel: "email",
                status: "processing",
                started_at: new Date().toISOString(),
                completed_at: null,
                error_code: null,
              }, { onConflict: "event_id,channel" });

              const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                  "Idempotency-Key": `medical-appointment-${event.event_id}-email`,
                },
                body: JSON.stringify({
                  from: emailFrom,
                  to: [profile.email],
                  subject: copy.subject,
                  html: buildEmailHtml(copy.subject, copy.body, portalUrl, confirmationLinks),
                }),
              });

              if (response.ok) {
                const result = await response.json().catch(() => ({}));
                providerMessageId = typeof result.id === "string" ? result.id : null;
                await admin
                  .from("medical_appointment_lifecycle_deliveries")
                  .update({
                    status: "sent",
                    provider_message_id: providerMessageId,
                    completed_at: new Date().toISOString(),
                  })
                  .eq("event_id", event.event_id)
                  .eq("channel", "email");
                delivered = true;
              } else {
                emailFailed = true;
                safeErrorCode = `email_http_${response.status}`;
                await admin
                  .from("medical_appointment_lifecycle_deliveries")
                  .update({
                    status: "failed",
                    error_code: safeErrorCode,
                    completed_at: new Date().toISOString(),
                  })
                  .eq("event_id", event.event_id)
                  .eq("channel", "email");
              }
            }

            if (emailFailed) outcome = event.attempt_count >= 5 ? "failed" : "retry";
            else outcome = delivered ? "sent" : "cancelled";
          }
        }
      } catch {
        outcome = event.attempt_count >= 5 ? "failed" : "retry";
        safeErrorCode = "delivery_exception";
      }

      const { data: completed, error: completionError } = await admin.rpc(
        "complete_medical_appointment_event",
        {
          target_event_id: event.event_id,
          worker_token: workerToken,
          outcome,
          safe_error_code: safeErrorCode,
          external_message_id: providerMessageId,
        },
      );
      if (completionError || completed !== true) continue;
      if (outcome === "sent") sent += 1;
      else if (outcome === "retry") retried += 1;
      else if (outcome === "failed") failed += 1;
      else cancelled += 1;
    }

    return new Response(JSON.stringify({
      claimed: (claimed || []).length,
      sent,
      retried,
      cancelled,
      failed,
    }), { headers: jsonHeaders });
  } catch (error) {
    const code = error instanceof Error ? error.message : "dispatcher_unavailable";
    const safeCode = /^[a-z0-9_]+$/i.test(code) ? code : "dispatcher_unavailable";
    return new Response(JSON.stringify({ error: safeCode }), {
      status: 503,
      headers: jsonHeaders,
    });
  }
});
