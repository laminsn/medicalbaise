import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS, type SubscriptionTier } from '@/lib/constants/subscriptionPlans';
import {
  ArrowLeft, Crown, Check, Zap, Star, Shield,
  Users, Loader2, ExternalLink, Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlanConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
  color: string;
  priceId?: string;
}

const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Basic',
    price: 0,
    description: 'Get started with basic features',
    icon: Users,
    color: 'text-muted-foreground',
    features: [
      'Create professional profile',
      'Receive direct bookings',
      '1 service listing',
      'View job postings',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: SUBSCRIPTION_PLANS.pro.price,
    description: 'For growing professionals',
    icon: Star,
    color: 'text-blue-500',
    popular: true,
    priceId: SUBSCRIPTION_PLANS.pro.price_id,
    features: [
      'All Free features',
      'Up to 5 service listings',
      '20 bids per month',
      'Bid on jobs up to R$5,000',
      'Schedule video meetings',
      'Add-on services',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: SUBSCRIPTION_PLANS.elite.price,
    description: 'For established businesses',
    icon: Crown,
    color: 'text-amber-500',
    priceId: SUBSCRIPTION_PLANS.elite.price_id,
    features: [
      'All Pro features',
      'Up to 10 service listings',
      'Unlimited bids',
      'No job size limit',
      'Featured bid placement',
      'Auto-reply messages',
      'Custom message templates',
      'Email campaigns (R$0.05/email)',
      'Basic analytics',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: SUBSCRIPTION_PLANS.enterprise.price,
    description: 'For large organizations',
    icon: Zap,
    color: 'text-purple-500',
    priceId: SUBSCRIPTION_PLANS.enterprise.price_id,
    features: [
      'All Elite features',
      'Unlimited service listings',
      'Meta Pixel tracking',
      'Google Analytics integration',
      'Conversion analytics dashboard',
      'Scheduled email reports',
      'Priority support',
      'Custom integrations',
    ],
  },
];

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const [searchParams] = useSearchParams();

  const {
    subscribed, tier: currentTier, subscriptionEnd,
    loading: subLoading, startCheckout, openCustomerPortal, checkSubscription,
  } = useSubscription();

  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [isManaging, setIsManaging] = useState(false);

  const localizePlanText = (text: string) => {
    if (isPt) {
      const ptMap: Record<string, string> = {
        Basic: 'Básico',
        'Get started with basic features': 'Comece com recursos básicos',
        'Create professional profile': 'Criar perfil profissional',
        'Receive direct bookings': 'Receber agendamentos diretos',
        '1 service listing': '1 anúncio de serviço',
        'View job postings': 'Ver solicitações',
        'For growing professionals': 'Para profissionais em crescimento',
        'All Free features': 'Todos os recursos do plano gratuito',
        'Up to 5 service listings': 'Até 5 anúncios de serviços',
        '20 bids per month': '20 propostas por mês',
        'Bid on jobs up to R$5,000': 'Enviar propostas para solicitações até R$5.000',
        'Schedule video meetings': 'Agendar videochamadas',
        'Add-on services': 'Serviços adicionais',
        'For established businesses': 'Para negócios estabelecidos',
        'All Pro features': 'Todos os recursos do Pro',
        'Up to 10 service listings': 'Até 10 anúncios de serviços',
        'Unlimited bids': 'Propostas ilimitadas',
        'No job size limit': 'Sem limite de valor da solicitação',
        'Featured bid placement': 'Destaque nas propostas',
        'Auto-reply messages': 'Mensagens de resposta automática',
        'Custom message templates': 'Modelos de mensagem personalizados',
        'Email campaigns (R$0.05/email)': 'Campanhas de e-mail (R$0,05/e-mail)',
        'Basic analytics': 'Análises básicas',
        'For large organizations': 'Para grandes organizações',
        'All Elite features': 'Todos os recursos do Elite',
        'Unlimited service listings': 'Anúncios de serviços ilimitados',
        'Meta Pixel tracking': 'Rastreamento Meta Pixel',
        'Google Analytics integration': 'Integração com Google Analytics',
        'Conversion analytics dashboard': 'Painel de análise de conversão',
        'Scheduled email reports': 'Relatórios de e-mail agendados',
        'Priority support': 'Suporte prioritário',
        'Custom integrations': 'Integrações personalizadas',
      };
      return ptMap[text] || text;
    }
    if (isEs) {
      const esMap: Record<string, string> = {
        Basic: 'Básico',
        'Get started with basic features': 'Empieza con funciones básicas',
        'Create professional profile': 'Crear perfil profesional',
        'Receive direct bookings': 'Recibir reservas directas',
        '1 service listing': '1 servicio publicado',
        'View job postings': 'Ver solicitudes',
        'For growing professionals': 'Para profesionales en crecimiento',
        'All Free features': 'Todas las funciones del plan gratis',
        'Up to 5 service listings': 'Hasta 5 servicios publicados',
        '20 bids per month': '20 propuestas por mes',
        'Bid on jobs up to R$5,000': 'Enviar propuestas en solicitudes de hasta R$5.000',
        'Schedule video meetings': 'Programar videollamadas',
        'Add-on services': 'Servicios adicionales',
        'For established businesses': 'Para negocios consolidados',
        'All Pro features': 'Todas las funciones de Pro',
        'Up to 10 service listings': 'Hasta 10 servicios publicados',
        'Unlimited bids': 'Propuestas ilimitadas',
        'No job size limit': 'Sin límite de valor de solicitud',
        'Featured bid placement': 'Ubicación destacada de propuestas',
        'Auto-reply messages': 'Mensajes de respuesta automática',
        'Custom message templates': 'Plantillas de mensajes personalizadas',
        'Email campaigns (R$0.05/email)': 'Campañas de correo (R$0,05/correo)',
        'Basic analytics': 'Analítica básica',
        'For large organizations': 'Para organizaciones grandes',
        'All Elite features': 'Todas las funciones de Elite',
        'Unlimited service listings': 'Servicios publicados ilimitados',
        'Meta Pixel tracking': 'Seguimiento con Meta Pixel',
        'Google Analytics integration': 'Integración con Google Analytics',
        'Conversion analytics dashboard': 'Panel de analítica de conversiones',
        'Scheduled email reports': 'Reportes de correo programados',
        'Priority support': 'Soporte prioritario',
        'Custom integrations': 'Integraciones personalizadas',
      };
      return esMap[text] || text;
    }
    return text;
  };

  // Handle Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success(isPt ? 'Assinatura ativada! Atualizando status...' : isEs ? '¡Suscripción activada! Actualizando estado...' : 'Subscription activated! Refreshing status...');
      checkSubscription();
    } else if (searchParams.get('canceled') === 'true') {
      toast.info(isPt ? 'Checkout cancelado.' : isEs ? 'Pago cancelado.' : 'Checkout canceled.');
    }
  }, [searchParams, isPt, isEs, checkSubscription]);

  // Auto-apply promo from URL
  useEffect(() => {
    const urlPromo = searchParams.get('promo');
    if (urlPromo) setPromoCode(urlPromo);
  }, [searchParams]);

  useEffect(() => {
    if (!user && !subLoading) navigate('/auth');
  }, [user, subLoading]);

  const handleSelectPlan = async (plan: PlanConfig) => {
    if (plan.id === currentTier || !plan.priceId) return;

    setIsUpgrading(plan.id);
    try {
      await startCheckout(plan.priceId, promoCode || undefined);
    } catch (err) {
      const message = err instanceof Error ? err.message : isPt ? 'Falha ao iniciar checkout' : isEs ? 'Error al iniciar el pago' : 'Failed to start checkout';
      toast.error(message);
    } finally {
      setIsUpgrading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      await openCustomerPortal();
    } catch (err) {
      const message = err instanceof Error ? err.message : isPt ? 'Falha ao abrir portal' : isEs ? 'Error al abrir el portal' : 'Failed to open portal';
      toast.error(message);
    } finally {
      setIsManaging(false);
    }
  };

  if (subLoading) {
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

          {/* Current Plan Summary */}
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
                    {subscriptionEnd && (
                      <p className="text-xs text-muted-foreground">
                        {isPt ? 'Renova em' : isEs ? 'Renueva el' : 'Renews'} {new Date(subscriptionEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {subscribed && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {isPt ? 'Ativo' : isEs ? 'Activo' : 'Active'}
                    </Badge>
                  )}
                </div>
              </div>
              {subscribed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-1.5 w-full"
                  onClick={handleManageSubscription}
                  disabled={isManaging}
                >
                  {isManaging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4" />
                  )}
                  {isPt ? 'Gerenciar assinatura' : isEs ? 'Administrar suscripción' : 'Manage Subscription'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Promo Code */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <label className="text-sm font-medium">{isPt ? 'Código promocional' : isEs ? 'Código promocional' : 'Promo Code'}</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder={isPt ? 'ex.: SUMMER2026' : isEs ? 'ej.: SUMMER2026' : 'e.g. SUMMER2026'}
                  className="flex-1"
                />
                {promoCode && (
                  <Badge variant="secondary" className="self-center whitespace-nowrap">
                    {isPt ? 'Aplicado ✓' : isEs ? 'Aplicado ✓' : 'Applied ✓'}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isPt
                  ? 'Insira um código antes de selecionar um plano. Você também pode inseri-lo no checkout.'
                  : isEs
                    ? 'Ingresa un código antes de seleccionar un plan. También puedes ingresarlo en el pago.'
                    : 'Enter a code before selecting a plan. You can also enter it at checkout.'}
              </p>
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
                        <CardTitle className="text-lg">{localizePlanText(plan.name)}</CardTitle>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">
                          {plan.price === 0 ? (isPt ? 'Grátis' : isEs ? 'Gratis' : 'Free') : `R$${plan.price}`}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-sm text-muted-foreground">{isPt ? '/mês' : isEs ? '/mes' : '/mo'}</span>
                        )}
                      </div>
                    </div>
                    <CardDescription>{localizePlanText(plan.description)}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          <span>{localizePlanText(feature)}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className="w-full gap-1.5"
                      variant={isCurrentPlan ? 'secondary' : plan.popular ? 'default' : 'outline'}
                      disabled={isCurrentPlan || !plan.priceId || isUpgrading !== null}
                      onClick={() => handleSelectPlan(plan)}
                    >
                      {isUpgrading === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {isPt ? 'Abrindo checkout...' : isEs ? 'Abriendo pago...' : 'Opening checkout...'}
                        </>
                      ) : isCurrentPlan ? (
                        <>
                          <Check className="h-4 w-4" />
                          {isPt ? 'Plano atual' : isEs ? 'Plan actual' : 'Current Plan'}
                        </>
                      ) : plan.priceId ? (
                        <>
                          <ExternalLink className="h-4 w-4" />
                          {isPt ? 'Assinar' : isEs ? 'Suscribirse' : 'Subscribe'}
                        </>
                      ) : (
                        isPt ? 'Grátis' : isEs ? 'Gratis' : 'Free'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('subscription.cancelAnytime', 'Cancel anytime. No hidden fees.')}
          </p>
        </div>
      </AppLayout>
    </>
  );
}
