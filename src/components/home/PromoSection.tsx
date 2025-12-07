import { Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function PromoSection() {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">{t('promo.badge')}</span>
          </div>
          
          <h3 className="text-xl font-bold mb-2">
            {t('promo.title')}
          </h3>
          
          <p className="text-sm opacity-90 mb-4">
            {t('promo.description')}
          </p>
          
          <Link to="/browse">
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-background text-primary hover:bg-background/90"
            >
              {t('promo.cta')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}