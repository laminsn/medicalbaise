import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BarChart3, BrainCircuit, Loader2, MapPin, RefreshCcw, ShoppingBag, Target, Users, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const db = supabase as any;

type MarketingMetric = {
  metric_key: string;
  metric_label: string;
  metric_value: number;
  detail: string | null;
};

type AudienceBreakdown = {
  dimension: string;
  label: string;
  audience_count: number;
  buyer_count: number;
  buyer_rate: number;
  avg_fit_score: number;
  recommendation_count: number;
};

type ProductHabit = {
  product_key: string;
  product_name: string;
  product_family: string;
  audience: string;
  active_registrations: number;
  trial_registrations: number;
  recommendation_count: number;
  accepted_recommendations: number;
  campaign_events: number;
  email_events: number;
  push_events: number;
  estimated_monthly_value: number;
};

type SnapshotGuidance = {
  primary_audience?: string;
  suggested_locations?: Record<string, string | null>;
  value_angles?: string[];
  creative_hooks?: string[];
  retargeting_signals?: string[];
  exclude_or_review?: string[];
};

type MarketingSnapshot = {
  id: string;
  snapshot_key: string;
  total_profiles: number;
  active_buyers: number;
  top_occupation: string | null;
  top_revenue_range: string | null;
  top_region: string | null;
  top_city: string | null;
  top_state: string | null;
  top_country: string | null;
  top_lifestyle: string | null;
  top_education_level: string | null;
  top_product_name: string | null;
  common_client_summary: string;
  purchasing_summary: string;
  meta_ads_guidance: SnapshotGuidance | null;
  generated_at: string;
};

const dimensionLabels: Record<string, string> = {
  occupation: 'Occupation',
  income_level: 'Income level',
  region: 'Region',
  state: 'State',
  city: 'City',
  country: 'Country',
  education: 'Education',
  lifestyle: 'Lifestyle',
};

function humanize(value?: string | null) {
  if (!value) return 'Not set';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not generated';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatAmount(amount = 0) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `BRL ${amount.toFixed(2)}`;
  }
}

function getTopDimension(items: AudienceBreakdown[], dimension: string) {
  return items
    .filter((item) => item.dimension === dimension && item.label !== 'Unknown')
    .sort((a, b) => Number(b.audience_count) - Number(a.audience_count) || Number(b.buyer_count) - Number(a.buyer_count))[0] || null;
}

function normalizeList(value?: string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export function AdminMarketingIntelligence() {
  const appKey = getBaiseAppKey();
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['marketing-intelligence-summary', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_marketing_intelligence_summary', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as MarketingMetric[];
    },
  });

  const breakdownsQuery = useQuery({
    queryKey: ['marketing-audience-breakdowns', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_marketing_audience_breakdowns', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as AudienceBreakdown[];
    },
  });

  const habitsQuery = useQuery({
    queryKey: ['marketing-product-habits', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_marketing_product_habits', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as ProductHabit[];
    },
  });

  const snapshotsQuery = useQuery({
    queryKey: ['marketing-audience-snapshots', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('marketing_audience_snapshots')
        .select('id, snapshot_key, total_profiles, active_buyers, top_occupation, top_revenue_range, top_region, top_city, top_state, top_country, top_lifestyle, top_education_level, top_product_name, common_client_summary, purchasing_summary, meta_ads_guidance, generated_at')
        .eq('app_key', appKey)
        .order('generated_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data || []) as MarketingSnapshot[];
    },
  });

  const snapshotMutation = useMutation({
    mutationFn: async () => {
      const { error } = await db.rpc('generate_marketing_audience_snapshot', { target_app_key: appKey });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing-audience-snapshots', appKey] });
      queryClient.invalidateQueries({ queryKey: ['marketing-intelligence-summary', appKey] });
      toast.success('Marketing audience snapshot generated');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to generate marketing snapshot'),
  });

  const breakdowns = breakdownsQuery.data || [];
  const habits = habitsQuery.data || [];
  const latestSnapshot = snapshotsQuery.data?.[0] || null;

  const topProfile = useMemo(() => {
    return {
      occupation: latestSnapshot?.top_occupation || getTopDimension(breakdowns, 'occupation')?.label || 'Not enough data',
      income: latestSnapshot?.top_revenue_range || getTopDimension(breakdowns, 'income_level')?.label || 'Not enough data',
      region: latestSnapshot?.top_region || getTopDimension(breakdowns, 'region')?.label || 'Not enough data',
      city: latestSnapshot?.top_city || getTopDimension(breakdowns, 'city')?.label || null,
      lifestyle: latestSnapshot?.top_lifestyle || getTopDimension(breakdowns, 'lifestyle')?.label || 'Not enough data',
      education: latestSnapshot?.top_education_level || getTopDimension(breakdowns, 'education')?.label || 'Not enough data',
      product: latestSnapshot?.top_product_name || habits[0]?.product_name || 'Not enough data',
    };
  }, [breakdowns, habits, latestSnapshot]);

  const groupedBreakdowns = useMemo(() => {
    return breakdowns.reduce<Record<string, AudienceBreakdown[]>>((acc, item) => {
      if (item.label === 'Unknown') return acc;
      acc[item.dimension] = acc[item.dimension] || [];
      acc[item.dimension].push(item);
      return acc;
    }, {});
  }, [breakdowns]);

  if (metricsQuery.isLoading || breakdownsQuery.isLoading || habitsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (metricsQuery.error || breakdownsQuery.error || habitsQuery.error) {
    const error = metricsQuery.error || breakdownsQuery.error || habitsQuery.error;
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            Marketing Intelligence needs activation
          </CardTitle>
          <CardDescription>Apply the Marketing Intelligence migration after the client insight migration is active.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Marketing Intelligence is not available yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Marketing Intelligence
              </CardTitle>
              <CardDescription>
                Centralized audience, demographic, region, product, and campaign data for smarter Meta ads and value-based targeting.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" disabled={snapshotMutation.isPending} onClick={() => snapshotMutation.mutate()}>
              {snapshotMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Generate Snapshot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(metricsQuery.data || []).map((metric) => (
              <div key={metric.metric_key} className="rounded-md border p-4">
                <p className="text-xs text-muted-foreground">{metric.metric_label}</p>
                <p className="mt-2 text-2xl font-semibold">{Number(metric.metric_value || 0).toLocaleString()}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{metric.detail}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Most Common Client
            </CardTitle>
            <CardDescription>Current strongest audience signal from insight profiles and buying behavior.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-4">
              <p className="text-sm text-muted-foreground">Primary profile</p>
              <p className="mt-2 text-lg font-semibold">
                {topProfile.occupation} · {topProfile.income}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Region: {topProfile.region}{topProfile.city ? ` / ${topProfile.city}` : ''}. Lifestyle: {topProfile.lifestyle}. Education: {topProfile.education}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InsightTile label="Likely product pull" value={topProfile.product} icon={ShoppingBag} />
              <InsightTile label="Best location signal" value={topProfile.region} icon={MapPin} />
            </div>
            {latestSnapshot ? (
              <div className="rounded-md bg-muted p-4 text-sm leading-6 text-muted-foreground">
                <p className="font-medium text-foreground">{latestSnapshot.common_client_summary}</p>
                <p className="mt-1">{latestSnapshot.purchasing_summary}</p>
                <p className="mt-2 text-xs">Snapshot generated {formatDate(latestSnapshot.generated_at)}</p>
              </div>
            ) : (
              <p className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                Generate a snapshot to lock the current audience read and Meta ads guidance.
              </p>
            )}
          </CardContent>
        </Card>

        <MetaGuidanceCard guidance={latestSnapshot?.meta_ads_guidance} topProfile={topProfile} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Audience Breakdowns
            </CardTitle>
            <CardDescription>Ranked by audience count, buyers, buyer rate, fit score, and recommendation activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[640px] pr-3">
              <div className="grid gap-3 lg:grid-cols-2">
                {Object.entries(groupedBreakdowns)
                  .filter(([dimension]) => ['occupation', 'income_level', 'region', 'city', 'education', 'lifestyle'].includes(dimension))
                  .map(([dimension, items]) => (
                    <BreakdownCard key={dimension} dimension={dimension} items={items.slice(0, 6)} />
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Purchasing Habits
            </CardTitle>
            <CardDescription>Products people register for, recommendations they receive, and campaign activity around each offer.</CardDescription>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No product habits are available yet.</p>
            ) : (
              <ScrollArea className="h-[640px] pr-3">
                <div className="space-y-3">
                  {habits.slice(0, 12).map((habit) => (
                    <div key={habit.product_key} className="rounded-md border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{habit.product_name}</p>
                          <p className="text-xs text-muted-foreground">{humanize(habit.product_family)} · {humanize(habit.audience)}</p>
                        </div>
                        <Badge variant="secondary">{Number(habit.active_registrations || 0).toLocaleString()} active</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <p>Trials: {Number(habit.trial_registrations || 0).toLocaleString()}</p>
                        <p>Recs: {Number(habit.recommendation_count || 0).toLocaleString()}</p>
                        <p>Accepted: {Number(habit.accepted_recommendations || 0).toLocaleString()}</p>
                        <p>Campaigns: {Number(habit.campaign_events || 0).toLocaleString()}</p>
                      </div>
                      <p className="mt-3 text-sm font-medium">{formatAmount(Number(habit.estimated_monthly_value || 0))} catalog value</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Audience Snapshots
          </CardTitle>
          <CardDescription>Saved reads of the current audience and purchasing profile for campaign planning.</CardDescription>
        </CardHeader>
        <CardContent>
          {(snapshotsQuery.data || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No snapshots generated yet.</p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {(snapshotsQuery.data || []).map((snapshot) => (
                <div key={snapshot.id} className="rounded-md border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{snapshot.common_client_summary}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{snapshot.purchasing_summary}</p>
                    </div>
                    <Badge variant="outline">{formatDate(snapshot.generated_at)}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[snapshot.top_occupation, snapshot.top_revenue_range, snapshot.top_region, snapshot.top_lifestyle, snapshot.top_product_name]
                      .filter(Boolean)
                      .map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InsightTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function MetaGuidanceCard({
  guidance,
  topProfile,
}: {
  guidance?: SnapshotGuidance | null;
  topProfile: { occupation: string; income: string; region: string; lifestyle: string };
}) {
  const locations = guidance?.suggested_locations || {};
  const valueAngles = normalizeList(guidance?.value_angles);
  const creativeHooks = normalizeList(guidance?.creative_hooks);
  const retargeting = normalizeList(guidance?.retargeting_signals);
  const exclusions = normalizeList(guidance?.exclude_or_review);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-primary" />
          Meta Ads Targeting Guidance
        </CardTitle>
        <CardDescription>Use this to keep paid campaigns consistent with the people already showing fit and purchase behavior.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-4">
          <p className="text-xs text-muted-foreground">Primary audience</p>
          <p className="mt-2 text-lg font-semibold">
            {guidance?.primary_audience || `${topProfile.occupation} · ${topProfile.income} · ${topProfile.lifestyle}`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Location focus: {[locations.city, locations.state, locations.region, locations.country].filter(Boolean).join(', ') || topProfile.region}
          </p>
        </div>

        <GuidanceList title="Value angles" items={valueAngles.length ? valueAngles : [
          'Make trusted support easier to find and compare.',
          'Keep records, payments, invoices, and proof organized in one portal.',
          'Reduce uncertainty before choosing a provider.',
        ]} />
        <GuidanceList title="Creative hooks" items={creativeHooks.length ? creativeHooks : [
          'Trusted help without guessing where to start.',
          'One portal for providers, payments, records, and next steps.',
        ]} />
        <div className="grid gap-3 md:grid-cols-2">
          <GuidanceList title="Retargeting signals" items={retargeting.length ? retargeting : ['Open product recommendation', 'Survey started but incomplete']} />
          <GuidanceList title="Exclude or review" items={exclusions.length ? exclusions : ['Duplicate warnings', 'Do-not-pitch profiles']} />
        </div>
      </CardContent>
    </Card>
  );
}

function GuidanceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md bg-muted p-4">
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-2 space-y-1 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  );
}

function BreakdownCard({ dimension, items }: { dimension: string; items: AudienceBreakdown[] }) {
  const maxCount = Math.max(...items.map((item) => Number(item.audience_count || 0)), 1);

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{dimensionLabels[dimension] || humanize(dimension)}</p>
        <Badge variant="outline">{items.length} segments</Badge>
      </div>
      <div className="mt-4 space-y-4">
        {items.map((item) => {
          const percent = Math.round((Number(item.audience_count || 0) / maxCount) * 100);
          return (
            <div key={`${dimension}-${item.label}`} className="space-y-2">
              <div className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(item.buyer_count || 0).toLocaleString()} buyers · {Number(item.buyer_rate || 0).toLocaleString()}% buyer rate
                  </p>
                </div>
                <Badge variant="secondary">{Number(item.audience_count || 0).toLocaleString()}</Badge>
              </div>
              <Progress value={percent} className="h-2" />
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px]">Fit {Number(item.avg_fit_score || 0).toLocaleString()}</Badge>
                <Badge variant="outline" className="text-[10px]">Recs {Number(item.recommendation_count || 0).toLocaleString()}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
