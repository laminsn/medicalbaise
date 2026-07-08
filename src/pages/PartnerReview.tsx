import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2, ShieldAlert } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminPartnerApplications } from '@/components/admin/AdminPartnerApplications';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export default function PartnerReview() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const { data, error } = await db.rpc('is_admin_or_moderator');
      setAllowed(Boolean(data) && !error);
      setLoading(false);
    };

    void checkAccess();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!allowed) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <ShieldAlert className="mb-4 h-12 w-12 text-destructive" />
          <h1 className="text-xl font-semibold">Partner review access required</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This review queue is available to super admins and selected staff profiles only.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Partner Review | Baise</title>
      </Helmet>
      <AppLayout>
        <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
          <AdminPartnerApplications />
        </div>
      </AppLayout>
    </>
  );
}
