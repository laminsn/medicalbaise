import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export function useFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavoriteIds();
    } else {
      setFavoriteIds(new Set());
    }
  }, [user]);

  const fetchFavoriteIds = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('provider_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavoriteIds(new Set(data?.map(f => f.provider_id) || []));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = useCallback(async (providerId: string, providerName: string) => {
    if (!user) {
      toast({
        title: t('auth.signIn'),
        description: t('favorites.loginRequired'),
      });
      return;
    }

    setLoading(true);
    const isFavorited = favoriteIds.has(providerId);

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('provider_id', providerId);

        if (error) throw error;

        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(providerId);
          return next;
        });

        toast({
          title: t('favorites.removed'),
          description: t('favorites.removedDescription', { name: providerName }),
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, provider_id: providerId });

        if (error) throw error;

        setFavoriteIds(prev => new Set(prev).add(providerId));

        toast({
          title: t('favorites.added'),
          description: t('favorites.addedDescription', { name: providerName }),
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: t('common.error'),
        description: t('favorites.removeError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, favoriteIds, toast, t]);

  const isFavorited = useCallback((providerId: string) => {
    return favoriteIds.has(providerId);
  }, [favoriteIds]);

  return {
    favoriteIds,
    toggleFavorite,
    isFavorited,
    loading,
  };
}