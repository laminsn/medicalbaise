// Prices in USD — converted to local currency at display time

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  BRL: 5.05,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 154.5,
  MXN: 17.15,
  COP: 3950,
  ARS: 875,
  CLP: 950,
  PEN: 3.72,
  UYU: 39.5,
  PYG: 7350,
  BOB: 6.91,
  INR: 83.5,
  CNY: 7.24,
  KRW: 1330,
  ZAR: 18.5,
  NGN: 1550,
  GHS: 14.5,
  KES: 153,
  TZS: 2550,
  UGX: 3800,
  RWF: 1280,
};

const LOCALE_CURRENCY_MAP: Record<string, string> = {
  'pt-BR': 'BRL', 'pt': 'BRL',
  'en-US': 'USD', 'en': 'USD',
  'en-GB': 'GBP', 'en-AU': 'AUD', 'en-CA': 'CAD',
  'es-MX': 'MXN', 'es-CO': 'COP', 'es-AR': 'ARS',
  'es-CL': 'CLP', 'es-PE': 'PEN', 'es-UY': 'UYU',
  'es-PY': 'PYG', 'es-BO': 'BOB', 'es': 'USD',
  'fr': 'EUR', 'de': 'EUR', 'it': 'EUR', 'nl': 'EUR',
  'ja': 'JPY', 'ko': 'KRW', 'zh': 'CNY',
  'hi': 'INR',
  'sw': 'KES',
};

function detectCurrency(): string {
  const locale = navigator.language || 'en-US';

  if (LOCALE_CURRENCY_MAP[locale]) return LOCALE_CURRENCY_MAP[locale];

  const langOnly = locale.split('-')[0];
  if (LOCALE_CURRENCY_MAP[langOnly]) return LOCALE_CURRENCY_MAP[langOnly];

  return 'USD';
}

let cachedCurrency: string | null = null;

export function getUserCurrency(): string {
  if (!cachedCurrency) {
    cachedCurrency = detectCurrency();
  }
  return cachedCurrency;
}

export function convertFromUSD(amountUSD: number, currency?: string): number {
  const curr = currency || getUserCurrency();
  const rate = EXCHANGE_RATES[curr] || 1;
  return Math.round(amountUSD * rate * 100) / 100;
}

export function formatPrice(amountUSD: number, locale?: string): string {
  const userLocale = locale || navigator.language || 'en-US';
  const currency = getUserCurrency();
  const converted = convertFromUSD(amountUSD, currency);

  try {
    return new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: converted >= 100 ? 0 : 2,
    }).format(converted);
  } catch {
    return `${currency} ${converted.toFixed(2)}`;
  }
}

export function formatLocalPrice(amount: number, locale?: string): string {
  const userLocale = locale || navigator.language || 'en-US';
  const currency = getUserCurrency();

  try {
    return new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
