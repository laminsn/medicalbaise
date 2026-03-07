import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProviderAnalytics } from '@/components/dashboard/ProviderAnalytics';
import { ProviderActiveJobs } from '@/components/dashboard/ProviderActiveJobs';
import { AutoReplySettings } from '@/components/messaging/AutoReplySettings';
import { CustomMessageTemplates } from '@/components/messaging/CustomMessageTemplates';
import { ScheduledServicesSection } from '@/components/scheduling/ScheduledServicesSection';
import { MessageTemplatesPanel } from '@/components/dashboard/MessageTemplatesPanel';
import { PixelTrackingSettings } from '@/components/dashboard/PixelTrackingSettings';
import { ConversionAnalyticsDashboard } from '@/components/dashboard/ConversionAnalyticsDashboard';
import { FollowerMarketingPanel } from '@/components/marketing/FollowerMarketingPanel';
import { ProviderEmailCampaigns } from '@/components/marketing/ProviderEmailCampaigns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  MessageSquare, 
  Mail, 
  Calendar, 
  Crown,
  ArrowUpRight,
  Loader2,
  Briefcase,
  Wallet,
  Target,
  Megaphone,
} from 'lucide-react';

type SubscriptionTier = 'free' | 'pro' | 'elite' | 'enterprise';

export default function ProviderDashboard() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [providerTier, setProviderTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProviderData = async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setIsProvider(false);
      } else {
        setIsProvider(true);
        setProviderTier((data.subscription_tier as SubscriptionTier) || 'free');
      }
      setIsLoading(false);
    };

    fetchProviderData();
  }, [user, navigate]);

  const isEliteOrAbove = providerTier === 'elite' || providerTier === 'enterprise';
  const isProOrAbove = isEliteOrAbove || providerTier === 'pro';
  const isEnterprise = providerTier === 'enterprise';
  const tierLabel = (tier: SubscriptionTier) => {
    if (!isPt) return tier;
    if (tier === 'free') return 'gratuito';
    if (tier === 'pro') return 'pro';
    if (tier === 'elite') return 'elite';
    return 'enterprise';
  };

  const getTierBadgeColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'enterprise': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'elite': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'pro': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!isProvider) {
    return (
      <AppLayout>
        <Helmet>
          <title>{t('dashboard.title')} | Brasil Base</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>{t('dashboard.notProvider.title')}</CardTitle>
              <CardDescription>{t('dashboard.notProvider.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/profile')}>
                {t('dashboard.notProvider.becomeProvider')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>{t('dashboard.title')} | Brasil Base</title>
        <meta name="description" content={t('dashboard.description')} />
      </Helmet>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${getTierBadgeColor(providerTier)} capitalize`}>
              <Crown className="h-3 w-3 mr-1" />
              {tierLabel(providerTier)} {t('common.tier')}
            </Badge>
            {!isEliteOrAbove && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/subscription')}>
                <ArrowUpRight className="h-4 w-4" />
                {t('dashboard.upgradeTier')}
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate('/payouts')}>
              <Wallet className="h-4 w-4" />
              {t('payouts.title', 'Payouts')}
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 h-auto">
            <TabsTrigger value="jobs" className="gap-2 py-3">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.jobs', 'Jobs')}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.analytics')}</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="gap-2 py-3">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.marketing', 'Marketing')}</span>
            </TabsTrigger>
            <TabsTrigger value="emailCampaigns" className="gap-2 py-3" disabled={!isEliteOrAbove}>
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">{isPt ? 'Campanhas de email' : 'Email Campaigns'}</span>
              {!isEliteOrAbove && <Crown className="h-3 w-3 text-amber-400" />}
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2 py-3">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.scheduled')}</span>
            </TabsTrigger>
            <TabsTrigger value="autoReply" className="gap-2 py-3" disabled={!isEliteOrAbove}>
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.autoReply')}</span>
              {!isEliteOrAbove && <Crown className="h-3 w-3 text-amber-400" />}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2 py-3" disabled={!isEliteOrAbove}>
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.messages')}</span>
              {!isEliteOrAbove && <Crown className="h-3 w-3 text-amber-400" />}
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2 py-3" disabled={!isEnterprise}>
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.tabs.tracking')}</span>
              {!isEnterprise && <Crown className="h-3 w-3 text-purple-400" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-6">
            <ProviderActiveJobs />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <ProviderAnalytics />
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
            <FollowerMarketingPanel />
          </TabsContent>

          <TabsContent value="emailCampaigns" className="space-y-6">
            {isPt ? (
              <TranslationPendingCard />
            ) : isEliteOrAbove ? (
              <ProviderEmailCampaigns />
            ) : (
              <UpgradePrompt 
                feature={isPt ? 'Campanhas de email' : 'Email Campaigns'}
                requiredTier="Elite"
              />
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <ScheduledServicesSection />
          </TabsContent>

          <TabsContent value="autoReply" className="space-y-6">
            {isEliteOrAbove ? (
              <AutoReplySettings providerTier={providerTier} />
            ) : (
              <UpgradePrompt 
                feature={t('dashboard.features.autoReply')} 
                requiredTier="Elite"
              />
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            {isEliteOrAbove ? (
              <MessageTemplatesPanel providerTier={providerTier} />
            ) : (
              <UpgradePrompt 
                feature={t('dashboard.features.customMessages')} 
                requiredTier="Elite"
              />
            )}
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            {isPt ? (
              <TranslationPendingCard />
            ) : isEnterprise ? (
              <div className="space-y-6">
                <PixelTrackingSettings />
                <ConversionAnalyticsDashboard />
              </div>
            ) : (
              <UpgradePrompt 
                feature={t('dashboard.features.pixelTracking')} 
                requiredTier="Enterprise"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function TranslationPendingCard() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center text-muted-foreground">
        Conteúdo desta seção em tradução para português.
      </CardContent>
    </Card>
  );
}

function UpgradePrompt({ feature, requiredTier }: { feature: string; requiredTier: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-amber-500/10 rounded-full mb-4">
          <Crown className="h-8 w-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {t('dashboard.upgrade.title', { feature })}
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          {t('dashboard.upgrade.description', { tier: requiredTier })}
        </p>
        <Button className="gap-2" onClick={() => navigate('/subscription')}>
          <ArrowUpRight className="h-4 w-4" />
          {t('dashboard.upgrade.button', { tier: requiredTier })}
        </Button>
      </CardContent>
    </Card>
  );
}
