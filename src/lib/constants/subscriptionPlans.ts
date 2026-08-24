// Provider subscription display amounts in BRL. Isolated from seeker plans.
// Do not invent a new ladder or multiply these by a baked FX rate.
export const SUBSCRIPTION_PLANS = {
  pro: {
    product_id: "prod_TwYB832UJEVdae",
    price_id: "price_1Syf5Q8Jqppqq3BaME0ZHv52",
    price: 29,
  },
  elite: {
    product_id: "prod_TwYCFDLTvmTaGp",
    price_id: "price_1Syf5d8Jqppqq3BacMVbBLkQ",
    price: 59,
  },
  enterprise: {
    product_id: "prod_TwYC2TfnPnZRND",
    price_id: "price_1Syf5s8Jqppqq3BaAnA96elD",
    price: 109,
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS | "free";

// Promo codes are validated server-side only — never expose coupon IDs client-side
