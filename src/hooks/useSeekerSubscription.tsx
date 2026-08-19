import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DEFAULT_SEEKER_PLAN,
  isSeekerPlan,
  type SeekerPlan,
} from '@/lib/constants/seekerPlans';

interface SeekerSubscriptionState {
  plan: SeekerPlan;
  status: string;
  transactionsUsed: number;
  currentPeriodEnd: string | null;
  loading: boolean;
}

const emptyState: SeekerSubscriptionState = {
  plan: DEFAULT_SEEKER_PLAN,
  status: 'active',
  transactionsUsed: 0,
  currentPeriodEnd: null,
  loading: true,
};

export function useSeekerSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SeekerSubscriptionState>(emptyState);

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ ...emptyState, loading: false });
      return;
    }

    const { data, error } = await supabase
      .from('seeker_subscriptions')
      .select('plan, status, transactions_used, current_period_end')
      .eq('user_id', user.id)
      .eq('app_key', 'medical')
      .maybeSingle();

    if (error) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const active = data?.status === 'active';
    const plan = active && isSeekerPlan(data?.plan) ? data.plan : DEFAULT_SEEKER_PLAN;

    setState({
      plan,
      status: data?.status || 'active',
      transactionsUsed: data?.transactions_used ?? 0,
      currentPeriodEnd: data?.current_period_end ?? null,
      loading: false,
    });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startCheckout = async (plan: Exclude<SeekerPlan, 'flex'>) => {
    const { data, error } = await supabase.functions.invoke('create-seeker-checkout', {
      body: { plan },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  };

  return {
    ...state,
    refresh,
    startCheckout,
  };
}
