import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

type AppKey = "casa" | "medical" | "legal";
type ActionType =
  | "signup"
  | "recovery"
  | "invite"
  | "magiclink"
  | "email"
  | "email_change"
  | "email_change_current"
  | "email_change_new"
  | "reauthentication"
  | "password_changed_notification"
  | "email_changed_notification"
  | "phone_changed_notification"
  | "identity_linked_notification"
  | "identity_unlinked_notification"
  | "mfa_factor_enrolled_notification"
  | "mfa_factor_unenrolled_notification";

interface AuthHookPayload {
  user: {
    email: string;
    new_email?: string;
    user_metadata?: Record<string, unknown>;
  };
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
}

interface Brand {
  name: string;
  domain: string;
  origin: string;
  hosts: readonly string[];
  color: string;
  colorDark: string;
  from: string;
  supportEmail: string;
}

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
    // INTERIM: legalbaise.com and support.legalbaise.com are not verified in
    // Resend, so anything sent from them 403s and never leaves -- no bounce, no
    // retry. Sending from the verified Baise domain with Legal Baise as the
    // display name keeps this mailbox alive. Revert to
    // support@support.legalbaise.com the moment the DKIM/SPF records verify.
    from: "Legal Baise Security <support@support.casabaise.com>",
    supportEmail: "support@legalbaise.com",
  },
};

const ACTION_COPY: Record<ActionType, {
  subject: (brand: Brand) => string;
  preview: (brand: Brand) => string;
  heading: string;
  intro: (brand: Brand) => string;
  button: string;
}> = {
  recovery: {
    subject: (brand) => `Reset your ${brand.name} password`,
    preview: (brand) => `Securely create a new password for your ${brand.name} account.`,
    heading: "Let’s get you safely back into your account",
    intro: (brand) => `We received a request to reset the password for your ${brand.name} account. Use the secure button below to create a new password.`,
    button: "Create new password",
  },
  signup: {
    subject: (brand) => `Welcome to ${brand.name} — confirm your email`,
    preview: (brand) => `One quick step to activate your ${brand.name} account.`,
    heading: "Welcome — we’re glad you’re here",
    intro: (brand) => `Thanks for joining ${brand.name}. Confirm your email address to activate your account and get started securely.`,
    button: "Confirm my email",
  },
  invite: {
    subject: (brand) => `You’re invited to ${brand.name}`,
    preview: (brand) => `Accept your invitation to join ${brand.name}.`,
    heading: "Your invitation is ready",
    intro: (brand) => `You’ve been invited to join ${brand.name}. Accept this invitation to set up your secure account.`,
    button: "Accept invitation",
  },
  magiclink: {
    subject: (brand) => `Your secure ${brand.name} sign-in link`,
    preview: (brand) => `Use this one-time link to sign in to ${brand.name}.`,
    heading: "Your secure sign-in link",
    intro: (brand) => `Use the button below to sign in to ${brand.name}. This link is intended only for you and can be used once.`,
    button: "Sign in securely",
  },
  email: {
    subject: (brand) => `Your ${brand.name} verification code`,
    preview: (brand) => `Use this one-time code to continue with ${brand.name}.`,
    heading: "Your secure verification code",
    intro: (brand) => `Use this one-time code to continue securely with ${brand.name}.`,
    button: "Continue securely",
  },
  email_change: {
    subject: (brand) => `Confirm your email change for ${brand.name}`,
    preview: (brand) => `Confirm this email address for your ${brand.name} account.`,
    heading: "Confirm your new email address",
    intro: (brand) => `A request was made to change the email address on your ${brand.name} account. Confirm it below to complete the change.`,
    button: "Confirm email change",
  },
  email_change_current: {
    subject: (brand) => `Confirm your email change for ${brand.name}`,
    preview: (brand) => `Approve the requested email change for your ${brand.name} account.`,
    heading: "Approve your email address change",
    intro: (brand) => `Confirm that you requested an email address change for your ${brand.name} account.`,
    button: "Approve email change",
  },
  email_change_new: {
    subject: (brand) => `Confirm your new ${brand.name} email`,
    preview: (brand) => `Confirm this new email address for your ${brand.name} account.`,
    heading: "Confirm your new email address",
    intro: (brand) => `Confirm this address as the new email for your ${brand.name} account.`,
    button: "Confirm new email",
  },
  reauthentication: {
    subject: (brand) => `Your ${brand.name} security code`,
    preview: (brand) => `Use this one-time code to confirm it’s you.`,
    heading: "Confirm it’s really you",
    intro: (brand) => `${brand.name} requires one more security check before completing this sensitive action.`,
    button: "Continue securely",
  },
  password_changed_notification: {
    subject: (brand) => `Your ${brand.name} password was changed`,
    preview: (brand) => `Security notice for your ${brand.name} account.`,
    heading: "Your password was changed",
    intro: (brand) => `The password for your ${brand.name} account was recently changed.`,
    button: "",
  },
  email_changed_notification: {
    subject: (brand) => `Your ${brand.name} email address was changed`,
    preview: (brand) => `Security notice for your ${brand.name} account.`,
    heading: "Your email address was changed",
    intro: (brand) => `The email address for your ${brand.name} account was recently changed.`,
    button: "",
  },
  phone_changed_notification: {
    subject: (brand) => `Your ${brand.name} phone number was changed`,
    preview: (brand) => `Security notice for your ${brand.name} account.`,
    heading: "Your phone number was changed",
    intro: (brand) => `The phone number for your ${brand.name} account was recently changed.`,
    button: "",
  },
  identity_linked_notification: {
    subject: (brand) => `A sign-in method was linked to ${brand.name}`,
    preview: (brand) => `Security notice for your ${brand.name} account.`,
    heading: "A sign-in method was linked",
    intro: (brand) => `A new sign-in method was linked to your ${brand.name} account.`,
    button: "",
  },
  identity_unlinked_notification: {
    subject: (brand) => `A sign-in method was removed from ${brand.name}`,
    preview: (brand) => `Security notice for your ${brand.name} account.`,
    heading: "A sign-in method was removed",
    intro: (brand) => `A sign-in method was removed from your ${brand.name} account.`,
    button: "",
  },
  mfa_factor_enrolled_notification: {
    subject: (brand) => `A verification method was added to ${brand.name}`,
    preview: (brand) => `Security notice for your ${brand.name} account.`,
    heading: "A verification method was added",
    intro: (brand) => `A new multi-factor verification method was added to your ${brand.name} account.`,
    button: "",
  },
  mfa_factor_unenrolled_notification: {
    subject: (brand) => `A verification method was removed from ${brand.name}`,
    preview: (brand) => `Security notice for your ${brand.name} account.`,
    heading: "A verification method was removed",
    intro: (brand) => `A multi-factor verification method was removed from your ${brand.name} account.`,
    button: "",
  },
};

const NOTIFICATION_TYPES = new Set<ActionType>([
  "password_changed_notification",
  "email_changed_notification",
  "phone_changed_notification",
  "identity_linked_notification",
  "identity_unlinked_notification",
  "mfa_factor_enrolled_notification",
  "mfa_factor_unenrolled_notification",
]);

const jsonHeaders = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

class HookRequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const parseFirstPartyUrl = (rawUrl: string) => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new HookRequestError(400, "Invalid authentication redirect");
  }
  if (
    parsed.protocol !== "https:"
    || parsed.username
    || parsed.password
    || parsed.port || parsed.search
    || parsed.hash
  ) {
    throw new HookRequestError(400, "Invalid authentication redirect");
  }
  return parsed;
};

const resolveBrand = (redirectTo: string, siteUrl: string, action: ActionType) => {
  const candidate = parseFirstPartyUrl(redirectTo || siteUrl);
  const match = (Object.entries(BRANDS) as [AppKey, Brand][])
    .find(([, brand]) => brand.hosts.includes(candidate.hostname));
  if (!match) throw new HookRequestError(400, "Unknown authentication brand");

  const [appKey, brand] = match;
  const allowedPaths = new Set(["/", "/auth", "/auth/callback", "/reset-password"]);
  if (!allowedPaths.has(candidate.pathname)) {
    throw new HookRequestError(400, "Authentication redirect path is not allowed");
  }
  if (action === "recovery" && candidate.pathname !== "/reset-password") {
    throw new HookRequestError(400, "Recovery redirect must use the reset-password page");
  }
  return {
    appKey,
    brand,
    redirectTo: `${brand.origin}${candidate.pathname}${candidate.search}`,
  };
};

const verifyUrl = (tokenHash: string, action: ActionType, redirectTo: string) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl || !tokenHash) {
    throw new Error("Authentication email server configuration is incomplete");
  }
  const providerUrl = parseFirstPartyUrl(supabaseUrl);
  const query = new URLSearchParams({
    token: tokenHash,
    type: action,
    redirect_to: redirectTo,
  });
  return `${providerUrl.origin}/auth/v1/verify?${query.toString()}`;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderEmail = ({
  brand,
  action,
  actionUrl,
  token,
  detail,
}: {
  brand: Brand;
  action: ActionType;
  actionUrl: string;
  token: string;
  detail?: string;
}) => {
  const copy = ACTION_COPY[action];
  const isCodeOnly = action === "reauthentication" || action === "email";
  const isNotification = NOTIFICATION_TYPES.has(action);
  const safeUrl = escapeHtml(actionUrl);
  const safeToken = escapeHtml(token);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(copy.subject(brand))}</title>
  </head>
  <body style="margin:0;background:#f4f6f8;color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(copy.preview(brand))}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 36px rgba(17,24,39,.10);">
          <tr>
            <td style="background:${brand.colorDark};padding:30px 34px;">
              <div style="font-size:25px;font-weight:800;letter-spacing:-.4px;color:#ffffff;">${brand.name}</div>
              <div style="margin-top:5px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffffcc;">Account Security</div>
            </td>
          </tr>
          <tr>
            <td style="padding:38px 34px 30px;">
              <div style="display:inline-block;margin-bottom:18px;border-radius:999px;background:${brand.color}1f;color:${brand.colorDark};padding:7px 12px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Secure account action</div>
              <h1 style="margin:0 0 16px;color:#111827;font-size:28px;line-height:1.2;letter-spacing:-.5px;">${copy.heading}</h1>
              <p style="margin:0;color:#4b5563;font-size:16px;line-height:1.65;">${copy.intro(brand)}</p>
              ${detail ? `<p style="margin:14px 0 0;color:#4b5563;font-size:14px;line-height:1.6;">${escapeHtml(detail)}</p>` : ""}
              ${
                isNotification
                  ? ""
                  : isCodeOnly
                  ? `<div style="margin:28px 0;border:1px solid #e5e7eb;border-radius:14px;background:#f9fafb;padding:20px;text-align:center;">
                      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#6b7280;">One-time security code</div>
                      <div style="margin-top:8px;font-size:30px;font-weight:800;letter-spacing:8px;color:#111827;">${safeToken}</div>
                    </div>`
                  : `<div style="margin:30px 0;text-align:center;">
                      <a href="${safeUrl}" style="display:inline-block;border-radius:12px;background:${brand.color};color:#ffffff;padding:15px 26px;font-size:16px;font-weight:800;text-decoration:none;">${copy.button}</a>
                    </div>`
              }
              ${!isCodeOnly && !isNotification && safeToken ? `<p style="margin:0 0 18px;color:#6b7280;font-size:13px;line-height:1.5;text-align:center;">Or use this one-time code: <strong style="color:#111827;letter-spacing:2px;">${safeToken}</strong></p>` : ""}
              <div style="margin-top:28px;border-left:4px solid ${brand.color};border-radius:8px;background:#f9fafb;padding:16px 18px;">
                <p style="margin:0 0 7px;color:#111827;font-size:14px;font-weight:800;">Wasn’t you?</p>
                <p style="margin:0;color:#4b5563;font-size:13px;line-height:1.6;">Do not click the button or share the code. You can safely ignore this message, then contact <a href="mailto:${brand.supportEmail}" style="color:${brand.colorDark};font-weight:700;">${brand.supportEmail}</a> if you are concerned about your account.</p>
              </div>
              <p style="margin:22px 0 0;color:#6b7280;font-size:12px;line-height:1.6;">${isNotification ? `Review your account immediately if you do not recognize this change. ` : `For your security, this link or code is time-limited and can only be used as permitted by ${brand.name}. `}Our team will never ask you to send us your password or one-time code.</p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;background:#f9fafb;padding:22px 34px;color:#6b7280;font-size:12px;line-height:1.6;">
              Sent securely by <strong style="color:#374151;">${brand.name}</strong><br>
              ${brand.domain} · <a href="mailto:${brand.supportEmail}" style="color:${brand.colorDark};">${brand.supportEmail}</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

const sendEmail = async ({
  to,
  brand,
  action,
  tokenHash,
  token,
  redirectTo,
  detail,
}: {
  to: string;
  brand: Brand;
  action: ActionType;
  tokenHash: string;
  token: string;
  redirectTo: string;
  detail?: string;
}) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    throw new HookRequestError(400, "Authentication email recipient is invalid");
  }
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");

  const copy = ACTION_COPY[action];
  const isNotification = NOTIFICATION_TYPES.has(action);
  const actionUrl = isNotification ? "" : verifyUrl(tokenHash, action, redirectTo);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `auth-email/${action}/${tokenHash}`,
    },
    body: JSON.stringify({
      from: brand.from,
      to: [to],
      reply_to: brand.supportEmail,
      subject: copy.subject(brand),
      html: renderEmail({ brand, action, actionUrl, token, detail }),
      text: `${copy.heading}\n\n${copy.intro(brand)}${detail ? `\n${detail}` : ""}\n\n${isNotification ? "Review your account immediately if you do not recognize this change." : action === "reauthentication" || action === "email" ? `Security code: ${token}` : `Continue: ${actionUrl}`}\n\nIf this wasn't you, do not use this link or code. Contact ${brand.supportEmail}.`,
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
      },
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
      headers: jsonHeaders,
    });
  }

  try {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 131072) {
      throw new HookRequestError(413, "Authentication email hook body is too large");
    }
    const rawSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
    if (!rawSecret) throw new Error("SEND_EMAIL_HOOK_SECRET is not configured");

    const payload = await request.text();
    const headers = Object.fromEntries(request.headers);
    const webhook = new Webhook(rawSecret.replace("v1,whsec_", ""));
    const { user, email_data: emailData } = webhook.verify(payload, headers) as AuthHookPayload;
    const action = emailData.email_action_type;
    if (!(action in ACTION_COPY)) {
      throw new HookRequestError(400, "Unsupported authentication email action");
    }
    const {
      appKey,
      brand,
      redirectTo,
    } = resolveBrand(emailData.redirect_to, emailData.site_url, action);
    const detail = action === "email_changed_notification" && emailData.old_email
      ? `Previous email: ${emailData.old_email}`
      : action === "phone_changed_notification" && emailData.old_phone
        ? `Previous phone: ${emailData.old_phone}`
        : (action === "identity_linked_notification" || action === "identity_unlinked_notification") && emailData.provider
          ? `Sign-in provider: ${emailData.provider}`
          : (action === "mfa_factor_enrolled_notification" || action === "mfa_factor_unenrolled_notification") && emailData.factor_type
            ? `Verification method: ${emailData.factor_type}`
            : undefined;

    if (action === "email_change") {
      const jobs: Promise<void>[] = [];

      if (emailData.token_hash_new && user.email) {
        jobs.push(sendEmail({
          to: user.email,
          brand,
          action,
          tokenHash: emailData.token_hash_new,
          token: emailData.token,
          redirectTo,
          detail,
        }));
      }

      if (emailData.token_hash && user.new_email) {
        jobs.push(sendEmail({
          to: user.new_email,
          brand,
          action,
          tokenHash: emailData.token_hash,
          token: emailData.token_new || emailData.token,
          redirectTo,
          detail,
        }));
      }

      if (jobs.length === 0) {
        jobs.push(sendEmail({
          to: user.new_email || user.email,
          brand,
          action,
          tokenHash: emailData.token_hash,
          token: emailData.token_new || emailData.token,
          redirectTo,
          detail,
        }));
      }

      await Promise.all(jobs);
    } else {
      await sendEmail({
        to: user.email,
        brand,
        action,
        tokenHash: emailData.token_hash,
        token: emailData.token,
        redirectTo,
        detail,
      });
    }

    console.info("[send-auth-email] accepted", { appKey, action });
    return new Response("{}", { status: 200, headers: jsonHeaders });
  } catch (error) {
    const status = error instanceof HookRequestError ? error.status : 503;
    console.error("[send-auth-email] request failed", {
      status,
      category: error instanceof HookRequestError ? "request" : "delivery",
    });
    return new Response(JSON.stringify({
      error: {
        http_code: status,
        message: "Unable to deliver authentication email",
      },
    }), { status, headers: jsonHeaders });
  }
});
