// Pilot application email confirmation — the landing point of the button in
// the confirmation email.
//
// Answers a GET from a mail client: no session, no JS, no Supabase client on
// the page. So this returns a finished HTML page rather than JSON, branded per
// app and written in the language the applicant filled the form in.
//
// Deployed with verify_jwt = false: the caller is an anonymous click.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type AppKey = "casa" | "medical" | "legal";
type Locale = "pt" | "es" | "en";

const BRANDS: Record<AppKey, { name: string; url: string; color: string }> = {
  casa: { name: "Casa Baise", url: "https://www.casabaise.com", color: "#1dbf73" },
  medical: { name: "MD Baise", url: "https://www.mdbaise.com", color: "#00b8d4" },
  legal: { name: "Legal Baise", url: "https://www.legalbaise.com", color: "#7c3aed" },
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

type Outcome = "CONFIRMED" | "ALREADY_CONFIRMED_OR_INVALID" | "EXPIRED" | "INVALID_TOKEN";

function copyFor(locale: Locale, outcome: Outcome, name: string) {
  const first = (name || "").trim().split(/\s+/)[0] || "";
  const T = {
    pt: {
      CONFIRMED: {
        icon: "✓",
        title: first ? `E-mail confirmado, ${first}!` : "E-mail confirmado!",
        body: "Pronto. Sua inscrição está completa e seu endereço está verificado. Se você for selecionado, seu código de acesso individual chega neste mesmo e-mail.",
        cta: "Voltar ao site",
      },
      ALREADY_CONFIRMED_OR_INVALID: {
        icon: "✓",
        title: "Este link já foi usado",
        body: "Se você já clicou antes, está tudo certo — seu e-mail já está confirmado e não é preciso fazer mais nada. Se você nunca clicou, inscreva-se novamente para receber um link novo.",
        cta: "Ir para a inscrição",
      },
      EXPIRED: {
        icon: "⏱",
        title: "Este link expirou",
        body: "Links de confirmação valem 7 dias. Faça a inscrição de novo com o mesmo e-mail e enviaremos um link novo na hora.",
        cta: "Inscrever-se de novo",
      },
      INVALID_TOKEN: {
        icon: "⚠",
        title: "Link inválido",
        body: "Não conseguimos ler este link de confirmação. Ele pode ter sido cortado pelo seu programa de e-mail. Tente copiar o endereço inteiro, ou inscreva-se de novo.",
        cta: "Ir para a inscrição",
      },
    },
    es: {
      CONFIRMED: {
        icon: "✓",
        title: first ? `¡Correo confirmado, ${first}!` : "¡Correo confirmado!",
        body: "Listo. Tu inscripción está completa y tu dirección queda verificada. Si eres seleccionado, tu código de acceso individual llegará a este mismo correo.",
        cta: "Volver al sitio",
      },
      ALREADY_CONFIRMED_OR_INVALID: {
        icon: "✓",
        title: "Este enlace ya se usó",
        body: "Si ya hiciste clic antes, todo está bien — tu correo ya está confirmado y no hay nada más que hacer. Si nunca hiciste clic, inscríbete de nuevo para recibir un enlace nuevo.",
        cta: "Ir a la inscripción",
      },
      EXPIRED: {
        icon: "⏱",
        title: "Este enlace venció",
        body: "Los enlaces de confirmación duran 7 días. Inscríbete otra vez con el mismo correo y te enviaremos un enlace nuevo al instante.",
        cta: "Inscribirse de nuevo",
      },
      INVALID_TOKEN: {
        icon: "⚠",
        title: "Enlace no válido",
        body: "No pudimos leer este enlace de confirmación. Puede que tu programa de correo lo haya cortado. Copia la dirección completa o inscríbete de nuevo.",
        cta: "Ir a la inscripción",
      },
    },
    en: {
      CONFIRMED: {
        icon: "✓",
        title: first ? `Email confirmed, ${first}!` : "Email confirmed!",
        body: "Done. Your application is complete and your address is verified. If you are selected, your individual access code arrives at this same address.",
        cta: "Back to the site",
      },
      ALREADY_CONFIRMED_OR_INVALID: {
        icon: "✓",
        title: "This link has already been used",
        body: "If you clicked it before, you are all set — your email is confirmed and there is nothing else to do. If you never clicked it, apply again to get a fresh link.",
        cta: "Go to the application",
      },
      EXPIRED: {
        icon: "⏱",
        title: "This link has expired",
        body: "Confirmation links last 7 days. Apply again with the same address and we will send a new link straight away.",
        cta: "Apply again",
      },
      INVALID_TOKEN: {
        icon: "⚠",
        title: "Invalid link",
        body: "We could not read this confirmation link. Your mail client may have wrapped it. Try copying the whole address, or apply again.",
        cta: "Go to the application",
      },
    },
  } as const;
  return T[locale][outcome];
}

function page(appKey: AppKey, locale: Locale, outcome: Outcome, name: string) {
  const brand = BRANDS[appKey];
  const c = copyFor(locale, outcome, name);
  const good = outcome === "CONFIRMED" || outcome === "ALREADY_CONFIRMED_OR_INVALID";
  const accent = good ? brand.color : "#b45309";
  const href = outcome === "CONFIRMED" ? brand.url : `${brand.url}/pilot`;
  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>${escapeHtml(c.title)} — ${escapeHtml(brand.name)}</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
           padding:24px; background:#0b0f0e; color:#e2e8f0;
           font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; }
    .card { width:100%; max-width:520px; background:#12181a; border:1px solid #1f2937;
            border-radius:16px; padding:40px 32px; text-align:center; }
    .mark { display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px;
            border-radius:16px; background:${accent}; color:#fff; font-size:28px; font-weight:700;
            margin-bottom:24px; }
    h1 { margin:0 0 14px; font-size:24px; line-height:1.25; color:#f8fafc; }
    p  { margin:0 0 28px; font-size:16px; line-height:1.65; color:#94a3b8; }
    a.btn { display:inline-block; background:${brand.color}; color:#fff; text-decoration:none;
            padding:14px 30px; border-radius:10px; font-weight:600; font-size:16px; }
    .brand { margin-top:28px; font-size:13px; color:#475569; }
    @media (prefers-color-scheme: light) {
      body { background:#f7f7f7; color:#0f172a; }
      .card { background:#fff; border-color:#e2e8f0; }
      h1 { color:#0f172a; } p { color:#475569; } .brand { color:#94a3b8; }
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="mark">${c.icon}</div>
    <h1>${escapeHtml(c.title)}</h1>
    <p>${escapeHtml(c.body)}</p>
    <a class="btn" href="${href}">${escapeHtml(c.cta)}</a>
    <div class="brand">${escapeHtml(brand.name)}</div>
  </main>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const hintLocale = String(url.searchParams.get("l") || "");
  const hintApp = String(url.searchParams.get("a") || "");

  let outcome: Outcome = "INVALID_TOKEN";
  let appKey: AppKey = (["casa", "medical", "legal"].includes(hintApp) ? hintApp : "casa") as AppKey;
  let locale: Locale = hintLocale === "es" ? "es" : hintLocale === "en" ? "en" : "pt";
  let name = "";

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/confirm_pilot_application_email`, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_token: token }),
    });
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (row?.outcome) {
      outcome = row.outcome as Outcome;
      if (["casa", "medical", "legal"].includes(row.app_key)) appKey = row.app_key;
      if (!hintLocale) {
        const l = String(row.locale || "pt");
        locale = l.startsWith("es") ? "es" : l.startsWith("en") ? "en" : "pt";
      }
      name = row.full_name || "";
    }
  } catch (e) {
    console.error("[confirm-pilot-email]", e);
  }

  // Always 200 with a readable page. A status code is invisible to someone who
  // clicked a link in their inbox; the page is the entire interface.
  return new Response(page(appKey, locale, outcome, name), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
});
