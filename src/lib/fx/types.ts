export const DISPLAY_CURRENCIES = ['BRL', 'USD', 'NGN'] as const;
export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number];

export const SETTLEMENT_CURRENCY = 'BRL';
export const DISPLAY_CURRENCY_STORAGE_KEY = 'baise_display_currency';
export const FX_DRIFT_THRESHOLD = 0.015;
export const FX_CACHE_TTL_MS = 30 * 60 * 1000;
export const SAO_PAULO_TZ = 'America/Sao_Paulo';

export type FxRates = {
  USD: number;
  NGN: number;
};

export type FxChecks = {
  ptaxUsdBrl: number | null;
};

export type FxPayload = {
  base: 'BRL';
  rates: FxRates;
  fetchedAt: string;
  timezone: typeof SAO_PAULO_TZ;
  source: string;
  delayed: boolean;
  suggestedCurrency: DisplayCurrency;
  country: string | null;
  checks?: FxChecks;
};

export function isDisplayCurrency(value: unknown): value is DisplayCurrency {
  return value === 'BRL' || value === 'USD' || value === 'NGN';
}

export function suggestCurrencyForCountry(country: string | null | undefined): DisplayCurrency {
  const code = (country || '').trim().toUpperCase();
  if (code === 'US') return 'USD';
  if (code === 'NG') return 'NGN';
  return 'BRL';
}
