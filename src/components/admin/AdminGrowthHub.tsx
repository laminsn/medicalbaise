import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Clock3,
  DollarSign,
  FileText,
  Gift,
  Handshake,
  ListTodo,
  Loader2,
  Mail,
  Megaphone,
  RefreshCcw,
  Star,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import { AdminActionQueue, AdminRelationshipOS } from '@/components/admin/AdminRelationshipOS';

const db = supabase as any;

type SummaryMetric = {
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

type GrowthIntake = {
  id: string;
  intake_type: string;
  campaign_key: string | null;
  campaign_name: string | null;
  landing_page: string | null;
  language: string | null;
  source: string | null;
  status: string;
  stage: string;
  approval_status: string | null;
  eligibility_status: string | null;
  value_amount: number;
  credit_amount: number;
  payout_amount: number;
  currency: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  growth_people?: GrowthPerson | GrowthPerson[] | null;
};

type GrowthEvent = {
  id: string;
  event_family: string;
  event_type: string;
  action_taken: string | null;
  status: string | null;
  amount: number | null;
  currency: string;
  campaign_key: string | null;
  source_table: string | null;
  occurred_at: string;
};

type FollowupTask = {
  id: string;
  task_type: string;
  title: string;
  status: string;
  priority: string;
  due_at: string | null;
  created_at: string;
};

type MessageTemplate = {
  id: string;
  event_type: string;
  audience: string;
  channel: string;
  locale: string;
  subject: string;
  is_active: boolean;
};

const tabConfig = [
  { value: 'relationship-360', label: 'Relationship 360', icon: Users, types: [] },
  { value: 'action-queue', label: 'Action Queue', icon: ListTodo, types: [] },
  { value: 'campaigns', label: 'Campaigns', icon: Megaphone, types: ['promotion', 'partner_campaign'] },
  { value: 'partners', label: 'Partners', icon: Handshake, types: ['partner_application'] },
  { value: 'referrals', label: 'Referrals', icon: Gift, types: ['referral'] },
  { value: 'testimonials', label: 'Testimonials', icon: Star, types: ['testimonial'] },
  { value: 'promo-leads', label: 'Promo Leads', icon: Users, types: ['promo_lead'] },
  { value: 'credits-payouts', label: 'Credits & Payouts', icon: DollarSign, types: ['credit', 'payout'] },
  { value: 'email-sequences', label: 'Email Sequences', icon: Mail, types: [] },
  { value: 'analytics', label: 'Analytics', icon: BarChart3, types: [] },
];

const statusTone: Record<string, string> = {
  active: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  approved: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  credited: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  paid: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  redeemed: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  pending: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  pending_review: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  submitted: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  under_review: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  scheduled: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
  processing: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
  declined: 'border-destructive/25 bg-destructive/10 text-destructive',
  rejected: 'border-destructive/25 bg-destructive/10 text-destructive',
  failed: 'border-destructive/25 bg-destructive/10 text-destructive',
};

function humanize(value?: string | null) {
  if (!value) return 'Not set';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatAmount(amount = 0, currency = 'BRL') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function getPerson(item: GrowthIntake): GrowthPerson | null {
  if (!item.growth_people) return null;
  if (Array.isArray(item.growth_people)) return item.growth_people[0] || null;
  return item.growth_people;
}

function metricIcon(metricKey: string) {
  if (metricKey.includes('partner')) return Handshake;
  if (metricKey.includes('referral') || metricKey.includes('credit')) return Gift;
  if (metricKey.includes('testimonial')) return Star;
  if (metricKey.includes('payout')) return DollarSign;
  if (metricKey.includes('event')) return BarChart3;
  return Megaphone;
}

export function AdminGrowthHub() {
  const appKey = getBaiseAppKey();
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['growth-hub-summary', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_growth_hub_summary', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as SummaryMetric[];
    },
  });

  const intakesQuery = useQuery({
    queryKey: ['growth-hub-intakes', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('growth_campaign_intakes')
        .select(`
          id,
          intake_type,
          campaign_key,
          campaign_name,
          landing_page,
          language,
          source,
          status,
          stage,
          approval_status,
          eligibility_status,
          value_amount,
          credit_amount,
          payout_amount,
          currency,
          due_at,
          completed_at,
          created_at,
          growth_people ( full_name, email, person_type )
        `)
        .eq('app_key', appKey)
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) throw error;
      return (data || []) as GrowthIntake[];
    },
  });

  const eventsQuery = useQuery({
    queryKey: ['growth-hub-events', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('growth_events')
        .select('id, event_family, event_type, action_taken, status, amount, currency, campaign_key, source_table, occurred_at')
        .eq('app_key', appKey)
        .order('occurred_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []) as GrowthEvent[];
    },
  });

  const tasksQuery = useQuery({
    queryKey: ['growth-hub-tasks', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('growth_followup_tasks')
        .select('id, task_type, title, status, priority, due_at, created_at')
        .eq('app_key', appKey)
        .order('due_at', { ascending: true, nullsFirst: false })
        .limit(20);

      if (error) throw error;
      return (data || []) as FollowupTask[];
    },
  });

  const templatesQuery = useQuery({
    queryKey: ['growth-hub-message-templates', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('platform_message_templates')
        .select('id, event_type, audience, channel, locale, subject, is_active')
        .eq('app_key', appKey)
        .order('event_type', { ascending: true });

      if (error) throw error;
      return (data || []) as MessageTemplate[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc('sync_growth_hub_from_existing', { target_app_key: appKey });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['growth-hub-summary', appKey] });
      queryClient.invalidateQueries({ queryKey: ['growth-hub-intakes', appKey] });
      queryClient.invalidateQueries({ queryKey: ['growth-hub-events', appKey] });
      toast.success(`Growth Hub synced${result?.intakes_processed ? `: ${result.intakes_processed} records touched` : ''}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Unable to sync Growth Hub');
    },
  });

  const intakes = intakesQuery.data || [];
  const events = eventsQuery.data || [];
  const tasks = tasksQuery.data || [];
  const templates = templatesQuery.data || [];
  const loading = summaryQuery.isLoading || intakesQuery.isLoading;
  const error = summaryQuery.error || intakesQuery.error || eventsQuery.error || tasksQuery.error || templatesQuery.error;

  const groupedTemplates = useMemo(() => {
    return templates.reduce<Record<string, MessageTemplate[]>>((acc, template) => {
      acc[template.event_type] = acc[template.event_type] || [];
      acc[template.event_type].push(template);
      return acc;
    }, {});
  }, [templates]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Growth Hub needs activation
          </CardTitle>
          <CardDescription>
            Apply the Growth Hub Supabase migration, then return here to sync existing partner, referral, promo, testimonial, credit, and payout records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Growth Hub data is not available yet.'}
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
                <BadgeCheck className="h-5 w-5 text-primary" />
                Growth Hub
              </CardTitle>
              <CardDescription>
                One operating view for campaigns, partner approvals, referrals, testimonials, credits, payouts, and follow-up.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
            >
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Sync Growth Hub
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(summaryQuery.data || []).map((metric) => (
              <MetricCard key={metric.metric_key} metric={metric} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="relationship-360" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-grid min-w-max grid-cols-10">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-1.5 whitespace-nowrap">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {tabConfig
          .filter((tab) => !['relationship-360', 'action-queue', 'email-sequences', 'analytics'].includes(tab.value))
          .map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-2">
              <IntakeList
                items={intakes.filter((item) => tab.types.includes(item.intake_type))}
                emptyLabel={`No ${tab.label.toLowerCase()} records are synced yet.`}
              />
            </TabsContent>
          ))}

        <TabsContent value="relationship-360" className="mt-2">
          <AdminRelationshipOS />
        </TabsContent>

        <TabsContent value="action-queue" className="mt-2">
          <AdminActionQueue />
        </TabsContent>

        <TabsContent value="email-sequences" className="mt-2">
          <EmailSequences groupedTemplates={groupedTemplates} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-2">
          <AnalyticsPanel events={events} tasks={tasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ metric }: { metric: SummaryMetric }) {
  const Icon = metricIcon(metric.metric_key);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{metric.metric_label}</p>
            <p className="mt-1 text-2xl font-bold">{Number(metric.metric_value || 0).toLocaleString()}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        {metric.detail ? <p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function IntakeList({ items, emptyLabel }: { items: GrowthIntake[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">{emptyLabel}</CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="h-[560px] pr-3">
      <div className="space-y-3">
        {items.map((item) => {
          const person = getPerson(item);
          const moneyAmount = Math.max(Number(item.credit_amount || 0), Number(item.payout_amount || 0), Number(item.value_amount || 0));
          return (
            <Card key={item.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      {item.campaign_name || item.campaign_key || humanize(item.intake_type)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {[person?.full_name || person?.email, person?.person_type ? humanize(person.person_type) : null]
                        .filter(Boolean)
                        .join(' - ') || 'No person profile attached yet'}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={statusTone[item.status] || ''}>
                    {humanize(item.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 text-sm md:grid-cols-4">
                  <Info label="Stage" value={humanize(item.stage)} />
                  <Info label="Eligibility" value={humanize(item.eligibility_status)} />
                  <Info label="Due" value={formatDate(item.due_at)} />
                  <Info label="Amount" value={moneyAmount > 0 ? formatAmount(moneyAmount, item.currency) : 'Not set'} />
                </div>
                <Separator />
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{humanize(item.intake_type)}</Badge>
                  {item.source ? <Badge variant="outline">Source: {humanize(item.source)}</Badge> : null}
                  {item.language ? <Badge variant="outline">Language: {item.language.toUpperCase()}</Badge> : null}
                  {item.landing_page ? <Badge variant="outline">{item.landing_page}</Badge> : null}
                  <span className="ml-auto flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDate(item.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function EmailSequences({ groupedTemplates }: { groupedTemplates: Record<string, MessageTemplate[]> }) {
  const entries = Object.entries(groupedTemplates);

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No branded message templates are available for this app yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {entries.map(([eventType, templates]) => {
        const activeChannels = new Set(templates.filter((template) => template.is_active).map((template) => template.channel));
        const locales = new Set(templates.map((template) => template.locale));
        return (
          <Card key={eventType}>
            <CardHeader>
              <CardTitle className="text-base">{humanize(eventType)}</CardTitle>
              <CardDescription>{templates[0]?.subject || 'Template sequence'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from(activeChannels).map((channel) => (
                  <Badge key={channel} variant="secondary">
                    {humanize(channel)}
                  </Badge>
                ))}
                {Array.from(locales).map((locale) => (
                  <Badge key={locale} variant="outline">
                    {locale.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function AnalyticsPanel({ events, tasks }: { events: GrowthEvent[]; tasks: FollowupTask[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Recent Growth Events
          </CardTitle>
          <CardDescription>Click, opt-in, approval, conversion, payout, credit, and testimonial activity.</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No growth events have been recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium">{humanize(event.event_type)}</p>
                      <p className="text-xs text-muted-foreground">
                        {[humanize(event.event_family), event.campaign_key, event.source_table].filter(Boolean).join(' - ')}
                      </p>
                    </div>
                    {event.amount ? (
                      <Badge variant="secondary">{formatAmount(event.amount, event.currency)}</Badge>
                    ) : (
                      <Badge variant="outline">{formatDate(event.occurred_at)}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Follow-Up Work
          </CardTitle>
          <CardDescription>Staff tasks created by Growth Hub workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No open follow-up tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {humanize(task.task_type)} - Due {formatDate(task.due_at)}
                      </p>
                    </div>
                    <Badge variant="outline" className={statusTone[task.status] || ''}>
                      {humanize(task.status)}
                    </Badge>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
