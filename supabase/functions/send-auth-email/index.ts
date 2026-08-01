import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

type AppKey = "casa" | "medical" | "legal";
type ActionType =
  | "signup" | "recovery" | "invite" | "magiclink" | "email"
  | "email_change" | "email_change_current" | "email_change_new"
  | "reauthentication" | "password_changed_notification"
  | "email_changed_notification" | "phone_changed_notification"
  | "identity_linked_notification" | "identity_unlinked_notification"
  | "mfa_factor_enrolled_notification" | "mfa_factor_unenrolled_notification";

type HookPayload = {
  user: { email: string; new_email?: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: ActionType;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
    old_email?: string;
    old_phone?: string;
    provider?: string;
    factor_type?: string;
  };
};

type Brand = {
  name: string;
  domain: string;
  origin: string;
  hosts: readonly string[];
  color: string;
  colorDark: string;
  from: string;
  supportEmail: string;
};

const BRANDS: Record<AppKey, Brand> = {
  casa: {
    name: "Casa Baise",
    domain: "casabaise.com",
    origin: "https://www.casabaise.com",
    hosts: ["casabaise.com", "www.casabaise.com"],
    color: "#1dbf73",
    colorDark: "#047857",
    from: "Casa Baise Security <support@support.casabaise.com>",
    supportEmail: "support@casabaise.com",
  },
  medical: {
    name: "Medical Baise",
    domain: "mdbaise.com",
    origin: "https://www.mdbaise.com",
    hosts: ["mdbaise.com", "www.mdbaise.com", "medicalbaise.com", "www.medicalbaise.com"],
    color: "#00b8d4",
    colorDark: "#087b8c",
    from: "Medical Baise Security <support@support.mdbaise.com>",
    supportEmail: "support@mdbaise.com",
  },
  legal: {
    name: "Legal Baise",
    domain: "legalbaise.com",
    origin: "https://www.legalbaise.com",
    hosts: ["legalbaise.com", "www.legalbaise.com"],
    color: "#7c3aed",
    colorDark: "#5b21b6",
    from: "Legal Baise Security <support@legalbaise.com>",
    supportEmail: "support@legalbaise.com",
  },
};

const ACTIONS = new Set<ActionType>([
  "signup", "recovery", "invite", "magiclink", "email", "email_change",
  "email_change_current", "email_change_new", "reauthentication",
  "password_changed_notification", "email_changed_notification",
  "phone_changed_notification", "identity_linked_notification",
  "identity_unlinked_notification", "mfa_factor_enrolled_notification",
  "mfa_factor_unenrolled_notification",
]);
const NOTIFICATIONS = new Set<ActionType>([
  "password_changed_notification", "email_changed_notification",
  "phone_changed_notification", "identity_linked_notification",
  "identity_unlinked_notification", "mfa_factor_enrolled_notification",
  "mfa_factor_unenrolled_notification",
]);
const CODE_ONLY = new Set<ActionType>(["email", "reauthentication"]);
const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

class HookRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const parseHttpsUrl = (raw: string) => {
  let value: URL;
  try {
    value = new URL(raw);
  } catch {
    throw new HookRequestError(400, "Invalid authentication URL");
  }
  if (
    value.protocol !== "https:" || value.username || value.password
    || value.port || value.search || value.hash
  ) {
    throw new HookRequestError(400, "Invalid authentication URL");
  }
  return value;
};

const resolveBrand = (redirectTo: string, siteUrl: string, action: ActionType) => {
  const candidate = parseHttpsUrl(redirectTo || siteUrl);
  const match = (Object.entries(BRANDS) as [AppKey, Brand][])
    .find(([, brand]) => brand.hosts.includes(candidate.hostname));
  if (!match) throw new HookRequestError(400, "Unknown authentication brand");
  const [appKey, brand] = match;
  const allowedPaths = new Set(["/", "/auth", "/auth/callback", "/reset-password"]);
  if (!allowedPaths.has(candidate.pathname)) {
    throw new HookRequestError(400, "Authentication redirect path is not allowed");
  }
  if (action === "recovery" && candidate.pathname !== "/reset-password") {
    throw new HookRequestError(400, "Recovery redirect must use reset-password");
  }
  return {
    appKey,
    brand,
    redirectTo: `${brand.origin}${candidate.pathname}${candidate.search}`,
  };
};

type ActionCopy = readonly [string, string, string, string];
const copyFor = (action: ActionType, brand: Brand): ActionCopy => {
  switch (action) {
    case "recovery":
      return [`Reset your ${brand.name} password`, "Let’s get you safely back into your account", `We received a request to reset the password for your ${brand.name} account. Use the secure button below to create a new password.`, "Create new password"];
    case "signup":
      return [`Welcome to ${brand.name} — confirm your email`, "Welcome — we’re glad you’re here", `Thanks for joining ${brand.name}. Confirm your email to activate your account securely.`, "Confirm my email"];
    case "invite":
      return [`You’re invited to ${brand.name}`, "Your invitation is ready", `You’ve been invited to join ${brand.name}. Accept this invitation to create your secure account.`, "Accept invitation"];
    case "magiclink":
      return [`Your secure ${brand.name} sign-in link`, "Your secure sign-in link", `Use this one-time link to sign in to ${brand.name}.`, "Sign in securely"];
    case "email":
      return [`Your ${brand.name} verification code`, "Your secure verification code", `Use this one-time code to continue securely with ${brand.name}.`, "Continue"];
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return [`Confirm your email change for ${brand.name}`, "Confirm your email address change", `An email-address change was requested for your ${brand.name} account.`, "Confirm email change"];
    case "reauthentication":
      return [`Your ${brand.name} security code`, "Confirm it’s really you", `${brand.name} requires one more security check for this sensitive action.`, "Continue"];
    case "password_changed_notification":
      return [`Your ${brand.name} password was changed`, "Your password was changed", `The password for your ${brand.name} account was recently changed.`, ""];
    case "email_changed_notification":
      return [`Your ${brand.name} email address was changed`, "Your email address was changed", `The email address for your ${brand.name} account was recently changed.`, ""];
    case "phone_changed_notification":
      return [`Your ${brand.name} phone number was changed`, "Your phone number was changed", `The phone number for your ${brand.name} account was recently changed.`, ""];
    case "identity_linked_notification":
      return [`A sign-in method was linked to ${brand.name}`, "A sign-in method was linked", `A new sign-in method was linked to your ${brand.name} account.`, ""];
    case "identity_unlinked_notification":
      return [`A sign-in method was removed from ${brand.name}`, "A sign-in method was removed", `A sign-in method was removed from your ${brand.name} account.`, ""];
    case "mfa_factor_enrolled_notification":
      return [`A verification method was added to ${brand.name}`, "A verification method was added", `A multi-factor verification method was added to your ${brand.name} account.`, ""];
    case "mfa_factor_unenrolled_notification":
      return [`A verification method was removed from ${brand.name}`, "A verification method was removed", `A multi-factor verification method was removed from your ${brand.name} account.`, ""];
  }
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const verificationUrl = (tokenHash: string, action: ActionType, redirectTo: string) => {
  const rawProviderUrl = Deno.env.get("SUPABASE_URL");
  if (!rawProviderUrl || !tokenHash) {
    throw new Error("Authentication email server configuration is incomplete");
  }
  const providerUrl = parseHttpsUrl(rawProviderUrl);
  const query = new URLSearchParams({
    token: tokenHash,
    type: action,
    redirect_to: redirectTo,
  });
  return `${providerUrl.origin}/auth/v1/verify?${query.toString()}`;
};

const render = (
  brand: Brand,
  action: ActionType,
  actionUrl: string,
  token: string,
  detail?: string,
) => {
  const [subject, heading, intro, button] = copyFor(action, brand);
  const notification = NOTIFICATIONS.has(action);
  const codeOnly = CODE_ONLY.has(action);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f4f6f8;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden">
<tr><td style="background:${brand.colorDark};padding:30px 34px;color:#fff"><strong style="font-size:25px">${escapeHtml(brand.name)}</strong><br><span style="font-size:12px;letter-spacing:2px">ACCOUNT SECURITY</span></td></tr>
<tr><td style="padding:38px 34px"><h1 style="margin:0 0 16px;font-size:28px">${escapeHtml(heading)}</h1><p style="color:#4b5563;line-height:1.65">${escapeHtml(intro)}</p>
${detail ? `<p style="color:#4b5563">${escapeHtml(detail)}</p>` : ""}
${notification ? "" : codeOnly
  ? `<div style="margin:28px 0;padding:20px;text-align:center;background:#f9fafb;border-radius:14px"><strong style="font-size:30px;letter-spacing:8px">${escapeHtml(token)}</strong></div>`
  : `<div style="margin:30px 0;text-align:center"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;border-radius:12px;background:${brand.color};color:#fff;padding:15px 26px;font-weight:800;text-decoration:none">${escapeHtml(button)}</a></div>`}
<div style="margin-top:28px;border-left:4px solid ${brand.color};background:#f9fafb;padding:16px 18px"><strong>Wasn’t you?</strong><p style="color:#4b5563;line-height:1.6">Do not use this link or code. Contact <a href="mailto:${brand.supportEmail}">${brand.supportEmail}</a> if you are concerned.</p></div>
<p style="font-size:12px;color:#6b7280;line-height:1.6">Links and codes are time-limited. Our team will never ask for your password or one-time code.</p></td></tr>
<tr><td style="background:#f9fafb;padding:22px 34px;font-size:12px;color:#6b7280">Sent securely by <strong>${escapeHtml(brand.name)}</strong><br>${brand.domain} · ${brand.supportEmail}</td></tr>
</table></td></tr></table></body></html>`;
};

const send = async (
  to: string,
  brand: Brand,
  action: ActionType,
  tokenHash: string,
  token: string,
  redirectTo: string,
  detail?: string,
) => {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    throw new HookRequestError(400, "Invalid authentication recipient");
  }
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");
  const [subject, heading, intro] = copyFor(action, brand);
  const notification = NOTIFICATIONS.has(action);
  const actionUrl = notification ? "" : verificationUrl(tokenHash, action, redirectTo);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `auth-email/${action}/${tokenHash}`,
    },
    body: JSON.stringify({
      from: brand.from,
      to: [to],
      reply_to: brand.supportEmail,
      subject,
      html: render(brand, action, actionUrl, token, detail),
      text: `${heading}\n\n${intro}${detail ? `\n${detail}` : ""}\n\n${notification ? "Review your account if you do not recognize this change." : CODE_ONLY.has(action) ? `Security code: ${token}` : `Continue: ${actionUrl}`}\n\nIf this wasn't you, contact ${brand.supportEmail}. Our team will never ask for your password or one-time code.`,
    }),
  });
  if (!response.ok) {
    console.error("[send-auth-email] delivery rejected", { status: response.status, action });
    throw new Error("Authentication email delivery was rejected");
  }
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }
  try {
    if (Number(request.headers.get("content-length") || "0") > 131072) {
      throw new HookRequestError(413, "Authentication email hook body is too large");
    }
    const secret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    if (!secret) throw new Error("SEND_EMAIL_HOOK_SECRET is not configured");
    const body = await request.text();
    const webhook = new Webhook(secret.replace("v1,whsec_", ""));
    const { user, email_data: email } = webhook.verify(
      body,
      Object.fromEntries(request.headers),
    ) as HookPayload;
    const action = email.email_action_type;
    if (!ACTIONS.has(action)) {
      throw new HookRequestError(400, "Unsupported authentication email action");
    }
    const { appKey, brand, redirectTo } = resolveBrand(
      email.redirect_to,
      email.site_url,
      action,
    );
    const detail = email.old_email
      ? `Previous email: ${email.old_email}`
      : email.old_phone
        ? `Previous phone: ${email.old_phone}`
        : email.provider
          ? `Sign-in provider: ${email.provider}`
          : email.factor_type
            ? `Verification method: ${email.factor_type}`
            : undefined;
    if (action === "email_change") {
      const jobs: Promise<void>[] = [];
      if (email.token_hash_new && user.email) {
        jobs.push(send(user.email, brand, action, email.token_hash_new, email.token, redirectTo, detail));
      }
      if (email.token_hash && user.new_email) {
        jobs.push(send(user.new_email, brand, action, email.token_hash, email.token_new || email.token, redirectTo, detail));
      }
      if (!jobs.length) {
        jobs.push(send(user.new_email || user.email, brand, action, email.token_hash, email.token_new || email.token, redirectTo, detail));
      }
      await Promise.all(jobs);
    } else {
      await send(user.email, brand, action, email.token_hash, email.token, redirectTo, detail);
    }
    console.info("[send-auth-email] accepted", { appKey, action });
    return new Response("{}", { status: 200, headers: JSON_HEADERS });
  } catch (error) {
    const status = error instanceof HookRequestError ? error.status : 503;
    console.error("[send-auth-email] request failed", {
      status,
      category: error instanceof HookRequestError ? "request" : "delivery",
    });
    return new Response(JSON.stringify({
      error: { http_code: status, message: "Unable to deliver authentication email" },
    }), { status, headers: JSON_HEADERS });
  }
});
