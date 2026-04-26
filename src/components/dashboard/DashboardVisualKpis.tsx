import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface VisualDatum {
  label: string;
  value: number;
}

interface KpiMeter {
  label: string;
  value: number;
  detail: string;
}

interface DashboardVisualKpisProps {
  title: string;
  description: string;
  ratingLabel: string;
  ratingValue?: number;
  ratingDetail: string;
  revenueLabel: string;
  revenueValue: string;
  revenueDetail: string;
  timelineLabel: string;
  timelineData: VisualDatum[];
  barLabel: string;
  barData: VisualDatum[];
  meters: KpiMeter[];
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
};

export function DashboardVisualKpis({
  title,
  description,
  ratingLabel,
  ratingValue,
  ratingDetail,
  revenueLabel,
  revenueValue,
  revenueDetail,
  timelineLabel,
  timelineData,
  barLabel,
  barData,
  meters,
}: DashboardVisualKpisProps) {
  const ratingPercent = Math.min(100, Math.max(0, ((ratingValue || 0) / 5) * 100));
  const safeTimelineData = timelineData.length ? timelineData : [{ label: 'Start', value: 0 }];
  const safeBarData = barData.length ? barData : [{ label: 'Start', value: 0 }];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4 text-amber-500" />
                {ratingLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">
                  {ratingValue ? ratingValue.toFixed(1) : 'New'}
                </p>
                <p className="text-xs text-muted-foreground">/ 5.0</p>
              </div>
              <Progress value={ratingPercent} className="mt-4 h-2" />
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{ratingDetail}</p>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                {revenueLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">{revenueValue}</p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{revenueDetail}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-sky-600" />
                {timelineLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={safeTimelineData} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{barLabel}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safeBarData} margin={{ left: -18, right: 8, top: 12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} className="text-xs" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {meters.map((meter) => (
          <Card key={meter.label} className="rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">{meter.label}</p>
                <p className="text-sm font-semibold tabular-nums">{meter.value}%</p>
              </div>
              <Progress value={meter.value} className="mt-3 h-2" />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{meter.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
