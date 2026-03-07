import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import DoctorProfile from './DoctorProfile';
import ProviderProfile from './ProviderProfile';

export default function ProviderProfileRouter() {
  const { id } = useParams<{ id: string }>();

  const { data: providerType, isLoading } = useQuery({
    queryKey: ['provider-type-by-id', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('providers')
        .select('provider_type')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data?.provider_type ?? null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });

  if (!id) {
    return <Navigate to="/browse" replace />;
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (providerType === 'healthcare') {
    return <DoctorProfile />;
  }

  return <ProviderProfile />;
}
