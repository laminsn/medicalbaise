export type FormatCurrency = 'BRL' | 'USD' | 'NGN';
export type FormatRates = { USD: number; NGN: number };

export const LANGUAGE_NUMBER_LOCALES: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-BR',
  es: 'es',
};

export function numberLocaleFromLanguage(language?: string): string {
  const code = (language || 'pt').split('-')[0];
  return LANGUAGE_NUMBER_LOCALES[code] || 'pt-BR';
}

export function formatMoneyAmount(amount: number, currency: string, locale: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: safeAmount >= 100 && Number.isInteger(safeAmount) ? 0 : 2,
      maximumFractionDigits: safeAmount >= 100 && Number.isInteger(safeAmount) ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return `${currency} ${safeAmount.toFixed(2)}`;
  }
}

export function convertBrl(amountBrl: number, currency: FormatCurrency, rates: FormatRates | null): number | null {
  if (currency === 'BRL') return amountBrl;
  const rate = rates?.[currency];
  if (!rate || !(rate > 0)) return null;
  return amountBrl * rate;
}

export type RateCaption = {
  rate: string;
  currency: 'USD' | 'NGN';
  time: string;
};

/**
 * Live FX caption values. Never null just because display currency is BRL —
 * BRL-first open still quotes 1 BRL in USD from /api/fx.
 */
export function formatRateCaption(options: {
  currency?: FormatCurrency;
  rates?: FormatRates | null;
  fetchedAt?: string | null;
  locale?: string;
  language?: string;
}): RateCaption | null {
  const rates = options.rates ?? null;
  const fetchedAt = options.fetchedAt;
  if (!rates || !fetchedAt) return null;

  const quoteCurrency: 'USD' | 'NGN' = options.currency === 'NGN' ? 'NGN' : 'USD';
  const rate = rates[quoteCurrency];
  if (!(rate > 0)) return null;

  const locale = options.locale || numberLocaleFromLanguage(options.language);
  return {
    rate: new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(rate),
    currency: quoteCurrency,
    time: fetchedAt,
  };
}

export function formatDisplayPriceFromBrl(
  amountBrl: number,
  options: {
    currency?: FormatCurrency;
    locale?: string;
    language?: string;
    rates?: FormatRates | null;
  } = {},
): string {
  const currency = options.currency || 'BRL';
  const locale = options.locale || numberLocaleFromLanguage(options.language);
  const original = formatMoneyAmount(amountBrl, 'BRL', locale);

  if (currency === 'BRL') return original;

  const converted = convertBrl(amountBrl, currency, options.rates ?? null);
  if (converted == null) return original;

  return `${original} · ≈ ${formatMoneyAmount(converted, currency, locale)}`;
}
