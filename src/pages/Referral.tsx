import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReferralDashboard } from '@/components/referral/ReferralDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Gift, ArrowLeft } from 'lucide-react';

export default function Referral() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!user) {
    return (
      <>
        <Helmet>
          <title>{t('referral.pageTitle')}</title>
        </Helmet>
        <AppLayout>
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Gift className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('referral.referAndEarn')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('referral.loginToAccess')}
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
      <Helmet>
        <title>{t('referral.pageTitle')}</title>
        <meta name="description" content={t('referral.pageDescription')} />
      </Helmet>
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