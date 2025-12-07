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
import { ScheduledServicesSection } from '@/components/scheduling/ScheduledServicesSection';
import JobLocationMap from '@/components/map/JobLocationMap';
import { useAuth } from '@/hooks/useAuth';
import { 
  Briefcase, 
  Calendar, 
  Image, 
  MapPin,
  Loader2,
  Plus
} from 'lucide-react';

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('customerDashboard.title')}</h1>
            <p className="text-muted-foreground">{t('customerDashboard.subtitle')}</p>
          </div>
          <Button onClick={() => navigate('/post-job')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('nav.postJob')}
          </Button>
        </div>

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
