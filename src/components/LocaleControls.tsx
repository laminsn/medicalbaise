import { CurrencySelector } from '@/components/CurrencySelector';
import { LanguageSelector } from '@/components/LanguageSelector';

export function LocaleControls() {
  return (
    <div className="flex items-center">
      <CurrencySelector />
      <LanguageSelector />
    </div>
  );
}
