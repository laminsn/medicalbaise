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
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 0,
    avgRating: 0,
    totalReviews: 0,
    unreadMessages: 0,
  });

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      const [providerResult, activeJobsResult, unreadResult] = await Promise.all([
        supabase
          .from('providers')
          .select('avg_rating, total_reviews')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('active_jobs')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', user.id)
          .eq('status', 'in_progress'),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false),
      ]);

      setStats({
        activeJobs: activeJobsResult.count ?? 0,
        avgRating: providerResult.data?.avg_rating ?? 0,
        totalReviews: providerResult.data?.total_reviews ?? 0,
        unreadMessages: unreadResult.count ?? 0,
      });
    };

    loadStats();
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
