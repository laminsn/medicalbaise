import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  ListTodo,
  Loader2,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { getBaiseAppKey } from '@/lib/providerCommunication';

const db = supabase as any;

type RelationshipPerson = {
  id: string;
  app_key: string;
  person_type: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_locale: string | null;
  client_id: string | null;
  referral_code: string | null;
  partner_code: string | null;
  lead_source: string | null;
  campaign_key: string | null;
  duplicate_warning: boolean;
  created_at: string;
  updated_at: string;
};

type RelationshipTimelineItem = {
  id: string;
  item_kind: string;
  category: string | null;
  title: string;
  description: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  timeline_at: string;
};

type RelationshipQuality = {
  score: number;
  strengths: string[] | null;
  gaps: string[] | null;
};

type RelationshipAction = {
  action_id: string;
  app_key: string;
  person_id: string | null;
  intake_id: string | null;
  task_id: string | null;
  action_type: string;
  title: string;
  priority: string;
  owner_id: string | null;
  why_it_matters: string;
  consequence: string;
  unlocks: string;
  due_at: string | null;
  status: string;
  source_table: string | null;
  source_id: string | null;
  created_at: string;
};

type SavedView = {
  id: string;
  view_key: string;
  name: string;
  description: string | null;
  filters: Record<string, unknown>;
};

const priorityTone: Record<string, string> = {
  urgent: 'border-destructive/30 bg-destructive/10 text-destructive',
  high: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  normal: 'border-sky-500/30 bg-sky-500/10 text-sky-700',
  low: 'border-muted bg-muted text-muted-foreground',
};

function humanize(value?: string | null) {
  if (!value) return 'Not set';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatAmount(amount?: number | null, currency = 'BRL') {
  if (!amount) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function personLabel(person: RelationshipPerson) {
  return person.full_name || person.email || person.phone || person.client_id || 'Unnamed relationship';
}

function mapActionToTaskType(actionType: string) {
  if (actionType.includes('payout')) return 'payout';
  if (actionType.includes('credit')) return 'credit';
  if (actionType.includes('testimonial')) return 'approve';
  if (actionType.includes('duplicate')) return 'fraud_review';
  if (actionType.includes('approval') || actionType.includes('review')) return 'review';
  return 'follow_up';
}

function useRelationshipActions(appKey: string, personId?: string | null) {
  return useQuery({
    queryKey: ['relationship-next-actions', appKey, personId || 'all'],
    queryFn: async () => {
      const { data, error } = await db.rpc('get_relationship_next_actions', {
        target_app_key: appKey,
        target_person_id: personId || null,
      });
      if (error) throw error;
      return (data || []) as RelationshipAction[];
    },
  });
}

export function AdminRelationshipOS() {
  const appKey = getBaiseAppKey();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [noteBody, setNoteBody] = useState('');

  const peopleQuery = useQuery({
    queryKey: ['relationship-people', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('growth_people')
        .select('id, app_key, person_type, full_name, email, phone, preferred_locale, client_id, referral_code, partner_code, lead_source, campaign_key, duplicate_warning, created_at, updated_at')
        .eq('app_key', appKey)
        .order('updated_at', { ascending: false })
        .limit(80);

      if (error) throw error;
      return (data || []) as RelationshipPerson[];
    },
  });

  const people = peopleQuery.data || [];

  useEffect(() => {
    if (!selectedPersonId && people.length > 0) {
      setSelectedPersonId(people[0].id);
    }
  }, [people, selectedPersonId]);

  const filteredPeople = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return people;
    return people.filter((person) =>
      [
        person.full_name,
        person.email,
        person.phone,
        person.client_id,
        person.referral_code,
        person.partner_code,
        person.lead_source,
        person.campaign_key,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [people, searchTerm]);

  const selectedPerson = people.find((person) => person.id === selectedPersonId) || null;

  const timelineQuery = useQuery({
    queryKey: ['relationship-timeline', appKey, selectedPersonId],
    enabled: Boolean(selectedPersonId),
    queryFn: async () => {
      const { data, error } = await db
        .from('relationship_timeline')
        .select('id, item_kind, category, title, description, status, amount, currency, timeline_at')
        .eq('app_key', appKey)
        .eq('person_id', selectedPersonId)
        .order('timeline_at', { ascending: false })
        .limit(80);

      if (error) throw error;
      return (data || []) as RelationshipTimelineItem[];
    },
  });

  const qualityQuery = useQuery({
    queryKey: ['relationship-quality', appKey, selectedPersonId],
    enabled: Boolean(selectedPersonId),
    queryFn: async () => {
      const { data, error } = await db.rpc('compute_relationship_quality_score', {
        target_person_id: selectedPersonId,
      });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as RelationshipQuality;
    },
  });

  const actionsQuery = useRelationshipActions(appKey, selectedPersonId);

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPersonId || !noteBody.trim()) return;
      const { error } = await db.from('relationship_notes').insert({
        app_key: appKey,
        person_id: selectedPersonId,
        note_type: 'general',
        visibility: 'internal',
        body: noteBody.trim(),
        metadata: { source: 'relationship_360' },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNoteBody('');
      queryClient.invalidateQueries({ queryKey: ['relationship-timeline', appKey, selectedPersonId] });
      queryClient.invalidateQueries({ queryKey: ['relationship-quality', appKey, selectedPersonId] });
      toast.success('Internal note added');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to add note'),
  });

  const actionMutation = useRelationshipActionMutations(appKey);

  if (peopleQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (peopleQuery.error) {
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Relationship OS needs activation
          </CardTitle>
          <CardDescription>
            Apply the Relationship OS Supabase migration after Growth Hub is active.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            {peopleQuery.error instanceof Error ? peopleQuery.error.message : 'Relationship data is not available yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.7fr_1.4fr_0.9fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="h-4 w-4 text-primary" />
            Relationships
          </CardTitle>
          <CardDescription>One profile for every lead, client, partner, referral, and testimonial contact.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, email, code, source"
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[620px] pr-2">
            <div className="space-y-2">
              {filteredPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => setSelectedPersonId(person.id)}
                  className={`w-full rounded-md border p-3 text-left transition hover:bg-muted/70 ${
                    selectedPersonId === person.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{personLabel(person)}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {[person.email, person.phone].filter(Boolean).join(' - ') || person.id}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {humanize(person.person_type)}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {person.campaign_key ? <Badge variant="secondary" className="text-[10px]">{person.campaign_key}</Badge> : null}
                    {person.duplicate_warning ? <Badge variant="destructive" className="text-[10px]">Duplicate</Badge> : null}
                  </div>
                </button>
              ))}
              {filteredPeople.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No matching relationships yet.</p>
              ) : null}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <RelationshipProfile person={selectedPerson} quality={qualityQuery.data} loading={qualityQuery.isLoading} />
        <RelationshipTimeline items={timelineQuery.data || []} loading={timelineQuery.isLoading} />
      </div>

      <div className="space-y-4">
        <NextActionsPanel
          actions={actionsQuery.data || []}
          loading={actionsQuery.isLoading}
          onComplete={(action) => actionMutation.completeTask.mutate(action)}
          onCreateTask={(action) => actionMutation.createTask.mutate(action)}
          busy={actionMutation.completeTask.isPending || actionMutation.createTask.isPending}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareText className="h-4 w-4 text-primary" />
              Internal Note
            </CardTitle>
            <CardDescription>Add staff context without exposing it to the client or partner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Add call notes, approval concerns, handoff details, or context for the next staff owner."
              className="min-h-28"
              disabled={!selectedPersonId}
            />
            <Button
              type="button"
              className="w-full"
              disabled={!selectedPersonId || !noteBody.trim() || addNoteMutation.isPending}
              onClick={() => addNoteMutation.mutate()}
            >
              {addNoteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Add Note
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AdminActionQueue() {
  const appKey = getBaiseAppKey();
  const actionsQuery = useRelationshipActions(appKey, null);
  const actionMutation = useRelationshipActionMutations(appKey);

  const savedViewsQuery = useQuery({
    queryKey: ['relationship-saved-views', appKey],
    queryFn: async () => {
      const { data, error } = await db
        .from('relationship_saved_views')
        .select('id, view_key, name, description, filters')
        .eq('app_key', appKey)
        .eq('is_shared', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []) as SavedView[];
    },
  });

  const groupedActions = useMemo(() => {
    return (actionsQuery.data || []).reduce<Record<string, RelationshipAction[]>>((acc, action) => {
      acc[action.priority] = acc[action.priority] || [];
      acc[action.priority].push(action);
      return acc;
    }, {});
  }, [actionsQuery.data]);

  if (actionsQuery.isLoading) {
    return (
      <Card>
        <CardContent className="flex min-h-52 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (actionsQuery.error) {
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Action queue needs activation
          </CardTitle>
          <CardDescription>Apply the Relationship OS migration to enable the next-best-action queue.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Saved Views
          </CardTitle>
          <CardDescription>Reusable staff views for the work that matters most.</CardDescription>
        </CardHeader>
        <CardContent>
          {savedViewsQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {(savedViewsQuery.data || []).map((view) => (
                <div key={view.id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{view.name}</p>
                  {view.description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{view.description}</p> : null}
                  <Badge variant="outline" className="mt-2 text-[10px]">{view.view_key}</Badge>
                </div>
              ))}
              {(savedViewsQuery.data || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No saved views are available yet.</p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {['urgent', 'high', 'normal', 'low'].map((priority) => {
          const actions = groupedActions[priority] || [];
          if (actions.length === 0) return null;
          return (
            <Card key={priority}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListTodo className="h-4 w-4 text-primary" />
                  {humanize(priority)} Priority
                </CardTitle>
                <CardDescription>{actions.length} action{actions.length === 1 ? '' : 's'} waiting.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actions.map((action) => (
                    <ActionItem
                      key={action.action_id}
                      action={action}
                      onComplete={() => actionMutation.completeTask.mutate(action)}
                      onCreateTask={() => actionMutation.createTask.mutate(action)}
                      busy={actionMutation.completeTask.isPending || actionMutation.createTask.isPending}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(actionsQuery.data || []).length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Inbox zero. No relationship actions are waiting right now.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function RelationshipProfile({
  person,
  quality,
  loading,
}: {
  person: RelationshipPerson | null;
  quality?: RelationshipQuality;
  loading: boolean;
}) {
  if (!person) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Select a relationship to view the 360 profile.
        </CardContent>
      </Card>
    );
  }

  const score = quality?.score || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {personLabel(person)}
            </CardTitle>
            <CardDescription>
              {[humanize(person.person_type), person.email, person.phone].filter(Boolean).join(' - ')}
            </CardDescription>
          </div>
          <Badge variant="outline" className={person.duplicate_warning ? 'border-destructive/30 bg-destructive/10 text-destructive' : ''}>
            {person.duplicate_warning ? 'Duplicate warning' : 'Clear'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm md:grid-cols-4">
          <Info label="Client ID" value={person.client_id || 'Not set'} />
          <Info label="Referral Code" value={person.referral_code || 'Not set'} />
          <Info label="Partner Code" value={person.partner_code || 'Not set'} />
          <Info label="Language" value={(person.preferred_locale || 'en').toUpperCase()} />
        </div>

        <Separator />

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Quality Control Score</p>
            <p className="text-sm font-bold">{loading ? '...' : `${score}/100`}</p>
          </div>
          <Progress value={score} />
          <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
            <QualityList label="Strengths" items={quality?.strengths || []} empty="No strengths scored yet." />
            <QualityList label="Gaps" items={quality?.gaps || []} empty="No gaps found." />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RelationshipTimeline({ items, loading }: { items: RelationshipTimelineItem[]; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="h-4 w-4 text-primary" />
          Unified Timeline
        </CardTitle>
        <CardDescription>Joined, clicked, applied, converted, uploaded, credited, paid, reviewed, and noted.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No timeline activity yet.</p>
        ) : (
          <ScrollArea className="h-[420px] pr-3">
            <div className="space-y-3">
              {items.map((item) => {
                const amount = formatAmount(item.amount, item.currency || 'BRL');
                return (
                  <div key={`${item.item_kind}-${item.id}-${item.timeline_at}`} className="rounded-md border p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{humanize(item.title)}</p>
                          <Badge variant="secondary" className="text-[10px]">{humanize(item.item_kind)}</Badge>
                        </div>
                        {item.description ? <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p> : null}
                      </div>
                      <div className="text-left text-xs text-muted-foreground md:text-right">
                        <p>{formatDate(item.timeline_at)}</p>
                        {amount ? <p className="font-medium text-foreground">{amount}</p> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function NextActionsPanel({
  actions,
  loading,
  onComplete,
  onCreateTask,
  busy,
}: {
  actions: RelationshipAction[];
  loading: boolean;
  onComplete: (action: RelationshipAction) => void;
  onCreateTask: (action: RelationshipAction) => void;
  busy: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListTodo className="h-4 w-4 text-primary" />
          Next Best Actions
        </CardTitle>
        <CardDescription>What to do next, why it matters, what happens if ignored, and what it unlocks.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : actions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No next action is waiting for this relationship.</p>
        ) : (
          <div className="space-y-3">
            {actions.slice(0, 6).map((action) => (
              <ActionItem
                key={action.action_id}
                action={action}
                onComplete={() => onComplete(action)}
                onCreateTask={() => onCreateTask(action)}
                busy={busy}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionItem({
  action,
  onComplete,
  onCreateTask,
  busy,
}: {
  action: RelationshipAction;
  onComplete: () => void;
  onCreateTask: () => void;
  busy: boolean;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{action.title}</p>
            <Badge variant="outline" className={priorityTone[action.priority] || ''}>
              {humanize(action.priority)}
            </Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{action.why_it_matters}</p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">Due {formatDate(action.due_at)}</p>
      </div>
      <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
        <p><span className="font-medium text-foreground">If ignored:</span> {action.consequence}</p>
        <p><span className="font-medium text-foreground">Unlocks:</span> {action.unlocks}</p>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {action.task_id ? (
          <Button type="button" size="sm" variant="outline" className="gap-2" disabled={busy} onClick={onComplete}>
            <CheckCircle2 className="h-4 w-4" />
            Complete Task
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" className="gap-2" disabled={busy} onClick={onCreateTask}>
            <ListTodo className="h-4 w-4" />
            Create Task
          </Button>
        )}
      </div>
    </div>
  );
}

function useRelationshipActionMutations(appKey: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['relationship-next-actions', appKey] });
    queryClient.invalidateQueries({ queryKey: ['relationship-timeline', appKey] });
    queryClient.invalidateQueries({ queryKey: ['growth-hub-tasks', appKey] });
  };

  const completeTask = useMutation({
    mutationFn: async (action: RelationshipAction) => {
      if (!action.task_id) {
        throw new Error('Create a task before marking this action complete.');
      }

      const { error } = await db
        .from('growth_followup_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', action.task_id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Action completed');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to complete action'),
  });

  const createTask = useMutation({
    mutationFn: async (action: RelationshipAction) => {
      if (!action.intake_id) {
        throw new Error('This action is missing a workflow record.');
      }

      const { error } = await db.from('growth_followup_tasks').insert({
        app_key: appKey,
        intake_id: action.intake_id,
        task_type: mapActionToTaskType(action.action_type),
        title: action.title,
        status: 'open',
        priority: action.priority || 'normal',
        due_at: action.due_at,
        metadata: {
          source: 'relationship_action_queue',
          action_id: action.action_id,
          why_it_matters: action.why_it_matters,
          consequence: action.consequence,
          unlocks: action.unlocks,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Task created');
    },
    onError: (error: Error) => toast.error(error.message || 'Unable to create task'),
  });

  return { completeTask, createTask };
}

function QualityList({ label, items, empty }: { label: string; items: string[]; empty: string }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="font-medium">{label}</p>
      <div className="mt-2 space-y-1 text-muted-foreground">
        {items.length > 0 ? items.slice(0, 4).map((item) => <p key={item}>{item}</p>) : <p>{empty}</p>}
      </div>
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
