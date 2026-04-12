import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/lib/constants/subscriptionPlans';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Crown, Zap, Building2, Star, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/currency';

const PLANS = [
  {
    id: 'free' as const,
    icon: Star,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    features: ['createProfile', 'receiveDirectBookings', 'viewJobPostings'],
    price: 0,
    popular: false,
    priceId: undefined as string | undefined,
  },
  {
    id: 'pro' as const,
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: ['allFreatures', 'bid20PerMonth', 'bidUpTo5000', 'scheduleMeetings'],
    price: SUBSCRIPTION_PLANS.pro.price,
    popular: true,
    priceId: SUBSCRIPTION_PLANS.pro.price_id,
  },
  {
    id: 'elite' as const,
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: ['allProFeatures', 'unlimitedBids', 'noBidLimit', 'featuredPlacement', 'autoReply', 'customMessages'],
    price: SUBSCRIPTION_PLANS.elite.price,
    popular: false,
    priceId: SUBSCRIPTION_PLANS.elite.price_id,
  },
  {
    id: 'enterprise' as const,
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: ['allEliteFeatures', 'metaPixelTracking', 'googleAnalytics', 'conversionDashboard', 'scheduledReports'],
    price: SUBSCRIPTION_PLANS.enterprise.price,
    popular: false,
    priceId: SUBSCRIPTION_PLANS.enterprise.price_id,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const { tier: currentTier, startCheckout } = useSubscription();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleSelectPlan = async (plan: typeof PLANS[number]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (plan.id === 'free' || plan.id === currentTier) {
      return;
    }

    if (!plan.priceId) return;

    setUpgrading(plan.id);
    try {
      await startCheckout(plan.priceId);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isPt
            ? 'Falha ao iniciar checkout'
            : isEs
              ? 'Error al iniciar el pago'
              : 'Failed to start checkout',
      );
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('pricing.title')} - Brasil Base</title>
        <meta name="description" content={t('pricing.subtitle')} />
      </Helmet>
      <AppLayout showNav={false}>
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/jobs')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('pricing.title')}</h1>
        </div>

        <div className="px-4 py-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('pricing.choosePlan')}</h2>
            <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
          </div>

          <div className="space-y-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === currentTier;

              return (
                <Card
                  key={plan.id}
                  className={`relative transition-all ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      {t('pricing.mostPopular')}
                    </Badge>
                  )}
                  {isCurrentPlan && (
                    <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                      {isPt ? 'Seu plano' : isEs ? 'Tu plan' : 'Your Plan'}
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${plan.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${plan.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{t(`pricing.plans.${plan.id}.name`)}</CardTitle>
                          <p className="text-sm text-muted-foreground">{t(`pricing.plans.${plan.id}.description`)}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold">
                        {plan.price === 0 ? t('pricing.free') : formatPrice(plan.price)}
                      </span>
                      {plan.price > 0 && <span className="text-muted-foreground">/{t('pricing.month')}</span>}
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{t(`pricing.features.${feature}`)}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full gap-1.5"
                      variant={plan.popular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || !plan.priceId || upgrading !== null}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {upgrading === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isPt ? 'Abrindo checkout...' : isEs ? 'Abriendo pago...' : 'Opening checkout...'}
                        </>
                      ) : isCurrentPlan ? (
                        t('pricing.currentPlan')
                      ) : plan.priceId ? (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          {t('pricing.selectPlan')}
                        </>
                      ) : (
                        t('pricing.currentPlan')
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('pricing.cancelAnytime')}
          </p>
        </div>
      </AppLayout>
    </>
  );
}
