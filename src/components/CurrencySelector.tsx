import { CircleDollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { DISPLAY_CURRENCIES, formatRateCaption, getNumberLocale, type DisplayCurrency } from '@/lib/currency';

const CURRENCY_META: Record<DisplayCurrency, { label: string }> = {
  BRL: { label: 'BRL' },
  USD: { label: 'USD' },
  NGN: { label: 'NGN' },
};

export function CurrencySelector() {
  const { t } = useTranslation();
  const { currency, setCurrency, suggestedCurrency, delayed, fetchedAt, rates } = useDisplayCurrency();
  const rateCaption = formatRateCaption({
    currency,
    rates,
    fetchedAt,
    locale: getNumberLocale(),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          aria-label={t('currency.changeCurrency')}
        >
          <CircleDollarSign className="w-4 h-4" />
          <span className="text-sm">{currency}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        {DISPLAY_CURRENCIES.map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={(event) => {
              event.preventDefault();
              setCurrency(code);
            }}
            className={currency === code ? 'bg-accent' : ''}
          >
            <span className="mr-2 font-medium">{CURRENCY_META[code].label}</span>
            <span className="text-muted-foreground">{t(`currency.names.${code}`)}</span>
            {suggestedCurrency === code && code !== 'BRL' && (
              <span className="ml-auto text-xs text-muted-foreground">{t('currency.suggested')}</span>
            )}
          </DropdownMenuItem>
        ))}
        <div className="border-t border-border px-2 py-2 text-xs text-muted-foreground">
          <p>{t('currency.defaultNote')}</p>
          {rateCaption && (
            <p className="mt-1">
              {t('currency.rateStamp', rateCaption)}
            </p>
          )}
          {delayed && <p className="mt-1 text-amber-600">{t('currency.rateDelayed')}</p>}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
