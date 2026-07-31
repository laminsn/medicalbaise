import { useEffect, useState } from 'react';
import { Briefcase, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  activeJobs: number;
  avgRating: number;
  totalReviews: number;
  unreadMessages: number;
}

export function DashboardOverview() {
  const { user } = useAuth();
  const [loadError, setLoadError] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    avgRating: 0,
    totalReviews: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadStats = async () => {
      try {
        setLoadError(false);
        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('id, avg_rating, total_reviews')
          .eq('user_id', user.id)
          .maybeSingle();

        if (providerError) throw providerError;
        if (!provider) {
          if (!cancelled) {
            setStats({ activeJobs: 0, avgRating: 0, totalReviews: 0, unreadMessages: 0 });
          }
          return;
        }

        const [activeJobsResult, conversationsResult] = await Promise.all([
          supabase
            .from('active_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('provider_id', user.id)
            .eq('job_status', 'in_progress'),
          supabase
            .from('conversations')
            .select('id')
            .eq('provider_id', provider.id),
        ]);

        if (activeJobsResult.error) throw activeJobsResult.error;
        if (conversationsResult.error) throw conversationsResult.error;

        const conversationIds = (conversationsResult.data || []).map(({ id }) => id);
        let unreadMessages = 0;

        if (conversationIds.length > 0) {
          const unreadResult = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .neq('sender_id', user.id)
            .eq('is_read', false);

          if (unreadResult.error) throw unreadResult.error;
          unreadMessages = unreadResult.count ?? 0;
        }

        if (!cancelled) {
          setStats({
            activeJobs: activeJobsResult.count ?? 0,
            avgRating: provider.avg_rating ?? 0,
            totalReviews: provider.total_reviews ?? 0,
            unreadMessages,
          });
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const cards = [
    {
      label: 'Active Appointments',
      value: stats.activeJobs,
      icon: Briefcase,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Rating',
      value: stats.avgRating ? `${stats.avgRating.toFixed(1)} ★` : 'New',
      icon: Star,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Reviews',
      value: stats.totalReviews,
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Unread Messages',
      value: stats.unreadMessages,
      icon: MessageSquare,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {loadError && (
        <p
          role="alert"
          className="col-span-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          Dashboard stats are temporarily unavailable. Your account data is still safe.
        </p>
      )}
      {cards.map((card) => (
        <div key={card.label} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-md ${card.bg}`}>
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </div>
          <p className="text-xl font-bold text-foreground">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
