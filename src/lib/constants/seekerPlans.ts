export const SEEKER_PLANS = {
  flex: {
    slug: 'flex',
    monthlyBrl: 0,
    feePercent: 5,
    feeMinBrl: 27,
    transactionLimit: null,
    stripeCheckout: false,
  },
  lifestyle: {
    slug: 'lifestyle',
    monthlyBrl: 99,
    feePercent: 0,
    feeMinBrl: 0,
    transactionLimit: 8,
    stripeCheckout: true,
  },
  project: {
    slug: 'project',
    monthlyBrl: 499,
    feePercent: 0,
    feeMinBrl: 0,
    transactionLimit: null,
    stripeCheckout: true,
  },
} as const;

export type SeekerPlan = keyof typeof SEEKER_PLANS;
export const DEFAULT_SEEKER_PLAN: SeekerPlan = 'flex';
export const LIFESTYLE_TRANSACTION_LIMIT = SEEKER_PLANS.lifestyle.transactionLimit;

export function isSeekerPlan(value: unknown): value is SeekerPlan {
  return value === 'flex' || value === 'lifestyle' || value === 'project';
}

export function formatSeekerBrl(amount: number, locale?: string): string {
  try {
    return new Intl.NumberFormat(locale || 'pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `R$${amount}`;
  }
}
