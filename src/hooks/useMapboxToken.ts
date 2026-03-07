import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MapboxTokenResponse {
  token?: string;
  error?: string;
}

export const useMapboxToken = () => {
  return useQuery({
    queryKey: ['mapbox-token'],
    queryFn: async () => {
      const envToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();

      const { data, error } = await supabase.functions.invoke<MapboxTokenResponse>('get-mapbox-token');

      if (!error && data?.token) {
        return data.token;
      }

      if (envToken) {
        return envToken;
      }

      if (error) {
        throw new Error(error.message || 'Failed to load map token');
      }

      throw new Error('Mapbox token not configured');
    },
    staleTime: Infinity,
  });
};
