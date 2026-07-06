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

type PushBody = {
  userId?: string;
  notificationId?: string;
  title: string;
  message?: string;
  body?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const { user } = await authenticateRequest(req);
    const body = (await req.json()) as PushBody;
    const targetUserId = body.userId || user.id;

    if (targetUserId !== user.id) {
      return new Response(JSON.stringify({ error: "Users can only dispatch push notifications to themselves from this endpoint" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const publicKey = Deno.env.get("WEB_PUSH_PUBLIC_KEY") || Deno.env.get("VAPID_PUBLIC_KEY");
    const privateKey = Deno.env.get("WEB_PUSH_PRIVATE_KEY") || Deno.env.get("VAPID_PRIVATE_KEY");
    const subject = Deno.env.get("WEB_PUSH_SUBJECT") || "mailto:support@baise.com";

    if (!publicKey || !privateKey) {
      return new Response(JSON.stringify({ error: "Web push VAPID keys are not configured" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const title = escapeHtml(body.title || "Baise notification").slice(0, 120);
    const message = escapeHtml(body.message || body.body || "Open Baise for the latest update.").slice(0, 240);
    const actionUrl = typeof body.actionUrl === "string" && body.actionUrl.startsWith("/")
      ? body.actionUrl
      : "/notifications";

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: prefs } = await supabaseAdmin
      .from("notification_preferences")
      .select("push_enabled")
      .eq("user_id", targetUserId)
      .maybeSingle();

    if (prefs && prefs.push_enabled === false) {
      return new Response(JSON.stringify({ sent: 0, skipped: true, reason: "push_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subscriptions, error: subscriptionError } = await supabaseAdmin
      .from("web_push_subscriptions")
      .select("id, endpoint, p256dh, auth, subscription_json")
      .eq("user_id", targetUserId)
      .eq("is_active", true);

    if (subscriptionError) throw subscriptionError;

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0, skipped: true, reason: "no_active_subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);

    const payload = JSON.stringify({
      title,
      body: message,
      url: actionUrl,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      metadata: body.metadata || {},
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
          .update({
            last_success_at: new Date().toISOString(),
            failure_count: 0,
          })
          .eq("id", subscription.id);

        await supabaseAdmin.from("push_notification_deliveries").insert({
          user_id: targetUserId,
          subscription_id: subscription.id,
          notification_id: isUuid(body.notificationId) ? body.notificationId : null,
          status: "sent",
          sent_at: new Date().toISOString(),
          metadata: body.metadata || {},
        });
      } catch (error) {
        failed += 1;
        const statusCode = typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: number }).statusCode)
          : 0;

        await supabaseAdmin
          .from("web_push_subscriptions")
          .update({
            is_active: statusCode === 404 || statusCode === 410 ? false : true,
            last_failure_at: new Date().toISOString(),
            failure_count: 1,
          })
          .eq("id", subscription.id);

        await supabaseAdmin.from("push_notification_deliveries").insert({
          user_id: targetUserId,
          subscription_id: subscription.id,
          notification_id: isUuid(body.notificationId) ? body.notificationId : null,
          status: "failed",
          error_message: error instanceof Error ? error.message.slice(0, 300) : "Push send failed",
          metadata: {
            status_code: statusCode || null,
            ...(body.metadata || {}),
          },
        });
      }
    }

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "DISPATCH-PUSH-NOTIFICATION");
  }
});
