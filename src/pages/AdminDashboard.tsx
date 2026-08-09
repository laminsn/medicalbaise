import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { AdminCreditManager } from '@/components/admin/AdminCreditManager';
import { AdminPromoManager } from '@/components/admin/AdminPromoManager';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminAllUsers } from '@/components/admin/AdminAllUsers';
import { AdminEmailCampaigns } from '@/components/admin/AdminEmailCampaigns';
import { AdminPartnerApplications } from '@/components/admin/AdminPartnerApplications';
import { AdminGrowthHub } from '@/components/admin/AdminGrowthHub';
import { BarChart3, FlaskConical, Loader2, Shield } from 'lucide-react';
import { AdminPilotCohort } from '@/components/admin/AdminPilotCohort';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!user || !isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <Shield className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">{t('admin.accessDenied')}</h2>
          <p className="text-muted-foreground">{t('admin.noPermission')}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('admin.title')} | MD Baise</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-destructive/10">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('admin.subtitle')}</p>
            </div>
          </div>

          <Tabs defaultValue="growth" className="space-y-6">
            <TabsList className="flex h-auto w-full flex-wrap overflow-x-auto">
              <TabsTrigger value="growth" className="flex-1 gap-1.5">
                <BarChart3 className="h-4 w-4" />
                Growth Hub
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex-1">{t('admin.overview')}</TabsTrigger>
              <TabsTrigger value="all-users" className="flex-1">{isPt ? 'Todos os usuários' : isEs ? 'Todos los usuários' : 'All Users'}</TabsTrigger>
              <TabsTrigger value="users" className="flex-1">{t('admin.users')}</TabsTrigger>
              <TabsTrigger value="credits" className="flex-1">{t('admin.credits')}</TabsTrigger>
              <TabsTrigger value="promos" className="flex-1">{t('admin.promos')}</TabsTrigger>
              <TabsTrigger value="campaigns" className="flex-1">{isPt ? 'Campanhas' : isEs ? 'Campañas' : 'Campaigns'}</TabsTrigger>
              <TabsTrigger value="partners" className="flex-1">{isPt ? 'Parceiros' : isEs ? 'Socios' : 'Partners'}</TabsTrigger>
              <TabsTrigger value="pilot" className="flex-1 gap-1.5">
                <FlaskConical className="h-4 w-4" />
                {isPt ? 'Piloto' : isEs ? 'Piloto' : 'Pilot'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="growth">
              <AdminGrowthHub />
            </TabsContent>

            <TabsContent value="overview">
              <AdminOverview />
            </TabsContent>

            <TabsContent value="all-users">
              <AdminAllUsers />
            </TabsContent>

            <TabsContent value="users">
              <AdminUserManagement />
            </TabsContent>

            <TabsContent value="credits">
              <AdminCreditManager />
            </TabsContent>

            <TabsContent value="promos">
              <AdminPromoManager />
            </TabsContent>

            <TabsContent value="campaigns">
              <AdminEmailCampaigns />
            </TabsContent>

            <TabsContent value="partners">
              <AdminPartnerApplications />
            </TabsContent>

            <TabsContent value="pilot">
              <AdminPilotCohort />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
