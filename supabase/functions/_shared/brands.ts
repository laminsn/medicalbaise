export type AppKey = "casa" | "medical" | "legal";

export interface AppBrand {
  name: string;
  domain: string;
  sendingDomain: string;
  url: string;
  origin: string;
  hosts: readonly string[];
  color: string;
  colorDark: string;
  from: string;
  securityFrom: string;
  supportEmail: string;
  category: string;
}

export const APP_BRANDS = {
  casa: {
    name: "Casa Baise",
    domain: "casabaise.com",
    sendingDomain: "support.casabaise.com",
    url: "https://casabaise.com",
    origin: "https://www.casabaise.com",
    hosts: ["casabaise.com", "www.casabaise.com"],
    color: "#1dbf73",
    colorDark: "#047857",
    from: "Casa Baise <support@support.casabaise.com>",
    securityFrom: "Casa Baise Security <support@support.casabaise.com>",
    supportEmail: "support@casabaise.com",
    category: "trusted home and business service providers",
  },
  medical: {
    name: "MD Baise",
    domain: "mdbaise.com",
    sendingDomain: "support.mdbaise.com",
    url: "https://mdbaise.com",
    origin: "https://www.mdbaise.com",
    hosts: ["mdbaise.com", "www.mdbaise.com"],
    color: "#00b8d4",
    colorDark: "#087b8c",
    from: "MD Baise <support@support.mdbaise.com>",
    securityFrom: "MD Baise Security <support@support.mdbaise.com>",
    supportEmail: "support@mdbaise.com",
    category: "trusted healthcare and wellness service providers",
  },
  legal: {
    name: "Legal Baise",
    domain: "legalbaise.com",
    sendingDomain: "support.legalbaise.com",
    url: "https://legalbaise.com",
    origin: "https://www.legalbaise.com",
    hosts: ["legalbaise.com", "www.legalbaise.com"],
    color: "#7c3aed",
    colorDark: "#5b21b6",
    from: "Legal Baise <support@support.legalbaise.com>",
    securityFrom: "Legal Baise Security <support@support.legalbaise.com>",
    supportEmail: "support@legalbaise.com",
    category: "trusted legal service providers",
  },
} as const satisfies Record<AppKey, AppBrand>;

export const normalizeAppKey = (value?: string, fallback: AppKey = "casa"): AppKey => {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "medical" || normalized === "medical_baise") return "medical";
  if (normalized === "legal" || normalized === "legal_baise") return "legal";
  if (normalized === "casa" || normalized === "casa_baise") return "casa";
  return fallback;
};

export const getAppBrand = (value?: string, fallback: AppKey = "casa") => {
  const appKey = normalizeAppKey(value || Deno.env.get("BAISE_APP_KEY"), fallback);
  return APP_BRANDS[appKey];
};

export const senderWithDisplayName = (displayName: string, brand: AppBrand): string => {
  const safeDisplayName = displayName.replace(/[\r\n<>]/g, " ").replace(/\s+/g, " ").trim();
  return `${safeDisplayName} <support@${brand.sendingDomain}>`;
};

const senderDomain = (sender: string): string =>
  sender.match(/@([^>\s]+)/)?.[1]?.toLowerCase() || "unknown";

export async function reportResendFailure(response: Response, sender: string, context: string): Promise<void> {
  if (response.ok) return;

  const detail = await response.clone().text().catch(() => "");
  if (response.status === 403 || /unverified[-_\s]?domain|domain[^.]{0,80}not verified/i.test(detail)) {
    console.error(`[${context}] Resend rejected unverified sender domain ${senderDomain(sender)}`, {
      status: response.status,
      senderDomain: senderDomain(sender),
      detail: detail.slice(0, 240),
    });
  }
}

type ResendSdkResult = {
  error?: {
    message?: string;
    name?: string;
    statusCode?: number;
  } | null;
};

export function reportResendSdkFailure(result: ResendSdkResult, sender: string, context: string): void {
  const status = result.error?.statusCode;
  const detail = `${result.error?.name || ""} ${result.error?.message || ""}`.trim();
  if (status === 403 || /unverified[-_\s]?domain|domain[^.]{0,80}not verified/i.test(detail)) {
    console.error(`[${context}] Resend rejected unverified sender domain ${senderDomain(sender)}`, {
      status,
      senderDomain: senderDomain(sender),
      detail: detail.slice(0, 240),
    });
  }
}
