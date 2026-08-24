import { useTranslation } from 'react-i18next';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { getNumberLocale } from '@/lib/currency';
import { cn } from '@/lib/utils';

export function DisplayRateNote({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { currency, rates, fetchedAt, source, delayed } = useDisplayCurrency();

  if (currency === 'BRL' || !rates || !fetchedAt) {
    return delayed ? (
      <p className={cn('text-xs text-amber-600', className)}>{t('currency.rateDelayed')}</p>
    ) : null;
  }

  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {t('currency.rateStamp', {
        rate: new Intl.NumberFormat(getNumberLocale(), { maximumFractionDigits: 6 }).format(rates[currency]),
        currency,
        time: fetchedAt,
        source: source || '',
      })}
      {delayed ? ` · ${t('currency.rateDelayed')}` : ''}
    </p>
  );
}
