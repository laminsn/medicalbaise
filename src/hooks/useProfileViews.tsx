import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useTrackProfileView(providerId: string | undefined, source: string = 'browse') {
  const { user } = useAuth();

  useEffect(() => {
    if (!providerId) return;

    // Don't track if viewing own profile
    const trackView = async () => {
      try {
        // Check if this is the provider's own profile
        const { data: provider } = await supabase
          .from('providers')
          .select('user_id')
          .eq('id', providerId)
          .maybeSingle();

        if (provider?.user_id === user?.id) return;

        // Insert the view
        await supabase
          .from('profile_views')
          .insert({
            provider_id: providerId,
            viewer_id: user?.id || null,
            source,
          });
      } catch (error) {
        // Silently fail - don't affect user experience
        console.error('Error tracking profile view:', error);
      }
    };

    trackView();
  }, [providerId, user?.id, source]);
}
