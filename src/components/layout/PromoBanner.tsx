import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const BANNER_ID = 'promo-aug-2026';
const REAPPEAR_AFTER_DAYS = 7;

function wasRecentlyDismissed() {
  if (typeof window === 'undefined') return false;

  const dismissed = localStorage.getItem(`promoBanner-${BANNER_ID}`);
  if (!dismissed) return false;

  const dismissedDate = new Date(dismissed);
  const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceDismissed < REAPPEAR_AFTER_DAYS;
}

export function PromoBanner() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(() => !wasRecentlyDismissed());

  if (!isVisible) return null;

  const promoItems = [
    `🌸 ${t('promo.newProviders')}`,
    `✨ ${t('promo.currentSpecial', { month: t('promo.currentMonth') })}`,
    `🎉 ${t('promo.annualPlans')}`,
  ];
  const bannerText = promoItems.join(' | ');
  const mobileBannerText = promoItems[1];

  const handleDismiss = () => {
    localStorage.setItem(`promoBanner-${BANNER_ID}`, new Date().toISOString());
    setIsVisible(false);
  };

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black py-1.5 px-3 sm:px-4 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-sm font-bold sm:hidden">
          {mobileBannerText}
        </p>
        <div className="relative hidden flex-1 overflow-hidden sm:block">
          <div className="inline-block whitespace-nowrap animate-marquee">
            <span className="text-sm font-bold mx-8">{bannerText}</span>
            <span className="text-sm font-bold mx-8">{bannerText}</span>
            <span className="text-sm font-bold mx-8">{bannerText}</span>
            <span className="text-sm font-bold mx-8">{bannerText}</span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-black/20"
          aria-label={t('common.close')}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
