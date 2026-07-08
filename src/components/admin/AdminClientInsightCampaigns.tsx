import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, ClipboardList, Loader2, Mail, RefreshCcw, Sparkles, Target, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const db = supabase as any;

type InsightMetric = {
  metric_key: string;
  metric_label: string;
  metric_value: number;
  detail: string | null;
};

type GrowthPerson = {
  full_name: string | null;
  email: string | null;
  person_type: string | null;
};

type InsightProfile = {
  id: string;
  occupation: string | null;
  revenue_range: string | null;
  lifestyle_tags: string[] | null;
  family_size: number | null;
  life_goals: unknown;
  education_level: string | null;
  preferred_language: string;
  confidence_score: number;
  last_surveyed_at: string | null;
  next_survey_due_at: string | null;
  growth_people?: GrowthPerson | GrowthPerson[] | null;
};

type CampaignProduct = {
  name: string | null;
  audience: string | null;
};

type CampaignEvent = {
  id: string;
  campaign_key: string;
  campaign_type: string;
  product_key: string | null;
  channel: string;
  locale: string;
  status: string;
  subject: string;
  body: string;
  scheduled_for: string;
  created_at: string;
  growth_people?: GrowthPerson | GrowthPerson[] | null;
  platform_products?: CampaignProduct | CampaignProduct[] | null;
};

type ValueCampaign = {
  id: string;
  campaign_key: string;
  campaign_type: string;
  product_key: string | null;
  audience: string;
  channel: string;
  locale: string;
  trigger_reason: string;
  subject: string;
  body: string;
  cadence_days: number;
};

function humanize(value?: string | null) {
  if (!value) return 'Not set';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function getLifeGoals(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 3);
}

function getChannelIcon(channel: string) {
  if (channel === 'email') return Mail;
  if (channel === 'push') return Bell;
  return Sparkles;
}

export function AdminClientInsightCampaigns() {
  const appKey = getBaiseAppKey();
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['client-insight-campaign-summary', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_client_insight_value_campaign_summary', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as InsightMetric[];
    },
  });

  const profilesQuery = useQuery({
    queryKey: ['client-insight-profiles-admin', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('client_insight_profiles')
        .select(`
          id,
          occupation,
          revenue_range,
          lifestyle_tags,
          family_size,
          life_goals,
          education_level,
          preferred_language,
          confidence_score,
          last_surveyed_at,
          next_survey_due_at,
          growth_people ( full_name, email, person_type )
        `)
        .eq('app_key', appKey)
        .order('updated_at', { ascending: false })
        .limit(24);

      if (error) throw error;
      return (data || []) as InsightProfile[];
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['product-value-campaign-events', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('product_value_campaign_events')
        .select(`
          id,
          campaign_key,
          campaign_type,
          product_key,
          channel,
          locale,
          status,
          subject,
          body,
          scheduled_for,
          created_at,
          growth_people ( full_name, email, person_type ),
          platform_products ( name, audience )
        `)
        .eq('app_key', appKey)
        .order('scheduled_for', { ascending: false })
        .limit(40);

      if (error) throw error;
      return (data || []) as CampaignEvent[];
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ['product-value-campaign-library', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('product_value_campaigns')
        .select('id, campaign_key, campaign_type, product_key, audience, channel, locale, trigger_reason, subject, body, cadence_days')
        .eq('app_key', appKey)
        .eq('is_active', true)
        .order('campaign_type')
        .order('product_key')
        .order('channel')
        .limit(60);

      if (error) throw error;
      return (data || []) as ValueCampaign[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc('sync_value_campaigns_for_app', { target_app_key: appKey });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['client-insight-campaign-summary', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-value-campaign-events', appKey] });
      queryClient.invalidateQueries({ queryKey: ['product-recommendations', appKey] });
      toast.success(`Value campaigns synced${result?.campaigns_queued ? `: ${result.campaigns_queued} queued` : ''}`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to sync value campaigns'),
  });

  const campaignCounts = useMemo(() => {
    return (eventsQuery.data || []).reduce<Record<string, number>>((acc, event) => {
      acc[event.channel] = (acc[event.channel] || 0) + 1;
      return acc;
    }, {});
  }, [eventsQuery.data]);

  if (metricsQuery.isLoading || profilesQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (metricsQuery.error || profilesQuery.error) {
    const error = metricsQuery.error || profilesQuery.error;
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-600" />
            Client insight campaigns need activation
          </CardTitle>
          <CardDescription>Apply the client insight and value campaign migration after Product Intelligence is active.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Client insight campaigns are not available yet.'}
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
                <UserRound className="h-5 w-5 text-primary" />
                Client Insight & Value Campaigns
              </CardTitle>
              <CardDescription>
                Survey context, product fit, and value-based email and push queues for recommendations that actually match the person.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" disabled={syncMutation.isPending} onClick={() => syncMutation.mutate()}>
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Sync Value Campaigns
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

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Insight Profiles
            </CardTitle>
            <CardDescription>Occupation, revenue, lifestyle, household, goals, and education context for better recommendations.</CardDescription>
          </CardHeader>
          <CardContent>
            {(profilesQuery.data || []).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No client insight profiles yet.</p>
            ) : (
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {(profilesQuery.data || []).map((profile) => {
                    const person = getOne(profile.growth_people);
                    const goals = getLifeGoals(profile.life_goals);
                    return (
                      <div key={profile.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{person?.full_name || person?.email || 'Relationship profile'}</p>
                            <p className="text-xs text-muted-foreground">{person?.email || humanize(person?.person_type)}</p>
                          </div>
                          <Badge variant={profile.confidence_score >= 75 ? 'default' : 'secondary'}>
                            {profile.confidence_score}% fit context
                          </Badge>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          <p><span className="font-medium text-foreground">Work:</span> {profile.occupation || 'Not set'}</p>
                          <p><span className="font-medium text-foreground">Revenue:</span> {profile.revenue_range || 'Not set'}</p>
                          <p><span className="font-medium text-foreground">Family:</span> {profile.family_size ?? 'Not set'}</p>
                          <p><span className="font-medium text-foreground">Education:</span> {profile.education_level || 'Not set'}</p>
                        </div>
                        {(profile.lifestyle_tags?.length || goals.length) ? (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {(profile.lifestyle_tags || []).slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                            ))}
                            {goals.map((goal) => (
                              <Badge key={goal} variant="secondary" className="text-[10px]">{goal}</Badge>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">Last: {formatDate(profile.last_surveyed_at)}</Badge>
                          <Badge variant="outline">Next: {formatDate(profile.next_survey_due_at)}</Badge>
                          <Badge variant="outline">{profile.preferred_language.toUpperCase()}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4 text-primary" />
              Email & Push Queue
            </CardTitle>
            <CardDescription>
              Value-based campaign events created from product recommendations and survey refreshes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {Object.entries(campaignCounts).map(([channel, count]) => (
                <Badge key={channel} variant="secondary">{humanize(channel)}: {count}</Badge>
              ))}
            </div>
            {eventsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (eventsQuery.data || []).length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No value campaign events queued yet.</p>
            ) : (
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {(eventsQuery.data || []).map((event) => {
                    const person = getOne(event.growth_people);
                    const product = getOne(event.platform_products);
                    const ChannelIcon = getChannelIcon(event.channel);
                    return (
                      <div key={event.id} className="rounded-md border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-medium">
                              <ChannelIcon className="h-4 w-4 text-primary" />
                              {event.subject}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{event.body}</p>
                          </div>
                          <Badge variant={event.status === 'queued' ? 'default' : 'secondary'}>{humanize(event.status)}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline">{humanize(event.channel)}</Badge>
                          <Badge variant="outline">{event.locale.toUpperCase()}</Badge>
                          <Badge variant="outline">{product?.name || event.product_key || humanize(event.campaign_type)}</Badge>
                          <Badge variant="secondary">{person?.full_name || person?.email || 'Relationship'}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Campaign Library
          </CardTitle>
          <CardDescription>Reusable product and survey campaigns by audience, channel, language, and cadence.</CardDescription>
        </CardHeader>
        <CardContent>
          {campaignsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {(campaignsQuery.data || []).slice(0, 12).map((campaign) => (
                <div key={campaign.id} className="rounded-md border p-4">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{humanize(campaign.campaign_type)}</Badge>
                    <Badge variant="outline">{humanize(campaign.audience)}</Badge>
                    <Badge variant="outline">{humanize(campaign.channel)}</Badge>
                    <Badge variant="outline">{campaign.locale.toUpperCase()}</Badge>
                  </div>
                  <p className="mt-3 font-medium">{campaign.subject}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{campaign.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {campaign.product_key || 'Survey refresh'} · every {campaign.cadence_days} days
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
