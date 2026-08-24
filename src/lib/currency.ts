import i18n from '@/i18n';
import {
  DISPLAY_CURRENCIES,
  DISPLAY_CURRENCY_STORAGE_KEY,
  SETTLEMENT_CURRENCY,
  type DisplayCurrency,
  type FxPayload,
  type FxRates,
  isDisplayCurrency,
} from '@/lib/fx/types';
import {
  convertBrl,
  formatDisplayPriceFromBrl,
  formatMoneyAmount,
  numberLocaleFromLanguage,
} from '@/lib/currencyFormat';

export {
  DISPLAY_CURRENCIES,
  DISPLAY_CURRENCY_STORAGE_KEY,
  SETTLEMENT_CURRENCY,
  isDisplayCurrency,
  convertBrl,
  formatMoneyAmount,
  type DisplayCurrency,
  type FxPayload,
  type FxRates,
};

export { LANGUAGE_NUMBER_LOCALES } from '@/lib/currencyFormat';

type CurrencyListener = () => void;

type CurrencyState = {
  currency: DisplayCurrency;
  rates: FxRates | null;
  fetchedAt: string | null;
  source: string | null;
  delayed: boolean;
  suggestedCurrency: DisplayCurrency;
};

const listeners = new Set<CurrencyListener>();

const state: CurrencyState = {
  currency: readStoredCurrency(),
  rates: null,
  fetchedAt: null,
  source: null,
  delayed: false,
  suggestedCurrency: 'BRL',
};

function readStoredCurrency(): DisplayCurrency {
  if (typeof localStorage === 'undefined') return 'BRL';
  try {
    const stored = localStorage.getItem(DISPLAY_CURRENCY_STORAGE_KEY);
    return isDisplayCurrency(stored) ? stored : 'BRL';
  } catch {
    return 'BRL';
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeDisplayCurrency(listener: CurrencyListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDisplayCurrencyState(): CurrencyState {
  return { ...state };
}

export function getDisplayCurrency(): DisplayCurrency {
  return state.currency;
}

/** Settlement / charge currency. Language never changes this. */
export function getSettlementCurrency(): 'BRL' {
  return SETTLEMENT_CURRENCY;
}

/** Input/charge prefix. Always BRL — language does not change currency. */
export function getUserCurrency(): string {
  return getSettlementCurrency();
}

export function setDisplayCurrency(currency: DisplayCurrency) {
  if (!isDisplayCurrency(currency)) return;
  state.currency = currency;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(DISPLAY_CURRENCY_STORAGE_KEY, currency);
    } catch {
      // private mode
    }
  }
  emit();
}

export function applyFxPayload(payload: FxPayload) {
  state.rates = payload.rates;
  state.fetchedAt = payload.fetchedAt;
  state.source = payload.source;
  state.delayed = payload.delayed;
  state.suggestedCurrency = payload.suggestedCurrency;
  emit();
}

export function getNumberLocale(language?: string): string {
  return numberLocaleFromLanguage(language || i18n.resolvedLanguage || i18n.language || 'pt');
}

export type FormatDisplayPriceOptions = {
  currency?: DisplayCurrency;
  locale?: string;
  rates?: FxRates | null;
};

/**
 * Display helper. Amounts are stored and settled in BRL.
 * Language only changes number format, never the currency.
 */
export function formatDisplayPrice(amountBrl: number, options: FormatDisplayPriceOptions = {}): string {
  return formatDisplayPriceFromBrl(amountBrl, {
    currency: options.currency || state.currency,
    locale: options.locale || getNumberLocale(),
    rates: options.rates === undefined ? state.rates : options.rates,
  });
}

/** Alias used across the app. Amounts are BRL, not USD. */
export function formatPrice(amountBrl: number, locale?: string): string {
  return formatDisplayPrice(amountBrl, { locale });
}

/** Format an amount that is already in the settlement currency without converting. */
export function formatLocalPrice(amountBrl: number, locale?: string): string {
  return formatMoneyAmount(amountBrl, 'BRL', locale || getNumberLocale());
}
