import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type CalendarEvent = {
  id: string;
  event_type: string;
  title: string;
  start_at: string;
  status: string;
};

type PaymentPlanItem = {
  id: string;
  label: string;
  amount: number | string;
  currency: string;
  due_at: string;
  status: string;
  client_action_required: boolean | null;
  last_payment_error: string | null;
  next_attempt_at: string | null;
};

type CommunicationEvent = {
  id: string;
  purpose: string;
  channel: string;
  subject: string | null;
  scheduled_at: string | null;
  next_attempt_at: string | null;
  status: string;
  delivery_error: string | null;
};

type AuditEvent = {
  id: string;
  action: string;
  resource_type: string;
  severity: 'info' | 'warning' | 'critical';
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type QueueItem = {
  id: string;
  kind: 'calendar' | 'payment' | 'message' | 'alert';
  title: string;
  detail: string;
  status: string;
  date: string | null;
  priority: 'critical' | 'warning' | 'info';
};

type SupabaseError = { message: string };
type ProviderRecord = { id: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: SupabaseError | null }>;
type ProviderQuery = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => QueryResult<ProviderRecord>;
    };
  };
};
type TableQuery<T> = QueryResult<T[]> & {
  eq: (column: string, value: string) => TableQuery<T>;
  gte: (column: string, value: string) => TableQuery<T>;
  lte: (column: string, value: string) => TableQuery<T>;
  in: (column: string, values: string[]) => TableQuery<T>;
  order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => TableQuery<T>;
  limit: (count: number) => TableQuery<T>;
};
type TableQueryBuilder<T> = {
  select: (columns: string) => TableQuery<T>;
};
type OperationsDb = {
  from: {
    (table: 'providers'): ProviderQuery;
    (table: 'provider_calendar_events'): TableQueryBuilder<CalendarEvent>;
    (table: 'provider_payment_plan_items'): TableQueryBuilder<PaymentPlanItem>;
    (table: 'provider_communication_events'): TableQueryBuilder<CommunicationEvent>;
    (table: 'provider_operational_audit_events'): TableQueryBuilder<AuditEvent>;
  };
};

const db = supabase as unknown as OperationsDb;

const WORKFLOW_COPY = {
  en: {
    requiredTitle: 'Provider command center',
    requiredDescription: 'Create a provider account to manage the operating queue.',
    title: "Today's operating queue",
    description: 'Calendar, payments, messages, and alerts that need provider attention.',
    refresh: 'Refresh',
    schedule: 'Schedule',
    payments: 'Payments',
    messages: 'Messages',
    alerts: 'Alerts',
    attentionTitle: 'Needs attention',
    attentionDescription: 'The next items to handle inside the portal.',
    upcomingTitle: 'Upcoming schedule',
    upcomingDescription: 'Booked work, follow-ups, inspections, and reminders.',
    allClear: 'No urgent items right now.',
    noSchedule: 'No upcoming calendar items in this view.',
    loadError: 'Unable to load the provider record.',
    recordsError: 'Unable to load the operating queue.',
    calendarAction: 'Calendar action',
    paymentAction: 'Payment action',
    messageAction: 'Message action',
    alertAction: 'Operations alert',
    due: 'Due',
    scheduled: 'Scheduled',
    retry: 'Retry',
    lastUpdated: 'Updated',
  },
  es: {
    requiredTitle: 'Centro de mando del proveedor',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar la cola operativa.',
    title: 'Cola operativa de hoy',
    description: 'Calendario, pagos, mensajes y alertas que necesitan atencion del proveedor.',
    refresh: 'Actualizar',
    schedule: 'Agenda',
    payments: 'Pagos',
    messages: 'Mensajes',
    alerts: 'Alertas',
    attentionTitle: 'Requiere atencion',
    attentionDescription: 'Los proximos elementos para resolver dentro del portal.',
    upcomingTitle: 'Agenda proxima',
    upcomingDescription: 'Trabajos, seguimientos, inspecciones y recordatorios.',
    allClear: 'No hay elementos urgentes ahora.',
    noSchedule: 'No hay eventos proximos en esta vista.',
    loadError: 'No se pudo cargar el registro del proveedor.',
    recordsError: 'No se pudo cargar la cola operativa.',
    calendarAction: 'Accion de agenda',
    paymentAction: 'Accion de pago',
    messageAction: 'Accion de mensaje',
    alertAction: 'Alerta operativa',
    due: 'Vence',
    scheduled: 'Programado',
    retry: 'Reintento',
    lastUpdated: 'Actualizado',
  },
  pt: {
    requiredTitle: 'Centro de comando do prestador',
    requiredDescription: 'Crie uma conta de prestador para gerenciar a fila operacional.',
    title: 'Fila operacional de hoje',
    description: 'Calendario, pagamentos, mensagens e alertas que precisam de atencao do prestador.',
    refresh: 'Atualizar',
    schedule: 'Agenda',
    payments: 'Pagamentos',
    messages: 'Mensagens',
    alerts: 'Alertas',
    attentionTitle: 'Precisa de atencao',
    attentionDescription: 'Os proximos itens para resolver dentro do portal.',
    upcomingTitle: 'Agenda proxima',
    upcomingDescription: 'Servicos, acompanhamentos, inspecoes e lembretes.',
    allClear: 'Nao ha itens urgentes agora.',
    noSchedule: 'Nao ha eventos proximos nesta visualizacao.',
    loadError: 'Nao foi possivel carregar o registro do prestador.',
    recordsError: 'Nao foi possivel carregar a fila operacional.',
    calendarAction: 'Acao de agenda',
    paymentAction: 'Acao de pagamento',
    messageAction: 'Acao de mensagem',
    alertAction: 'Alerta operacional',
    due: 'Vence',
    scheduled: 'Programado',
    retry: 'Repetir',
    lastUpdated: 'Atualizado',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

const formatLabel = (value: string) =>
  value.replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDateTime = (value: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatMoney = (amount: number | string, currency: string) => {
  const numericAmount = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: (currency || 'brl').toUpperCase(),
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toFixed(2)} ${currency || 'BRL'}`;
  }
};

const isPast = (value: string | null, nowTimestamp: number) =>
  Boolean(value && new Date(value).getTime() < nowTimestamp);

const getPriorityRank = (priority: QueueItem['priority']) => {
  if (priority === 'critical') return 0;
  if (priority === 'warning') return 1;
  return 2;
};

export function ProviderWorkflowCommandCenter() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const copy = useMemo(() => WORKFLOW_COPY[getCopyKey(i18n.language)], [i18n.language]);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [paymentItems, setPaymentItems] = useState<PaymentPlanItem[]>([]);
  const [communicationEvents, setCommunicationEvents] = useState<CommunicationEvent[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  const loadProvider = useCallback(async () => {
    if (!user) {
      setProviderId(null);
      setIsLoadingProvider(false);
      return;
    }

    setIsLoadingProvider(true);
    const { data, error } = await db
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      toast.error(copy.loadError);
      setProviderId(null);
    } else {
      setProviderId(data?.id ?? null);
    }
    setIsLoadingProvider(false);
  }, [copy.loadError, user]);

  const loadRecords = useCallback(async () => {
    if (!providerId) return;

    const now = new Date();
    const startsAfter = new Date(now);
    startsAfter.setDate(startsAfter.getDate() - 2);
    const startsBefore = new Date(now);
    startsBefore.setDate(startsBefore.getDate() + 14);

    setIsLoadingRecords(true);
    const [calendarResult, paymentsResult, messagesResult, auditResult] = await Promise.all([
      db
        .from('provider_calendar_events')
        .select('id,event_type,title,start_at,status')
        .eq('provider_id', providerId)
        .in('status', ['scheduled', 'confirmed', 'missed'])
        .gte('start_at', startsAfter.toISOString())
        .lte('start_at', startsBefore.toISOString())
        .order('start_at', { ascending: true })
        .limit(16),
      db
        .from('provider_payment_plan_items')
        .select('id,label,amount,currency,due_at,status,client_action_required,last_payment_error,next_attempt_at')
        .eq('provider_id', providerId)
        .in('status', ['pending', 'processing', 'overdue', 'failed', 'retry_due'])
        .order('due_at', { ascending: true })
        .limit(16),
      db
        .from('provider_communication_events')
        .select('id,purpose,channel,subject,scheduled_at,next_attempt_at,status,delivery_error')
        .eq('provider_id', providerId)
        .in('status', ['queued', 'processing', 'failed', 'deferred'])
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .limit(16),
      db
        .from('provider_operational_audit_events')
        .select('id,action,resource_type,severity,created_at,metadata')
        .eq('provider_id', providerId)
        .in('severity', ['warning', 'critical'])
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    if (calendarResult.error || paymentsResult.error || messagesResult.error || auditResult.error) {
      toast.error(copy.recordsError);
    }

    setCalendarEvents(calendarResult.data ?? []);
    setPaymentItems(paymentsResult.data ?? []);
    setCommunicationEvents(messagesResult.data ?? []);
    setAuditEvents(auditResult.data ?? []);
    setIsLoadingRecords(false);
  }, [copy.recordsError, providerId]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const nowTimestamp = Date.now();

  const attentionItems = useMemo(() => {
    const items: QueueItem[] = [
      ...paymentItems.map((item) => ({
        id: item.id,
        kind: 'payment' as const,
        title: item.label || copy.paymentAction,
        detail: `${formatMoney(item.amount, item.currency)} ${copy.due} ${formatDateTime(item.due_at)}`,
        status: item.last_payment_error || formatLabel(item.status),
        date: item.next_attempt_at || item.due_at,
        priority: item.status === 'failed' || item.status === 'overdue' ? ('critical' as const) : ('warning' as const),
      })),
      ...communicationEvents
        .filter((event) => event.status === 'failed' || event.status === 'deferred' || isPast(event.scheduled_at, nowTimestamp))
        .map((event) => ({
          id: event.id,
          kind: 'message' as const,
          title: event.subject || formatLabel(event.purpose || copy.messageAction),
          detail: `${formatLabel(event.channel)} ${event.scheduled_at ? `${copy.scheduled} ${formatDateTime(event.scheduled_at)}` : copy.scheduled}`,
          status: event.delivery_error || formatLabel(event.status),
          date: event.next_attempt_at || event.scheduled_at,
          priority: event.status === 'failed' ? ('critical' as const) : ('warning' as const),
        })),
      ...calendarEvents
        .filter((event) => event.status === 'missed' || isPast(event.start_at, nowTimestamp))
        .map((event) => ({
          id: event.id,
          kind: 'calendar' as const,
          title: event.title,
          detail: `${formatLabel(event.event_type)} ${formatDateTime(event.start_at)}`,
          status: formatLabel(event.status),
          date: event.start_at,
          priority: event.status === 'missed' ? ('critical' as const) : ('warning' as const),
        })),
      ...auditEvents.map((event) => ({
        id: event.id,
        kind: 'alert' as const,
        title: formatLabel(event.action),
        detail: formatLabel(event.resource_type),
        status: formatLabel(event.severity),
        date: event.created_at,
        priority: event.severity,
      })),
    ];

    return items
      .sort((a, b) => {
        const priorityDelta = getPriorityRank(a.priority) - getPriorityRank(b.priority);
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      })
      .slice(0, 8);
  }, [auditEvents, calendarEvents, communicationEvents, copy, nowTimestamp, paymentItems]);

  const upcomingSchedule = useMemo(
    () =>
      calendarEvents
        .filter((event) => !isPast(event.start_at, nowTimestamp) && event.status !== 'missed')
        .slice(0, 5),
    [calendarEvents, nowTimestamp],
  );

  const metrics = useMemo(
    () => [
      {
        label: copy.schedule,
        value: upcomingSchedule.length,
        icon: CalendarClock,
      },
      {
        label: copy.payments,
        value: paymentItems.length,
        icon: Wallet,
      },
      {
        label: copy.messages,
        value: communicationEvents.length,
        icon: MessageSquare,
      },
      {
        label: copy.alerts,
        value: auditEvents.length,
        icon: AlertTriangle,
      },
    ],
    [auditEvents.length, communicationEvents.length, copy, paymentItems.length, upcomingSchedule.length],
  );

  if (isLoadingProvider) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {copy.title}
        </CardContent>
      </Card>
    );
  }

  if (!providerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{copy.requiredTitle}</CardTitle>
          <CardDescription>{copy.requiredDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={loadRecords} disabled={isLoadingRecords}>
          {isLoadingRecords ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          {copy.refresh}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-lg border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-3 text-2xl font-semibold">{metric.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.attentionTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.attentionDescription}</p>
            </div>
            <div className="divide-y">
              {attentionItems.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {copy.allClear}
                </div>
              ) : (
                attentionItems.map((item) => <QueueItemRow key={`${item.kind}-${item.id}`} item={item} copy={copy} />)
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.upcomingTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.upcomingDescription}</p>
            </div>
            <div className="divide-y">
              {upcomingSchedule.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {copy.noSchedule}
                </div>
              ) : (
                upcomingSchedule.map((event) => (
                  <div key={event.id} className="flex items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatLabel(event.event_type)} · {formatDateTime(event.start_at)}
                      </p>
                    </div>
                    <Badge variant="outline">{formatLabel(event.status)}</Badge>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueItemRow({
  item,
  copy,
}: {
  item: QueueItem;
  copy: (typeof WORKFLOW_COPY)[keyof typeof WORKFLOW_COPY];
}) {
  const Icon =
    item.kind === 'payment'
      ? Wallet
      : item.kind === 'message'
        ? MessageSquare
        : item.kind === 'calendar'
          ? CalendarClock
          : AlertTriangle;
  const label =
    item.kind === 'payment'
      ? copy.paymentAction
      : item.kind === 'message'
        ? copy.messageAction
        : item.kind === 'calendar'
          ? copy.calendarAction
          : copy.alertAction;
  const variant = item.priority === 'critical' ? 'destructive' : 'secondary';

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 rounded-full bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{label}</Badge>
            <Badge variant={variant}>{item.status}</Badge>
          </div>
          <p className="mt-2 font-medium">{item.title}</p>
          <p className="text-sm text-muted-foreground">{item.detail}</p>
        </div>
      </div>
      {item.date && <p className="text-sm text-muted-foreground sm:text-right">{formatDateTime(item.date)}</p>}
    </div>
  );
}
