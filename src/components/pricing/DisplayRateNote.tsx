import { useTranslation } from 'react-i18next';
import { useDisplayCurrency } from '@/contexts/DisplayCurrencyContext';
import { formatRateCaption, getNumberLocale } from '@/lib/currency';
import { cn } from '@/lib/utils';

export function DisplayRateNote({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { currency, rates, fetchedAt, delayed } = useDisplayCurrency();
  const rateCaption = formatRateCaption({
    currency,
    rates,
    fetchedAt,
    locale: getNumberLocale(),
  });

  if (!rateCaption) {
    return delayed ? (
      <p className={cn('text-xs text-amber-600', className)}>{t('currency.rateDelayed')}</p>
    ) : null;
  }

  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {t('currency.rateStamp', rateCaption)}
      {delayed ? ` · ${t('currency.rateDelayed')}` : ''}
    </p>
  );
}
