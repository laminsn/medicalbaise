import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Send,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type CalendarEvent = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  status: string;
  channel_preferences: string[];
  portal_first: boolean;
};

const db = supabase as any;

const EVENT_TYPE_VALUES = ['booking', 'cancellation', 'follow_up', 'payment_due', 'campaign', 'inspection', 'deadline', 'custom'] as const;

const CHANNELS = ['portal', 'email', 'whatsapp'];

const CALENDAR_COPY = {
  en: {
    types: {
      booking: 'Booking',
      cancellation: 'Cancellation',
      follow_up: 'Follow-up',
      payment_due: 'Payment due',
      campaign: 'Campaign',
      inspection: 'Inspection',
      deadline: 'Deadline',
      custom: 'Custom',
    },
    requiredTitle: 'Provider calendar manager',
    requiredDescription: 'Create a provider account to manage bookings, reminders, follow-ups, and campaigns.',
    upcoming: 'Upcoming',
    bookings: 'Bookings',
    followUps: 'Follow-ups',
    campaigns: 'Campaigns',
    addTitle: 'Add portal-managed event',
    addDescription: 'Keep bookings, cancellations, follow-ups, payment reminders, inspections, notifications, and campaigns in one provider calendar.',
    title: 'Title',
    titlePlaceholder: 'Follow up with client',
    eventType: 'Event type',
    notes: 'Message / notes',
    notesPlaceholder: 'What the provider and client should see in the portal',
    start: 'Start',
    end: 'End',
    reminderOne: 'Reminder 1 minutes before',
    reminderTwo: 'Reminder 2 minutes before',
    channels: 'Channels',
    channelNote: 'Portal is always the primary workflow; email and WhatsApp are fallback/support channels.',
    create: 'Create event and notification',
    queue: 'Calendar queue',
    queueDescription: 'Bookings, cancellations, follow-ups, timed notifications, payment reminders, and campaigns.',
    allTypes: 'All event types',
    empty: 'No calendar events in this view yet.',
    portalFirst: 'Portal first',
    noNotes: 'No notes',
    done: 'Done',
    cancel: 'Cancel',
    loadError: 'Unable to load provider calendar.',
    recordsError: 'Unable to load calendar events.',
    titleRequired: 'Add a clear event title.',
    strategy: 'Portal is primary. Email and WhatsApp are fallback channels for reminders and confirmations.',
    defaultMessage: 'is scheduled in your Baise portal.',
    created: 'Calendar event and portal notification created.',
    updateError: 'Unable to update event status.',
    updated: 'Calendar event updated.',
    createError: 'Unable to create calendar event.',
  },
  es: {
    types: {
      booking: 'Reserva',
      cancellation: 'Cancelacion',
      follow_up: 'Seguimiento',
      payment_due: 'Pago pendiente',
      campaign: 'Campana',
      inspection: 'Inspeccion',
      deadline: 'Fecha limite',
      custom: 'Personalizado',
    },
    requiredTitle: 'Gestor de calendario del proveedor',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar reservas, recordatorios, seguimientos y campanas.',
    upcoming: 'Proximos',
    bookings: 'Reservas',
    followUps: 'Seguimientos',
    campaigns: 'Campanas',
    addTitle: 'Agregar evento gestionado en el portal',
    addDescription: 'Mantiene reservas, cancelaciones, seguimientos, recordatorios de pago, inspecciones, notificaciones y campanas en un calendario del proveedor.',
    title: 'Titulo',
    titlePlaceholder: 'Dar seguimiento al cliente',
    eventType: 'Tipo de evento',
    notes: 'Mensaje / notas',
    notesPlaceholder: 'Lo que el proveedor y el cliente deben ver en el portal',
    start: 'Inicio',
    end: 'Fin',
    reminderOne: 'Recordatorio 1 minutos antes',
    reminderTwo: 'Recordatorio 2 minutos antes',
    channels: 'Canales',
    channelNote: 'El portal siempre es el flujo principal; email y WhatsApp son canales de apoyo.',
    create: 'Crear evento y notificacion',
    queue: 'Cola del calendario',
    queueDescription: 'Reservas, cancelaciones, seguimientos, notificaciones programadas, recordatorios de pago y campanas.',
    allTypes: 'Todos los tipos',
    empty: 'No hay eventos de calendario en esta vista.',
    portalFirst: 'Portal primero',
    noNotes: 'Sin notas',
    done: 'Listo',
    cancel: 'Cancelar',
    loadError: 'No se pudo cargar el calendario del proveedor.',
    recordsError: 'No se pudieron cargar los eventos del calendario.',
    titleRequired: 'Agrega un titulo claro para el evento.',
    strategy: 'El portal es principal. Email y WhatsApp son canales de apoyo para recordatorios y confirmaciones.',
    defaultMessage: 'esta programado en tu portal Baise.',
    created: 'Evento de calendario y notificacion del portal creados.',
    updateError: 'No se pudo actualizar el evento.',
    updated: 'Evento de calendario actualizado.',
    createError: 'No se pudo crear el evento.',
  },
  pt: {
    types: {
      booking: 'Reserva',
      cancellation: 'Cancelamento',
      follow_up: 'Acompanhamento',
      payment_due: 'Pagamento devido',
      campaign: 'Campanha',
      inspection: 'Inspecao',
      deadline: 'Prazo',
      custom: 'Personalizado',
    },
    requiredTitle: 'Gerenciador de calendario do prestador',
    requiredDescription: 'Crie uma conta de prestador para gerenciar reservas, lembretes, acompanhamentos e campanhas.',
    upcoming: 'Proximos',
    bookings: 'Reservas',
    followUps: 'Acompanhamentos',
    campaigns: 'Campanhas',
    addTitle: 'Adicionar evento gerenciado no portal',
    addDescription: 'Mantenha reservas, cancelamentos, acompanhamentos, lembretes de pagamento, inspecoes, notificacoes e campanhas em um calendario do prestador.',
    title: 'Titulo',
    titlePlaceholder: 'Acompanhar cliente',
    eventType: 'Tipo de evento',
    notes: 'Mensagem / notas',
    notesPlaceholder: 'O que o prestador e o cliente devem ver no portal',
    start: 'Inicio',
    end: 'Fim',
    reminderOne: 'Lembrete 1 minutos antes',
    reminderTwo: 'Lembrete 2 minutos antes',
    channels: 'Canais',
    channelNote: 'O portal e sempre o fluxo principal; email e WhatsApp sao canais de apoio.',
    create: 'Criar evento e notificacao',
    queue: 'Fila do calendario',
    queueDescription: 'Reservas, cancelamentos, acompanhamentos, notificacoes programadas, lembretes de pagamento e campanhas.',
    allTypes: 'Todos os tipos',
    empty: 'Nao ha eventos de calendario nesta visualizacao.',
    portalFirst: 'Portal primeiro',
    noNotes: 'Sem notas',
    done: 'Concluir',
    cancel: 'Cancelar',
    loadError: 'Nao foi possivel carregar o calendario do prestador.',
    recordsError: 'Nao foi possivel carregar os eventos do calendario.',
    titleRequired: 'Adicione um titulo claro para o evento.',
    strategy: 'O portal e principal. Email e WhatsApp sao canais de apoio para lembretes e confirmacoes.',
    defaultMessage: 'esta agendado no seu portal Baise.',
    created: 'Evento de calendario e notificacao do portal criados.',
    updateError: 'Nao foi possivel atualizar o evento.',
    updated: 'Evento de calendario atualizado.',
    createError: 'Nao foi possivel criar o evento.',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

const toLocalInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export function ProviderCalendarManager() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = CALENDAR_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const [providerId, setProviderId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('booking');
  const [startAt, setStartAt] = useState(toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [endAt, setEndAt] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['portal']);
  const [reminderOne, setReminderOne] = useState('1440');
  const [reminderTwo, setReminderTwo] = useState('120');
  const eventTypes = useMemo(
    () => EVENT_TYPE_VALUES.map((value) => ({ value, label: copy.types[value] })),
    [copy],
  );

  const loadProvider = async () => {
    if (!user) return;
    const { data, error } = await db
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      toast.error(copy.loadError);
      return;
    }
    setProviderId(data?.id || null);
  };

  const loadEvents = async (nextProviderId = providerId) => {
    if (!nextProviderId) return;
    setIsLoading(true);
    try {
      const from = new Date();
      from.setDate(from.getDate() - 14);
      const to = new Date();
      to.setDate(to.getDate() + 90);

      let query = db
        .from('provider_calendar_events')
        .select('id, event_type, title, description, start_at, end_at, status, channel_preferences, portal_first')
        .eq('provider_id', nextProviderId)
        .gte('start_at', from.toISOString())
        .lte('start_at', to.toISOString())
        .order('start_at', { ascending: true })
        .limit(120);

      if (typeFilter !== 'all') query = query.eq('event_type', typeFilter);

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.recordsError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProvider();
  }, [user?.id]);

  useEffect(() => {
    if (providerId) loadEvents(providerId);
  }, [providerId, typeFilter]);

  const summary = useMemo(() => {
    const upcoming = events.filter((event) => new Date(event.start_at).getTime() >= Date.now()).length;
    const confirmations = events.filter((event) => event.event_type === 'booking').length;
    const followUps = events.filter((event) => event.event_type === 'follow_up').length;
    const campaigns = events.filter((event) => event.event_type === 'campaign').length;
    return { upcoming, confirmations, followUps, campaigns };
  }, [events]);

  const toggleChannel = (channel: string, checked: boolean) => {
    setSelectedChannels((prev) => {
      if (checked) return Array.from(new Set([...prev, channel]));
      const next = prev.filter((item) => item !== channel);
      return next.length ? next : ['portal'];
    });
  };

  const createEvent = async () => {
    if (!providerId || !user) return;
    if (title.trim().length < 3) {
      toast.error(copy.titleRequired);
      return;
    }

    setIsCreating(true);
    try {
      const offsets = [Number(reminderOne), Number(reminderTwo)]
        .filter((value) => Number.isFinite(value) && value >= 0);

      const { error } = await db.from('provider_calendar_events').insert({
        provider_id: providerId,
        created_by: user.id,
        event_type: eventType,
        title,
        description,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt ? new Date(endAt).toISOString() : null,
        status: eventType === 'cancellation' ? 'cancelled' : 'scheduled',
        notification_offsets_minutes: offsets,
        channel_preferences: selectedChannels,
        portal_first: true,
        metadata: {
          strategy: copy.strategy,
        },
      });

      if (error) throw error;

      await db.from('provider_communication_events').insert({
        provider_id: providerId,
        created_by: user.id,
        purpose:
          eventType === 'booking'
            ? 'confirmation'
            : eventType === 'follow_up'
              ? 'follow_up'
              : eventType === 'payment_due'
                ? 'payment_request'
                : 'notification',
        channel: 'portal',
        subject: title,
        message_body: description || `${title} ${copy.defaultMessage}`,
        scheduled_at: new Date(startAt).toISOString(),
        status: 'queued',
        metadata: {
          event_type: eventType,
          fallback_channels: selectedChannels.filter((channel) => channel !== 'portal'),
        },
      });

      toast.success(copy.created);
      setTitle('');
      setDescription('');
      setEventType('booking');
      setSelectedChannels(['portal']);
      await loadEvents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsCreating(false);
    }
  };

  const updateStatus = async (eventId: string, status: string) => {
    const { error } = await db
      .from('provider_calendar_events')
      .update({ status })
      .eq('id', eventId);
    if (error) {
      toast.error(copy.updateError);
      return;
    }
    toast.success(copy.updated);
    await loadEvents();
  };

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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title={copy.upcoming} value={summary.upcoming} icon={Clock} />
        <Metric title={copy.bookings} value={summary.confirmations} icon={CalendarClock} />
        <Metric title={copy.followUps} value={summary.followUps} icon={BellRing} />
        <Metric title={copy.campaigns} value={summary.campaigns} icon={Send} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {copy.addTitle}
          </CardTitle>
          <CardDescription>
            {copy.addDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-title">{copy.title}</Label>
                <Input id="event-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={copy.titlePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label>{copy.eventType}</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-description">{copy.notes}</Label>
              <Textarea id="event-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={copy.notesPlaceholder} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-start">{copy.start}</Label>
                <Input id="event-start" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-end">{copy.end}</Label>
                <Input id="event-end" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reminder-one">{copy.reminderOne}</Label>
                <Input id="reminder-one" type="number" min="0" value={reminderOne} onChange={(event) => setReminderOne(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-two">{copy.reminderTwo}</Label>
                <Input id="reminder-two" type="number" min="0" value={reminderTwo} onChange={(event) => setReminderTwo(event.target.value)} />
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-medium">{copy.channels}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {CHANNELS.map((channel) => (
                  <label key={channel} className="flex items-center gap-2 text-sm capitalize">
                    <Checkbox checked={selectedChannels.includes(channel)} onCheckedChange={(checked) => toggleChannel(channel, Boolean(checked))} />
                    {channel}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{copy.channelNote}</p>
            </div>
            <Button onClick={createEvent} disabled={isCreating} className="w-full">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {copy.create}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{copy.queue}</CardTitle>
              <CardDescription>{copy.queueDescription}</CardDescription>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.allTypes}</SelectItem>
                {eventTypes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{event.event_type}</Badge>
                    <Badge variant={event.status === 'cancelled' ? 'destructive' : 'outline'}>{event.status}</Badge>
                    {event.portal_first && <Badge>{copy.portalFirst}</Badge>}
                  </div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.description || copy.noNotes}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.start_at).toLocaleString()} · {event.channel_preferences?.join(', ') || 'portal'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => updateStatus(event.id, 'completed')}>
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    {copy.done}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => updateStatus(event.id, 'cancelled')}>
                    <XCircle className="mr-1 h-4 w-4" />
                    {copy.cancel}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Clock }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
