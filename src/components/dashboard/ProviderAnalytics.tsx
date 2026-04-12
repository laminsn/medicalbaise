import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Star, Eye, MessageSquare, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { useProviderAnalytics } from '@/hooks/useProviderAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/currency';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  positive?: boolean;
  loading?: boolean;
}

function StatCard({ title, value, change, icon, positive = true, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-20 mt-1" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {change && !loading && (
              <p className={`text-xs ${positive ? 'text-green-500' : 'text-red-500'}`}>
                {positive ? '+' : ''}{change} vs last month
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProviderAnalytics() {
  const { t } = useTranslation();
  const { analytics, loading } = useProviderAnalytics();

  const formatCurrency = (value: number) => {
    return formatPrice(value);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('dashboard.analytics.totalJobs')}
          value={analytics?.totalJobs ?? 0}
          icon={<CheckCircle className="h-5 w-5 text-primary" />}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.analytics.totalRevenue')}
          value={formatCurrency(analytics?.totalRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.analytics.avgRating')}
          value={analytics?.avgRating?.toFixed(1) ?? '0.0'}
          icon={<Star className="h-5 w-5 text-primary" />}
          loading={loading}
        />
        <StatCard
          title={t('dashboard.analytics.profileViews')}
          value={analytics?.profileViews?.toLocaleString() ?? '0'}
          icon={<Eye className="h-5 w-5 text-primary" />}
          loading={loading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('dashboard.analytics.revenueOverTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics?.monthlyData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Jobs Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('dashboard.analytics.jobsCompleted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics?.monthlyData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="jobs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown & Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.analytics.serviceBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics?.serviceBreakdown ?? []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(analytics?.serviceBreakdown ?? []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {(analytics?.serviceBreakdown ?? []).map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-muted-foreground">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('dashboard.analytics.quickStats')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="text-sm">{t('dashboard.analytics.responseRate')}</span>
              </div>
              {loading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="font-semibold">{analytics?.responseRate ?? 0}%</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm">{t('dashboard.analytics.repeatCustomers')}</span>
              </div>
              {loading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="font-semibold">{analytics?.repeatCustomers ?? 0}%</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm">{t('dashboard.analytics.avgCompletionTime')}</span>
              </div>
              {loading ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <span className="font-semibold">{analytics?.avgCompletionDays ?? 0} {t('common.days')}</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">{t('dashboard.analytics.completionRate')}</span>
              </div>
              {loading ? (
                <Skeleton className="h-5 w-12" />
              ) : (
                <span className="font-semibold">{analytics?.completionRate ?? 0}%</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
