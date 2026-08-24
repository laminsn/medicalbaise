import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyFxPayload,
  getDisplayCurrencyState,
  setDisplayCurrency,
  subscribeDisplayCurrency,
  type DisplayCurrency,
  type FxRates,
} from '@/lib/currency';
import { isDisplayCurrency, type FxPayload } from '@/lib/fx/types';

type DisplayCurrencyContextValue = {
  currency: DisplayCurrency;
  rates: FxRates | null;
  fetchedAt: string | null;
  source: string | null;
  delayed: boolean;
  suggestedCurrency: DisplayCurrency;
  setCurrency: (currency: DisplayCurrency) => void;
};

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue | null>(null);

async function loadFx(): Promise<FxPayload | null> {
  try {
    const response = await fetch('/api/fx', { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    const payload = (await response.json()) as FxPayload;
    if (!payload?.rates?.USD || !payload?.rates?.NGN) return null;
    return payload;
  } catch {
    return null;
  }
}

export function DisplayCurrencyProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState(getDisplayCurrencyState);

  useEffect(() => subscribeDisplayCurrency(() => setSnapshot(getDisplayCurrencyState())), []);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const payload = await loadFx();
      if (cancelled || !payload) return;
      applyFxPayload(payload);
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), 30 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const value = useMemo<DisplayCurrencyContextValue>(
    () => ({
      currency: snapshot.currency,
      rates: snapshot.rates,
      fetchedAt: snapshot.fetchedAt,
      source: snapshot.source,
      delayed: snapshot.delayed,
      suggestedCurrency: snapshot.suggestedCurrency,
      setCurrency: (currency) => {
        if (isDisplayCurrency(currency)) setDisplayCurrency(currency);
      },
    }),
    [snapshot],
  );

  return (
    <DisplayCurrencyContext.Provider value={value}>
      <div data-display-currency={value.currency} data-fx-delayed={value.delayed ? 'true' : 'false'}>
        {children}
      </div>
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency(): DisplayCurrencyContextValue {
  const context = useContext(DisplayCurrencyContext);
  if (!context) {
    return {
      ...getDisplayCurrencyState(),
      setCurrency: setDisplayCurrency,
    };
  }
  return context;
}
