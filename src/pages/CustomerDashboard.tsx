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
import { PrintableDashboard } from '@/components/dashboard/PrintableDashboard';
import { ScheduledServicesSection } from '@/components/scheduling/ScheduledServicesSection';
import { ClientTransactionHistory } from '@/components/payments/ClientTransactionHistory';
import { ClientInsightSurvey } from '@/components/products/ClientInsightSurvey';
import { ClientProductAddOns } from '@/components/products/ClientProductAddOns';
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
  MessageSquare,
  ReceiptText
} from 'lucide-react';

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('jobs');
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

      const [jobsRes, scheduledRes, approvalsRes, signoffsRes] = await Promise.all([
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
        supabase
          .from('provider_work_signoffs')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', user.id)
          .eq('status', 'requested'),
      ]);

      return {
        jobs: jobsRes.count || 0,
        scheduled: scheduledRes.count || 0,
        approvals: (approvalsRes.count || 0) + (signoffsRes.count || 0),
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
          <title>{t('customerDashboard.title')} | MD Baise</title>
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
        <title>{t('customerDashboard.title')} | MD Baise</title>
        <meta name="description" content={t('customerDashboard.description')} />
      </Helmet>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <DashboardCommandCenter
          eyebrow="MD Baise"
          title={t('customerDashboard.title', 'My Dashboard')}
          description={t('customerDashboard.subtitle', 'Track appointments, healthcare service requests, approvals, and provider conversations from one workspace.')}
          badge={counts?.approvals ? `${counts.approvals} pending approval${counts.approvals === 1 ? '' : 's'}` : t('customerDashboard.cc.allClear', "All clear")}
          focus={{
            label: t('customerDashboard.cc.priority', "Priority"),
            title: counts?.approvals ? t('customerDashboard.cc.reviewCareUpdatesWaiting', "Review care updates waiting on you") : t('customerDashboard.cc.yourPatientWorkspaceIs', "Your patient workspace is clear"),
            description: counts?.approvals
              ? 'Check provider media, approve completed work, or request changes before the care request closes.'
              : 'Start a care request, browse providers, or check messages when something needs attention.',
            icon: counts?.approvals ? CheckCircle : ClipboardList,
            tone: counts?.approvals ? 'amber' : 'green',
            actionLabel: counts?.approvals ? t('customerDashboard.cc.openApprovals', "Open approvals") : t('customerDashboard.cc.postARequest', "Post a request"),
            onAction: () => counts?.approvals ? setActiveTab('approvals') : navigate('/post-job'),
          }}
          metrics={[
            {
              label: t('customerDashboard.stats.activeJobs', 'Active Jobs'),
              value: counts?.jobs || 0,
              detail: t('customerDashboard.cc.openHealthcareRequestsAnd', "Open healthcare requests and active care services."),
              icon: ClipboardList,
              tone: 'blue',
            },
            {
              label: t('customerDashboard.stats.scheduled', t('customerDashboard.cc.scheduled', "Scheduled")),
              value: counts?.scheduled || 0,
              detail: t('customerDashboard.cc.upcomingAppointmentsAndRecurring', "Upcoming appointments and recurring services."),
              icon: Clock,
              tone: 'green',
            },
            {
              label: t('customerDashboard.stats.pendingApprovals', 'Pending'),
              value: counts?.approvals || 0,
              detail: t('customerDashboard.cc.careUpdatesOrWork', "Care updates or work media waiting for review."),
              icon: CheckCircle,
              tone: 'amber',
            },
            {
              label: t('customerDashboard.cc.workspace', "Workspace"),
              value: t('customerDashboard.cc.patient', "Patient"),
              detail: t('customerDashboard.cc.builtForBookingTracking', "Built for booking, tracking, and follow-up."),
              icon: Briefcase,
              tone: 'purple',
            },
          ]}
          actions={[
            {
              label: t('nav.postJob', 'Post a Job'),
              description: t('customerDashboard.cc.requestHealthcareHelpWith', "Request healthcare help with specialty, location, and timing."),
              icon: Plus,
              onClick: () => navigate('/post-job'),
            },
            {
              label: t('customerDashboard.cc.browseProviders', "Browse providers"),
              description: t('customerDashboard.cc.findDoctorsAndHealthcare', "Find doctors and healthcare professionals by specialty."),
              icon: Search,
              onClick: () => navigate('/browse'),
            },
            {
              label: t('customerDashboard.cc.messages', "Messages"),
              description: t('customerDashboard.cc.reviewProviderConversationsAnd', "Review provider conversations and follow-ups."),
              icon: MessageSquare,
              onClick: () => navigate('/messages'),
            },
          ]}
        />

        <DashboardVisualKpis
          title={t('customerDashboard.cc.visualKpiSnapshot', "Visual KPI snapshot")}
          description={t('customerDashboard.cc.aQuickReadOn', "A quick read on care requests, approvals, scheduled visits, and patient follow-through.")}
          ratingLabel={t('customerDashboard.cc.providerRatingSignal', "Provider rating signal")}
          ratingDetail={t('customerDashboard.cc.ratingsAppearAfterCompleted', "Ratings appear after completed care interactions, helping you compare providers over time.")}
          revenueLabel={t('customerDashboard.cc.careSpendVisibility', "Care spend visibility")}
          revenueValue={t('customerDashboard.cc.trackedPerRequest', "Tracked per request")}
          revenueDetail={t('customerDashboard.cc.approvedServicesAndPayments', "Approved services and payments stay connected to each healthcare request.")}
          timelineLabel={t('customerDashboard.cc.careTimeline', "Care timeline")}
          timelineData={[
            { label: 'Active', value: counts?.jobs || 0 },
            { label: t('customerDashboard.cc.scheduled', "Scheduled"), value: counts?.scheduled || 0 },
            { label: 'Approvals', value: counts?.approvals || 0 },
            { label: 'Clear', value: counts?.approvals ? 0 : 1 },
          ]}
          barLabel={t('customerDashboard.cc.careWorkloadMix', "Care workload mix")}
          barData={[
            { label: 'Requests', value: counts?.jobs || 0 },
            { label: 'Visits', value: counts?.scheduled || 0 },
            { label: 'Reviews', value: counts?.approvals || 0 },
          ]}
          meters={[
            {
              label: t('customerDashboard.cc.approvalHealth', "Approval health"),
              value: counts?.approvals ? Math.max(30, 100 - counts.approvals * 20) : 100,
              detail: counts?.approvals ? t('customerDashboard.cc.careUpdatesNeedReview', "Care updates need review.") : t('customerDashboard.cc.noReviewBlockersRight', "No review blockers right now."),
            },
            {
              label: t('customerDashboard.cc.scheduleCoverage', "Schedule coverage"),
              value: counts?.scheduled ? 88 : 45,
              detail: counts?.scheduled ? t('customerDashboard.cc.youHaveUpcomingCare', "You have upcoming care on the calendar.") : t('customerDashboard.cc.scheduleServicesToImprove', "Schedule services to improve continuity."),
            },
            {
              label: t('customerDashboard.cc.followUpReadiness', "Follow-up readiness"),
              value: counts?.jobs || counts?.scheduled ? 82 : 58,
              detail: t('customerDashboard.cc.useRequestsMessagesAnd', "Use requests, messages, and provider search to keep care moving."),
            },
          ]}
        />

        <PrintableDashboard
          brandName="MD Baise"
          audience="client"
          title={t('customerDashboard.cc.printablePatientDashboard', "Printable patient dashboard")}
          subtitle={t('customerDashboard.cc.aCleanClientReport', "A clean client report for healthcare service tracking: active requests, scheduled visits, approvals, receipts, follow-up, and records in one printable view.")}
          accountLabel={t('customerDashboard.cc.patientWorkspace', "Patient workspace")}
          generatedFor={user?.email}
          metrics={[
            {
              label: t('customerDashboard.cc.activeRequests', "Active requests"),
              value: counts?.jobs || 0,
              detail: t('customerDashboard.cc.openHealthcareRequestsAnd', "Open healthcare requests and active care services currently in motion."),
            },
            {
              label: t('customerDashboard.cc.scheduled', "Scheduled"),
              value: counts?.scheduled || 0,
              detail: t('customerDashboard.cc.upcomingVisitsOrRecurring', "Upcoming visits or recurring services."),
            },
            {
              label: t('customerDashboard.cc.pendingApprovals', "Pending approvals"),
              value: counts?.approvals || 0,
              detail: t('customerDashboard.cc.careUpdatesWorkMedia', "Care updates, work media, or sign-offs waiting for review."),
            },
            {
              label: t('customerDashboard.cc.workspace', "Workspace"),
              value: t('customerDashboard.cc.patient', "Patient"),
              detail: t('customerDashboard.cc.builtForBookingTracking', "Built for booking, tracking, approving, and saving care records."),
            },
          ]}
          sections={[
            {
              title: t('customerDashboard.cc.careTrackingSummary', "Care tracking summary"),
              items: [
                t('customerDashboard.cc.openRequestsScheduledVisits', "Open requests, scheduled visits, provider messages, and approvals are managed in the portal."),
                t('customerDashboard.cc.eachServiceCanKeep', "Each service can keep its quote, invoice, payment status, follow-up notes, and activity history together."),
                t('customerDashboard.cc.approvalsAndSignOffs', "Approvals and sign-offs help keep care moving while preserving proof of what happened."),
              ],
            },
            {
              title: t('customerDashboard.cc.patientRecordsSummary', "Patient records summary"),
              items: [
                t('customerDashboard.cc.receiptsInvoicesServiceHistory', "Receipts, invoices, service history, and provider details remain available through transaction history."),
                t('customerDashboard.cc.monthlyMonthToDate', "Monthly, month-to-date, annual, and custom transaction filters support proof and tax records."),
                t('customerDashboard.cc.messagesSignaturesFilesAnd', "Messages, signatures, files, and decisions should stay inside the portal whenever the record matters."),
              ],
            },
          ]}
          nextSteps={[
            counts?.approvals ? t('customerDashboard.cc.reviewPendingApprovalsSo', "Review pending approvals so your care request can continue.") : 'Start a new care request or browse providers when you need support.',
            t('customerDashboard.cc.downloadOrPrintReceipts', "Download or print receipts and invoices for any service that may matter later."),
            t('customerDashboard.cc.keepMessagesFilesSignatures', "Keep messages, files, signatures, and service decisions inside the portal for a clean history."),
          ]}
          recordsChecklist={[
            t('customerDashboard.cc.invoicesReceiptsTransactionHistory', "Invoices, receipts, transaction history, and payment status."),
            t('customerDashboard.cc.providerNameServiceDescription', "Provider name, service description, timestamps, and care details."),
            t('customerDashboard.cc.uploadedFilesWorkApprovals', "Uploaded files, work approvals, notes, and signed records."),
            t('customerDashboard.cc.monthlyQuarterlyAnnualAnd', "Monthly, quarterly, annual, and custom transaction exports when needed."),
          ]}
        />

        <ClientInsightSurvey />

        <ClientProductAddOns />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
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
            <TabsTrigger value="payments" className="gap-2 py-3">
              <ReceiptText className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
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

          <TabsContent value="payments" className="space-y-6">
            <ClientTransactionHistory />
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
                    onClick={() => setActiveTab('jobs')}
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
