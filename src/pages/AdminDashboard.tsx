import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Shield, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');

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
        <title>{t('admin.title')} | MDBaise</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-destructive/10">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('admin.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('admin.subtitle')}</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="w-full overflow-x-auto flex">
              <TabsTrigger value="overview" className="flex-1">{t('admin.overview')}</TabsTrigger>
              <TabsTrigger value="all-users" className="flex-1">{isPt ? 'Todos os usuários' : 'All Users'}</TabsTrigger>
              <TabsTrigger value="users" className="flex-1">{t('admin.users')}</TabsTrigger>
              <TabsTrigger value="credits" className="flex-1">{t('admin.credits')}</TabsTrigger>
              <TabsTrigger value="promos" className="flex-1">{t('admin.promos')}</TabsTrigger>
              <TabsTrigger value="campaigns" className="flex-1">{isPt ? 'Campanhas' : 'Campaigns'}</TabsTrigger>
            </TabsList>

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
              {isPt ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                  Conteúdo de campanhas em tradução para português.
                </div>
              ) : (
                <AdminEmailCampaigns />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
