import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageMetadata } from '@/components/seo/PageMetadata';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';
import { useAuth } from '@/hooks/useAuth';
import { formatDisplayPrice } from '@/lib/currency';
import { REFERRAL_CREDIT_BRL } from '@/lib/constants/referral';
import { Button } from '@/components/ui/button';
import { Gift, ArrowLeft } from 'lucide-react';

export default function Referral() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  if (!user) {
    return (
      <>
        <PageMetadata page="referral-dashboard" locale={i18n.resolvedLanguage || i18n.language} path="/referral" />
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Gift className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('referral.referAndEarn')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('referral.loginToAccess', { amount: formatDisplayPrice(REFERRAL_CREDIT_BRL) })}
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full max-w-xs">
              {t('referral.login')}
            </Button>
          </div>
        </AppLayout>
      </>
    );
  }

  return (
    <>
      <PageMetadata page="referral-dashboard" locale={i18n.resolvedLanguage || i18n.language} path="/referral" />
      <AppLayout>
        <div className="px-4 py-6 pb-24">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <ReferralDashboard />
        </div>
      </AppLayout>
    </>
  );
}
