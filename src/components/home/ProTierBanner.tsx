import { useTranslation } from 'react-i18next';
import { Crown, ChevronRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProTierBanner = () => {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-2">
      <Link to="/browse?tier=pro,elite">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-black p-4 shadow-lg">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
          
          <div className="relative flex items-center gap-4">
            {/* Crown Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight">
                {t('proElite.title')}
              </h3>
              <p className="text-white/80 text-xs mt-0.5 leading-snug">
                {t('proElite.subtitle')}
              </p>
              
              {/* Trust badges */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                <span className="flex items-center gap-1 text-xs text-white/90">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  {t('proElite.verified')}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/90">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  {t('proElite.fastResponse')}
                </span>
                <span className="flex items-center gap-1 text-xs text-white/90">
                  <CheckCircle className="w-3 h-3 text-yellow-400" />
                  {t('proElite.highQuality')}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
};
