import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FollowerStats {
  followersCount: number;
  followingCount: number;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Fetch follower + following counts for a given provider.
 * followersCount = how many users follow THIS provider
 * followingCount = how many providers THIS provider's user follows (optional, only if userId is provided)
 */
export function useFollowerStats(providerId: string | null | undefined): FollowerStats {
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!providerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Get followers count (people who follow this provider)
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_provider_id', providerId);

    setFollowersCount(followers || 0);

    // For "following" we'd need the provider's user_id first
    // Get provider's user_id, then count how many providers they follow
    const { data: providerData } = await supabase
      .from('providers')
      .select('user_id')
      .eq('id', providerId)
      .maybeSingle();

    if (providerData?.user_id) {
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', providerData.user_id);

      setFollowingCount(following || 0);
    }

    setIsLoading(false);
  }, [providerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { followersCount, followingCount, isLoading, refetch: fetchStats };
}
