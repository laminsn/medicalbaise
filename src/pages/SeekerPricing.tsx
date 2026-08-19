import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, ExternalLink, Loader2, Sparkles, Star, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSeekerSubscription } from '@/hooks/useSeekerSubscription';
import {
  LIFESTYLE_TRANSACTION_LIMIT,
  SEEKER_PLANS,
  formatSeekerBrl,
  type SeekerPlan,
} from '@/lib/constants/seekerPlans';

const PLAN_UI: Array<{
  id: SeekerPlan;
  icon: typeof Star;
  color: string;
  bgColor: string;
  popular: boolean;
  features: string[];
}> = [
  {
    id: 'flex',
    icon: Star,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    popular: false,
    features: ['payPerService', 'platformFee', 'noMonthlyCharge'],
  },
  {
    id: 'lifestyle',
    icon: Sparkles,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    popular: true,
    features: ['eightPaidServices', 'zeroFee', 'monthlyBilling'],
  },
  {
    id: 'project',
    icon: Workflow,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    popular: false,
    features: ['unlimitedServices', 'zeroFee', 'monthlyBilling'],
  },
];

export default function SeekerPricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { plan: currentPlan, transactionCount, startCheckout } = useSeekerSubscription();
  const [upgrading, setUpgrading] = useState<SeekerPlan | null>(null);

  const handleSelectPlan = async (planId: SeekerPlan) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (planId === 'flex' || planId === currentPlan) return;

    setUpgrading(planId);
    try {
      if (planId !== 'lifestyle' && planId !== 'project') return;
      await startCheckout(planId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('seekerPricing.checkoutFailed'));
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('seekerPricing.title')} - MD Baise</title>
        <meta name="description" content={t('seekerPricing.subtitle')} />
      </Helmet>
      <AppLayout showNav={false}>
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('seekerPricing.title')}</h1>
        </div>

        <div className="px-4 py-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('seekerPricing.choosePlan')}</h2>
            <p className="text-muted-foreground">{t('seekerPricing.subtitle')}</p>
          </div>

          <div className="space-y-4">
            {PLAN_UI.map((plan) => {
              const Icon = plan.icon;
              const config = SEEKER_PLANS[plan.id];
              const isCurrentPlan = plan.id === currentPlan;
              const usedLabel =
                plan.id === 'lifestyle'
                  ? t('seekerPricing.usedOfLimit', {
                      used: currentPlan === 'lifestyle' ? transactionCount : 0,
                      limit: LIFESTYLE_TRANSACTION_LIMIT,
                    })
                  : null;

              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      {t('seekerPricing.mostPopular')}
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                      {t('seekerPricing.yourPlan')}
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${plan.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${plan.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{t(`seekerPricing.plans.${plan.id}.name`)}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {t(`seekerPricing.plans.${plan.id}.description`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold">
                        {config.monthlyBrl === 0
                          ? formatSeekerBrl(0, i18n.language)
                          : formatSeekerBrl(config.monthlyBrl, i18n.language)}
                      </span>
                      {config.monthlyBrl > 0 && (
                        <span className="text-muted-foreground">/{t('seekerPricing.month')}</span>
                      )}
                    </div>
                    {usedLabel && (
                      <p className="text-sm font-medium mb-3">{usedLabel}</p>
                    )}
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>
                            {feature === 'platformFee'
                              ? t('seekerPricing.features.platformFee', {
                                  percent: config.feePercent,
                                  min: formatSeekerBrl(config.feeMinBrl, i18n.language),
                                })
                              : t(`seekerPricing.features.${feature}`)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full gap-1.5"
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || !config.stripeCheckout || upgrading !== null}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {upgrading === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('seekerPricing.openingCheckout')}
                        </>
                      ) : isCurrentPlan ? (
                        t('seekerPricing.currentPlan')
                      ) : config.stripeCheckout ? (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          {t('seekerPricing.selectPlan')}
                        </>
                      ) : (
                        t('seekerPricing.currentPlan')
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('seekerPricing.cancelAnytime')}
          </p>
        </div>
      </AppLayout>
    </>
  );
}
