import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActiveJobsSection } from '@/components/dashboard/ActiveJobsSection';
import { CustomerWorkApprovals } from '@/components/dashboard/CustomerWorkApprovals';
import { DashboardCommandCenter } from '@/components/dashboard/DashboardCommandCenter';
import { DashboardVisualKpis } from '@/components/dashboard/DashboardVisualKpis';
import { ScheduledServicesSection } from '@/components/scheduling/ScheduledServicesSection';
import JobLocationMap from '@/components/map/JobLocationMap';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Briefcase, 
  Calendar, 
  Image, 
  MapPin,
  Loader2,
  Plus,
  ClipboardList,
  Clock,
  CheckCircle,
  Search,
  MessageSquare
} from 'lucide-react';

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data: counts } = useQuery({
    queryKey: ['dashboard-counts', user?.id],
    queryFn: async () => {
      if (!user) return { jobs: 0, scheduled: 0, approvals: 0 };

      const { data: activeJobs } = await supabase
        .from('active_jobs')
        .select('id')
        .eq('customer_id', user.id);

      const jobIds = activeJobs?.map((job) => job.id) || [];

      const [jobsRes, scheduledRes, approvalsRes] = await Promise.all([
        supabase
          .from('active_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .in('job_status', ['pending_start', 'in_progress']),
        supabase
          .from('scheduled_services')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .eq('status', 'active'),
        jobIds.length > 0
          ? supabase
              .from('work_approval_media')
              .select('id', { count: 'exact', head: true })
              .in('active_job_id', jobIds)
              .eq('status', 'pending')
          : Promise.resolve({ count: 0 }),
      ]);

      return {
        jobs: jobsRes.count || 0,
        scheduled: scheduledRes.count || 0,
        approvals: approvalsRes.count || 0,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <Helmet>
          <title>{t('customerDashboard.title')} | Brasil Base</title>
        </Helmet>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardHeader>
              <CardTitle>{t('customerDashboard.loginRequired.title')}</CardTitle>
              <CardDescription>{t('customerDashboard.loginRequired.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')}>
                {t('auth.signIn')}
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
        <title>{t('customerDashboard.title')} | Brasil Base</title>
        <meta name="description" content={t('customerDashboard.description')} />
      </Helmet>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <DashboardCommandCenter
          eyebrow="Medical Baise"
          title={t('customerDashboard.title', 'My Dashboard')}
          description={t('customerDashboard.subtitle', 'Track appointments, healthcare service requests, approvals, and provider conversations from one workspace.')}
          badge={counts?.approvals ? `${counts.approvals} pending approval${counts.approvals === 1 ? '' : 's'}` : 'All clear'}
          focus={{
            label: 'Priority',
            title: counts?.approvals ? 'Review care updates waiting on you' : 'Your patient workspace is clear',
            description: counts?.approvals
              ? 'Check provider media, approve completed work, or request changes before the care request closes.'
              : 'Start a care request, browse providers, or check messages when something needs attention.',
            icon: counts?.approvals ? CheckCircle : ClipboardList,
            tone: counts?.approvals ? 'amber' : 'green',
            actionLabel: counts?.approvals ? 'Open approvals' : 'Post a request',
            onAction: () => counts?.approvals ? setActiveTab('approvals') : navigate('/post-job'),
          }}
          metrics={[
            {
              label: t('customerDashboard.stats.activeJobs', 'Active Jobs'),
              value: counts?.jobs || 0,
              detail: 'Open healthcare requests and active care services.',
              icon: ClipboardList,
              tone: 'blue',
            },
            {
              label: t('customerDashboard.stats.scheduled', 'Scheduled'),
              value: counts?.scheduled || 0,
              detail: 'Upcoming appointments and recurring services.',
              icon: Clock,
              tone: 'green',
            },
            {
              label: t('customerDashboard.stats.pendingApprovals', 'Pending'),
              value: counts?.approvals || 0,
              detail: 'Care updates or work media waiting for review.',
              icon: CheckCircle,
              tone: 'amber',
            },
            {
              label: 'Workspace',
              value: 'Patient',
              detail: 'Built for booking, tracking, and follow-up.',
              icon: Briefcase,
              tone: 'purple',
            },
          ]}
          actions={[
            {
              label: t('nav.postJob', 'Post a Job'),
              description: 'Request healthcare help with specialty, location, and timing.',
              icon: Plus,
              onClick: () => navigate('/post-job'),
            },
            {
              label: 'Browse providers',
              description: 'Find doctors and healthcare professionals by specialty.',
              icon: Search,
              onClick: () => navigate('/browse'),
            },
            {
              label: 'Messages',
              description: 'Review provider conversations and follow-ups.',
              icon: MessageSquare,
              onClick: () => navigate('/messages'),
            },
          ]}
        />

        <DashboardVisualKpis
          title="Visual KPI snapshot"
          description="A quick read on care requests, approvals, scheduled visits, and patient follow-through."
          ratingLabel="Provider rating signal"
          ratingDetail="Ratings appear after completed care interactions, helping you compare providers over time."
          revenueLabel="Care spend visibility"
          revenueValue="Tracked per request"
          revenueDetail="Approved services and payments stay connected to each healthcare request."
          timelineLabel="Care timeline"
          timelineData={[
            { label: 'Active', value: counts?.jobs || 0 },
            { label: 'Scheduled', value: counts?.scheduled || 0 },
            { label: 'Approvals', value: counts?.approvals || 0 },
            { label: 'Clear', value: counts?.approvals ? 0 : 1 },
          ]}
          barLabel="Care workload mix"
          barData={[
            { label: 'Requests', value: counts?.jobs || 0 },
            { label: 'Visits', value: counts?.scheduled || 0 },
            { label: 'Reviews', value: counts?.approvals || 0 },
          ]}
          meters={[
            {
              label: 'Approval health',
              value: counts?.approvals ? Math.max(30, 100 - counts.approvals * 20) : 100,
              detail: counts?.approvals ? 'Care updates need review.' : 'No review blockers right now.',
            },
            {
              label: 'Schedule coverage',
              value: counts?.scheduled ? 88 : 45,
              detail: counts?.scheduled ? 'You have upcoming care on the calendar.' : 'Schedule services to improve continuity.',
            },
            {
              label: 'Follow-up readiness',
              value: counts?.jobs || counts?.scheduled ? 82 : 58,
              detail: 'Use requests, messages, and provider search to keep care moving.',
            },
          ]}
        />

        {/* Main Tabs */}
        <Tabs defaultValue="jobs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
            <TabsTrigger value="jobs" className="gap-2 py-3">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">{t('customerDashboard.tabs.jobs')}</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2 py-3">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">{t('customerDashboard.tabs.scheduled')}</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2 py-3">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">{t('customerDashboard.tabs.approvals')}</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2 py-3">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{t('customerDashboard.tabs.map')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-6">
            <ActiveJobsSection onSelectJob={setSelectedJobId} />
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <ScheduledServicesSection />
          </TabsContent>

          <TabsContent value="approvals" className="space-y-6">
            <CustomerWorkApprovals />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            {selectedJobId ? (
              <JobLocationMap activeJobId={selectedJobId} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">{t('customerDashboard.map.selectJob')}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {t('customerDashboard.map.description')}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      const tabsList = document.querySelector('[value="jobs"]');
                      if (tabsList) (tabsList as HTMLElement).click();
                    }}
                  >
                    {t('customerDashboard.map.viewJobs')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
