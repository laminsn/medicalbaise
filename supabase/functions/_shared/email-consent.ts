import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import type { AppBrand, AppKey } from "./brands.ts";

export type EmailCategory =
  | "all"
  | "promotions"
  | "education"
  | "analytics"
  | "referral"
  | "product_updates";

export type ConsentSource =
  | "one_click"
  | "preference_center"
  | "admin"
  | "bounce"
  | "complaint";

type ConsentEventInput = {
  email: string;
  brand: AppKey;
  category: EmailCategory;
  action: "opt_in" | "opt_out";
  source: ConsentSource;
  ip?: string | null;
  userAgent?: string | null;
};

export function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

const storeError = (operation: string, error: { message?: string } | null) =>
  new Error(`Email consent store ${operation} failed${error?.message ? `: ${error.message}` : ""}`);

// Throws on store failure. Marketing callers must not turn this failure into a send.
export async function isSuppressed(
  client: SupabaseClient,
  email: string,
  brand: AppKey,
  category: EmailCategory,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("A recipient email is required for suppression checks");

  const categories = category === "all" ? ["all"] : ["all", category];
  const { data, error } = await client
    .from("email_suppressions")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("brand", brand)
    .in("category", categories)
    .limit(1);

  if (error) throw storeError("lookup", error);
  return Boolean(data?.length);
}

// Creates on first use and remains idempotent for each normalized (email, brand).
export async function getOrCreateUnsubscribeToken(
  client: SupabaseClient,
  email: string,
  brand: AppKey,
): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("A recipient email is required for unsubscribe tokens");

  const { data: existing, error: lookupError } = await client
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalizedEmail)
    .eq("brand", brand)
    .maybeSingle();

  if (lookupError) throw storeError("token lookup", lookupError);
  if (existing?.token) return String(existing.token);

  const { data: created, error: insertError } = await client
    .from("email_unsubscribe_tokens")
    .insert({ email: normalizedEmail, brand })
    .select("token")
    .maybeSingle();

  if (!insertError && created?.token) return String(created.token);

  // A concurrent first send may have won the unique-key race. Resolve its token.
  const { data: raced, error: racedLookupError } = await client
    .from("email_unsubscribe_tokens")
    .select("token")
    .eq("email", normalizedEmail)
    .eq("brand", brand)
    .maybeSingle();

  if (racedLookupError || !raced?.token) {
    throw storeError("token creation", racedLookupError || insertError);
  }
  return String(raced.token);
}

const functionsUrl = (): string => {
  const configured = String(Deno.env.get("FUNCTIONS_URL") || "").replace(/\/$/, "");
  if (configured) return configured;

  const supabaseUrl = String(Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
  if (!supabaseUrl) throw new Error("FUNCTIONS_URL or SUPABASE_URL is required for unsubscribe links");
  return `${supabaseUrl}/functions/v1`;
};

// RFC 8058 headers. An empty token is reserved for transactional callers.
export function unsubscribeHeaders(token: string, brand: AppBrand): Record<string, string> {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return {};

  const unsubscribeUrl = `${functionsUrl()}/email-unsubscribe?token=${encodeURIComponent(normalizedToken)}`;
  return {
    "List-Unsubscribe": `<mailto:support@${brand.sendingDomain}?subject=unsubscribe>, <${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

export function unsubscribeFooter(
  token: string,
  brand: AppBrand,
  lang: string,
  kind: "marketing" | "transactional",
): string {
  const locale = String(lang || "").toLowerCase().startsWith("pt")
    ? "pt"
    : String(lang || "").toLowerCase().startsWith("es")
      ? "es"
      : "en";
  const label = kind === "marketing"
    ? { en: "Unsubscribe", pt: "Cancelar inscrição", es: "Cancelar suscripción" }[locale]
    : { en: "Manage email preferences", pt: "Gerenciar preferências de e-mail", es: "Gestionar preferencias de correo" }[locale];
  const url = `${brand.url}/unsubscribe?token=${encodeURIComponent(String(token || "").trim())}`;

  return `
<div style="margin:24px auto 0;padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
  <a href="${url}" style="color:${brand.colorDark};text-decoration:underline;">${label}</a>
</div>`;
}

export async function recordConsentEvent(
  client: SupabaseClient,
  input: ConsentEventInput,
): Promise<void> {
  const normalizedEmail = normalizeEmail(input.email);
  if (!normalizedEmail) throw new Error("A recipient email is required for consent events");

  const { error } = await client.from("email_consent_events").insert({
    email: normalizedEmail,
    brand: input.brand,
    category: input.category,
    action: input.action,
    source: input.source,
    ip: input.ip || null,
    user_agent: input.userAgent || null,
  });

  if (error) throw storeError("event append", error);
}
