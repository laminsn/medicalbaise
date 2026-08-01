import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { timingSafeEqual } from "node:crypto";
import { authenticateRequest, AuthError, getCorsHeaders, parseRequestBody, serverRateLimit } from "./security.ts";

type Mode = "request" | "recover" | "staff-close" | "purge";
type Payload = { appContext?: string; reason?: string; immediate?: boolean; targetUserId?: string };
const APPS = new Set(["casa", "medical", "legal"]);
const DAY = 86_400_000;

function safeEqual(leftValue: string | null | undefined, rightValue: string | null | undefined) {
  const left = new TextEncoder().encode(leftValue || "");
  const right = new TextEncoder().encode(rightValue || "");
  return left.length === right.length && timingSafeEqual(left, right);
}

function response(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

function adminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Account lifecycle is not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function audit(admin: ReturnType<typeof adminClient>, values: Record<string, unknown>) {
  const { error } = await admin.from("account_deletion_audit").insert(values);
  if (error) throw error;
}

async function lifecycleEmail(admin: ReturnType<typeof adminClient>, userId: string, kind: "scheduled" | "winback" | "recovered" | "closed", purgeAt?: string, app = "casa", userDataOverride?: { user?: { email?: string } }) {
  const { data: userData } = userDataOverride ? { data: userDataOverride } : await admin.auth.admin.getUserById(userId);
  const email = userData.user?.email;
  if (!email) return;
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) { console.warn("[account-lifecycle] RESEND_API_KEY missing; email deferred"); return; }
  const origin = Deno.env.get("BAISE_PORTAL_URL") || "https://casabaise.com";
  const recover = `${origin}/auth?account=recover`;
  const date = purgeAt ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(purgeAt)) : "";
  const templates = {
    scheduled: { subject: "Sua conta Baise foi programada para encerramento", body: `Sua identidade compartilhada Casa, Medical e Legal Baise será encerrada em ${date}. Mudou de ideia? Você pode recuperar sua conta até essa data.` },
    winback: { subject: "Sua conta Baise ainda pode ser recuperada", body: `Sua conta continua no período de recuperação até ${date}. Se quiser voltar, recupere-a com um clique.` },
    recovered: { subject: "Sua conta Baise foi recuperada", body: "Sua identidade compartilhada Casa, Medical e Legal Baise está ativa novamente." },
    closed: { subject: "Sua conta Baise foi encerrada", body: "Sua conta foi encerrada. Registros exigidos por lei podem ser mantidos de forma minimizada pelo prazo aplicável, sujeito à confirmação jurídica de cada negócio." },
  }[kind];
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("ACCOUNT_EMAIL_FROM") || "Baise <contas@casabaise.com>", to: [email], subject: templates.subject, html: `<div style="font-family:Arial,sans-serif;max-width:600px"><h1>${templates.subject}</h1><p>${templates.body}</p>${kind === "scheduled" || kind === "winback" ? `<p><a href="${recover}">Recuperar minha conta</a></p>` : ""}<p>Contexto: ${app}.</p></div>` }) });
  await audit(admin, { user_id: userId, action: "email", app_context: app, metadata: { template: kind } });
}

async function requireStaff(admin: ReturnType<typeof adminClient>, actorId: string) {
  const { data } = await admin.from("user_roles").select("role").eq("user_id", actorId).in("role", ["admin", "moderator"]);
  if (!data?.length) throw new AuthError("Access denied", 403);
}

export function serveAccountLifecycle(mode: Mode) {
  Deno.serve(async (req) => {
    const headers = getCorsHeaders(req);
    if (req.method === "OPTIONS") return new Response(null, { headers });
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, headers);
    try {
      const admin = adminClient();
      if (mode === "purge") {
        const secret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        const expected = Deno.env.get("CRON_SECRET");
        if (!expected || !safeEqual(secret, expected)) throw new AuthError("Access denied", 401);
        if (!serverRateLimit("account-purge", 4, 60_000)) throw new AuthError("Too many requests", 429);
        const { data: due, error } = await admin.from("account_deletion_requests").select("id,user_id,app_context,requested_at,scheduled_purge_at,winback_days_sent").eq("status", "pending_deletion").limit(200);
        if (error) throw error;
        let purged = 0;
        for (const item of due || []) {
          if (new Date(item.scheduled_purge_at).getTime() > Date.now()) {
            const day = Math.floor((Date.now() - new Date(item.requested_at).getTime()) / DAY);
            if ([3, 21, 28].includes(day) && !(item.winback_days_sent || []).includes(day)) {
              await lifecycleEmail(admin, item.user_id, "winback", item.scheduled_purge_at, item.app_context || "casa");
              await admin.from("account_deletion_requests").update({ winback_days_sent: [...(item.winback_days_sent || []), day] }).eq("id", item.id).eq("status", "pending_deletion");
            }
            continue;
          }
          const { data: userData } = await admin.auth.admin.getUserById(item.user_id);
          const { error: anonymizeError } = await admin.rpc("anonymize_baise_identity_for_purge", { p_user_id: item.user_id });
          if (anonymizeError) { console.error("[account-purge] anonymization failed", item.id); continue; }
          const { error: deleteError } = await admin.auth.admin.deleteUser(item.user_id);
          if (deleteError) { await audit(admin, { request_id: item.id, user_id: item.user_id, action: "purge_failed", app_context: item.app_context, metadata: { identity_wide: true } }); console.error("[account-purge] auth deletion failed", item.id); continue; }
          await admin.from("profiles").update({ deletion_state: "purged", status: "purged" }).eq("user_id", item.user_id);
          await admin.from("account_deletion_requests").update({ status: "purged", purged_at: new Date().toISOString() }).eq("id", item.id);
          await lifecycleEmail(admin, item.user_id, "closed", undefined, item.app_context || "casa", userData);
          await audit(admin, { request_id: item.id, user_id: item.user_id, action: "purge", app_context: item.app_context, metadata: { identity_wide: true } });
          purged++;
        }
        return response({ processed: due?.length || 0, purged }, 200, headers);
      }

      const { user } = await authenticateRequest(req);
      if (!serverRateLimit(`account-${mode}:${user.id}`, mode === "recover" ? 10 : 5, 60 * 60_000)) throw new AuthError("Too many requests", 429);
      const body = await parseRequestBody<Payload>(req, 4096).catch(() => ({} as Payload));
      const app = APPS.has(String(body.appContext)) ? String(body.appContext) : "casa";

      if (mode === "request") {
        // Deliberately ignore targetUserId: self-service always uses authenticated user.id.
        const purgeAt = new Date(Date.now() + 30 * DAY).toISOString();
        const { data, error } = await admin.from("account_deletion_requests").insert({ user_id: user.id, status: "pending_deletion", initiated_by: "self", requested_at: new Date().toISOString(), scheduled_purge_at: purgeAt, created_by_user_id: user.id, app_context: app }).select("id,scheduled_purge_at").single();
        if (error) {
          if (error.code === "23505") return response({ status: "already_scheduled" }, 409, headers);
          throw error;
        }
        await admin.from("profiles").update({ deletion_state: "pending_deletion", status: "pending_deletion" }).eq("user_id", user.id);
        await audit(admin, { request_id: data.id, user_id: user.id, actor_id: user.id, action: "request", app_context: app, metadata: { identity_wide: true } });
        await lifecycleEmail(admin, user.id, "scheduled", data.scheduled_purge_at, app);
        return response({ status: "pending_deletion", scheduledPurgeAt: data.scheduled_purge_at, identityWide: true }, 200, headers);
      }

      if (mode === "recover") {
        const { data } = await admin.from("account_deletion_requests").select("id,scheduled_purge_at,app_context").eq("user_id", user.id).eq("status", "pending_deletion").gt("scheduled_purge_at", new Date().toISOString()).order("requested_at", { ascending: false }).limit(1).maybeSingle();
        if (!data) throw new AuthError("No recoverable account was found", 404);
        await admin.from("account_deletion_requests").update({ status: "recovered", recovered_at: new Date().toISOString() }).eq("id", data.id).eq("user_id", user.id);
        await admin.from("profiles").update({ deletion_state: "active", status: "active" }).eq("user_id", user.id);
        await audit(admin, { request_id: data.id, user_id: user.id, actor_id: user.id, action: "recover", app_context: data.app_context, metadata: { winback_cancelled: true } });
        await lifecycleEmail(admin, user.id, "recovered", undefined, data.app_context || app);
        return response({ status: "active" }, 200, headers);
      }

      await requireStaff(admin, user.id);
      if (!body.targetUserId || !/^[0-9a-f-]{36}$/i.test(body.targetUserId)) throw new AuthError("Invalid request", 400);
      const now = new Date(); const purgeAt = body.immediate ? now.toISOString() : new Date(now.getTime() + 30 * DAY).toISOString();
      const { data, error } = await admin.from("account_deletion_requests").insert({ user_id: body.targetUserId, status: "pending_deletion", initiated_by: "staff", reason: String(body.reason || "staff_closure").slice(0, 500), requested_at: now.toISOString(), scheduled_purge_at: purgeAt, immediate: Boolean(body.immediate), created_by_user_id: user.id, app_context: app }).select("id,scheduled_purge_at").single();
      if (error) {
        if (error.code === "23505") return response({ status: "already_scheduled" }, 409, headers);
        throw error;
      }
      await admin.from("profiles").update({ deletion_state: "pending_deletion", status: "pending_deletion" }).eq("user_id", body.targetUserId);
      await audit(admin, { request_id: data.id, user_id: body.targetUserId, actor_id: user.id, action: "staff_close", app_context: app, metadata: { immediate: Boolean(body.immediate), identity_wide: true } });
      if (body.immediate) {
        const { data: userData } = await admin.auth.admin.getUserById(body.targetUserId);
        const { error: anonymizeError } = await admin.rpc("anonymize_baise_identity_for_purge", { p_user_id: body.targetUserId });
        if (anonymizeError) throw anonymizeError;
        const { error: deleteError } = await admin.auth.admin.deleteUser(body.targetUserId);
        if (deleteError) { await audit(admin, { request_id: data.id, user_id: body.targetUserId, actor_id: user.id, action: "purge_failed", app_context: app, metadata: { immediate: true, identity_wide: true } }); throw deleteError; }
        await admin.from("profiles").update({ deletion_state: "purged", status: "purged" }).eq("user_id", body.targetUserId);
        await admin.from("account_deletion_requests").update({ status: "purged", purged_at: new Date().toISOString() }).eq("id", data.id);
        await lifecycleEmail(admin, body.targetUserId, "closed", undefined, app, userData);
        await audit(admin, { request_id: data.id, user_id: body.targetUserId, actor_id: user.id, action: "purge", app_context: app, metadata: { immediate: true, identity_wide: true } });
        return response({ status: "purged", immediate: true }, 200, headers);
      }
      await lifecycleEmail(admin, body.targetUserId, "scheduled", data.scheduled_purge_at, app);
      return response({ status: "pending_deletion", scheduledPurgeAt: data.scheduled_purge_at, immediate: false }, 200, headers);
    } catch (error) {
      const status = error instanceof AuthError ? error.status : 500;
      if (!(error instanceof AuthError)) console.error(`[account-${mode}]`, error instanceof Error ? error.message : "failed");
      return response({ error: error instanceof AuthError ? error.message : "Unable to process account request" }, status, headers);
    }
  });
}
