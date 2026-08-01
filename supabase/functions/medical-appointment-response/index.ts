import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import {
  verifyConfirmationToken,
  type ConfirmationAction,
} from "../_shared/medical-appointment-lifecycle.ts";

const securityHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
  "Pragma": "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
};

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character] || character));

const actionCopy = (action: ConfirmationAction) => {
  if (action === "confirm") {
    return {
      title: "Confirm this appointment response?",
      button: "Confirm appointment",
      success: "Your confirmation was recorded.",
    };
  }
  if (action === "decline") {
    return {
      title: "Tell us you cannot attend?",
      button: "I cannot attend",
      success: "Your response was recorded.",
    };
  }
  return {
    title: "Request a different appointment time?",
    button: "Request a new time",
    success: "Your request was recorded.",
  };
};

const renderPage = (
  title: string,
  message: string,
  form?: { token: string; button: string },
): string => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Medical Baise</title></head>
<body style="margin:0;background:#f4f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#102a2e">
  <main style="max-width:560px;margin:48px auto;padding:0 16px">
    <section style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.08)">
      <header style="padding:24px;background:#00b8d4;color:#fff;font-size:22px;font-weight:800">Medical Baise</header>
      <div style="padding:28px">
        <h1 style="font-size:22px;margin:0 0 14px">${escapeHtml(title)}</h1>
        <p style="line-height:1.6;color:#475569">${escapeHtml(message)}</p>
        ${form ? `
          <form method="post">
            <input type="hidden" name="token" value="${escapeHtml(form.token)}">
            <button type="submit" style="border:0;border-radius:9px;background:#00b8d4;color:#fff;padding:13px 20px;font-size:16px;font-weight:800;cursor:pointer">
              ${escapeHtml(form.button)}
            </button>
          </form>
        ` : ""}
        <p style="margin-top:24px;font-size:13px;line-height:1.5;color:#64748b">
          No medical details are displayed here. Sign in to the secure Medical Baise portal for appointment information.
        </p>
      </div>
    </section>
  </main>
</body>
</html>`;

const getConfiguration = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  const signingSecret = Deno.env.get("MEDICAL_APPOINTMENT_CALLBACK_SECRET")?.trim();
  if (!supabaseUrl || !serviceRoleKey || !signingSecret || signingSecret.length < 32) {
    return null;
  }
  return { supabaseUrl, serviceRoleKey, signingSecret };
};

serve(async (request) => {
  if (request.method !== "GET" && request.method !== "POST") {
    return new Response(
      renderPage("Unable to continue", "Use the secure link from your Medical Baise message."),
      { status: 404, headers: securityHeaders },
    );
  }

  const configuration = getConfiguration();
  if (!configuration) {
    return new Response(
      renderPage("Temporarily unavailable", "Please sign in to the secure portal or contact Medical Baise support."),
      { status: 503, headers: securityHeaders },
    );
  }

  if (Number(request.headers.get("content-length") || 0) > 4096) {
    return new Response(
      renderPage("Unable to continue", "The response request was invalid."),
      { status: 413, headers: securityHeaders },
    );
  }

  let token = "";
  if (request.method === "GET") {
    token = new URL(request.url).searchParams.get("token") || "";
  } else {
    const form = await request.formData().catch(() => null);
    token = typeof form?.get("token") === "string" ? String(form?.get("token")) : "";
  }

  const payload = await verifyConfirmationToken(token, configuration.signingSecret);
  if (!payload) {
    return new Response(
      renderPage("This response link is unavailable", "It may be invalid or expired. Sign in to the secure portal for current options."),
      { status: 400, headers: securityHeaders },
    );
  }

  const copy = actionCopy(payload.action);
  if (request.method === "GET") {
    return new Response(
      renderPage(
        copy.title,
        "Review the action below. Opening this page did not change your appointment.",
        { token, button: copy.button },
      ),
      { headers: securityHeaders },
    );
  }

  const admin = createClient(
    configuration.supabaseUrl,
    configuration.serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await admin.rpc(
    "respond_to_medical_appointment_confirmation",
    {
      target_event_id: payload.eventId,
      requested_action: payload.action,
    },
  );

  if (error || data !== payload.action) {
    return new Response(
      renderPage("Unable to record this response", "The link may already have been used. Sign in to the secure portal for current options."),
      { status: 409, headers: securityHeaders },
    );
  }

  return new Response(
    renderPage("Response received", copy.success),
    { headers: securityHeaders },
  );
});
