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
import { Shield, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have admin permissions.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | MD Baise</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-destructive/10">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users, credits, and promotions</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="promos">Promos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AdminOverview />
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
          </Tabs>
        </div>
      </AppLayout>
    </>
  );
}
