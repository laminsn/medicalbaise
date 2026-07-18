import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProviderAnalytics } from '@/components/dashboard/ProviderAnalytics';
import { ProviderActiveJobs } from '@/components/dashboard/ProviderActiveJobs';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { DashboardCommandCenter } from '@/components/dashboard/DashboardCommandCenter';
import { DashboardVisualKpis } from '@/components/dashboard/DashboardVisualKpis';
import { PrintableDashboard } from '@/components/dashboard/PrintableDashboard';
import { AutoReplySettings } from '@/components/messaging/AutoReplySettings';
import { ScheduledServicesSection } from '@/components/scheduling/ScheduledServicesSection';
import { MessageTemplatesPanel } from '@/components/dashboard/MessageTemplatesPanel';
import { PixelTrackingSettings } from '@/components/dashboard/PixelTrackingSettings';
import { ConversionAnalyticsDashboard } from '@/components/dashboard/ConversionAnalyticsDashboard';
import { FollowerMarketingPanel } from '@/components/marketing/FollowerMarketingPanel';
import { ProviderEmailCampaigns } from '@/components/marketing/ProviderEmailCampaigns';
import { useAuth } from '@/hooks/useAuth';
import { useProviderAnalytics } from '@/hooks/useProviderAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { BidTemplates } from '@/components/provider/BidTemplates';
import { ProviderCalendarManager } from '@/components/provider/ProviderCalendarManager';
import { ProviderIntegrationsManager } from '@/components/provider/ProviderIntegrationsManager';
import { ProviderMessagingCommandCenter } from '@/components/provider/ProviderMessagingCommandCenter';
import { ProviderOperationsLog } from '@/components/provider/ProviderOperationsLog';
import { ProviderPaymentsWorkspace } from '@/components/provider/ProviderPaymentsWorkspace';
import { ProviderCRMWorkspace } from '@/components/provider/ProviderCRMWorkspace';
import { ProviderWorkflowCommandCenter } from '@/components/provider/ProviderWorkflowCommandCenter';
import { ProviderDeliveryCommandCenter } from '@/components/provider/ProviderDeliveryCommandCenter';
import { ProviderFinanceCommandCenter } from '@/components/provider/ProviderFinanceCommandCenter';
import { ProviderRetentionCommandCenter } from '@/components/provider/ProviderRetentionCommandCenter';
import { ProviderActivationCommandCenter } from '@/components/provider/ProviderActivationCommandCenter';
import { PartnerCampaignCommandCenter } from '@/components/partner/PartnerCampaignCommandCenter';
import {
  BarChart3,
  Calendar,
  Crown,
  ArrowUpRight,
  Loader2,
  Briefcase,
  Wallet,
  Target,
  Users,
  Megaphone,
  Video,
  MapPin,
  Clock,
  Search,
  Settings,
  Handshake,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

type SubscriptionTier = 'free' | 'pro' | 'elite' | 'enterprise';

export default function ProviderDashboard() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [providerTier, setProviderTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [isProvider, setIsProvider] = useState(false);
  const { analytics } = useProviderAnalytics();
  const [currentProviderId, setCurrentProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProviderData = async () => {
      const { data, error } = await supabase
        .from('providers')
        .select('id, subscription_tier')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setIsProvider(false);
      } else {
        setIsProvider(true);
        setCurrentProviderId(data.id);
        setProviderTier((data.subscription_tier as SubscriptionTier) || 'free');
      }
      setIsLoading(false);
    };

    fetchProviderData();
  }, [user, navigate]);

  const isEliteOrAbove = providerTier === 'elite' || providerTier === 'enterprise';
  const isProOrAbove = isEliteOrAbove || providerTier === 'pro';
  const isEnterprise = providerTier === 'enterprise';
  const tierMeter = providerTier === 'enterprise' ? 100 : providerTier === 'elite' ? 86 : providerTier === 'pro' ? 68 : 38;
  const tierLabel = (tier: SubscriptionTier) => {
    if (!isPt && !isEs) return tier;
    if (tier === 'free') return isEs ? 'gratis' : 'gratuito';
    if (tier === 'pro') return 'pro';
    if (tier === 'elite') return 'elite';
    return isEs ? 'empresarial' : 'enterprise';
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
        <DashboardCommandCenter
          eyebrow="Medical Baise"
          title={t('dashboard.title', 'My Dashboard')}
          description={t('dashboard.subtitle', 'Run your healthcare practice workspace: appointments, patient requests, services, messaging, and growth tools.')}
          badge={`${tierLabel(providerTier)} ${t('common.tier', 'tier')}`}
          focus={{
            label: 'Care operations',
            title: isProOrAbove ? 'Keep patient demand moving' : 'Set up the care workflow first',
            description: isProOrAbove
              ? 'Use analytics, patient messages, and service settings to stay responsive and credible.'
              : 'Focus on available requests, services, and payout setup before adding growth automation.',
            icon: Target,
            tone: isProOrAbove ? 'purple' : 'blue',
            actionLabel: isProOrAbove ? 'View analytics' : 'Find requests',
            onAction: () => navigate(isProOrAbove ? '/dashboard' : '/jobs'),
          }}
          metrics={[
            {
              label: 'Provider tier',
              value: tierLabel(providerTier),
              detail: isEliteOrAbove ? 'Automation and campaigns are available.' : 'Upgrade when you need automation and campaigns.',
              icon: Crown,
              tone: providerTier === 'free' ? 'amber' : 'purple',
            },
            {
              label: 'Care queue',
              value: 'Jobs',
              detail: 'Appointments and active service requests stay organized.',
              icon: Briefcase,
              tone: 'blue',
            },
            {
              label: 'Revenue',
              value: 'Payments',
              detail: 'Create invoices, plans, POS payments, and exports.',
              icon: Wallet,
              tone: 'green',
            },
            {
              label: 'Growth',
              value: isProOrAbove ? 'Enabled' : 'Limited',
              detail: 'Marketing, analytics, and tracking tools live below.',
              icon: Megaphone,
              tone: 'purple',
            },
          ]}
          actions={[
            {
              label: 'Find jobs',
              description: 'Browse patient requests and appointment opportunities.',
              icon: Search,
              onClick: () => navigate('/jobs'),
            },
            {
              label: 'Manage services',
              description: 'Update specialties, pricing, add-ons, and availability.',
              icon: Settings,
              onClick: () => navigate('/services'),
            },
            {
              label: 'Payments',
              description: 'Create payment plans, POS checkout, and exports.',
              icon: Wallet,
              onClick: () => navigate('/payments'),
            },
          ]}
        />

        <DashboardVisualKpis
          title="Performance visual board"
          description="Ratings, earnings, care timelines, and operating meters for quick decision-making."
          ratingLabel="Average rating"
          ratingValue={analytics?.avgRating}
          ratingDetail={`${analytics?.totalReviews || 0} review${analytics?.totalReviews === 1 ? '' : 's'} contributing to patient trust.`}
          revenueLabel="Revenue generated"
          revenueValue={formatPrice(analytics?.totalRevenue || 0)}
          revenueDetail={`${analytics?.totalJobs || 0} completed care request${analytics?.totalJobs === 1 ? '' : 's'} tracked in the provider workspace.`}
          timelineLabel="6-month revenue timeline"
          timelineData={(analytics?.monthlyData || []).map((item) => ({ label: item.month, value: item.revenue }))}
          barLabel="Care requests completed by month"
          barData={(analytics?.monthlyData || []).map((item) => ({ label: item.month, value: item.jobs }))}
          meters={[
            {
              label: 'Completion rate',
              value: analytics?.completionRate ?? 100,
              detail: 'Percent of started care requests that reach completion.',
            },
            {
              label: 'Response rate',
              value: analytics?.responseRate ?? 100,
              detail: 'Conversation responsiveness signal.',
            },
            {
              label: 'Tier leverage',
              value: tierMeter,
              detail: 'How much of the growth toolkit is available on this plan.',
            },
          ]}
        />

        <PrintableDashboard
          brandName="Medical Baise"
          audience="provider"
          title="Printable provider dashboard"
          subtitle="A concise healthcare operations report: appointment activity, revenue visibility, patient follow-up, records, and growth readiness in one printable view."
          accountLabel={`${tierLabel(providerTier)} ${t('common.tier', 'tier')}`}
          generatedFor={user?.email}
          metrics={[
            {
              label: 'Provider tier',
              value: tierLabel(providerTier),
              detail: isEliteOrAbove ? 'Advanced automation and campaign tools are available.' : 'Core tools are active; upgrade when automation is needed.',
            },
            {
              label: 'Completed care requests',
              value: analytics?.totalJobs || 0,
              detail: 'Completed healthcare work tracked in the provider workspace.',
            },
            {
              label: 'Revenue generated',
              value: formatPrice(analytics?.totalRevenue || 0),
              detail: 'Tracked from completed care requests and payment records.',
            },
            {
              label: 'Average rating',
              value: analytics?.avgRating ? `${analytics.avgRating.toFixed(1)} / 5` : 'New',
              detail: `${analytics?.totalReviews || 0} review${analytics?.totalReviews === 1 ? '' : 's'} currently support patient trust.`,
            },
          ]}
          sections={[
            {
              title: 'Provider operating summary',
              items: [
                'Appointments, care requests, patient messages, and approvals stay connected inside the portal.',
                'Invoices, payment plans, POS payments, receipts, and client IDs support cleaner accounting.',
                'Calendar tasks, follow-ups, signatures, notes, and delivery records help document each interaction.',
              ],
            },
            {
              title: 'Growth and reputation summary',
              items: [
                'Reviews, ratings, and profile quality help patients choose with more confidence.',
                'Campaigns, referrals, social analytics, and service updates support consistent patient acquisition.',
                'Monthly, quarterly, annual, and custom records support reporting, taxes, and client proof.',
              ],
            },
          ]}
          nextSteps={[
            'Review active care requests, scheduled visits, and follow-ups before the next appointment window.',
            'Confirm every paid service has an invoice, payment status, receipt, and client record.',
            'Update specialties, pricing, availability, and proof before promoting services.',
          ]}
          recordsChecklist={[
            'Unique invoice and client ID for each paid healthcare service.',
            'Payment, refund, service credit, and receipt records.',
            'Signatures, approval notes, service descriptions, and timestamps.',
            'Monthly, quarterly, annual, and custom financial exports.',
          ]}
        />

        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="today" className="gap-2 py-3">
              <Target className="h-4 w-4" />
              <span>Today</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-2 py-3">
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="gap-2 py-3">
              <Calendar className="h-4 w-4" />
              <span>Work</span>
            </TabsTrigger>
            <TabsTrigger value="money" className="gap-2 py-3">
              <Wallet className="h-4 w-4" />
              <span>Money</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="gap-2 py-3">
              <BarChart3 className="h-4 w-4" />
              <span>Growth</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 py-3">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="partner" className="gap-2 py-3">
              <Handshake className="h-4 w-4" />
              <span>Partner</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-6">
            <DashboardOverview />
            <ProviderWorkflowCommandCenter />
            {currentProviderId && <UpcomingAppointments providerId={currentProviderId} />}
            <ProviderActiveJobs />
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <ProviderRetentionCommandCenter />
            <ProviderActivationCommandCenter />
            <ProviderCRMWorkspace />
          </TabsContent>

          <TabsContent value="work" className="space-y-6">
            <ProviderDeliveryCommandCenter />
            <ProviderCalendarManager />
            <ScheduledServicesSection />
            <BidTemplates mode="manage" />
          </TabsContent>

          <TabsContent value="money" className="space-y-6">
            <ProviderFinanceCommandCenter />
            <ProviderPaymentsWorkspace />
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <ProviderMessagingCommandCenter />
            {isPt || isEs ? (
              <TranslationPendingCard isEs={isEs} />
            ) : isEliteOrAbove ? (
              <ProviderEmailCampaigns />
            ) : (
              <UpgradePrompt
                feature={isPt ? 'Campanhas de email' : isEs ? 'Campañas de correo' : 'Outbound email campaign automation'}
                requiredTier="Elite"
              />
            )}
            <ProviderAnalytics />
            <FollowerMarketingPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <ProviderIntegrationsManager />
            <ProviderOperationsLog />
            {isEliteOrAbove ? (
              <>
                <AutoReplySettings providerTier={providerTier} />
                <MessageTemplatesPanel providerTier={providerTier} />
              </>
            ) : (
              <UpgradePrompt
                feature="Automation settings and custom message templates"
                requiredTier="Elite"
              />
            )}
            {isPt || isEs ? (
              <TranslationPendingCard isEs={isEs} />
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

          <TabsContent value="partner" className="space-y-6">
            <PartnerCampaignCommandCenter />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

interface AppointmentRecord {
  conversationId: string;
  patientName: string;
  slotDate: string;
  slotTime: string;
  appointmentType: 'in_person' | 'teleconsult';
  status: string;
}

function UpcomingAppointments({ providerId }: { providerId: string }) {
  const navigate = useNavigate();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['upcoming-appointments', providerId],
    queryFn: async (): Promise<AppointmentRecord[]> => {
      const today = new Date().toISOString().split('T')[0];

      // Fetch conversations for this provider
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, customer_id')
        .eq('provider_id', providerId);

      if (!convos || convos.length === 0) return [];

      const convoIds = convos.map((c) => c.id);
      const customerIds = [...new Set(convos.map((c) => c.customer_id))];

      // Fetch messages that are appointment bookings
      const { data: msgs } = await supabase
        .from('messages')
        .select('content, conversation_id')
        .in('conversation_id', convoIds);

      if (!msgs) return [];

      // Fetch customer profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', customerIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [
          p.user_id,
          [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Patient',
        ]),
      );

      const convoCustomerMap = new Map(convos.map((c) => [c.id, c.customer_id]));

      const upcoming: AppointmentRecord[] = [];

      for (const msg of msgs) {
        try {
          const obj = JSON.parse(msg.content);
          if (
            obj.__type === 'appointment_booking' &&
            obj.slot_date &&
            obj.slot_date >= today
          ) {
            const customerId = convoCustomerMap.get(msg.conversation_id) ?? '';
            upcoming.push({
              conversationId: msg.conversation_id,
              patientName: profileMap.get(customerId) ?? 'Patient',
              slotDate: obj.slot_date,
              slotTime: obj.slot_time,
              appointmentType: obj.appointment_type ?? 'in_person',
              status: obj.status ?? 'confirmed',
            });
          }
        } catch {
          // not an appointment message
        }
      }

      return upcoming.sort((a, b) => {
        const da = `${a.slotDate}T${a.slotTime}`;
        const db = `${b.slotDate}T${b.slotTime}`;
        return da < db ? -1 : da > db ? 1 : 0;
      });
    },
    enabled: !!providerId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Upcoming Appointments
          {appointments.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {appointments.length} scheduled
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming appointments. Share your profile to start receiving bookings.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt, idx) => (
              <button
                key={`${appt.conversationId}-${idx}`}
                onClick={() => navigate(`/chat/${appt.conversationId}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors text-left"
              >
                <div className="p-2 bg-primary/10 rounded-full shrink-0">
                  {appt.appointmentType === 'teleconsult' ? (
                    <Video className="h-4 w-4 text-primary" />
                  ) : (
                    <MapPin className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{appt.patientName}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {new Date(appt.slotDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      · {appt.slotTime}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <span
                    className={[
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      appt.status === 'confirmed'
                        ? 'bg-green-500/10 text-green-600'
                        : 'bg-muted text-muted-foreground',
                    ].join(' ')}
                  >
                    {appt.appointmentType === 'teleconsult' ? 'Video' : 'In-person'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TranslationPendingCard({ isEs = false }: { isEs?: boolean }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center text-muted-foreground">
        {isEs
          ? 'Contenido de esta sección en traducción al español.'
          : 'Conteúdo desta seção em tradução para português.'}
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
