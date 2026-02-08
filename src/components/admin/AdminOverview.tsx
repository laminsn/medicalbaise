import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, Briefcase, FileText, DollarSign } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProviders: number;
  totalJobs: number;
  totalReferrals: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProviders: 0,
    totalJobs: 0,
    totalReferrals: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, providersRes, jobsRes, referralsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('jobs_posted').select('id', { count: 'exact', head: true }),
        supabase.from('referrals').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalProviders: providersRes.count || 0,
        totalJobs: jobsRes.count || 0,
        totalReferrals: referralsRes.count || 0,
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Providers', value: stats.totalProviders, icon: Briefcase, color: 'text-green-500' },
    { title: 'Jobs Posted', value: stats.totalJobs, icon: FileText, color: 'text-amber-500' },
    { title: 'Referrals', value: stats.totalReferrals, icon: DollarSign, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold">
                      {loading ? '...' : card.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${card.color} opacity-50`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>• Use the <strong>Users</strong> tab to search, view, and edit any user account</li>
            <li>• Use the <strong>Credits</strong> tab to adjust user credit balances</li>
            <li>• Use the <strong>Promos</strong> tab to create referral bonuses and partner perks</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
