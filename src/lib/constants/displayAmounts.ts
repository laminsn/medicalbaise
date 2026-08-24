/** Display-only BRL amounts. Charge/settle stay BRL; UI converts via formatDisplayPrice. */
export const TESTIMONIAL_GOOGLE_CREDIT_BRL = 50;
export const TESTIMONIAL_VIDEO_CREDIT_BRL = 100;
export const TESTIMONIAL_TOTAL_CREDIT_BRL = 150;
export const INFLUENCER_POST_PAY_BRL = 150;
export const INFLUENCER_VIRAL_BONUS_BRL = 150;
export const PAYOUT_MINIMUM_BRL = 50;
export const INSIGHT_REVENUE_UNDER_BRL = 5000;
export const INSIGHT_REVENUE_MID_BRL = 15000;
export const INSIGHT_REVENUE_HIGH_BRL = 40000;

export function fillDisplayAmount(template: string, amount: string): string {
  return template.replaceAll('{{amount}}', amount);
}
