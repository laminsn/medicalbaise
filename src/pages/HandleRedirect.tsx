import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

export default function HandleRedirect() {
  const { handle } = useParams<{ handle: string }>();
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const resolveHandle = async () => {
      if (!handle) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // First check if handle belongs to a provider
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('handle', handle.toLowerCase())
        .maybeSingle();

      if (!profile) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Check if this user is a provider
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (provider) {
        setProviderId(provider.id);
      } else {
        // Not a provider, redirect to a generic profile view
        setNotFound(true);
      }
      setLoading(false);
    };

    resolveHandle();
  }, [handle]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (providerId) {
    return <Navigate to={`/provider/${providerId}`} replace />;
  }

  if (notFound) {
    return <Navigate to="/browse" replace />;
  }

  return null;
}
