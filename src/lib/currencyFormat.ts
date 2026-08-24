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
