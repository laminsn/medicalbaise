import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileImage,
  FileText,
  FolderKanban,
  Loader2,
  PenLine,
  RefreshCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { queueProviderUpdateNotification } from '@/lib/providerCommunication';
import { recordProviderOperationSilently } from '@/lib/providerOperations';

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

type ProjectRecord = {
  id: string;
  contact_id: string | null;
  project_name: string;
  project_status: string;
  priority: string;
  completion_percent: number;
  due_date: string | null;
  next_milestone: string | null;
  risk_level: string;
  updated_at: string;
};

type ProjectTask = {
  id: string;
  project_id: string | null;
  contact_id: string | null;
  title: string;
  task_status: string;
  priority: string;
  due_at: string | null;
};

type WorkSignoff = {
  id: string;
  contact_id: string | null;
  quote_id: string | null;
  project_id: string | null;
  customer_id: string | null;
  title: string;
  signoff_type: string;
  status: string;
  signer_name: string | null;
  signer_email: string | null;
  signed_at: string | null;
  created_at: string;
};

type WorkAttachment = {
  id: string;
  quote_id: string | null;
  project_id: string | null;
  signoff_id: string | null;
  file_name: string;
  attachment_type: string;
  mime_type: string | null;
  caption: string | null;
  created_at: string;
};

type DeliveryAction = {
  id: string;
  kind: 'quote' | 'project' | 'task' | 'signoff';
  title: string;
  detail: string;
  status: string;
  date: string | null;
  priority: 'critical' | 'warning' | 'info';
  buttonLabel?: string;
  onAction?: () => void;
};

type ClientContact = {
  id: string;
  customer_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
};

type DeliveryNotification = {
  eventKey: 'new_link' | 'job_accepted' | 'service_provided' | 'signature_requested';
  subject: string;
  message: string;
  resourceKind: string;
  contactId?: string | null;
  targetUserId?: string | null;
  targetEmail?: string | null;
  targetPhone?: string | null;
  metadata?: Record<string, unknown>;
};

type SupabaseError = { message: string };
type ProviderRecord = { id: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: SupabaseError | null }>;
type Query<T> = QueryResult<T[]> & {
  eq: (column: string, value: string) => Query<T>;
  in: (column: string, values: string[]) => Query<T>;
  order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => Query<T>;
  limit: (count: number) => Query<T>;
};
type Mutation = QueryResult<null> & {
  eq: (column: string, value: string) => Mutation;
};
type Table<T> = {
  select: (columns: string) => Query<T>;
  update: (values: Record<string, unknown>) => Mutation;
};
type ProviderTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => QueryResult<ProviderRecord>;
    };
  };
};
type DeliveryDb = {
  from: {
    (table: 'providers'): ProviderTable;
    <T>(table: string): Table<T>;
  };
};

const db = supabase as unknown as DeliveryDb;

const DELIVERY_COPY = {
  en: {
    requiredTitle: 'Delivery command center',
    requiredDescription: 'Create a provider account to manage quotes, projects, sign-offs, and proof files.',
    title: 'Delivery command center',
    description: 'Quotes, project milestones, client sign-offs, and proof files for work in motion.',
    refresh: 'Refresh',
    quotes: 'Open quotes',
    projects: 'Active projects',
    signoffs: 'Pending sign-offs',
    proof: 'Proof files',
    actionTitle: 'Ready for action',
    actionDescription: 'Follow-ups, deadlines, client approvals, and blocked work.',
    projectTitle: 'Project board',
    projectDescription: 'Active work with status, risk, milestone, and progress.',
    proofTitle: 'Latest proof files',
    proofDescription: 'Photos, documents, signatures, and service evidence attached to client work.',
    emptyActions: 'No urgent delivery actions right now.',
    emptyProjects: 'No active projects in this view.',
    emptyProof: 'No proof files uploaded yet.',
    loadError: 'Unable to load provider delivery workspace.',
    recordsError: 'Unable to load delivery records.',
    updateError: 'Unable to update delivery record.',
    updated: 'Delivery record updated.',
    markSent: 'Mark sent',
    convertQuote: 'Convert',
    resume: 'Resume',
    markDone: 'Done',
    requestSignoff: 'Request',
    due: 'Due',
    expires: 'Expires',
    signed: 'Signed',
    signer: 'Signer',
    noMilestone: 'No milestone set',
  },
  es: {
    requiredTitle: 'Centro de entrega',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar presupuestos, proyectos, firmas y archivos de prueba.',
    title: 'Centro de entrega',
    description: 'Presupuestos, hitos, firmas del cliente y pruebas para el trabajo en curso.',
    refresh: 'Actualizar',
    quotes: 'Presupuestos abiertos',
    projects: 'Proyectos activos',
    signoffs: 'Firmas pendientes',
    proof: 'Archivos de prueba',
    actionTitle: 'Listo para accion',
    actionDescription: 'Seguimientos, fechas limite, aprobaciones del cliente y trabajo bloqueado.',
    projectTitle: 'Tablero de proyectos',
    projectDescription: 'Trabajo activo con estado, riesgo, hito y progreso.',
    proofTitle: 'Pruebas recientes',
    proofDescription: 'Fotos, documentos, firmas y evidencia del servicio vinculados al trabajo del cliente.',
    emptyActions: 'No hay acciones urgentes de entrega ahora.',
    emptyProjects: 'No hay proyectos activos en esta vista.',
    emptyProof: 'Aun no hay archivos de prueba.',
    loadError: 'No se pudo cargar el espacio de entrega del proveedor.',
    recordsError: 'No se pudieron cargar los registros de entrega.',
    updateError: 'No se pudo actualizar el registro de entrega.',
    updated: 'Registro de entrega actualizado.',
    markSent: 'Marcar enviado',
    convertQuote: 'Convertir',
    resume: 'Reanudar',
    markDone: 'Listo',
    requestSignoff: 'Solicitar',
    due: 'Vence',
    expires: 'Expira',
    signed: 'Firmado',
    signer: 'Firmante',
    noMilestone: 'Sin hito definido',
  },
  pt: {
    requiredTitle: 'Centro de entrega',
    requiredDescription: 'Crie uma conta de prestador para gerenciar orcamentos, projetos, assinaturas e arquivos de prova.',
    title: 'Centro de entrega',
    description: 'Orcamentos, marcos, assinaturas do cliente e provas para servicos em andamento.',
    refresh: 'Atualizar',
    quotes: 'Orcamentos abertos',
    projects: 'Projetos ativos',
    signoffs: 'Assinaturas pendentes',
    proof: 'Arquivos de prova',
    actionTitle: 'Pronto para acao',
    actionDescription: 'Acompanhamentos, prazos, aprovacoes do cliente e trabalho bloqueado.',
    projectTitle: 'Quadro de projetos',
    projectDescription: 'Trabalho ativo com status, risco, marco e progresso.',
    proofTitle: 'Provas recentes',
    proofDescription: 'Fotos, documentos, assinaturas e evidencias do servico vinculadas ao trabalho do cliente.',
    emptyActions: 'Nao ha acoes urgentes de entrega agora.',
    emptyProjects: 'Nao ha projetos ativos nesta visualizacao.',
    emptyProof: 'Ainda nao ha arquivos de prova.',
    loadError: 'Nao foi possivel carregar o espaco de entrega do prestador.',
    recordsError: 'Nao foi possivel carregar os registros de entrega.',
    updateError: 'Nao foi possivel atualizar o registro de entrega.',
    updated: 'Registro de entrega atualizado.',
    markSent: 'Marcar enviado',
    convertQuote: 'Converter',
    resume: 'Retomar',
    markDone: 'Concluir',
    requestSignoff: 'Solicitar',
    due: 'Vence',
    expires: 'Expira',
    signed: 'Assinado',
    signer: 'Assinante',
    noMilestone: 'Sem marco definido',
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

const priorityRank = (priority: DeliveryAction['priority']) => {
  if (priority === 'critical') return 0;
  if (priority === 'warning') return 1;
  return 2;
};

export function ProviderDeliveryCommandCenter() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const copy = useMemo(
    () => DELIVERY_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)],
    [i18n.language, i18n.resolvedLanguage],
  );
  const [providerId, setProviderId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [signoffs, setSignoffs] = useState<WorkSignoff[]>([]);
  const [attachments, setAttachments] = useState<WorkAttachment[]>([]);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

    setIsLoadingRecords(true);
    const [quotesResult, projectsResult, tasksResult, signoffsResult, attachmentsResult] = await Promise.all([
      db
        .from<QuoteRecord>('provider_quote_records')
        .select('id,contact_id,quote_number,title,currency,total_amount,status,valid_until,sent_at,accepted_at,updated_at')
        .eq('provider_id', providerId)
        .in('status', ['draft', 'sent', 'viewed', 'accepted'])
        .order('updated_at', { ascending: false })
        .limit(12),
      db
        .from<ProjectRecord>('provider_projects')
        .select('id,contact_id,project_name,project_status,priority,completion_percent,due_date,next_milestone,risk_level,updated_at')
        .eq('provider_id', providerId)
        .in('project_status', ['planning', 'scheduled', 'in_progress', 'waiting_client', 'on_hold'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(12),
      db
        .from<ProjectTask>('provider_project_tasks')
        .select('id,project_id,contact_id,title,task_status,priority,due_at')
        .eq('provider_id', providerId)
        .in('task_status', ['todo', 'in_progress', 'blocked'])
        .order('due_at', { ascending: true, nullsFirst: false })
        .limit(12),
      db
        .from<WorkSignoff>('provider_work_signoffs')
        .select('id,contact_id,quote_id,project_id,customer_id,title,signoff_type,status,signer_name,signer_email,signed_at,created_at')
        .eq('provider_id', providerId)
        .in('status', ['draft', 'requested', 'declined'])
        .order('created_at', { ascending: false })
        .limit(12),
      db
        .from<WorkAttachment>('provider_work_attachments')
        .select('id,quote_id,project_id,signoff_id,file_name,attachment_type,mime_type,caption,created_at')
        .eq('provider_id', providerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    if (quotesResult.error || projectsResult.error || tasksResult.error || signoffsResult.error || attachmentsResult.error) {
      toast.error(copy.recordsError);
    }

    setQuotes(quotesResult.data ?? []);
    setProjects(projectsResult.data ?? []);
    setTasks(tasksResult.data ?? []);
    setSignoffs(signoffsResult.data ?? []);
    setAttachments(attachmentsResult.data ?? []);
    setIsLoadingRecords(false);
  }, [copy.recordsError, providerId]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const resolveClientContact = useCallback(
    async (contactId?: string | null): Promise<ClientContact | null> => {
      if (!contactId || !providerId) return null;

      const { data, error } = await supabase
        .from('provider_crm_contacts')
        .select('id,customer_id,full_name,email,phone')
        .eq('id', contactId)
        .eq('provider_id', providerId)
        .maybeSingle();

      if (error) {
        console.warn('Unable to resolve client contact for delivery notification', error);
        return null;
      }

      return data as ClientContact | null;
    },
    [providerId],
  );

  const queueDeliveryNotification = useCallback(
    async (resourceId: string, notification?: DeliveryNotification) => {
      if (!providerId || !user || !notification) return;

      try {
        const contact = await resolveClientContact(notification.contactId);
        const targetUserId = notification.targetUserId || contact?.customer_id || null;
        const targetEmail = notification.targetEmail || contact?.email || null;
        const targetPhone = notification.targetPhone || contact?.phone || null;

        if (!targetUserId && !targetEmail) return;

        await queueProviderUpdateNotification({
          providerId,
          targetUserId,
          actorId: user.id,
          eventKey: notification.eventKey,
          subject: notification.subject,
          message: notification.message,
          actionPath: '/customer-dashboard',
          resourceKind: notification.resourceKind,
          resourceId,
          targetEmail,
          targetPhone,
          audience: 'client',
          locale: i18n.resolvedLanguage || i18n.language,
          metadata: {
            actor_role: 'owner',
            contact_id: notification.contactId || null,
            contact_name: contact?.full_name || null,
            ...notification.metadata,
          },
        });
      } catch (notificationError) {
        console.warn('Unable to queue delivery notification', notificationError);
      }
    },
    [i18n.language, i18n.resolvedLanguage, providerId, resolveClientContact, user],
  );

  const updateDeliveryRecord = useCallback(
    async (
      table: string,
      id: string,
      values: Record<string, unknown>,
      action: string,
      resourceType: string,
      notification?: DeliveryNotification,
    ) => {
      if (!providerId) return;

      setUpdatingId(id);
      const { error } = await db.from(table).update(values).eq('id', id).eq('provider_id', providerId);
      setUpdatingId(null);

      if (error) {
        toast.error(copy.updateError);
        return;
      }

      recordProviderOperationSilently({
        action,
        resourceType,
        resourceId: id,
        metadata: values,
      });
      await queueDeliveryNotification(id, notification);
      toast.success(copy.updated);
      await loadRecords();
    },
    [copy.updateError, copy.updated, loadRecords, providerId, queueDeliveryNotification],
  );

  const nowTimestamp = Date.now();

  const activeProjectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);

  const deliveryActions = useMemo(() => {
    const actions: DeliveryAction[] = [
      ...quotes.map((quote) => {
        const isExpired = isPast(quote.valid_until, nowTimestamp) && !['accepted', 'converted'].includes(quote.status);
        return {
          id: quote.id,
          kind: 'quote' as const,
          title: quote.title,
          detail: `${quote.quote_number || 'Quote'} · ${formatMoney(quote.total_amount, quote.currency)}${
            quote.valid_until ? ` · ${copy.expires} ${formatDate(quote.valid_until)}` : ''
          }`,
          status: isExpired ? 'Expired' : formatLabel(quote.status),
          date: quote.valid_until || quote.updated_at,
          priority: isExpired ? ('critical' as const) : quote.status === 'draft' ? ('warning' as const) : ('info' as const),
          buttonLabel: quote.status === 'draft' ? copy.markSent : quote.status === 'accepted' ? copy.convertQuote : undefined,
          onAction:
            quote.status === 'draft'
              ? () =>
                  updateDeliveryRecord(
                    'provider_quote_records',
                    quote.id,
                    { status: 'sent', sent_at: new Date().toISOString() },
                    'quote.sent',
                    'provider_quote_record',
                    {
                      eventKey: 'new_link',
                      subject: `${quote.quote_number || 'Your quote'} is ready`,
                      message: `${quote.title} is ready for review. Open your portal to view the quote, service details, approval options, and next steps.`,
                      resourceKind: 'provider_quote_record',
                      contactId: quote.contact_id,
                      metadata: {
                        quote_number: quote.quote_number,
                        quote_total: quote.total_amount,
                        quote_status: 'sent',
                      },
                    },
                  )
              : quote.status === 'accepted'
                ? () =>
                    updateDeliveryRecord(
                      'provider_quote_records',
                      quote.id,
                      { status: 'converted' },
                      'quote.converted',
                      'provider_quote_record',
                      {
                        eventKey: 'job_accepted',
                        subject: `${quote.title} is moving forward`,
                        message: `${quote.title} has been accepted and moved into the next stage. Open your portal for schedule, payment, signature, and service records.`,
                        resourceKind: 'provider_quote_record',
                        contactId: quote.contact_id,
                        metadata: {
                          quote_number: quote.quote_number,
                          quote_total: quote.total_amount,
                          quote_status: 'converted',
                        },
                      },
                    )
                : undefined,
        };
      }),
      ...projects
        .filter((project) => project.risk_level === 'high' || project.project_status === 'waiting_client' || isPast(project.due_date, nowTimestamp))
        .map((project) => ({
          id: project.id,
          kind: 'project' as const,
          title: project.project_name,
          detail: `${project.next_milestone || copy.noMilestone}${project.due_date ? ` · ${copy.due} ${formatDate(project.due_date)}` : ''}`,
          status: project.risk_level === 'high' ? 'High Risk' : formatLabel(project.project_status),
          date: project.due_date || project.updated_at,
          priority: project.risk_level === 'high' || isPast(project.due_date, nowTimestamp) ? ('critical' as const) : ('warning' as const),
          buttonLabel: project.project_status === 'waiting_client' || project.project_status === 'on_hold' ? copy.resume : undefined,
          onAction:
            project.project_status === 'waiting_client' || project.project_status === 'on_hold'
              ? () =>
                  updateDeliveryRecord(
                    'provider_projects',
                    project.id,
                    { project_status: 'in_progress' },
                    'project.resumed',
                    'provider_project',
                  )
              : undefined,
        })),
      ...tasks
        .filter((task) => task.task_status === 'blocked' || task.priority === 'urgent' || isPast(task.due_at, nowTimestamp))
        .map((task) => ({
          id: task.id,
          kind: 'task' as const,
          title: task.title,
          detail: `${task.project_id ? activeProjectById.get(task.project_id)?.project_name || 'Project' : 'Project'}${
            task.due_at ? ` · ${copy.due} ${formatDate(task.due_at)}` : ''
          }`,
          status: task.task_status === 'blocked' ? 'Blocked' : formatLabel(task.priority),
          date: task.due_at,
          priority: task.task_status === 'blocked' || isPast(task.due_at, nowTimestamp) ? ('critical' as const) : ('warning' as const),
          buttonLabel: task.task_status !== 'blocked' ? copy.markDone : undefined,
          onAction:
            task.task_status !== 'blocked'
              ? () =>
                  updateDeliveryRecord(
                    'provider_project_tasks',
                    task.id,
                    { task_status: 'done', completed_at: new Date().toISOString() },
                    'project_task.completed',
                    'provider_project_task',
                    {
                      eventKey: 'service_provided',
                      subject: `${task.title} was completed`,
                      message: `${task.title} has been marked complete. Open your portal to review proof, notes, receipts, and any next steps.`,
                      resourceKind: 'provider_project_task',
                      contactId: task.contact_id || (task.project_id ? activeProjectById.get(task.project_id)?.contact_id : null),
                      metadata: {
                        project_id: task.project_id,
                        task_status: 'done',
                      },
                    },
                  )
              : undefined,
        })),
      ...signoffs.map((signoff) => ({
        id: signoff.id,
        kind: 'signoff' as const,
        title: signoff.title,
        detail: `${formatLabel(signoff.signoff_type)} · ${signoff.signer_name || copy.signer}`,
        status: formatLabel(signoff.status),
        date: signoff.created_at,
        priority: signoff.status === 'declined' ? ('critical' as const) : ('warning' as const),
        buttonLabel: signoff.status === 'draft' ? copy.requestSignoff : undefined,
        onAction:
          signoff.status === 'draft'
            ? () =>
                  updateDeliveryRecord(
                    'provider_work_signoffs',
                    signoff.id,
                    { status: 'requested' },
                    'signoff.requested',
                    'provider_work_signoff',
                    {
                      eventKey: 'signature_requested',
                      subject: `Signature requested: ${signoff.title}`,
                      message: `${signoff.title} needs your review and signature before the next step. Open your portal to review the details and sign securely.`,
                      resourceKind: 'provider_work_signoff',
                      contactId: signoff.contact_id,
                      targetUserId: signoff.customer_id,
                      targetEmail: signoff.signer_email,
                      metadata: {
                        quote_id: signoff.quote_id,
                        project_id: signoff.project_id,
                        signoff_type: signoff.signoff_type,
                        signoff_status: 'requested',
                      },
                    },
                  )
            : undefined,
      })),
    ];

    return actions
      .sort((a, b) => {
        const priorityDelta = priorityRank(a.priority) - priorityRank(b.priority);
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      })
      .slice(0, 8);
  }, [activeProjectById, copy, nowTimestamp, projects, quotes, signoffs, tasks, updateDeliveryRecord]);

  const metrics = useMemo(
    () => [
      { label: copy.quotes, value: quotes.length, icon: FileText },
      { label: copy.projects, value: projects.length, icon: FolderKanban },
      { label: copy.signoffs, value: signoffs.length, icon: PenLine },
      { label: copy.proof, value: attachments.length, icon: FileImage },
    ],
    [attachments.length, copy, projects.length, quotes.length, signoffs.length],
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.actionTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.actionDescription}</p>
            </div>
            <div className="divide-y">
              {deliveryActions.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {copy.emptyActions}
                </div>
              ) : (
                deliveryActions.map((action) => (
                  <DeliveryActionRow
                    key={`${action.kind}-${action.id}`}
                    action={action}
                    isUpdating={updatingId === action.id}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.proofTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.proofDescription}</p>
            </div>
            <div className="divide-y">
              {attachments.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <FileImage className="h-4 w-4" />
                  {copy.emptyProof}
                </div>
              ) : (
                attachments.map((attachment) => (
                  <div key={attachment.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{attachment.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatLabel(attachment.attachment_type)} · {formatDate(attachment.created_at)}
                        </p>
                      </div>
                      <Badge variant="outline">{attachment.mime_type?.split('/')[0] || 'file'}</Badge>
                    </div>
                    {attachment.caption && <p className="mt-2 text-sm text-muted-foreground">{attachment.caption}</p>}
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-lg border bg-background">
          <div className="border-b p-4">
            <h3 className="font-semibold">{copy.projectTitle}</h3>
            <p className="text-sm text-muted-foreground">{copy.projectDescription}</p>
          </div>
          {projects.length === 0 ? (
            <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
              <FolderKanban className="h-4 w-4" />
              {copy.emptyProjects}
            </div>
          ) : (
            <div className="grid gap-3 p-4 lg:grid-cols-2">
              {projects.slice(0, 6).map((project) => (
                <div key={project.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{formatLabel(project.project_status)}</Badge>
                    <Badge variant="outline">{formatLabel(project.priority)}</Badge>
                    <Badge variant={project.risk_level === 'high' ? 'destructive' : 'secondary'}>{formatLabel(project.risk_level)}</Badge>
                  </div>
                  <p className="mt-3 font-semibold">{project.project_name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{project.next_milestone || copy.noMilestone}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${project.completion_percent}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.completion_percent}%</span>
                    {project.due_date && <span>{copy.due} {formatDate(project.due_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

function DeliveryActionRow({
  action,
  isUpdating,
}: {
  action: DeliveryAction;
  isUpdating: boolean;
}) {
  const Icon =
    action.kind === 'quote'
      ? FileText
      : action.kind === 'project'
        ? FolderKanban
        : action.kind === 'task'
          ? ClipboardCheck
          : PenLine;
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
      {action.buttonLabel && action.onAction && (
        <Button type="button" size="sm" variant="outline" onClick={action.onAction} disabled={isUpdating}>
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {action.buttonLabel}
        </Button>
      )}
    </div>
  );
}
