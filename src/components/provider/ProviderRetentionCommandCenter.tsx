import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Repeat,
  Send,
  Star,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { recordProviderOperationSilently } from '@/lib/providerOperations';

type CRMContact = {
  id: string;
  customer_id: string | null;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  relationship_type: string;
  status: string;
  priority: string;
  preferred_channel: string;
  estimated_value: number | string;
  lifetime_value: number | string;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  updated_at: string;
};

type CRMOpportunity = {
  id: string;
  contact_id: string | null;
  title: string;
  stage: string;
  status: string;
  estimated_value: number | string;
  probability: number;
  expected_close_date: string | null;
  next_step: string | null;
  updated_at: string;
};

type QuoteRecord = {
  id: string;
  contact_id: string | null;
  quote_number: string | null;
  title: string;
  currency: string;
  total_amount: number | string;
  status: string;
  valid_until: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  updated_at: string;
};

type ProviderProject = {
  id: string;
  contact_id: string | null;
  project_name: string;
  project_status: string;
  completion_percent: number;
  due_date: string | null;
  risk_level: string;
  updated_at: string;
};

type CRMActivity = {
  id: string;
  contact_id: string | null;
  activity_type: string;
  subject: string;
  channel: string;
  status: string;
  due_at: string | null;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  campaign_type: string;
  audience: string;
  primary_channel: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
};

type RetentionAction = {
  id: string;
  kind: 'follow_up' | 'quote' | 'review' | 'winback' | 'payment';
  title: string;
  detail: string;
  status: string;
  date: string | null;
  priority: 'critical' | 'warning' | 'info';
  contactId: string | null;
  campaignType: 'follow_up' | 'review_request' | 'winback' | 'payment_reminder';
  activityType: 'follow_up' | 'review_request' | 'campaign' | 'payment';
  triggerType: 'manual' | 'review_event' | 'inactive_client' | 'payment_event';
  subject: string;
  message: string;
  buttonLabel: string;
};

type SupabaseError = { message: string };
type ProviderRecord = { id: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: SupabaseError | null }>;
type Query<T> = QueryResult<T[]> & {
  eq: (column: string, value: string) => Query<T>;
  order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => Query<T>;
  limit: (count: number) => Query<T>;
};
type Mutation = QueryResult<null> & {
  eq: (column: string, value: string) => Mutation;
};
type InsertMutation<T> = QueryResult<null> & {
  select: (columns: string) => {
    single: () => QueryResult<T>;
  };
};
type Table<T> = {
  select: (columns: string) => Query<T>;
  insert: (values: Record<string, unknown>) => InsertMutation<T>;
  update: (values: Record<string, unknown>) => Mutation;
};
type ProviderTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => QueryResult<ProviderRecord>;
    };
  };
};
type RetentionDb = {
  from: {
    (table: 'providers'): ProviderTable;
    <T>(table: string): Table<T>;
  };
};

const db = supabase as unknown as RetentionDb;

const RETENTION_COPY = {
  en: {
    requiredTitle: 'Client revenue cockpit',
    requiredDescription: 'Create a provider account to manage client follow-ups, quote recovery, review requests, and winback campaigns.',
    title: 'Client revenue cockpit',
    description: 'Leads, follow-ups, quotes, reviews, and winback actions that turn client history into repeat work.',
    refresh: 'Refresh',
    activeClients: 'Active clients',
    hotLeads: 'Hot leads',
    weightedPipeline: 'Weighted pipeline',
    dueFollowUps: 'Due follow-ups',
    signalsTitle: 'Revenue signals',
    signalsDescription: 'Pipeline, quote, project, and relationship health in one client view.',
    openQuotes: 'Open quotes',
    staleQuotes: 'Quotes needing follow-up',
    activeProjects: 'Active projects',
    reviewReady: 'Review-ready projects',
    winbackReady: 'Winback-ready clients',
    actionsTitle: 'Client actions',
    actionsDescription: 'Create portal-first nudges that keep clients, receipts, approvals, and decisions inside Baise.',
    latestCampaigns: 'Latest client campaigns',
    latestCampaignsDescription: 'Recently created portal-first messages for follow-ups, reviews, payments, and repeat work.',
    emptyActions: 'No urgent client revenue actions right now.',
    emptyCampaigns: 'No client campaigns yet.',
    createCampaign: 'Create campaign',
    creating: 'Creating',
    followUpLabel: 'Follow-up',
    quoteLabel: 'Quote',
    reviewLabel: 'Review',
    winbackLabel: 'Winback',
    paymentLabel: 'Payment',
    followUpSubject: 'Follow-up on your service',
    followUpMessage: 'Checking in from Baise. Your notes, files, payment records, and next steps are ready in the portal.',
    quoteSubject: 'Your quote is ready for review',
    quoteMessage: 'Your quote is ready in Baise. Please review the scope, price, timeline, and message us in the portal with any questions.',
    reviewSubject: 'Share a verified review',
    reviewMessage: 'Thank you for trusting us. Please leave a verified Baise review so future clients can book with confidence.',
    winbackSubject: 'Ready for your next service',
    winbackMessage: 'Your service history, receipts, and next booking options are waiting inside Baise whenever you are ready.',
    paymentSubject: 'Payment record waiting in Baise',
    paymentMessage: 'Your payment details, invoice, receipt history, and service records are ready in your Baise portal.',
    loadError: 'Unable to load client revenue cockpit.',
    recordsError: 'Unable to load client records.',
    createError: 'Unable to create client campaign.',
    created: 'Client campaign created.',
    contact: 'Contact',
    due: 'Due',
    validUntil: 'Valid until',
    updated: 'Updated',
    manual: 'Manual',
  },
  es: {
    requiredTitle: 'Panel de ingresos de clientes',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar seguimientos, recuperacion de cotizaciones, resenas y reactivacion.',
    title: 'Panel de ingresos de clientes',
    description: 'Leads, seguimientos, cotizaciones, resenas y reactivaciones que convierten el historial en trabajo repetido.',
    refresh: 'Actualizar',
    activeClients: 'Clientes activos',
    hotLeads: 'Leads calientes',
    weightedPipeline: 'Pipeline ponderado',
    dueFollowUps: 'Seguimientos vencidos',
    signalsTitle: 'Senales de ingresos',
    signalsDescription: 'Salud del pipeline, cotizaciones, proyectos y relaciones en una vista.',
    openQuotes: 'Cotizaciones abiertas',
    staleQuotes: 'Cotizaciones para seguir',
    activeProjects: 'Proyectos activos',
    reviewReady: 'Proyectos listos para resena',
    winbackReady: 'Clientes para reactivar',
    actionsTitle: 'Acciones de clientes',
    actionsDescription: 'Crea mensajes portal primero para mantener clientes, recibos, aprobaciones y decisiones dentro de Baise.',
    latestCampaigns: 'Campanas recientes',
    latestCampaignsDescription: 'Mensajes recientes para seguimientos, resenas, pagos y trabajo repetido.',
    emptyActions: 'No hay acciones urgentes de ingresos ahora.',
    emptyCampaigns: 'Aun no hay campanas de clientes.',
    createCampaign: 'Crear campana',
    creating: 'Creando',
    followUpLabel: 'Seguimiento',
    quoteLabel: 'Cotizacion',
    reviewLabel: 'Resena',
    winbackLabel: 'Reactivacion',
    paymentLabel: 'Pago',
    followUpSubject: 'Seguimiento de tu servicio',
    followUpMessage: 'Estamos dando seguimiento desde Baise. Tus notas, archivos, pagos y proximos pasos estan listos en el portal.',
    quoteSubject: 'Tu cotizacion esta lista',
    quoteMessage: 'Tu cotizacion esta lista en Baise. Revisa alcance, precio, fecha y escribenos en el portal si tienes preguntas.',
    reviewSubject: 'Comparte una resena verificada',
    reviewMessage: 'Gracias por confiar en nosotros. Deja una resena verificada en Baise para ayudar a futuros clientes.',
    winbackSubject: 'Listo para tu proximo servicio',
    winbackMessage: 'Tu historial, recibos y proximas opciones de reserva estan listos dentro de Baise cuando los necesites.',
    paymentSubject: 'Registro de pago esperando en Baise',
    paymentMessage: 'Tus detalles de pago, factura, recibos e historial del servicio estan listos en tu portal Baise.',
    loadError: 'No se pudo cargar el panel de ingresos.',
    recordsError: 'No se pudieron cargar los registros de clientes.',
    createError: 'No se pudo crear la campana.',
    created: 'Campana de cliente creada.',
    contact: 'Contacto',
    due: 'Vence',
    validUntil: 'Valida hasta',
    updated: 'Actualizado',
    manual: 'Manual',
  },
  pt: {
    requiredTitle: 'Painel de receita de clientes',
    requiredDescription: 'Crie uma conta de prestador para gerenciar acompanhamentos, recuperacao de orcamentos, avaliacoes e reativacao.',
    title: 'Painel de receita de clientes',
    description: 'Leads, acompanhamentos, orcamentos, avaliacoes e reativacoes que transformam historico em trabalho recorrente.',
    refresh: 'Atualizar',
    activeClients: 'Clientes ativos',
    hotLeads: 'Leads quentes',
    weightedPipeline: 'Pipeline ponderado',
    dueFollowUps: 'Acompanhamentos vencidos',
    signalsTitle: 'Sinais de receita',
    signalsDescription: 'Saude do pipeline, orcamentos, projetos e relacionamentos em uma vista.',
    openQuotes: 'Orcamentos abertos',
    staleQuotes: 'Orcamentos para seguir',
    activeProjects: 'Projetos ativos',
    reviewReady: 'Projetos prontos para avaliacao',
    winbackReady: 'Clientes para reativar',
    actionsTitle: 'Acoes de clientes',
    actionsDescription: 'Crie mensagens portal primeiro para manter clientes, recibos, aprovacoes e decisoes dentro do Baise.',
    latestCampaigns: 'Campanhas recentes',
    latestCampaignsDescription: 'Mensagens recentes para acompanhamentos, avaliacoes, pagamentos e trabalho recorrente.',
    emptyActions: 'Nao ha acoes urgentes de receita agora.',
    emptyCampaigns: 'Ainda nao ha campanhas de clientes.',
    createCampaign: 'Criar campanha',
    creating: 'Criando',
    followUpLabel: 'Acompanhamento',
    quoteLabel: 'Orcamento',
    reviewLabel: 'Avaliacao',
    winbackLabel: 'Reativacao',
    paymentLabel: 'Pagamento',
    followUpSubject: 'Acompanhamento do seu servico',
    followUpMessage: 'Estamos acompanhando pelo Baise. Suas notas, arquivos, pagamentos e proximos passos estao prontos no portal.',
    quoteSubject: 'Seu orcamento esta pronto',
    quoteMessage: 'Seu orcamento esta pronto no Baise. Revise escopo, preco, prazo e fale conosco no portal se tiver duvidas.',
    reviewSubject: 'Compartilhe uma avaliacao verificada',
    reviewMessage: 'Obrigado por confiar em nos. Deixe uma avaliacao verificada no Baise para ajudar futuros clientes.',
    winbackSubject: 'Pronto para seu proximo servico',
    winbackMessage: 'Seu historico, recibos e proximas opcoes de reserva estao prontos dentro do Baise quando precisar.',
    paymentSubject: 'Registro de pagamento esperando no Baise',
    paymentMessage: 'Seus detalhes de pagamento, fatura, recibos e historico do servico estao prontos no portal Baise.',
    loadError: 'Nao foi possivel carregar o painel de receita.',
    recordsError: 'Nao foi possivel carregar os registros de clientes.',
    createError: 'Nao foi possivel criar a campanha.',
    created: 'Campanha de cliente criada.',
    contact: 'Contato',
    due: 'Vence',
    validUntil: 'Valido ate',
    updated: 'Atualizado',
    manual: 'Manual',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

const formatLabel = (value: string) =>
  value.replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatDate = (value: string | null) => {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const formatMoney = (amount: number | string, currency = 'brl') => {
  const numericAmount = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(numericAmount);
  } catch {
    return `${numericAmount.toFixed(2)} ${currency.toUpperCase()}`;
  }
};

const daysSince = (value: string | null, nowTimestamp: number) => {
  if (!value) return Number.POSITIVE_INFINITY;
  return Math.floor((nowTimestamp - new Date(value).getTime()) / (24 * 60 * 60 * 1000));
};

const isPast = (value: string | null, nowTimestamp: number) =>
  Boolean(value && new Date(value).getTime() < nowTimestamp);

const getPriorityRank = (priority: RetentionAction['priority']) => {
  if (priority === 'critical') return 0;
  if (priority === 'warning') return 1;
  return 2;
};

export function ProviderRetentionCommandCenter() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = RETENTION_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const [providerId, setProviderId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [projects, setProjects] = useState<ProviderProject[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [creatingActionId, setCreatingActionId] = useState<string | null>(null);

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
      setProviderId(data?.id || null);
    }
    setIsLoadingProvider(false);
  }, [copy.loadError, user]);

  const loadRecords = useCallback(async () => {
    if (!providerId) return;

    setIsLoadingRecords(true);
    try {
      const [contactsRes, oppsRes, quotesRes, projectsRes, activitiesRes, campaignsRes] = await Promise.all([
        db
          .from<CRMContact>('provider_crm_contacts')
          .select('id,customer_id,full_name,company_name,email,phone,relationship_type,status,priority,preferred_channel,estimated_value,lifetime_value,last_contact_at,next_follow_up_at,updated_at')
          .eq('provider_id', providerId)
          .order('updated_at', { ascending: false })
          .limit(150),
        db
          .from<CRMOpportunity>('provider_crm_opportunities')
          .select('id,contact_id,title,stage,status,estimated_value,probability,expected_close_date,next_step,updated_at')
          .eq('provider_id', providerId)
          .order('updated_at', { ascending: false })
          .limit(150),
        db
          .from<QuoteRecord>('provider_quote_records')
          .select('id,contact_id,quote_number,title,currency,total_amount,status,valid_until,sent_at,accepted_at,updated_at')
          .eq('provider_id', providerId)
          .order('updated_at', { ascending: false })
          .limit(150),
        db
          .from<ProviderProject>('provider_projects')
          .select('id,contact_id,project_name,project_status,completion_percent,due_date,risk_level,updated_at')
          .eq('provider_id', providerId)
          .order('updated_at', { ascending: false })
          .limit(150),
        db
          .from<CRMActivity>('provider_crm_activities')
          .select('id,contact_id,activity_type,subject,channel,status,due_at,created_at')
          .eq('provider_id', providerId)
          .order('due_at', { ascending: true, nullsFirst: false })
          .limit(150),
        db
          .from<Campaign>('provider_communication_campaigns')
          .select('id,name,campaign_type,audience,primary_channel,status,scheduled_at,created_at')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      const firstError = [contactsRes, oppsRes, quotesRes, projectsRes, activitiesRes, campaignsRes].find((result) => result.error)?.error;
      if (firstError) throw firstError;

      setContacts(contactsRes.data || []);
      setOpportunities(oppsRes.data || []);
      setQuotes(quotesRes.data || []);
      setProjects(projectsRes.data || []);
      setActivities(activitiesRes.data || []);
      setCampaigns(campaignsRes.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.recordsError);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [copy.recordsError, providerId]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const nowTimestamp = Date.now();
  const contactById = useMemo(() => new Map(contacts.map((contact) => [contact.id, contact])), [contacts]);

  const summary = useMemo(() => {
    const activeClients = contacts.filter((contact) =>
      contact.relationship_type === 'client' || ['active', 'won'].includes(contact.status),
    ).length;
    const hotLeads = contacts.filter((contact) =>
      ['lead', 'partner', 'sponsor'].includes(contact.relationship_type) &&
      ['hot', 'urgent', 'vip'].includes(contact.priority) &&
      !['lost', 'inactive'].includes(contact.status),
    ).length;
    const dueFollowUps = contacts.filter((contact) => isPast(contact.next_follow_up_at, nowTimestamp)).length +
      activities.filter((activity) => ['open', 'scheduled'].includes(activity.status) && isPast(activity.due_at, nowTimestamp)).length;
    const weightedPipeline = opportunities
      .filter((opportunity) => opportunity.status === 'open')
      .reduce((total, opportunity) => total + Number(opportunity.estimated_value || 0) * ((Number(opportunity.probability) || 0) / 100), 0);
    const openQuotes = quotes.filter((quote) => ['sent', 'viewed', 'accepted'].includes(quote.status)).length;
    const staleQuotes = quotes.filter((quote) =>
      ['sent', 'viewed'].includes(quote.status) &&
      (isPast(quote.valid_until, nowTimestamp) || daysSince(quote.sent_at || quote.updated_at, nowTimestamp) >= 7),
    ).length;
    const activeProjects = projects.filter((project) =>
      !['completed', 'cancelled'].includes(project.project_status),
    ).length;
    const reviewReady = projects.filter((project) =>
      project.project_status === 'completed' && daysSince(project.updated_at, nowTimestamp) <= 45,
    ).length;
    const winbackReady = contacts.filter((contact) =>
      contact.relationship_type === 'past_client' ||
      contact.status === 'inactive' ||
      (['client', 'past_client'].includes(contact.relationship_type) && daysSince(contact.last_contact_at || contact.updated_at, nowTimestamp) >= 60),
    ).length;

    return {
      activeClients,
      hotLeads,
      dueFollowUps,
      weightedPipeline,
      openQuotes,
      staleQuotes,
      activeProjects,
      reviewReady,
      winbackReady,
    };
  }, [activities, contacts, nowTimestamp, opportunities, projects, quotes]);

  const retentionActions = useMemo<RetentionAction[]>(() => {
    const contactActions = contacts
      .filter((contact) => isPast(contact.next_follow_up_at, nowTimestamp) && !['lost', 'inactive'].includes(contact.status))
      .map((contact) => ({
        id: `contact-${contact.id}`,
        kind: 'follow_up' as const,
        title: contact.full_name,
        detail: `${contact.company_name || contact.email || copy.contact} - ${copy.due} ${formatDate(contact.next_follow_up_at)}`,
        status: copy.followUpLabel,
        date: contact.next_follow_up_at,
        priority: ['urgent', 'vip'].includes(contact.priority) ? ('critical' as const) : ('warning' as const),
        contactId: contact.id,
        campaignType: 'follow_up' as const,
        activityType: 'follow_up' as const,
        triggerType: 'manual' as const,
        subject: copy.followUpSubject,
        message: copy.followUpMessage,
        buttonLabel: copy.createCampaign,
      }));

    const quoteActions = quotes
      .filter((quote) =>
        ['sent', 'viewed'].includes(quote.status) &&
        (isPast(quote.valid_until, nowTimestamp) || daysSince(quote.sent_at || quote.updated_at, nowTimestamp) >= 7),
      )
      .map((quote) => {
        const contact = quote.contact_id ? contactById.get(quote.contact_id) : null;
        return {
          id: `quote-${quote.id}`,
          kind: 'quote' as const,
          title: quote.quote_number || quote.title,
          detail: `${contact?.full_name || copy.contact} - ${formatMoney(quote.total_amount, quote.currency)}${
            quote.valid_until ? ` - ${copy.validUntil} ${formatDate(quote.valid_until)}` : ''
          }`,
          status: copy.quoteLabel,
          date: quote.valid_until || quote.sent_at || quote.updated_at,
          priority: isPast(quote.valid_until, nowTimestamp) ? ('critical' as const) : ('warning' as const),
          contactId: quote.contact_id,
          campaignType: 'follow_up' as const,
          activityType: 'follow_up' as const,
          triggerType: 'manual' as const,
          subject: copy.quoteSubject,
          message: copy.quoteMessage,
          buttonLabel: copy.createCampaign,
        };
      });

    const reviewActions = projects
      .filter((project) => project.project_status === 'completed' && daysSince(project.updated_at, nowTimestamp) <= 45)
      .map((project) => {
        const contact = project.contact_id ? contactById.get(project.contact_id) : null;
        return {
          id: `review-${project.id}`,
          kind: 'review' as const,
          title: project.project_name,
          detail: `${contact?.full_name || copy.contact} - ${copy.updated} ${formatDate(project.updated_at)}`,
          status: copy.reviewLabel,
          date: project.updated_at,
          priority: 'info' as const,
          contactId: project.contact_id,
          campaignType: 'review_request' as const,
          activityType: 'review_request' as const,
          triggerType: 'review_event' as const,
          subject: copy.reviewSubject,
          message: copy.reviewMessage,
          buttonLabel: copy.createCampaign,
        };
      });

    const winbackActions = contacts
      .filter((contact) =>
        contact.relationship_type === 'past_client' ||
        contact.status === 'inactive' ||
        (['client', 'past_client'].includes(contact.relationship_type) && daysSince(contact.last_contact_at || contact.updated_at, nowTimestamp) >= 60),
      )
      .map((contact) => ({
        id: `winback-${contact.id}`,
        kind: 'winback' as const,
        title: contact.full_name,
        detail: `${contact.company_name || contact.email || copy.contact} - ${copy.updated} ${formatDate(contact.last_contact_at || contact.updated_at)}`,
        status: copy.winbackLabel,
        date: contact.last_contact_at || contact.updated_at,
        priority: contact.priority === 'vip' ? ('warning' as const) : ('info' as const),
        contactId: contact.id,
        campaignType: 'winback' as const,
        activityType: 'campaign' as const,
        triggerType: 'inactive_client' as const,
        subject: copy.winbackSubject,
        message: copy.winbackMessage,
        buttonLabel: copy.createCampaign,
      }));

    return [...contactActions, ...quoteActions, ...reviewActions, ...winbackActions]
      .sort((a, b) => {
        const priorityDelta = getPriorityRank(a.priority) - getPriorityRank(b.priority);
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      })
      .slice(0, 8);
  }, [contactById, contacts, copy, nowTimestamp, projects, quotes]);

  const createClientCampaign = async (action: RetentionAction) => {
    if (!providerId || !user) return;

    setCreatingActionId(action.id);
    const contact = action.contactId ? contactById.get(action.contactId) : null;
    const now = new Date().toISOString();
    const nextFollowUp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      const { data, error } = await db
        .from<{ id: string }>('provider_communication_campaigns')
        .insert({
          provider_id: providerId,
          created_by: user.id,
          name: action.subject,
          campaign_type: action.campaignType,
          audience: 'custom',
          primary_channel: 'portal',
          secondary_channels: ['email', 'whatsapp'],
          portal_first: true,
          subject: action.subject,
          message_body: action.message,
          trigger_type: action.triggerType,
          scheduled_at: now,
          status: 'active',
          metadata: {
            source: 'client_revenue_cockpit',
            contact_id: action.contactId,
            action_kind: action.kind,
            fallback_channels: ['email', 'whatsapp'],
          },
        })
        .select('id')
        .single();

      if (error) throw error;

      await db.from('provider_communication_events').insert({
        provider_id: providerId,
        campaign_id: data.id,
        customer_id: contact?.customer_id || null,
        created_by: user.id,
        purpose: action.campaignType === 'payment_reminder' ? 'payment_request' : action.kind === 'follow_up' ? 'follow_up' : 'campaign',
        channel: 'portal',
        subject: action.subject,
        message_body: action.message,
        scheduled_at: now,
        status: 'queued',
        metadata: {
          source: 'client_revenue_cockpit',
          contact_id: action.contactId,
          portal_first: true,
          fallback_channels: ['email', 'whatsapp'],
        },
      });

      await db.from('provider_crm_activities').insert({
        provider_id: providerId,
        contact_id: action.contactId,
        created_by: user.id,
        activity_type: action.activityType,
        subject: action.subject,
        body: action.message,
        channel: 'portal',
        status: 'completed',
        completed_at: now,
        metadata: {
          source: 'client_revenue_cockpit',
          campaign_id: data.id,
        },
      });

      if (action.contactId) {
        await db
          .from('provider_crm_contacts')
          .update({ last_contact_at: now, next_follow_up_at: nextFollowUp })
          .eq('id', action.contactId)
          .eq('provider_id', providerId);
      }

      recordProviderOperationSilently({
        action: 'client_retention.campaign_created',
        resourceType: 'provider_communication_campaign',
        resourceId: data.id,
        metadata: {
          action_kind: action.kind,
          campaign_type: action.campaignType,
          contact_id: action.contactId,
          portal_first: true,
        },
      });

      toast.success(copy.created);
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setCreatingActionId(null);
    }
  };

  const metrics = [
    { label: copy.activeClients, value: summary.activeClients, icon: Users },
    { label: copy.hotLeads, value: summary.hotLeads, icon: Target },
    { label: copy.weightedPipeline, value: formatMoney(summary.weightedPipeline), icon: TrendingUp },
    { label: copy.dueFollowUps, value: summary.dueFollowUps, icon: Bell },
  ];

  const signals = [
    { label: copy.openQuotes, value: summary.openQuotes, icon: FileText },
    { label: copy.staleQuotes, value: summary.staleQuotes, icon: Clock },
    { label: copy.activeProjects, value: summary.activeProjects, icon: CalendarClock },
    { label: copy.reviewReady, value: summary.reviewReady, icon: Star },
    { label: copy.winbackReady, value: summary.winbackReady, icon: Repeat },
  ];

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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-lg border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-3 text-xl font-semibold">{metric.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.signalsTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.signalsDescription}</p>
            </div>
            <div className="divide-y">
              {signals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.label} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-muted p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{signal.label}</span>
                    </div>
                    <Badge variant="secondary">{signal.value}</Badge>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.actionsTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.actionsDescription}</p>
            </div>
            <div className="divide-y">
              {retentionActions.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {copy.emptyActions}
                </div>
              ) : (
                retentionActions.map((action) => (
                  <RetentionActionRow
                    key={action.id}
                    action={action}
                    isCreating={creatingActionId === action.id}
                    onCreate={() => createClientCampaign(action)}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-lg border bg-background">
          <div className="border-b p-4">
            <h3 className="font-semibold">{copy.latestCampaigns}</h3>
            <p className="text-sm text-muted-foreground">{copy.latestCampaignsDescription}</p>
          </div>
          <div className="divide-y">
            {campaigns.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{copy.emptyCampaigns}</p>
            ) : (
              campaigns.map((campaign) => (
                <div key={campaign.id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <Badge variant="secondary">{formatLabel(campaign.campaign_type)}</Badge>
                      <Badge variant="outline">{formatLabel(campaign.primary_channel)}</Badge>
                      <Badge>{formatLabel(campaign.status)}</Badge>
                    </div>
                    <p className="font-medium">{campaign.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.scheduled_at ? formatDate(campaign.scheduled_at) : copy.manual}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function RetentionActionRow({
  action,
  isCreating,
  onCreate,
}: {
  action: RetentionAction;
  isCreating: boolean;
  onCreate: () => void;
}) {
  const Icon =
    action.kind === 'quote'
      ? FileText
      : action.kind === 'review'
        ? Star
        : action.kind === 'winback'
          ? Repeat
          : action.kind === 'payment'
            ? MessageSquare
            : Bell;
  const variant = action.priority === 'critical' ? 'destructive' : action.priority === 'warning' ? 'secondary' : 'outline';

  return (
    <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 rounded-full bg-muted p-2">
          {action.priority === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{formatLabel(action.kind)}</Badge>
            <Badge variant={variant}>{action.status}</Badge>
          </div>
          <p className="mt-2 font-medium">{action.title}</p>
          <p className="text-sm text-muted-foreground">{action.detail}</p>
        </div>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onCreate} disabled={isCreating}>
        {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        {action.buttonLabel}
      </Button>
    </div>
  );
}
