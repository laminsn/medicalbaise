// Branded welcome email for new auth users.
// Configure as a Supabase Database Webhook on INSERT into auth.users.
// Required secrets: RESEND_API_KEY and WELCOME_HOOK_SECRET.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { APP_BRANDS, type AppBrand, type AppKey, reportResendFailure } from "../_shared/brands.ts";
import { getOrCreateUnsubscribeToken, unsubscribeFooter } from "../_shared/email-consent.ts";
import { escapeHtml } from "../_shared/security.ts";

type LocaleKey = "en" | "es" | "pt";
type Audience = "client" | "provider";

interface AuthUsersInsertPayload {
  type: "INSERT";
  table: "users";
  schema: "auth";
  record: {
    id: string;
    email: string | null;
    raw_user_meta_data?: {
      first_name?: string;
      last_name?: string;
      full_name?: string;
      name?: string;
      languages?: string[];
      app_key?: string;
      signup_app?: string;
      signup_url?: string;
      signup_intent?: string;
      user_type?: string;
      account_type?: string;
    } | null;
  };
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const WELCOME_HOOK_SECRET = Deno.env.get("WELCOME_HOOK_SECRET");

function pickAppKey(meta: AuthUsersInsertPayload["record"]["raw_user_meta_data"]): AppKey {
  const raw = String(meta?.app_key || meta?.signup_app || Deno.env.get("BAISE_APP_KEY") || "casa").toLowerCase();
  if (raw === "medical" || raw === "legal" || raw === "casa") return raw;
  const signupUrl = String(meta?.signup_url || "").toLowerCase();
  if (signupUrl.includes("medical")) return "medical";
  if (signupUrl.includes("legal")) return "legal";
  return "casa";
}

function pickLanguage(langs?: string[]): LocaleKey {
  const first = langs?.[0]?.toLowerCase() || "";
  if (first.startsWith("es") || first.includes("spanish")) return "es";
  if (first.startsWith("pt") || first.includes("portuguese")) return "pt";
  return "en";
}

function pickAudience(meta: AuthUsersInsertPayload["record"]["raw_user_meta_data"]): Audience {
  const raw = String(meta?.signup_intent || meta?.user_type || meta?.account_type || "").toLowerCase();
  return raw.includes("provider") || raw.includes("service") ? "provider" : "client";
}

function pickFirstName(meta: AuthUsersInsertPayload["record"]["raw_user_meta_data"]): string {
  if (!meta) return "";
  if (meta.first_name) return meta.first_name;
  const fullName = meta.full_name || meta.name || "";
  return fullName.split(" ")[0] || "";
}

function getCopy(locale: LocaleKey, audience: Audience, brand: AppBrand, firstName: string) {
  const name = firstName.trim();
  const greeting = locale === "pt"
    ? name ? `Oi ${name}` : "Bem-vindo"
    : locale === "es"
      ? name ? `Hola ${name}` : "Bienvenido"
      : name ? `Hi ${name}` : "Welcome";

  if (audience === "provider") {
    if (locale === "pt") {
      return {
        subject: `Bem-vindo ao ${brand.name}`,
        heading: `${greeting}, seu espaco de prestador esta pronto`,
        body: `Use o ${brand.name} para gerenciar solicitações, clientes, orçamentos, reservas, faturas, pagamentos, assinaturas, campanhas, avaliações, recibos e histórico de serviços em um só portal.`,
        cta: "Abrir portal do prestador",
      };
    }
    if (locale === "es") {
      return {
        subject: `Bienvenido a ${brand.name}`,
        heading: `${greeting}, tu espacio de proveedor esta listo`,
        body: `Usa ${brand.name} para gestionar solicitudes, clientes, presupuestos, reservas, facturas, pagos, firmas, campanas, reseñas, recibos e historial de servicios en un solo portal.`,
        cta: "Abrir portal de proveedor",
      };
    }
    return {
      subject: `Welcome to ${brand.name}`,
      heading: `${greeting}, your provider workspace is ready`,
      body: `Use ${brand.name} to manage requests, clients, quotes, bookings, invoices, payments, signatures, campaigns, reviews, receipts, and service history from one portal.`,
      cta: "Open provider portal",
    };
  }

  if (locale === "pt") {
    return {
      subject: `Bem-vindo ao ${brand.name}`,
      heading: `${greeting}, sua conta esta pronta`,
      body: `Use o ${brand.name} para encontrar ${brand.category}, enviar solicitações, acompanhar orçamentos, pagar com segurança e manter faturas, recibos e histórico de serviços em um só lugar.`,
      cta: "Encontrar prestadores",
    };
  }

  if (locale === "es") {
    return {
      subject: `Bienvenido a ${brand.name}`,
      heading: `${greeting}, tu cuenta esta lista`,
      body: `Usa ${brand.name} para encontrar ${brand.category}, enviar solicitudes, revisar presupuestos, pagar de forma segura y mantener facturas, recibos e historial de servicios en un solo lugar.`,
      cta: "Encontrar proveedores",
    };
  }

  return {
    subject: `Welcome to ${brand.name}`,
    heading: `${greeting}, your account is ready`,
    body: `Use ${brand.name} to find ${brand.category}, send requests, review quotes, pay securely, and keep invoices, receipts, and service history in one place.`,
    cta: "Find providers",
  };
}

function buildEmail(brand: AppBrand, copy: ReturnType<typeof getCopy>, locale: LocaleKey, consentFooter: string) {
  const portalLabel = locale === "pt" ? "Portal seguro Baise" : locale === "es" ? "Portal seguro Baise" : "Secure Baise portal";

  return `
<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:${brand.color};padding:24px 32px;color:#ffffff;">
          <h1 style="margin:0;font-size:24px;font-weight:700;">${escapeHtml(brand.name)}</h1>
          <p style="margin:4px 0 0;font-size:14px;opacity:0.92;">${escapeHtml(portalLabel)}</p>
        </td></tr>
        <tr><td style="padding:32px;color:#111111;line-height:1.6;">
          <h2 style="margin:0 0 16px;font-size:22px;">${escapeHtml(copy.heading)}</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#334155;">${escapeHtml(copy.body)}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${brand.url}" style="display:inline-block;background:${brand.color};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">${escapeHtml(copy.cta)}</a>
          </div>
          <p style="margin:24px 0 0;font-size:13px;color:#64748b;">
            ${escapeHtml(brand.name)} keeps requests, messages, payments, receipts, documents, and service records connected inside the portal.
          </p>
        </td></tr>
        <tr><td style="background:#f7f7f7;padding:16px 32px;font-size:12px;color:#888888;text-align:center;">
          ${escapeHtml(brand.name)} · ${escapeHtml(brand.domain)}
          ${consentFooter}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", Allow: "POST, OPTIONS" },
    });
  }

  if (!RESEND_API_KEY || !WELCOME_HOOK_SECRET) {
    console.error("[send-welcome-email] Missing RESEND_API_KEY or WELCOME_HOOK_SECRET");
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader !== `Bearer ${WELCOME_HOOK_SECRET}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: AuthUsersInsertPayload;
  try {
    payload = (await req.json()) as AuthUsersInsertPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (payload?.type !== "INSERT" || payload?.schema !== "auth" || payload?.table !== "users") {
    return new Response(JSON.stringify({ error: "Unexpected payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = payload.record?.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ skipped: "no valid email" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const meta = payload.record.raw_user_meta_data;
  const appKey = pickAppKey(meta);
  const brand = APP_BRANDS[appKey];
  const locale = pickLanguage(meta?.languages);
  const audience = pickAudience(meta);
  const copy = getCopy(locale, audience, brand, pickFirstName(meta));
  let consentFooter = "";
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
      { auth: { persistSession: false } },
    );
    const token = await getOrCreateUnsubscribeToken(admin, email, appKey);
    consentFooter = unsubscribeFooter(token, brand, locale, "transactional");
  } catch (error) {
    console.error("[send-welcome-email] Preference link unavailable; continuing transactional send", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: brand.from,
      to: [email],
      subject: copy.subject,
      html: buildEmail(brand, copy, locale, consentFooter),
    }),
  });

  await reportResendFailure(res, brand.from, "send-welcome-email");

  if (!res.ok) {
    const body = await res.text();
    console.error("[send-welcome-email] Resend error:", res.status, body);
    return new Response(JSON.stringify({ error: "Send failed" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await res.json();
  return new Response(JSON.stringify({ ok: true, id: data?.id, appKey, audience, locale }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
