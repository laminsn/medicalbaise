// Pilot tester confirmation email.
//
// Fires when someone submits the /pilot application. Confirms receipt, restates
// the three undertakings they just accepted, and tells them what happens next.
// Sent in the language they filled the form in -- consent they could read
// should be confirmed in the language they read it in.
//
// Required secret: RESEND_API_KEY.
// Deployed with verify_jwt = false because the pilot form is public.

import { APP_BRANDS, type AppBrand, type AppKey, reportResendFailure } from "../_shared/brands.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Random token, stored only as a SHA-256 hash. 32 bytes is far past guessing
// range, so no salt or pepper management is needed -- the token itself is the
// secret and it exists in exactly two places: the applicant's inbox, and
// nowhere else.
async function mintToken() {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...raw))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  return { token, hash };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Locale = "pt" | "es" | "en";

const BRANDS = APP_BRANDS;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function copyFor(locale: Locale, brand: AppBrand, name: string) {
  const first = (name || "").trim().split(/\s+/)[0] || "";
  if (locale === "pt") {
    return {
      subject: `Recebemos sua inscrição — piloto ${brand.name}`,
      eyebrow: "Programa piloto de testadores",
      heading: first ? `Obrigado, ${first}!` : "Inscrição recebida!",
      intro: `Recebemos sua inscrição para testar o ${brand.name} antes do lançamento. Vamos analisar cada inscrição individualmente e responder pelo e-mail que você informou.`,
      rulesTitle: "O que você aceitou",
      rules: [
        "Usar apenas dados fictícios — nada de informações de pessoas reais.",
        "Nenhum dinheiro real se movimenta. Faturas e saldos que você vir são simulados.",
        "Ao final dos 60 dias sua conta é desativada e o conteúdo do teste é removido.",
      ],
      nextTitle: "O que acontece agora",
      next: "Se você for selecionado, enviaremos seu código de acesso individual por e-mail. O código é de uso único e vale só para você.",
      confirmTitle: "Primeiro: confirme seu e-mail",
      confirmBody: "Clique no bot\u00e3o abaixo para confirmar que este endere\u00e7o \u00e9 seu. S\u00f3 enviamos c\u00f3digos de acesso para e-mails confirmados \u2014 assim ningu\u00e9m se inscreve no seu lugar.",
      cta: "Confirmar meu e-mail",
      ctaNote: "O link vale por 7 dias.",
      ignore: "Se voc\u00ea n\u00e3o se inscreveu, ignore este e-mail \u2014 nada acontece sem a confirma\u00e7\u00e3o.",
      footer: `Dúvidas? Responda este e-mail ou escreva para ${brand.supportEmail}.`,
      sig: "Equipe Baise",
    };
  }
  if (locale === "es") {
    return {
      subject: `Recibimos tu inscripción — piloto de ${brand.name}`,
      eyebrow: "Programa piloto de probadores",
      heading: first ? `¡Gracias, ${first}!` : "¡Inscripción recibida!",
      intro: `Recibimos tu inscripción para probar ${brand.name} antes del lanzamiento. Revisaremos cada inscripción individualmente y te responderemos al correo que nos diste.`,
      rulesTitle: "Lo que aceptaste",
      rules: [
        "Usar solo datos ficticios — nada de información de personas reales.",
        "No se mueve dinero real. Las facturas y saldos que veas son simulados.",
        "Al final de los 60 días tu cuenta se desactiva y el contenido de prueba se elimina.",
      ],
      nextTitle: "Qué pasa ahora",
      next: "Si eres seleccionado, te enviaremos tu código de acceso individual por correo. El código es de un solo uso y sirve solo para ti.",
      confirmTitle: "Primero: confirma tu correo",
      confirmBody: "Haz clic en el bot\u00f3n de abajo para confirmar que esta direcci\u00f3n es tuya. Solo enviamos c\u00f3digos de acceso a correos confirmados \u2014 as\u00ed nadie se inscribe en tu lugar.",
      cta: "Confirmar mi correo",
      ctaNote: "El enlace vale por 7 d\u00edas.",
      ignore: "Si no te inscribiste, ignora este correo \u2014 nada ocurre sin la confirmaci\u00f3n.",
      footer: `¿Dudas? Responde a este correo o escribe a ${brand.supportEmail}.`,
      sig: "Equipo Baise",
    };
  }
  return {
    subject: `We got your application — ${brand.name} pilot`,
    eyebrow: "Pilot tester programme",
    heading: first ? `Thank you, ${first}!` : "Application received!",
    intro: `We received your application to test ${brand.name} before launch. We review every application individually and will reply at the email you gave us.`,
    rulesTitle: "What you accepted",
    rules: [
      "Use fictitious data only — nothing belonging to a real person.",
      "No real money moves. Any invoice or balance you see is simulated.",
      "After 60 days your account is deactivated and the test content is removed.",
    ],
    nextTitle: "What happens next",
    next: "If you are selected we will email you your individual access code. The code is single-use and tied to you alone.",
    confirmTitle: "First: confirm your email",
    confirmBody: "Click the button below to confirm this address is yours. We only send access codes to confirmed addresses \u2014 so nobody can apply in your name.",
    cta: "Confirm my email",
    ctaNote: "The link is valid for 7 days.",
    ignore: "If you did not apply, ignore this email \u2014 nothing happens without the confirmation.",
    footer: `Questions? Reply to this email or write to ${brand.supportEmail}.`,
    sig: "The Baise team",
  };
}

function buildHtml(brand: AppBrand, c: ReturnType<typeof copyFor>, locale: Locale, confirmUrl: string) {
  const rules = c.rules
    .map((r) => `<li style="margin:0 0 10px;">${escapeHtml(r)}</li>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:${brand.color};padding:24px 32px;color:#ffffff;">
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">${escapeHtml(c.eyebrow)}</p>
          <h1 style="margin:0;font-size:24px;font-weight:700;">${escapeHtml(brand.name)}</h1>
        </td></tr>
        <tr><td style="padding:32px;color:#111111;line-height:1.6;">
          <h2 style="margin:0 0 16px;font-size:22px;">${escapeHtml(c.heading)}</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#334155;">${escapeHtml(c.intro)}</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111111;">${escapeHtml(c.confirmTitle)}</p>
              <p style="margin:0 0 18px;font-size:14px;color:#475569;">${escapeHtml(c.confirmBody)}</p>
              <a href="${confirmUrl}" style="display:inline-block;background:${brand.color};color:#ffffff;text-decoration:none;padding:13px 26px;border-radius:8px;font-weight:600;font-size:16px;">${escapeHtml(c.cta)}</a>
              <p style="margin:14px 0 0;font-size:12px;color:#94a3b8;">${escapeHtml(c.ctaNote)}</p>
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111111;">${escapeHtml(c.rulesTitle)}</p>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;color:#334155;">${rules}</ul>

          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111111;">${escapeHtml(c.nextTitle)}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#334155;">${escapeHtml(c.next)}</p>

          <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">${escapeHtml(c.ignore)}</p>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #e5e7eb;color:#64748b;font-size:13px;">
          <p style="margin:0 0 6px;">${escapeHtml(c.footer)}</p>
          <p style="margin:0;">${escapeHtml(c.sig)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    if (!RESEND_API_KEY) {
      console.error("[send-pilot-confirmation] RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ ok: false, error: "EMAIL_NOT_CONFIGURED" }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const name = String(body?.name || "").trim().slice(0, 120);
    const appKey = (["casa", "medical", "legal"].includes(String(body?.app_key))
      ? String(body.app_key) : "casa") as AppKey;
    const rawLocale = String(body?.locale || "pt").toLowerCase();
    const locale: Locale = rawLocale.startsWith("es") ? "es" : rawLocale.startsWith("en") ? "en" : "pt";

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ ok: false, error: "INVALID_EMAIL" }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const brand = BRANDS[appKey];
    const c = copyFor(locale, brand, name);

    // Attach a fresh confirmation token to the most recent application from
    // this address on this app. Re-applying supersedes the previous token,
    // which is the behaviour you want: the newest email is the live one.
    const { token, hash } = await mintToken();
    const patch = await fetch(
      `${SUPABASE_URL}/rest/v1/pilot_applications?app_key=eq.${encodeURIComponent(appKey)}` +
      `&email=eq.${encodeURIComponent(email)}&email_confirmed_at=is.null`,
      {
        method: "PATCH",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          email_confirm_token_hash: hash,
          email_confirm_sent_at: new Date().toISOString(),
          email_confirm_expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
        }),
      },
    );
    if (!patch.ok) {
      // Send nothing rather than send a link that cannot work. A dead button
      // in a confirmation email is worse than no email: it reads as a broken
      // product at the applicant's very first contact with it.
      const detail = await patch.text();
      console.error("[send-pilot-confirmation] token write failed", patch.status, detail);
      return new Response(JSON.stringify({ ok: false, error: "TOKEN_WRITE_FAILED" }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Locale and app ride along on the link purely so the landing page can render
    // in the right language and brand. The token is what authorises the
    // confirmation, so tampering with these only changes what the clicker sees.
    const confirmUrl = `${SUPABASE_URL}/functions/v1/confirm-pilot-email` +
      `?t=${encodeURIComponent(token)}&l=${locale}&a=${appKey}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: brand.from,
        to: [email],
        subject: c.subject,
        html: buildHtml(brand, c, locale, confirmUrl),
      }),
    });

    await reportResendFailure(res, brand.from, "send-pilot-confirmation");

    if (!res.ok) {
      const detail = await res.text();
      console.error("[send-pilot-confirmation] resend failed", res.status, detail);
      return new Response(JSON.stringify({ ok: false, error: "SEND_FAILED" }),
        { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }),
      { headers: { ...CORS, "Content-Type": "application/json" } });
  } catch (e) {
    // Never fail the caller: the application is already saved, the email is a courtesy.
    console.error("[send-pilot-confirmation]", e);
    return new Response(JSON.stringify({ ok: false, error: "UNEXPECTED" }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
