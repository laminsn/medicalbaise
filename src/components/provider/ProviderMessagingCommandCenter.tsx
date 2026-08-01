import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  CalendarCheck,
  Loader2,
  Mail,
  MessageSquare,
  Percent,
  RefreshCcw,
  Send,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { recordProviderOperationSilently } from '@/lib/providerOperations';

type Campaign = {
  id: string;
  name: string;
  campaign_type: string;
  audience: string;
  primary_channel: string;
  secondary_channels: string[];
  status: string;
  scheduled_at: string | null;
  message_body: string;
};

const db = supabase as any;

const TEMPLATE_META = [
  { type: 'booking_confirmation', icon: CalendarCheck },
  { type: 'booking_reminder', icon: Bell },
  { type: 'cancellation', icon: MessageSquare },
  { type: 'follow_up', icon: Send },
  { type: 'payment_reminder', icon: Mail },
  { type: 'review_request', icon: MessageSquare },
  { type: 'coupon', icon: Percent },
  { type: 'winback', icon: Smartphone },
] as const;

const MESSAGING_COPY = {
  en: {
    templates: {
      booking_confirmation: {
        title: 'Booking confirmation',
        purpose: 'Confirm service date, scope, location, portal thread, and payment expectations.',
        body: 'Your booking is confirmed. Please keep messages, files, updates, and payment records inside your Baise portal so everything stays organized.',
      },
      booking_reminder: {
        title: 'Booking reminder',
        purpose: 'Send 24-hour and 2-hour reminders with portal-first instructions.',
        body: 'Reminder: your upcoming service is scheduled soon. Open the Baise portal for timing, notes, files, and direct provider updates.',
      },
      cancellation: {
        title: 'Cancellation update',
        purpose: 'Handle cancelled or rescheduled work without losing the client record.',
        body: 'This service has been cancelled or needs rescheduling. Use the Baise portal to choose the next step and keep the full record in one place.',
      },
      follow_up: {
        title: 'Follow-up',
        purpose: 'Bring the client back into the portal after completion or quote delivery.',
        body: 'Checking in on your service. You can review notes, receipts, next steps, and message us directly inside Baise.',
      },
      payment_reminder: {
        title: 'Payment reminder',
        purpose: 'Remind clients about one-off, recurring, split, or milestone payments.',
        body: 'Your payment is ready in the Baise portal. You can view the invoice, receipt history, and payment schedule before paying.',
      },
      review_request: {
        title: 'Review request',
        purpose: 'Ask for a verified review tied to real service history.',
        body: 'Thanks for using our service. Please leave a verified review in Baise so future clients can book with confidence.',
      },
      coupon: {
        title: 'Coupon or offer',
        purpose: 'Turn past clients and warm leads into repeat bookings.',
        body: 'A new offer is available in your Baise portal. Open the portal to view details, book, and keep your receipt history together.',
      },
      winback: {
        title: 'Winback',
        purpose: 'Reactivate inactive clients without moving the relationship out of Baise.',
        body: 'It has been a while since your last service. Your history, receipts, and next booking options are ready inside Baise.',
      },
    },
    requiredTitle: 'Messaging command center',
    requiredDescription: 'Create a provider account to manage campaigns, confirmations, reminders, and notifications.',
    strategyTitle: 'Portal-first messaging strategy',
    strategyDescription: 'Email, WhatsApp, and SMS support reminders, confirmations, and campaigns, but the main relationship, records, files, receipts, and decisions stay inside the Baise portal.',
    createTitle: 'Create campaign or timed message',
    createDescription: 'Build confirmations, reminders, follow-ups, review requests, coupons, winback messages, and payment nudges.',
    name: 'Name',
    namePlaceholder: 'Booking confirmation',
    type: 'Type',
    audience: 'Audience',
    primaryChannel: 'Primary channel',
    clients: 'Clients',
    leads: 'Leads',
    pastClients: 'Past clients',
    followers: 'Followers',
    custom: 'Custom',
    portal: 'Portal',
    email: 'Email',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    subject: 'Subject',
    scheduledTime: 'Scheduled time',
    portalMessage: 'Portal message',
    strategy: 'Suggested strategy:',
    create: 'Create portal-first campaign',
    queue: 'Campaign queue',
    queueDescription: 'Provider messages are kept in Baise first, with email, WhatsApp, and SMS as fallback channels.',
    dispatchDue: 'Send due messages',
    dispatchSuccess: 'Due messages processed',
    empty: 'No campaigns yet.',
    manual: 'Manual',
    loadError: 'Unable to load provider messaging workspace.',
    recordsError: 'Unable to load campaigns.',
    validation: 'Add a campaign name and message.',
    success: 'Portal-first campaign created.',
    createError: 'Unable to create campaign.',
  },
  es: {
    templates: {
      booking_confirmation: {
        title: 'Confirmación de reserva',
        purpose: 'Confirma fecha, alcance, ubicación, hilo del portal y expectativas de pago.',
        body: 'Tu reserva esta confirmada. Mantén mensajes, archivos, actualizaciones y pagos dentro del portal Baise para que todo quede organizado.',
      },
      booking_reminder: {
        title: 'Recordatorio de reserva',
        purpose: 'Envia recordatorios de 24 horas y 2 horas con instrucciones centradas en el portal.',
        body: 'Recordatorio: tu servicio esta programado pronto. Abre el portal Baise para ver horarios, notas, archivos y actualizaciones del proveedor.',
      },
      cancellation: {
        title: 'Actualización de cancelación',
        purpose: 'Gestiona trabajos cancelados o reprogramados sin perder el registro del cliente.',
        body: 'Este servicio fue cancelado o necesita reprogramarse. Usa el portal Baise para elegir el siguiente paso y mantener el registro completo.',
      },
      follow_up: {
        title: 'Seguimiento',
        purpose: 'Trae al cliente de vuelta al portal después de completar el servicio o enviar una cotización.',
        body: 'Estamos dando seguimiento a tu servicio. Puedes revisar notas, recibos, proximos pasos y escribirnos dentro de Baise.',
      },
      payment_reminder: {
        title: 'Recordatorio de pago',
        purpose: 'Recuerda pagos unicos, recurrentes, divididos o por hitos.',
        body: 'Tu pago esta listo en el portal Baise. Puedes revisar la factura, historial de recibos y calendario de pago antes de pagar.',
      },
      review_request: {
        title: 'Solicitud de reseña',
        purpose: 'Pide una reseña verificada ligada al historial real del servicio.',
        body: 'Gracias por usar nuestro servicio. Deja una reseña verificada en Baise para que futuros clientes reserven con confianza.',
      },
      coupon: {
        title: 'Cupon u oferta',
        purpose: 'Convierte clientes anteriores y prospectos en nuevas reservas.',
        body: 'Hay una nueva oferta disponible en tu portal Baise. Abre el portal para ver detalles, reservar y conservar tu historial de recibos.',
      },
      winback: {
        title: 'Reactivación',
        purpose: 'Reactiva clientes inactivos sin mover la relación fuera de Baise.',
        body: 'Ha pasado tiempo desde tu último servicio. Tu historial, recibos y proximas opciones de reserva están listos dentro de Baise.',
      },
    },
    requiredTitle: 'Centro de mensajes',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar campanas, confirmaciones, recordatorios y notificaciones.',
    strategyTitle: 'Estrategia de mensajes con portal primero',
    strategyDescription: 'Email, WhatsApp y SMS apoyan recordatorios, confirmaciones y campanas, pero la relación, registros, archivos, recibos y decisiones permanecen en el portal Baise.',
    createTitle: 'Crear campana o mensaje programado',
    createDescription: 'Crea confirmaciones, recordatorios, seguimientos, solicitudes de reseña, cupones, reactivaciones y avisos de pago.',
    name: 'Nombre',
    namePlaceholder: 'Confirmación de reserva',
    type: 'Tipo',
    audience: 'Audiência',
    primaryChannel: 'Canal principal',
    clients: 'Clientes',
    leads: 'Prospectos',
    pastClients: 'Clientes anteriores',
    followers: 'Seguidores',
    custom: 'Personalizado',
    portal: 'Portal',
    email: 'Email',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    subject: 'Asunto',
    scheduledTime: 'Hora programada',
    portalMessage: 'Mensaje del portal',
    strategy: 'Estrategia sugerida:',
    create: 'Crear campana portal primero',
    queue: 'Cola de campanas',
    queueDescription: 'Los mensajes del proveedor se guardan primero en Baise, con email, WhatsApp y SMS como canales de apoyo.',
    dispatchDue: 'Enviar mensajes vencidos',
    dispatchSuccess: 'Mensajes vencidos procesados',
    empty: 'Aún no hay campanas.',
    manual: 'Manual',
    loadError: 'No se pudo cargar el centro de mensajes.',
    recordsError: 'No se pudieron cargar las campanas.',
    validation: 'Agrega un nombre y mensaje para la campana.',
    success: 'Campana portal primero creada.',
    createError: 'No se pudo crear la campana.',
  },
  pt: {
    templates: {
      booking_confirmation: {
        title: 'Confirmação de reserva',
        purpose: 'Confirma data, escopo, local, conversa no portal e expectativas de pagamento.',
        body: 'Sua reserva esta confirmada. Mantenha mensagens, arquivos, atualizações e pagamentos dentro do portal Baise para tudo ficar organizado.',
      },
      booking_reminder: {
        title: 'Lembrete de reserva',
        purpose: 'Envia lembretes de 24 horas e 2 horas com instruções centradas no portal.',
        body: 'Lembrete: seu serviço será realizado em breve. Abra o portal Baise para ver horários, notas, arquivos e atualizações do prestador.',
      },
      cancellation: {
        title: 'Atualização de cancelamento',
        purpose: 'Gerência trabalhos cancelados ou reagendados sem perder o registro do cliente.',
        body: 'Este serviço foi cancelado ou precisa ser reagendado. Use o portal Baise para escolher o próximo passo e manter o registro completo.',
      },
      follow_up: {
        title: 'Acompanhamento',
        purpose: 'Traz o cliente de volta ao portal após a conclusao ou envio de orçamento.',
        body: 'Estamos acompanhando seu serviço. Você pode revisar notas, recibos, proximos passos e falar conosco dentro do Baise.',
      },
      payment_reminder: {
        title: 'Lembrete de pagamento',
        purpose: 'Lembra clientes sobre pagamentos unicos, recorrentes, divididos ou por marcos.',
        body: 'Seu pagamento esta pronto no portal Baise. Você pode ver a fatura, histórico de recibos e calendário de pagamento antes de pagar.',
      },
      review_request: {
        title: 'Pedido de avaliação',
        purpose: 'Pede uma avaliação verificada ligada ao histórico real do serviço.',
        body: 'Obrigado por usar nosso serviço. Deixe uma avaliação verificada no Baise para que futuros clientes possam reservar com confiança.',
      },
      coupon: {
        title: 'Cupom ou oferta',
        purpose: 'Transforma clientes antigos e leads aquecidos em novas reservas.',
        body: 'Uma nova oferta esta disponível no seu portal Baise. Abra o portal para ver detalhes, reservar e manter seu histórico de recibos.',
      },
      winback: {
        title: 'Reativação',
        purpose: 'Reativa clientes inativos sem levar a relação para fora do Baise.',
        body: 'Faz tempo desde seu último serviço. Seu histórico, recibos e proximas opções de reserva estao prontos no Baise.',
      },
    },
    requiredTitle: 'Central de mensagens',
    requiredDescription: 'Crie uma conta de prestador para gerenciar campanhas, confirmações, lembretes e notificações.',
    strategyTitle: 'Estratégia de mensagens com portal primeiro',
    strategyDescription: 'Email, WhatsApp e SMS apoiam lembretes, confirmações e campanhas, mas a relação, registros, arquivos, recibos e decisoes ficam no portal Baise.',
    createTitle: 'Criar campanha ou mensagem agendada',
    createDescription: 'Crie confirmações, lembretes, acompanhamentos, pedidos de avaliação, cupons, reativações e avisos de pagamento.',
    name: 'Nome',
    namePlaceholder: 'Confirmação de reserva',
    type: 'Tipo',
    audience: 'Público',
    primaryChannel: 'Canal principal',
    clients: 'Clientes',
    leads: 'Leads',
    pastClients: 'Clientes anteriores',
    followers: 'Seguidores',
    custom: 'Personalizado',
    portal: 'Portal',
    email: 'Email',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    subject: 'Assunto',
    scheduledTime: 'Horário agendado',
    portalMessage: 'Mensagem do portal',
    strategy: 'Estratégia sugerida:',
    create: 'Criar campanha portal primeiro',
    queue: 'Fila de campanhas',
    queueDescription: 'As mensagens do prestador ficam primeiro no Baise, com email, WhatsApp e SMS como canais de apoio.',
    dispatchDue: 'Enviar mensagens vencidas',
    dispatchSuccess: 'Mensagens vencidas processadas',
    empty: 'Ainda não ha campanhas.',
    manual: 'Manual',
    loadError: 'Não foi possível carregar a central de mensagens.',
    recordsError: 'Não foi possível carregar as campanhas.',
    validation: 'Adicione nome e mensagem para a campanha.',
    success: 'Campanha portal primeiro criada.',
    createError: 'Não foi possível criar a campanha.',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

export function ProviderMessagingCommandCenter() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = MESSAGING_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const templates = useMemo(
    () => TEMPLATE_META.map((template) => ({
      ...template,
      ...copy.templates[template.type],
    })),
    [copy],
  );
  const [providerId, setProviderId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  const [name, setName] = useState('');
  const [campaignType, setCampaignType] = useState('booking_confirmation');
  const [audience, setAudience] = useState('clients');
  const [primaryChannel, setPrimaryChannel] = useState('portal');
  const [scheduledAt, setScheduledAt] = useState('');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.type === campaignType) || templates[0],
    [campaignType, templates],
  );

  useEffect(() => {
    if (!messageBody) {
      setName(templates[0].title);
      setSubject(templates[0].title);
      setMessageBody(templates[0].body);
    }
  }, [messageBody, templates]);

  const loadProvider = async () => {
    if (!user) return;
    const { data, error } = await db.from('providers').select('id').eq('user_id', user.id).maybeSingle();
    if (error) {
      toast.error(copy.loadError);
      return;
    }
    setProviderId(data?.id || null);
  };

  const loadCampaigns = async (nextProviderId = providerId) => {
    if (!nextProviderId) return;
    setIsLoading(true);
    try {
      const { data, error } = await db
        .from('provider_communication_campaigns')
        .select('id, name, campaign_type, audience, primary_channel, secondary_channels, status, scheduled_at, message_body')
        .eq('provider_id', nextProviderId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setCampaigns(data || []);
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
    if (providerId) loadCampaigns(providerId);
  }, [providerId]);

  const applyTemplate = (type: string) => {
    const template = templates.find((item) => item.type === type) || templates[0];
    setCampaignType(type);
    setName(template.title);
    setSubject(template.title);
    setMessageBody(template.body);
  };

  const createCampaign = async () => {
    if (!providerId || !user) return;
    if (name.trim().length < 3 || messageBody.trim().length < 10) {
      toast.error(copy.validation);
      return;
    }

    setIsCreating(true);
    try {
      const secondaryChannels = primaryChannel === 'portal' ? ['email', 'whatsapp', 'sms'] : ['portal'];
      const { data, error } = await db
        .from('provider_communication_campaigns')
        .insert({
          provider_id: providerId,
          created_by: user.id,
          name,
          campaign_type: campaignType,
          audience,
          primary_channel: primaryChannel,
          secondary_channels: secondaryChannels,
          portal_first: true,
          subject,
          message_body: messageBody,
          trigger_type: scheduledAt ? 'scheduled' : 'manual',
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          status: scheduledAt ? 'scheduled' : 'draft',
          metadata: {
            strategy: selectedTemplate.purpose,
            portal_first: true,
            fallback_channels: secondaryChannels,
          },
        })
        .select('id')
        .single();

      if (error) throw error;

      await db.from('provider_communication_events').insert({
        provider_id: providerId,
        campaign_id: data.id,
        created_by: user.id,
        purpose: campaignType === 'payment_reminder' ? 'payment_request' : 'campaign',
        channel: 'portal',
        subject,
        message_body: messageBody,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        status: scheduledAt ? 'queued' : 'draft',
        metadata: {
          fallback_channels: secondaryChannels,
          audience,
          portal_first: true,
        },
      });

      recordProviderOperationSilently({
        action: 'communication_campaign.created',
        resourceType: 'provider_communication_campaign',
        resourceId: data.id,
        metadata: {
          campaign_type: campaignType,
          audience,
          primary_channel: primaryChannel,
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          portal_first: true,
        },
      });

      toast.success(copy.success);
      await loadCampaigns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsCreating(false);
    }
  };

  const dispatchDueMessages = async () => {
    setIsDispatching(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispatch-provider-communication-events', {
        body: { limit: 50 },
      });

      if (error) throw error;

      toast.success(
        `${copy.dispatchSuccess}: ${data?.sent || 0} sent, ${data?.deferred || 0} deferred, ${data?.failed || 0} failed.`,
      );
      await loadCampaigns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.recordsError);
    } finally {
      setIsDispatching(false);
    }
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
      <Card>
        <CardHeader>
          <CardTitle>{copy.strategyTitle}</CardTitle>
          <CardDescription>
            {copy.strategyDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <button
                key={template.type}
                type="button"
                onClick={() => applyTemplate(template.type)}
                className="rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary"
              >
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <p className="font-semibold">{template.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{template.purpose}</p>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.createTitle}</CardTitle>
          <CardDescription>
            {copy.createDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">{copy.name}</Label>
                <Input id="campaign-name" value={name} onChange={(event) => setName(event.target.value)} placeholder={copy.namePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label>{copy.type}</Label>
                <Select value={campaignType} onValueChange={applyTemplate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => <SelectItem key={template.type} value={template.type}>{template.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{copy.audience}</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">{copy.clients}</SelectItem>
                    <SelectItem value="leads">{copy.leads}</SelectItem>
                    <SelectItem value="past_clients">{copy.pastClients}</SelectItem>
                    <SelectItem value="followers">{copy.followers}</SelectItem>
                    <SelectItem value="custom">{copy.custom}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.primaryChannel}</Label>
                <Select value={primaryChannel} onValueChange={setPrimaryChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portal">{copy.portal}</SelectItem>
                    <SelectItem value="email">{copy.email}</SelectItem>
                    <SelectItem value="whatsapp">{copy.whatsapp}</SelectItem>
                    <SelectItem value="sms">{copy.sms}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campaign-subject">{copy.subject}</Label>
                <Input id="campaign-subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-scheduled">{copy.scheduledTime}</Label>
                <Input id="campaign-scheduled" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-body">{copy.portalMessage}</Label>
              <Textarea id="campaign-body" value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows={5} />
              <p className="text-xs text-muted-foreground">
                {copy.strategy} {selectedTemplate.purpose}
              </p>
            </div>
            <Button onClick={createCampaign} disabled={isCreating} className="w-full">
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
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
            <Button variant="outline" onClick={dispatchDueMessages} disabled={isDispatching}>
              {isDispatching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              {copy.dispatchDue}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{campaign.campaign_type}</Badge>
                    <Badge>{campaign.primary_channel}</Badge>
                    <Badge variant="outline">{campaign.status}</Badge>
                  </div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{campaign.message_body}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString() : copy.manual}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
