import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, Crown, Zap, Building2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PLANS = [
  {
    id: 'free',
    icon: Star,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    features: ['createProfile', 'receiveDirectBookings', 'viewJobPostings'],
    price: 0,
    popular: false,
  },
  {
    id: 'pro',
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: ['allFreatures', 'bid20PerMonth', 'bidUpTo5000', 'scheduleMeetings'],
    price: 149,
    popular: true,
  },
  {
    id: 'elite',
    icon: Zap,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: ['allProFeatures', 'unlimitedBids', 'noBidLimit', 'featuredPlacement', 'autoReply', 'customMessages'],
    price: 299,
    popular: false,
  },
  {
    id: 'enterprise',
    icon: Building2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: ['allEliteFeatures', 'metaPixelTracking', 'googleAnalytics', 'conversionDashboard', 'scheduledReports'],
    price: 549,
    popular: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (planId === 'free') {
      toast({
        title: t('pricing.alreadyFree'),
        description: t('pricing.upgradeToAccess'),
      });
      return;
    }

    setSelectedPlan(planId);
    toast({
      title: t('pricing.planSelected'),
      description: t('pricing.paymentComingSoon'),
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('pricing.title')} - Brasil Base</title>
        <meta name="description" content={t('pricing.subtitle')} />
      </Helmet>
      <AppLayout showNav={false}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/jobs')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('pricing.title')}</h1>
        </div>

        <div className="px-4 py-6 pb-24">
          {/* Hero */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">{t('pricing.choosePlan')}</h2>
            <p className="text-muted-foreground">{t('pricing.subtitle')}</p>
          </div>

          {/* Plans */}
          <div className="space-y-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all ${plan.popular ? 'border-primary shadow-lg' : ''} ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                      {t('pricing.mostPopular')}
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
                        {plan.price === 0 ? t('pricing.free') : `R$${plan.price.toFixed(2)}`}
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
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {plan.price === 0 ? t('pricing.currentPlan') : t('pricing.selectPlan')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('pricing.cancelAnytime')}
          </p>
        </div>
      </AppLayout>
    </>
  );
}
