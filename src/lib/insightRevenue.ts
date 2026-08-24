/** Stable insight-survey revenue option IDs. Charge/settle stay BRL. */
export const REVENUE_OPTION_IDS = [
  'prefer_not',
  'under_5000',
  '5000_15000',
  '15000_40000',
  '40000_plus',
  'varies',
] as const;

export type RevenueOptionId = (typeof REVENUE_OPTION_IDS)[number];

/**
 * Map a stored revenue_range to a stable option ID.
 *
 * Legacy DB rows still hold pre-#23 display labels. Match those rows by
 * band numbers / locale words only — never embed R$+digit literals here or
 * they ship in the CustomerDashboard chunk.
 */
export function normalizeRevenueId(value?: string | null): string {
  if (!value) return '';
  if ((REVENUE_OPTION_IDS as readonly string[]).includes(value)) return value;

  const folded = value.toLowerCase().replace(/\s+/g, '');
  if (folded.includes('prefer') || folded.includes('prefiro') || folded.includes('prefiero')) {
    return 'prefer_not';
  }
  if (folded.includes('varia') || folded.includes('varies')) return 'varies';

  const has5 = /(?:^|[^0-9])5(?:k|mil)\b/.test(folded);
  const has15 = /15(?:k|mil)\b/.test(folded);
  const has40 = /40(?:k|mil)\b/.test(folded);
  const isUnder = /under|abaixo|menos/.test(folded);

  if (isUnder && has5) return 'under_5000';
  if (has5 && has15) return '5000_15000';
  if (has15 && has40) return '15000_40000';
  if (has40) return '40000_plus';
  return value;
}

export function revenueOptionLabels(
  locale: 'en' | 'pt' | 'es',
  under: string,
  mid: string,
  high: string,
): Record<RevenueOptionId, string> {
  if (locale === 'pt') {
    return {
      prefer_not: 'Prefiro nao informar',
      under_5000: `Abaixo de ${under}/mes`,
      '5000_15000': `${under}-${mid}/mes`,
      '15000_40000': `${mid}-${high}/mes`,
      '40000_plus': `${high}+/mes`,
      varies: 'Faturamento varia',
    };
  }
  if (locale === 'es') {
    return {
      prefer_not: 'Prefiero no decir',
      under_5000: `Menos de ${under}/mes`,
      '5000_15000': `${under}-${mid}/mes`,
      '15000_40000': `${mid}-${high}/mes`,
      '40000_plus': `${high}+/mes`,
      varies: 'Ingresos variables',
    };
  }
  return {
    prefer_not: 'Prefer not to say',
    under_5000: `Under ${under}/month`,
    '5000_15000': `${under}-${mid}/month`,
    '15000_40000': `${mid}-${high}/month`,
    '40000_plus': `${high}+/month`,
    varies: 'Business revenue varies',
  };
}
