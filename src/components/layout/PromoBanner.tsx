import { X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function PromoBanner() {
  const { i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const bannerText = isPt
    ? '🌸 Novos profissionais: primeiros 14 dias GRÁTIS! | ✨ Especial de Abril: primeira taxa de transação grátis! | 🎉 Planos anuais: ganhe 2 meses GRÁTIS! | 🌸 Celebre com a gente!'
    : isEs
      ? '🌸 Nuevos profesionales: ¡primeros 14 días GRATIS! | ✨ Especial de Abril: ¡sin comisión en la primera transacción! | 🎉 Planes anuales: ¡obtén 2 meses GRATIS! | 🌸 ¡Celebra con nosotros!'
      : '🌸 New Providers: First 14 Days FREE! | ✨ April Special: First Transaction Fee Waived! | 🎉 Annual Plans: Get 2 Months FREE! | 🌸 Celebrate with us!';
  const mobileBannerText = isPt
    ? '✨ Especial de Abril: primeira taxa grátis'
    : isEs
      ? '✨ Especial de Abril: primera comisión gratis'
      : '✨ April Special: First transaction fee waived';

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
          onClick={() => setIsVisible(false)}
          className="shrink-0 rounded-full p-0.5 transition-colors hover:bg-black/20"
          aria-label={isPt ? 'Fechar banner' : isEs ? 'Cerrar banner' : 'Close banner'}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
