import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { APP_BRANDS, type AppBrand, reportResendFailure } from "../_shared/brands.ts";
import {
  authenticateRequest,
  createErrorResponse,
  escapeHtml,
  getCorsHeaders,
  rejectNonPostMethod,
} from "../_shared/security.ts";

type ReferralEmailBody = {
  recipientEmail?: string;
  referralLink?: string;
  appKey?: "casa" | "medical" | "legal";
  locale?: "en" | "es" | "pt";
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeAppKey = (value?: string) => {
  if (value === "medical" || value === "legal" || value === "casa") return value;
  const fromEnv = Deno.env.get("BAISE_APP_KEY");
  if (fromEnv === "medical" || fromEnv === "legal" || fromEnv === "casa") return fromEnv;
  return "casa";
};

const normalizeLocale = (value?: string) => {
  if (value === "es" || value === "pt" || value === "en") return value;
  return "en";
};

const safeReferralUrl = (value: string | undefined, fallback: string) => {
  try {
    const url = new URL(value || fallback);
    if (url.protocol !== "https:") return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
};

function getCopy(locale: "en" | "es" | "pt", brandName: string, senderName: string) {
  if (locale === "pt") {
    return {
      subject: `${senderName} convidou você para ${brandName}`,
      heading: "Encontre profissionais confiáveis ou cresca seu negócio",
      body: `${senderName} enviou um convite para ${brandName}. Use a plataforma para encontrar prestadores verificados, gerenciar pedidos, pagamentos, faturas, recibos e histórico de serviços em um só lugar.`,
      cta: "Abrir convite",
      footer: "Este convite foi enviado por um usuário Baise.",
    };
  }

  if (locale === "es") {
    return {
      subject: `${senderName} te invito a ${brandName}`,
      heading: "Encuentra proveedores confiables o haz crecer tu negocio",
      body: `${senderName} te envio una invitacion para ${brandName}. Usa la plataforma para encontrar proveedores verificados, gestionar solicitudes, pagos, facturas, recibos e historial de servicios en un solo lugar.`,
      cta: "Abrir invitacion",
      footer: "Esta invitación fue enviada por un usuario de Baise.",
    };
  }

  return {
    subject: `${senderName} invited you to ${brandName}`,
    heading: "Find trusted providers or grow your service business",
    body: `${senderName} sent you an invite to ${brandName}. Use the platform to find verified providers, manage requests, payments, invoices, receipts, and service history in one place.`,
    cta: "Open invite",
    footer: "This invite was sent by a Baise user.",
  };
}

function buildEmailHtml(
  brand: AppBrand,
  copy: ReturnType<typeof getCopy>,
  referralUrl: string,
) {
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
          <p style="margin:4px 0 0;font-size:14px;opacity:0.92;">Trusted service marketplace and provider workspace</p>
        </td></tr>
        <tr><td style="padding:32px;color:#111111;line-height:1.6;">
          <h2 style="margin:0 0 16px;font-size:22px;">${escapeHtml(copy.heading)}</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#334155;">${escapeHtml(copy.body)}</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${referralUrl}" style="display:inline-block;background:${brand.color};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">${escapeHtml(copy.cta)}</a>
          </div>
          <p style="margin:24px 0 0;font-size:13px;color:#64748b;">${escapeHtml(copy.footer)}</p>
        </td></tr>
        <tr><td style="background:#f7f7f7;padding:16px 32px;font-size:12px;color:#888888;text-align:center;">
          ${escapeHtml(brand.name)} · ${escapeHtml(brand.domain)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user, token } = await authenticateRequest(req);
    const body = (await req.json()) as ReferralEmailBody;
    const recipientEmail = String(body.recipientEmail || "").trim().toLowerCase();

    if (!emailRegex.test(recipientEmail)) {
      return new Response(JSON.stringify({ error: "A valid recipient email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (recipientEmail === user.email.toLowerCase()) {
      return new Response(JSON.stringify({ error: "You cannot send a referral invite to your own email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appKey = normalizeAppKey(body.appKey);
    const locale = normalizeLocale(body.locale);
    const brand = APP_BRANDS[appKey];
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("first_name,last_name,email,referral_code,user_type")
      .eq("user_id", user.id)
      .maybeSingle();

    const referralCode = profile?.referral_code || `REF${user.id.slice(0, 6).toUpperCase()}`;
    const senderName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "A Baise member";
    const referralUrl = safeReferralUrl(body.referralLink, `${brand.url}/ref/${encodeURIComponent(referralCode)}`);
    const copy = getCopy(locale, brand.name, senderName);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: brand.from,
        to: [recipientEmail],
        subject: copy.subject,
        html: buildEmailHtml(brand, copy, referralUrl),
      }),
    });

    await reportResendFailure(res, brand.from, "send-referral-email");

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Referral email send failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sendResult = await res.json();

    const referralType = profile?.user_type === "provider" ? "provider" : "customer";
    const referralMetadata = {
      app_key: appKey,
      referral_url: referralUrl,
      resend_id: sendResult?.id || null,
      source: "send_referral_email",
    };
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      },
    );

    const { error: referralRpcError } = await supabaseUser.rpc("track_referral_invite", {
      target_referrer_id: user.id,
      target_referral_code: referralCode,
      target_referred_email: recipientEmail,
      target_referral_type: referralType,
      target_metadata: referralMetadata,
    });

    if (referralRpcError) {
      console.warn("[SEND-REFERRAL-EMAIL] Referral RPC failed, falling back to direct insert:", referralRpcError.message);
      await supabaseAdmin.from("referrals").insert({
        referrer_id: user.id,
        referral_code: referralCode,
        referral_type: referralType,
        status: "pending",
        referred_email: recipientEmail,
        credit_amount: referralType === "provider" ? 100 : 20,
        metadata: referralMetadata,
      });
    }

    return new Response(JSON.stringify({ ok: true, id: sendResult?.id || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "SEND-REFERRAL-EMAIL");
  }
});
