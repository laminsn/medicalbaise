// Pilot tester confirmation email.
//
// Fires when someone submits the /pilot application. Confirms receipt, restates
// the three undertakings they just accepted, and tells them what happens next.
// Sent in the language they filled the form in -- consent they could read
// should be confirmed in the language they read it in.
//
// Required secret: RESEND_API_KEY.
// Deployed with verify_jwt = false because the pilot form is public.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AppKey = "casa" | "medical" | "legal";
type Locale = "pt" | "es" | "en";

const BRANDS: Record<AppKey, { name: string; url: string; color: string; from: string; support: string }> = {
  casa: {
    name: "Casa Baise",
    url: "https://www.casabaise.com",
    color: "#1dbf73",
    from: "Casa Baise <support@support.casabaise.com>",
    support: "support@casabaise.com",
  },
  medical: {
    name: "Medical Baise",
    url: "https://www.mdbaise.com",
    color: "#00b8d4",
    from: "Medical Baise <support@support.mdbaise.com>",
    support: "support@casabaise.com",
  },
  legal: {
    name: "Legal Baise",
    url: "https://www.legalbaise.com",
    color: "#7c3aed",
    // legalbaise.com is not a verified Resend domain, so mail from it 403s.
    // Sent from the verified Baise sender with Legal Baise as the display name
    // until the DNS records for legalbaise.com are added and verified.
    from: "Legal Baise <support@support.casabaise.com>",
    support: "support@casabaise.com",
  },
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function copyFor(locale: Locale, brand: typeof BRANDS.casa, name: string) {
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
      cta: "Ver as regras do piloto",
      footer: `Dúvidas? Responda este e-mail ou escreva para ${brand.support}.`,
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
      cta: "Ver las reglas del piloto",
      footer: `¿Dudas? Responde a este correo o escribe a ${brand.support}.`,
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
    cta: "Read the pilot rules",
    footer: `Questions? Reply to this email or write to ${brand.support}.`,
    sig: "The Baise team",
  };
}

function buildHtml(brand: typeof BRANDS.casa, c: ReturnType<typeof copyFor>, locale: Locale) {
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

          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111111;">${escapeHtml(c.rulesTitle)}</p>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:15px;color:#334155;">${rules}</ul>

          <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#111111;">${escapeHtml(c.nextTitle)}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#334155;">${escapeHtml(c.next)}</p>

          <div style="text-align:center;margin:32px 0 8px;">
            <a href="${brand.url}/pilot" style="display:inline-block;background:${brand.color};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">${escapeHtml(c.cta)}</a>
          </div>
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: brand.from,
        to: [email],
        subject: c.subject,
        html: buildHtml(brand, c, locale),
      }),
    });

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
