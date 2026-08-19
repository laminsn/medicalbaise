import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { SeekerPlanCards } from '@/components/pricing/SeekerPlanCards';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

export default function SeekerPricing() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('seekerPricing.title')} - Brasil Base</title>
        <meta name="description" content={t('seekerPricing.subtitle')} />
      </Helmet>
      <AppLayout showNav={false}>
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/customer-dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('seekerPricing.title')}</h1>
        </div>

        <div className="px-3 pb-24">
          <SeekerPlanCards />
        </div>
      </AppLayout>
    </>
  );
}
