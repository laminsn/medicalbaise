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

  return (
    <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black py-1.5 px-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="text-sm font-bold mx-8">{bannerText}</span>
            <span className="text-sm font-bold mx-8">{bannerText}</span>
            <span className="text-sm font-bold mx-8">{bannerText}</span>
            <span className="text-sm font-bold mx-8">{bannerText}</span>
          </div>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 hover:bg-black/20 rounded-full p-0.5 transition-colors flex-shrink-0"
          aria-label={isPt ? 'Fechar banner' : isEs ? 'Cerrar banner' : 'Close banner'}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
