import { type Dispatch, type SetStateAction, type ReactNode, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BarChart3,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const db = supabase as any;

type RevenueMetric = {
  metric_key: string;
  metric_label: string;
  metric_value: number;
  detail: string | null;
};

type RevenueAttribution = {
  product_key: string;
  product_name: string;
  audience: string;
  active_registrations: number;
  open_recommendations: number;
  accepted_recommendations: number;
  revenue_actions: number;
  quote_drafts: number;
  invoiced_revenue: number;
  paid_revenue: number;
  attach_rate: number;
};

type JourneyProduct = {
  name: string | null;
  audience: string | null;
};

type OfferJourney = {
  id: string;
  product_key: string;
  journey_key: string;
  name: string;
  audience: string;
  status: string;
  welcome_subject: string | null;
  welcome_body: string | null;
  congrats_subject: string | null;
  congrats_body: string | null;
  upsell_subject: string | null;
  upsell_body: string | null;
  downsell_subject: string | null;
  downsell_body: string | null;
  reminder_subject: string | null;
  reminder_body: string | null;
  reminder_delay_days: number;
  consultation_cta_label: string;
  portal_cta_label: string;
  portal_cta_path: string;
  staff_task_title: string;
  staff_task_description: string | null;
  staff_task_priority: string;
  client_addon_label: string | null;
  client_addon_description: string | null;
  partner_safe_message: string | null;
  platform_products?: JourneyProduct | JourneyProduct[] | null;
};

type FitPerson = {
  full_name: string | null;
  email: string | null;
  person_type: string | null;
};

type FitScore = {
  id: string;
  fit_score: number;
  urgency: string;
  timing: string;
  status: string;
  value_reason: string | null;
  do_not_pitch: boolean;
  do_not_pitch_reason: string | null;
  current_product_keys: string[] | null;
  recommended_product_keys: string[] | null;
  missing_protection: unknown;
  calculated_at: string;
  growth_people?: FitPerson | FitPerson[] | null;
};

type RevenueAction = {
  id: string;
  product_key: string;
  action_type: string;
  action_status: string;
  title: string;
  amount: number;
  currency: string;
  quote_id: string | null;
  invoice_id: string | null;
  calendar_event_id: string | null;
  communication_event_id: string | null;
  created_at: string;
  growth_people?: FitPerson | FitPerson[] | null;
  providers?: { business_name: string | null } | { business_name: string | null }[] | null;
};

const journeyStatuses = ['draft', 'active', 'paused', 'archived'];
const staffPriorities = ['low', 'normal', 'high', 'urgent'];

function humanize(value?: string | null) {
  if (!value) return 'Not set';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatAmount(amount = 0, currency = 'BRL') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

function getOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] || null : value;
}

export function AdminProductRevenueAutomation() {
  const appKey = getBaiseAppKey();
  const queryClient = useQueryClient();
  const [editingJourney, setEditingJourney] = useState<OfferJourney | null>(null);

  const metricsQuery = useQuery({
    queryKey: ['product-revenue-metrics', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_product_revenue_metrics', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as RevenueMetric[];
    },
  });

  const attributionQuery = useQuery({
    queryKey: ['product-revenue-attribution', appKey],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_product_revenue_attribution', { target_app_key: appKey });
      if (error) throw error;
      return (data || []) as RevenueAttribution[];
    },
  });

  const journeysQuery = useQuery({
    queryKey: ['product-offer-journeys', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('product_offer_journeys')
        .select(`
          id,
          product_key,
          journey_key,
          name,
          audience,
          status,
          welcome_subject,
          welcome_body,
          congrats_subject,
          congrats_body,
          upsell_subject,
          upsell_body,
          downsell_subject,
          downsell_body,
          reminder_subject,
          reminder_body,
          reminder_delay_days,
          consultation_cta_label,
          portal_cta_label,
          portal_cta_path,
          staff_task_title,
          staff_task_description,
          staff_task_priority,
          client_addon_label,
          client_addon_description,
          partner_safe_message,
          platform_products ( name, audience )
        `)
        .eq('app_key', appKey)
        .order('audience')
        .order('name');

      if (error) throw error;
      return (data || []) as OfferJourney[];
    },
  });

  const fitScoresQuery = useQuery({
    queryKey: ['product-fit-scores', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('product_fit_scores')
        .select(`
          id,
          fit_score,
          urgency,
          timing,
          status,
          value_reason,
          do_not_pitch,
          do_not_pitch_reason,
          current_product_keys,
          recommended_product_keys,
          missing_protection,
          calculated_at,
          growth_people ( full_name, email, person_type )
        `)
        .eq('app_key', appKey)
        .order('fit_score', { ascending: false })
        .limit(40);

      if (error) throw error;
      return (data || []) as FitScore[];
    },
  });

  const actionsQuery = useQuery({
    queryKey: ['product-revenue-actions', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('product_revenue_actions')
        .select(`
          id,
          product_key,
          action_type,
          action_status,
          title,
          amount,
          currency,
          quote_id,
          invoice_id,
          calendar_event_id,
          communication_event_id,
          created_at,
          growth_people ( full_name, email, person_type ),
          providers ( business_name )
        `)
        .eq('app_key', appKey)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []) as RevenueAction[];
    },
  });

  const syncFitScoresMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.rpc('sync_product_fit_scores_for_app', { target_app_key: appKey });
      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['product-fit-scores', appKey] });
      toast.success(`Fit scores synced${result?.scores_updated ? `: ${result.scores_updated}` : ''}`);
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to sync fit scores'),
  });

  const updateJourneyMutation = useMutation({
    mutationFn: async ({ journeyId, updates }: { journeyId: string; updates: Record<string, unknown> }) => {
      const { error } = await db
        .from('product_offer_journeys')
        .update(updates)
        .eq('id', journeyId)
        .eq('app_key', appKey);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-offer-journeys', appKey] });
      setEditingJourney(null);
      toast.success('Offer journey updated');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to update offer journey'),
  });

  const journeys = journeysQuery.data || [];
  const attribution = attributionQuery.data || [];
  const fitScores = fitScoresQuery.data || [];
  const actions = actionsQuery.data || [];
  const isActivationMissing = metricsQuery.error || journeysQuery.error;

  const groupedJourneys = useMemo(() => {
    return journeys.reduce<Record<string, OfferJourney[]>>((acc, journey) => {
      acc[journey.audience] = acc[journey.audience] || [];
      acc[journey.audience].push(journey);
      return acc;
    }, {});
  }, [journeys]);

  if (isActivationMissing) {
    const error = metricsQuery.error || journeysQuery.error;
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Route className="h-4 w-4 text-amber-600" />
            Product-to-revenue automation needs activation
          </CardTitle>
          <CardDescription>Apply the product-to-revenue migration after Product Intelligence is active.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : 'Revenue automation is not available yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4 text-primary" />
              Product-to-Revenue Automation
            </CardTitle>
            <CardDescription>
              Turn recommendations into journeys, fit scores, quote drafts, safe add-ons, and revenue attribution.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" className="gap-2" disabled={syncFitScoresMutation.isPending} onClick={() => syncFitScoresMutation.mutate()}>
            {syncFitScoresMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            Sync Fit Scores
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {(metricsQuery.data || []).map((metric) => (
            <MetricTile key={metric.metric_key} metric={metric} />
          ))}
        </div>

        <Tabs defaultValue="journeys" className="space-y-4">
          <TabsList className="grid h-auto grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="journeys" className="gap-2">
              <Mail className="h-4 w-4" />
              Journeys
            </TabsTrigger>
            <TabsTrigger value="fit" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Fit Scores
            </TabsTrigger>
            <TabsTrigger value="attribution" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Attribution
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journeys">
            {journeysQuery.isLoading ? (
              <LoadingState />
            ) : (
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-4">
                  {Object.entries(groupedJourneys).map(([audience, audienceJourneys]) => (
                    <div key={audience} className="space-y-2">
                      <Badge variant="secondary">{humanize(audience)}</Badge>
                      <div className="grid gap-3 lg:grid-cols-2">
                        {audienceJourneys.map((journey) => (
                          <JourneyCard key={journey.id} journey={journey} onEdit={() => setEditingJourney(journey)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="fit">
            {fitScoresQuery.isLoading ? (
              <LoadingState />
            ) : fitScores.length === 0 ? (
              <EmptyState title="No fit scores yet" body="Sync fit scores after recommendations have been generated." />
            ) : (
              <ScrollArea className="h-[520px] pr-3">
                <div className="grid gap-3 lg:grid-cols-2">
                  {fitScores.map((score) => (
                    <FitScoreCard key={score.id} score={score} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="attribution">
            {attributionQuery.isLoading ? (
              <LoadingState />
            ) : attribution.length === 0 ? (
              <EmptyState title="No product attribution yet" body="Revenue attribution appears as products, recommendations, quotes, and invoices are linked." />
            ) : (
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-2">
                  {attribution.map((row) => (
                    <AttributionRow key={row.product_key} row={row} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="actions">
            {actionsQuery.isLoading ? (
              <LoadingState />
            ) : actions.length === 0 ? (
              <EmptyState title="No revenue actions yet" body="Actions appear when staff convert recommendations into proposals, quote lines, calls, value emails, or not-now outcomes." />
            ) : (
              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {actions.map((action) => (
                    <RevenueActionCard key={action.id} action={action} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {editingJourney ? (
        <JourneyEditorDialog
          key={editingJourney.id}
          journey={editingJourney}
          open={Boolean(editingJourney)}
          onOpenChange={(open) => !open && setEditingJourney(null)}
          isPending={updateJourneyMutation.isPending}
          onSubmit={(updates) => updateJourneyMutation.mutate({ journeyId: editingJourney.id, updates })}
        />
      ) : null}
    </Card>
  );
}

function MetricTile({ metric }: { metric: RevenueMetric }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{metric.metric_label}</p>
        <p className="mt-1 text-2xl font-bold">{Number(metric.metric_value || 0).toLocaleString()}</p>
        {metric.detail ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function JourneyCard({ journey, onEdit }: { journey: OfferJourney; onEdit: () => void }) {
  const product = getOne(journey.platform_products);
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{product?.name || journey.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{journey.product_key}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            <Badge variant={journey.status === 'active' ? 'default' : 'outline'}>{humanize(journey.status)}</Badge>
            <Badge variant="secondary">{humanize(journey.audience)}</Badge>
          </div>
        </div>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <Snippet label="Welcome" value={journey.welcome_subject} />
          <Snippet label="Congrats" value={journey.congrats_subject} />
          <Snippet label="Upsell" value={journey.upsell_subject} />
          <Snippet label="Reminder" value={`${journey.reminder_delay_days} days`} />
        </div>
        <div className="rounded-md bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
          <span className="font-medium text-foreground">Client CTA:</span> {journey.portal_cta_label} · {journey.portal_cta_path}
        </div>
        <Button type="button" size="sm" variant="outline" className="gap-2" onClick={onEdit}>
          <Edit3 className="h-4 w-4" />
          Edit Journey
        </Button>
      </CardContent>
    </Card>
  );
}

function FitScoreCard({ score }: { score: FitScore }) {
  const person = getOne(score.growth_people);
  const currentProducts = score.current_product_keys || [];
  const recommendedProducts = score.recommended_product_keys || [];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium">{person?.full_name || person?.email || 'Unknown relationship'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{humanize(person?.person_type)} · {humanize(score.timing)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{score.fit_score}</p>
            <Badge variant={score.do_not_pitch ? 'destructive' : score.status === 'ready' ? 'default' : 'outline'}>
              {humanize(score.status)}
            </Badge>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{score.value_reason}</p>
        {score.do_not_pitch ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            {score.do_not_pitch_reason || 'Do not pitch yet.'}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">Urgency: {humanize(score.urgency)}</Badge>
          <Badge variant="outline">Current: {currentProducts.length}</Badge>
          <Badge variant="outline">Recommended: {recommendedProducts.length}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AttributionRow({ row }: { row: RevenueAttribution }) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[1.1fr_repeat(6,0.65fr)] lg:items-center">
        <div>
          <p className="font-medium">{row.product_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.product_key} · {humanize(row.audience)}</p>
        </div>
        <SmallMetric label="Sold" value={row.active_registrations} />
        <SmallMetric label="Open" value={row.open_recommendations} />
        <SmallMetric label="Accepted" value={row.accepted_recommendations} />
        <SmallMetric label="Actions" value={row.revenue_actions} />
        <SmallMetric label="Paid" value={formatAmount(row.paid_revenue)} />
        <SmallMetric label="Attach" value={`${Number(row.attach_rate || 0).toFixed(1)}%`} />
      </CardContent>
    </Card>
  );
}

function RevenueActionCard({ action }: { action: RevenueAction }) {
  const person = getOne(action.growth_people);
  const provider = getOne(action.providers);
  const linked = [
    action.quote_id ? 'quote' : '',
    action.invoice_id ? 'invoice' : '',
    action.calendar_event_id ? 'call' : '',
    action.communication_event_id ? 'email' : '',
  ].filter(Boolean);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-medium">{action.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[person?.full_name || person?.email || 'Unknown relationship', provider?.business_name, action.product_key].filter(Boolean).join(' - ')}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{humanize(action.action_type)}</Badge>
            <Badge variant={action.action_status === 'completed' ? 'default' : 'secondary'}>{humanize(action.action_status)}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">{formatAmount(action.amount, action.currency)}</Badge>
          {linked.map((item) => <Badge key={item} variant="outline">{humanize(item)} linked</Badge>)}
          <Badge variant="outline">{new Date(action.created_at).toLocaleDateString()}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function JourneyEditorDialog({
  journey,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  journey: OfferJourney;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (updates: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    status: journey.status,
    welcome_subject: journey.welcome_subject || '',
    welcome_body: journey.welcome_body || '',
    congrats_subject: journey.congrats_subject || '',
    congrats_body: journey.congrats_body || '',
    upsell_subject: journey.upsell_subject || '',
    upsell_body: journey.upsell_body || '',
    downsell_subject: journey.downsell_subject || '',
    downsell_body: journey.downsell_body || '',
    reminder_subject: journey.reminder_subject || '',
    reminder_body: journey.reminder_body || '',
    reminder_delay_days: String(journey.reminder_delay_days || 7),
    consultation_cta_label: journey.consultation_cta_label || '',
    portal_cta_label: journey.portal_cta_label || '',
    portal_cta_path: journey.portal_cta_path || '',
    staff_task_title: journey.staff_task_title || '',
    staff_task_description: journey.staff_task_description || '',
    staff_task_priority: journey.staff_task_priority || 'normal',
    client_addon_label: journey.client_addon_label || '',
    client_addon_description: journey.client_addon_description || '',
    partner_safe_message: journey.partner_safe_message || '',
  });

  const submit = () => {
    onSubmit({
      ...form,
      reminder_delay_days: Number(form.reminder_delay_days) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit offer journey</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Status">
            <Select value={form.status} onValueChange={(value) => setFormValue(setForm, 'status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{journeyStatuses.map((status) => <SelectItem key={status} value={status}>{humanize(status)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Staff task priority">
            <Select value={form.staff_task_priority} onValueChange={(value) => setFormValue(setForm, 'staff_task_priority', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{staffPriorities.map((priority) => <SelectItem key={priority} value={priority}>{humanize(priority)}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Welcome subject">
            <Input value={form.welcome_subject} onChange={(event) => setFormValue(setForm, 'welcome_subject', event.target.value)} />
          </Field>
          <Field label="Congrats subject">
            <Input value={form.congrats_subject} onChange={(event) => setFormValue(setForm, 'congrats_subject', event.target.value)} />
          </Field>
          <TextAreaField label="Welcome email" value={form.welcome_body} onChange={(value) => setFormValue(setForm, 'welcome_body', value)} />
          <TextAreaField label="Congrats email" value={form.congrats_body} onChange={(value) => setFormValue(setForm, 'congrats_body', value)} />
          <TextAreaField label="Upsell email" value={form.upsell_body} onChange={(value) => setFormValue(setForm, 'upsell_body', value)} />
          <TextAreaField label="Downsell email" value={form.downsell_body} onChange={(value) => setFormValue(setForm, 'downsell_body', value)} />
          <Field label="Reminder subject">
            <Input value={form.reminder_subject} onChange={(event) => setFormValue(setForm, 'reminder_subject', event.target.value)} />
          </Field>
          <Field label="Reminder delay days">
            <Input type="number" min="0" value={form.reminder_delay_days} onChange={(event) => setFormValue(setForm, 'reminder_delay_days', event.target.value)} />
          </Field>
          <TextAreaField label="Reminder email" value={form.reminder_body} onChange={(value) => setFormValue(setForm, 'reminder_body', value)} />
          <TextAreaField label="Partner-safe message" value={form.partner_safe_message} onChange={(value) => setFormValue(setForm, 'partner_safe_message', value)} />
          <Field label="Consultation CTA">
            <Input value={form.consultation_cta_label} onChange={(event) => setFormValue(setForm, 'consultation_cta_label', event.target.value)} />
          </Field>
          <Field label="Portal CTA">
            <Input value={form.portal_cta_label} onChange={(event) => setFormValue(setForm, 'portal_cta_label', event.target.value)} />
          </Field>
          <Field label="Portal path">
            <Input value={form.portal_cta_path} onChange={(event) => setFormValue(setForm, 'portal_cta_path', event.target.value)} />
          </Field>
          <Field label="Client add-on label">
            <Input value={form.client_addon_label} onChange={(event) => setFormValue(setForm, 'client_addon_label', event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <TextAreaField label="Client add-on description" value={form.client_addon_description} onChange={(value) => setFormValue(setForm, 'client_addon_description', value)} />
          </div>
          <Field label="Staff task title">
            <Input value={form.staff_task_title} onChange={(event) => setFormValue(setForm, 'staff_task_title', event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <TextAreaField label="Staff task description" value={form.staff_task_description} onChange={(value) => setFormValue(setForm, 'staff_task_description', value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={isPending} onClick={submit}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save Journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SmallMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function Snippet({ label, value }: { label: string; value?: string | null }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label}:</span> {value || 'Not set'}
    </p>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-48 items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
      <ShieldCheck className="h-6 w-6 text-muted-foreground" />
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <Textarea value={value} rows={4} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function setFormValue(setForm: Dispatch<SetStateAction<Record<string, string>>>, key: string, value: string) {
  setForm((current) => ({ ...current, [key]: value }));
}
