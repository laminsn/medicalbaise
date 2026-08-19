export const MEDICAL_APP_KEY = "medical";
export const SEEKER_ROLE = "seeker";
export const SEEKER_STRIPE_PLANS = ["lifestyle", "project"] as const;

export type SeekerStripePlan = (typeof SEEKER_STRIPE_PLANS)[number];
export type SeekerPlan = "flex" | SeekerStripePlan;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RpcClient = {
  rpc: (
    fn: "try_consume_seeker_transaction",
    args: { app_key: string; user_id: string },
  ) => Promise<{ data: boolean | null; error: { message?: string } | null }>;
};

type ProfileLookupClient = {
  from: (table: "profiles") => {
    select: (columns: "user_id") => {
      eq: (column: "email", value: string) => {
        maybeSingle: () => Promise<{ data: { user_id: string } | null }>;
      };
    };
  };
};

export function isSeekerUserId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function emailHint(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.includes("@") ? email : null;
}

export function clientEmailFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  return emailHint((metadata as { client_email?: unknown }).client_email);
}

export async function resolveSeekerUserId(
  supabase: ProfileLookupClient,
  input: { customerId?: string | null; email?: string | null },
): Promise<string | null> {
  if (isSeekerUserId(input.customerId)) return input.customerId;
  const email = emailHint(input.email);
  if (!email) return null;
  const { data } = await supabase.from("profiles").select("user_id").eq("email", email).maybeSingle();
  return isSeekerUserId(data?.user_id) ? data.user_id : null;
}

export function requireMedicalAppKey(): string {
  const key = String(Deno.env.get("BAISE_APP_KEY") || "").toLowerCase();
  if (key !== MEDICAL_APP_KEY) {
    throw new Error("medical_app_key_required");
  }
  return MEDICAL_APP_KEY;
}

export function isSeekerStripePlan(value: unknown): value is SeekerStripePlan {
  return value === "lifestyle" || value === "project";
}

export function seekerPriceAllowlist(): Record<SeekerStripePlan, string> {
  return {
    lifestyle: String(Deno.env.get("STRIPE_PRICE_SEEKER_LIFESTYLE") || "").trim(),
    project: String(Deno.env.get("STRIPE_PRICE_SEEKER_PROJECT") || "").trim(),
  };
}

export function resolveSeekerPriceId(plan: SeekerStripePlan): string {
  const priceId = seekerPriceAllowlist()[plan];
  if (!priceId || !/^price_[A-Za-z0-9]{8,}$/.test(priceId)) {
    throw new Error("seeker_price_unset");
  }
  return priceId;
}

export async function consumeSeekerPaidTransaction(
  supabaseAdmin: RpcClient,
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;

  const { data, error } = await supabaseAdmin.rpc("try_consume_seeker_transaction", {
    app_key: MEDICAL_APP_KEY,
    user_id: userId,
  });

  if (error) {
    console.error("try_consume_seeker_transaction failed", error.message);
    return false;
  }

  return data === true;
}
