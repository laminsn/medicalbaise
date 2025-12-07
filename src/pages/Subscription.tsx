import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Crown, Check, Zap, Star, Shield, 
  MessageSquare, BarChart3, Users, Video, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ElementType;
  color: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Basic',
    price: 0,
    description: 'Get started with basic features',
    icon: Users,
    color: 'text-muted-foreground',
    features: [
      { text: 'Create professional profile', included: true },
      { text: 'Receive direct bookings', included: true },
      { text: '1 service listing', included: true },
      { text: 'View job postings', included: true },
      { text: 'Bid on jobs', included: false },
      { text: 'Video meetings', included: false },
      { text: 'Custom messaging', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    description: 'For growing professionals',
    icon: Star,
    color: 'text-blue-500',
    popular: true,
    features: [
      { text: 'All Free features', included: true },
      { text: 'Up to 5 service listings', included: true },
      { text: '20 bids per month', included: true },
      { text: 'Bid on jobs up to R$5,000', included: true },
      { text: 'Schedule video meetings', included: true },
      { text: 'Add-on services', included: true },
      { text: 'Custom messaging', included: false },
      { text: 'Analytics dashboard', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 299,
    description: 'For established businesses',
    icon: Crown,
    color: 'text-amber-500',
    features: [
      { text: 'All Pro features', included: true },
      { text: 'Up to 10 service listings', included: true },
      { text: 'Unlimited bids', included: true },
      { text: 'No job size limit', included: true },
      { text: 'Featured bid placement', included: true },
      { text: 'Auto-reply messages', included: true },
      { text: 'Custom message templates', included: true },
      { text: 'Basic analytics', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 549,
    description: 'For large organizations',
    icon: Zap,
    color: 'text-purple-500',
    features: [
      { text: 'All Elite features', included: true },
      { text: 'Unlimited service listings', included: true },
      { text: 'Meta Pixel tracking', included: true },
      { text: 'Google Analytics integration', included: true },
      { text: 'Conversion analytics dashboard', included: true },
      { text: 'Scheduled email reports', included: true },
      { text: 'Priority support', included: true },
      { text: 'Custom integrations', included: true },
    ],
  },
];

export default function Subscription() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [isProvider, setIsProvider] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      navigate('/auth');
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('providers')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setIsProvider(true);
        setCurrentTier(data.subscription_tier || 'free');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentTier) return;
    
    if (!isProvider) {
      toast.error(t('subscription.providerRequired', 'You need to be a provider to subscribe'));
      return;
    }

    setIsUpgrading(planId);
    
    // Simulate upgrade process - in production, this would integrate with payment
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(t('subscription.planSelected', 'Plan selected! Payment integration coming soon.'));
    setIsUpgrading(null);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('subscription.title', 'Subscription')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{t('subscription.title', 'Subscription')}</h1>
              <p className="text-sm text-muted-foreground">
                {t('subscription.subtitle', 'Choose the plan that fits your needs')}
              </p>
            </div>
          </div>

          {/* Current Plan */}
          <Card className="mb-6 border-primary">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('subscription.currentPlan', 'Current Plan')}</p>
                    <p className="text-sm text-muted-foreground capitalize">{currentTier}</p>
                  </div>
                </div>
                {isProvider && currentTier !== 'free' && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {t('subscription.active', 'Active')}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="space-y-4">
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === currentTier;
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative ${plan.popular ? 'border-primary' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        {t('subscription.mostPopular', 'Most Popular')}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${plan.color}`} />
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">R${plan.price}</span>
                        {plan.price > 0 && (
                          <span className="text-sm text-muted-foreground">/{t('subscription.month', 'mo')}</span>
                        )}
                      </div>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className={`h-4 w-4 ${feature.included ? 'text-primary' : 'text-muted-foreground/30'}`} />
                          <span className={feature.included ? '' : 'text-muted-foreground/50'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className="w-full"
                      variant={isCurrentPlan ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || isUpgrading !== null}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {isUpgrading === plan.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : isCurrentPlan ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {t('subscription.currentPlan', 'Current Plan')}
                        </>
                      ) : (
                        t('subscription.selectPlan', 'Select Plan')
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('subscription.cancelAnytime', 'Cancel anytime. No hidden fees.')}
          </p>
        </div>
      </AppLayout>
    </>
  );
}