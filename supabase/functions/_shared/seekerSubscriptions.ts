export const MEDICAL_APP_KEY = "medical";
export const SEEKER_ROLE = "seeker";
export const SEEKER_STRIPE_PLANS = ["lifestyle", "project"] as const;

export type SeekerStripePlan = (typeof SEEKER_STRIPE_PLANS)[number];
export type SeekerPlan = "flex" | SeekerStripePlan;

type RpcClient = {
  rpc: (
    fn: "try_consume_seeker_transaction",
    args: { app_key: string; user_id: string },
  ) => Promise<{ data: boolean | null; error: { message?: string } | null }>;
};

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
