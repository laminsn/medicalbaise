import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  Briefcase,
  Camera,
  CheckCircle2,
  ClipboardList,
  FileText,
  Loader2,
  MessageSquare,
  PenLine,
  Plus,
  Send,
  Target,
  Upload,
  Users,
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
import { formatPrice } from '@/lib/currency';
import { SignaturePad } from '@/components/signature/SignaturePad';

type CRMContact = {
  id: string;
  customer_id: string | null;
  full_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  relationship_type: string;
  status: string;
  source: string;
  priority: string;
  preferred_channel: string;
  estimated_value: number;
  lifetime_value: number;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
};

type CRMOpportunity = {
  id: string;
  contact_id: string | null;
  title: string;
  stage: string;
  status: string;
  estimated_value: number;
  probability: number;
  expected_close_date: string | null;
  next_step: string | null;
};

type QuoteRecord = {
  id: string;
  contact_id: string | null;
  opportunity_id: string | null;
  quote_number: string | null;
  title: string;
  service_scope: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  valid_until: string | null;
  created_at: string;
};

type ProviderProject = {
  id: string;
  contact_id: string | null;
  quote_id: string | null;
  project_name: string;
  description: string | null;
  project_status: string;
  priority: string;
  budget: number;
  spent_amount: number;
  completion_percent: number;
  start_date: string | null;
  due_date: string | null;
  next_milestone: string | null;
  risk_level: string;
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

type CRMActivity = {
  id: string;
  contact_id: string | null;
  project_id: string | null;
  activity_type: string;
  subject: string;
  body: string | null;
  channel: string;
  status: string;
  due_at: string | null;
  created_at: string;
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
  signature_data_url: string | null;
  signed_at: string | null;
  notes: string | null;
  created_at: string;
};

type WorkAttachment = {
  id: string;
  contact_id: string | null;
  quote_id: string | null;
  project_id: string | null;
  signoff_id: string | null;
  file_name: string;
  file_path: string;
  bucket_id: string;
  file_size: number | null;
  mime_type: string | null;
  attachment_type: string;
  caption: string | null;
  signed_url?: string | null;
  created_at: string;
};

const db = supabase as any;

const CRM_COPY = {
  en: {
    requiredTitle: 'CRM management',
    requiredDescription: 'Create a provider account to manage contacts, quotes, projects, follow-ups, and push-ready reminders.',
    title: 'Provider CRM, quotes, and projects',
    description: 'Manage every relationship from first lead to quote, project delivery, review request, and repeat business without leaving Baise.',
    contacts: 'Contacts',
    pipeline: 'Pipeline',
    quotes: 'Quotes',
    projects: 'Projects',
    tasksDue: 'Tasks due',
    addContact: 'Add contact or lead',
    contactDescription: 'Capture leads, clients, referral partners, sponsors, vendors, and repeat customers.',
    fullName: 'Full name',
    company: 'Company',
    email: 'Email',
    phone: 'Phone',
    type: 'Type',
    status: 'Status',
    source: 'Source',
    priority: 'Priority',
    preferredChannel: 'Preferred channel',
    estimatedValue: 'Estimated value',
    followUp: 'Next follow-up',
    tags: 'Tags',
    notes: 'Notes',
    createContact: 'Create contact',
    createOpportunity: 'Create opportunity',
    opportunityTitle: 'Opportunity title',
    stage: 'Stage',
    probability: 'Probability',
    closeDate: 'Expected close date',
    nextStep: 'Next step',
    createQuote: 'Create quote',
    quoteTitle: 'Quote title',
    scope: 'Scope',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    validUntil: 'Valid until',
    createProject: 'Create project',
    projectName: 'Project name',
    budget: 'Budget',
    dueDate: 'Due date',
    milestone: 'Next milestone',
    completion: 'Completion',
    addTask: 'Add project task',
    taskTitle: 'Task title',
    taskProject: 'Project',
    addActivity: 'Add follow-up activity',
    activitySubject: 'Subject',
    activityBody: 'Details',
    activityType: 'Activity type',
    dueAt: 'Due date and time',
    createPortalNotification: 'Create portal and push notification',
    saveActivity: 'Save activity',
    contactList: 'Relationship list',
    quoteList: 'Quote management',
    projectList: 'Project management',
    activityList: 'Activity timeline',
    noContacts: 'No CRM contacts yet.',
    noOpportunities: 'No opportunities yet.',
    noQuotes: 'No quotes yet.',
    noProjects: 'No projects yet.',
    noActivities: 'No activities yet.',
    validationContact: 'Add a contact name.',
    validationQuote: 'Add a quote title and scope.',
    validationProject: 'Add a project name.',
    validationActivity: 'Add an activity subject.',
    createdContact: 'Contact created.',
    createdOpportunity: 'Opportunity created.',
    createdQuote: 'Quote created.',
    createdProject: 'Project created.',
    createdTask: 'Task created.',
    createdActivity: 'Activity saved and reminders queued.',
    loadError: 'Unable to load provider CRM.',
    recordsError: 'Unable to load CRM records.',
    createError: 'Unable to save CRM record.',
    converted: 'Quote converted into a project.',
    updated: 'CRM record updated.',
    allContacts: 'No linked contact',
    markContacted: 'Mark contacted',
    convertToProject: 'Convert to project',
    markDone: 'Mark done',
    signoffTitle: 'Client sign-off and proof',
    signoffDescription: 'Collect approvals, signatures, completed-work photos, unexpected-problem evidence, and quote or estimate attachments.',
    createSignoff: 'Create sign-off request',
    signoffName: 'Sign-off title',
    signoffType: 'Sign-off type',
    signerName: 'Signer name',
    signerEmail: 'Signer email',
    captureSignature: 'Capture client signature',
    clearSignature: 'Clear signature',
    saveSignature: 'Save signed approval',
    signatureRequired: 'Draw or capture a client signature first.',
    createdSignoff: 'Sign-off request created.',
    signedSignoff: 'Client sign-off saved.',
    uploadProof: 'Upload work proof',
    attachmentType: 'Attachment type',
    attachmentCaption: 'Caption',
    files: 'Files',
    uploadFiles: 'Upload files',
    uploadedFiles: 'Proof uploaded.',
    noSignoffs: 'No sign-off records yet.',
    noAttachments: 'No proof files yet.',
    signoffList: 'Sign-off records',
    attachmentList: 'Proof and attachments',
  },
  es: {
    requiredTitle: 'Gestión de CRM',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar contactos, cotizaciones, proyectos, seguimientos y recordatorios con push.',
    title: 'CRM, cotizaciones y proyectos del proveedor',
    description: 'Gestiona cada relación desde el primer lead hasta la cotización, entrega del proyecto, reseña y negocio repetido sin salir de Baise.',
    contacts: 'Contactos',
    pipeline: 'Pipeline',
    quotes: 'Cotizaciones',
    projects: 'Proyectos',
    tasksDue: 'Tareas',
    addContact: 'Agregar contacto o lead',
    contactDescription: 'Captura leads, clientes, referidos, patrocinadores, proveedores y clientes recurrentes.',
    fullName: 'Nombre completo',
    company: 'Empresa',
    email: 'Email',
    phone: 'Teléfono',
    type: 'Tipo',
    status: 'Estado',
    source: 'Origen',
    priority: 'Prioridad',
    preferredChannel: 'Canal preferido',
    estimatedValue: 'Valor estimado',
    followUp: 'Próximo seguimiento',
    tags: 'Etiquetas',
    notes: 'Notas',
    createContact: 'Crear contacto',
    createOpportunity: 'Crear oportunidad',
    opportunityTitle: 'Título de oportunidad',
    stage: 'Etapa',
    probability: 'Probabilidad',
    closeDate: 'Cierre esperado',
    nextStep: 'Siguiente paso',
    createQuote: 'Crear cotización',
    quoteTitle: 'Título de cotización',
    scope: 'Alcance',
    subtotal: 'Subtotal',
    discount: 'Descuento',
    tax: 'Impuesto',
    validUntil: 'Válida hasta',
    createProject: 'Crear proyecto',
    projectName: 'Nombre del proyecto',
    budget: 'Presupuesto',
    dueDate: 'Fecha límite',
    milestone: 'Próximo hito',
    completion: 'Avance',
    addTask: 'Agregar tarea',
    taskTitle: 'Título de tarea',
    taskProject: 'Proyecto',
    addActivity: 'Agregar seguimiento',
    activitySubject: 'Asunto',
    activityBody: 'Detalles',
    activityType: 'Tipo de actividad',
    dueAt: 'Fecha y hora',
    createPortalNotification: 'Crear notificación del portal y push',
    saveActivity: 'Guardar actividad',
    contactList: 'Lista de relaciones',
    quoteList: 'Gestión de cotizaciones',
    projectList: 'Gestión de proyectos',
    activityList: 'Linea de actividad',
    noContacts: 'Aún no hay contactos.',
    noOpportunities: 'Aún no hay oportunidades.',
    noQuotes: 'Aún no hay cotizaciones.',
    noProjects: 'Aún no hay proyectos.',
    noActivities: 'Aún no hay actividades.',
    validationContact: 'Agrega el nombre del contacto.',
    validationQuote: 'Agrega título y alcance.',
    validationProject: 'Agrega el nombre del proyecto.',
    validationActivity: 'Agrega un asunto.',
    createdContact: 'Contacto creado.',
    createdOpportunity: 'Oportunidad creada.',
    createdQuote: 'Cotización creada.',
    createdProject: 'Proyecto creado.',
    createdTask: 'Tarea creada.',
    createdActivity: 'Actividad guardada y recordatorios en cola.',
    loadError: 'No se pudo cargar el CRM.',
    recordsError: 'No se pudieron cargar los registros.',
    createError: 'No se pudo guardar.',
    converted: 'Cotización convertida en proyecto.',
    updated: 'Registro actualizado.',
    allContacts: 'Sin contacto vinculado',
    markContacted: 'Marcar contactado',
    convertToProject: 'Convertir en proyecto',
    markDone: 'Completar',
    signoffTitle: 'Aprobación del cliente y prueba',
    signoffDescription: 'Recolecta aprobaciones, firmas, fotos de trabajo terminado, evidência de problemas y adjuntos de cotizaciones o estimados.',
    createSignoff: 'Crear solicitud de aprobación',
    signoffName: 'Título de aprobación',
    signoffType: 'Tipo de aprobación',
    signerName: 'Nombre del firmante',
    signerEmail: 'Email del firmante',
    captureSignature: 'Capturar firma del cliente',
    clearSignature: 'Borrar firma',
    saveSignature: 'Guardar aprobación firmada',
    signatureRequired: 'Dibuja o captura una firma primero.',
    createdSignoff: 'Solicitud de aprobación creada.',
    signedSignoff: 'Aprobación del cliente guardada.',
    uploadProof: 'Subir prueba del trabajo',
    attachmentType: 'Tipo de adjunto',
    attachmentCaption: 'Descripción',
    files: 'Archivos',
    uploadFiles: 'Subir archivos',
    uploadedFiles: 'Prueba subida.',
    noSignoffs: 'Aún no hay aprobaciones.',
    noAttachments: 'Aún no hay pruebas.',
    signoffList: 'Registros de aprobación',
    attachmentList: 'Pruebas y adjuntos',
  },
  pt: {
    requiredTitle: 'Gestão de CRM',
    requiredDescription: 'Crie uma conta de prestador para gerenciar contatos, orçamentos, projetos, acompanhamentos e lembretes com push.',
    title: 'CRM, orçamentos e projetos do prestador',
    description: 'Gerencie cada relacionamento desde o primeiro lead até o orçamento, entrega do projeto, avaliação e recompra sem sair do Baise.',
    contacts: 'Contatos',
    pipeline: 'Pipeline',
    quotes: 'Orçamentos',
    projects: 'Projetos',
    tasksDue: 'Tarefas',
    addContact: 'Adicionar contato ou lead',
    contactDescription: 'Capture leads, clientes, indicações, patrocinadores, fornecedores e clientes recorrentes.',
    fullName: 'Nome completo',
    company: 'Empresa',
    email: 'Email',
    phone: 'Telefone',
    type: 'Tipo',
    status: 'Status',
    source: 'Origem',
    priority: 'Prioridade',
    preferredChannel: 'Canal preferido',
    estimatedValue: 'Valor estimado',
    followUp: 'Próximo acompanhamento',
    tags: 'Tags',
    notes: 'Notas',
    createContact: 'Criar contato',
    createOpportunity: 'Criar oportunidade',
    opportunityTitle: 'Título da oportunidade',
    stage: 'Etapa',
    probability: 'Probabilidade',
    closeDate: 'Fechamento esperado',
    nextStep: 'Próximo passo',
    createQuote: 'Criar orçamento',
    quoteTitle: 'Título do orçamento',
    scope: 'Escopo',
    subtotal: 'Subtotal',
    discount: 'Desconto',
    tax: 'Imposto',
    validUntil: 'Válido até',
    createProject: 'Criar projeto',
    projectName: 'Nome do projeto',
    budget: 'Orçamento',
    dueDate: 'Prazo',
    milestone: 'Próximo marco',
    completion: 'Avanço',
    addTask: 'Adicionar tarefa',
    taskTitle: 'Título da tarefa',
    taskProject: 'Projeto',
    addActivity: 'Adicionar acompanhamento',
    activitySubject: 'Assunto',
    activityBody: 'Detalhes',
    activityType: 'Tipo de atividade',
    dueAt: 'Data e hora',
    createPortalNotification: 'Criar notificação do portal e push',
    saveActivity: 'Salvar atividade',
    contactList: 'Lista de relacionamentos',
    quoteList: 'Gestão de orçamentos',
    projectList: 'Gestão de projetos',
    activityList: 'Linha de atividade',
    noContacts: 'Ainda não ha contatos.',
    noOpportunities: 'Ainda não ha oportunidades.',
    noQuotes: 'Ainda não ha orçamentos.',
    noProjects: 'Ainda não ha projetos.',
    noActivities: 'Ainda não ha atividades.',
    validationContact: 'Adicione o nome do contato.',
    validationQuote: 'Adicione título e escopo.',
    validationProject: 'Adicione o nome do projeto.',
    validationActivity: 'Adicione um assunto.',
    createdContact: 'Contato criado.',
    createdOpportunity: 'Oportunidade criada.',
    createdQuote: 'Orçamento criado.',
    createdProject: 'Projeto criado.',
    createdTask: 'Tarefa criada.',
    createdActivity: 'Atividade salva e lembretes na fila.',
    loadError: 'Não foi possível carregar o CRM.',
    recordsError: 'Não foi possível carregar os registros.',
    createError: 'Não foi possível salvar.',
    converted: 'Orçamento convertido em projeto.',
    updated: 'Registro atualizado.',
    allContacts: 'Sem contato vinculado',
    markContacted: 'Marcar contactado',
    convertToProject: 'Converter em projeto',
    markDone: 'Concluir',
    signoffTitle: 'Aprovação do cliente e prova',
    signoffDescription: 'Colete aprovações, assinaturas, fotos do trabalho concluido, evidências de problemas e anexos de orçamentos ou estimativas.',
    createSignoff: 'Criar solicitação de aprovação',
    signoffName: 'Título da aprovação',
    signoffType: 'Tipo de aprovação',
    signerName: 'Nome do assinante',
    signerEmail: 'Email do assinante',
    captureSignature: 'Capturar assinatura do cliente',
    clearSignature: 'Limpar assinatura',
    saveSignature: 'Salvar aprovação assinada',
    signatureRequired: 'Desenhe ou capture uma assinatura primeiro.',
    createdSignoff: 'Solicitação de aprovação criada.',
    signedSignoff: 'Aprovação do cliente salva.',
    uploadProof: 'Enviar prova do trabalho',
    attachmentType: 'Tipo de anexo',
    attachmentCaption: 'Descrição',
    files: 'Arquivos',
    uploadFiles: 'Enviar arquivos',
    uploadedFiles: 'Prova enviada.',
    noSignoffs: 'Ainda não ha aprovações.',
    noAttachments: 'Ainda não ha provas.',
    signoffList: 'Registros de aprovação',
    attachmentList: 'Provas e anexos',
  },
} as const;

const relationshipTypes = ['lead', 'client', 'past_client', 'partner', 'vendor', 'sponsor', 'other'];
const contactStatuses = ['new', 'contacted', 'qualified', 'quoted', 'active', 'won', 'lost', 'inactive'];
const contactSources = ['portal', 'referral', 'google', 'social', 'campaign', 'repeat', 'manual', 'other'];
const contactPriorities = ['cold', 'warm', 'hot', 'urgent', 'vip'];
const channels = ['portal', 'email', 'whatsapp', 'phone', 'sms'];
const opportunityStages = ['new', 'qualified', 'estimate', 'proposal', 'negotiation', 'won', 'lost', 'paused'];
const quoteStatuses = ['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired', 'converted'];
const projectStatuses = ['planning', 'scheduled', 'in_progress', 'waiting_client', 'on_hold', 'completed', 'cancelled'];
const projectPriorities = ['low', 'normal', 'high', 'urgent'];
const activityTypes = ['note', 'call', 'email', 'whatsapp', 'portal_message', 'meeting', 'task', 'follow_up', 'campaign', 'payment', 'review_request'];
const signoffTypes = ['quote_acceptance', 'estimate_approval', 'work_completed', 'milestone', 'problem_acknowledgement', 'change_order', 'proof_review'];
const attachmentTypes = ['completed_work', 'unexpected_problem', 'proof', 'quote_attachment', 'estimate_attachment', 'before', 'after', 'other'];

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const toLocalInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const sanitizeFileName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'upload';

export function ProviderCRMWorkspace() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = CRM_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const [providerId, setProviderId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [opportunities, setOpportunities] = useState<CRMOpportunity[]>([]);
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [projects, setProjects] = useState<ProviderProject[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [signoffs, setSignoffs] = useState<WorkSignoff[]>([]);
  const [attachments, setAttachments] = useState<WorkAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<FileList | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');

  const [contactForm, setContactForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    relationshipType: 'lead',
    status: 'new',
    source: 'portal',
    priority: 'warm',
    preferredChannel: 'portal',
    estimatedValue: '',
    nextFollowUpAt: '',
    tags: '',
    notes: '',
  });

  const [opportunityForm, setOpportunityForm] = useState({
    contactId: '',
    title: '',
    stage: 'new',
    estimatedValue: '',
    probability: '25',
    expectedCloseDate: '',
    nextStep: '',
  });

  const [quoteForm, setQuoteForm] = useState({
    contactId: '',
    opportunityId: '',
    title: '',
    serviceScope: '',
    subtotal: '',
    discountAmount: '',
    taxAmount: '',
    validUntil: '',
    status: 'draft',
  });

  const [projectForm, setProjectForm] = useState({
    contactId: '',
    quoteId: '',
    projectName: '',
    description: '',
    projectStatus: 'planning',
    priority: 'normal',
    budget: '',
    completionPercent: '0',
    dueDate: '',
    nextMilestone: '',
  });

  const [taskForm, setTaskForm] = useState({
    projectId: '',
    contactId: '',
    title: '',
    priority: 'normal',
    dueAt: '',
  });

  const [activityForm, setActivityForm] = useState({
    contactId: '',
    projectId: '',
    activityType: 'follow_up',
    subject: '',
    body: '',
    channel: 'portal',
    dueAt: toLocalInputValue(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    notify: true,
  });

  const [signoffForm, setSignoffForm] = useState({
    contactId: '',
    quoteId: '',
    projectId: '',
    title: '',
    signoffType: 'work_completed',
    signerName: '',
    signerEmail: '',
    notes: '',
    selectedSignoffId: '',
  });

  const [attachmentForm, setAttachmentForm] = useState({
    contactId: '',
    quoteId: '',
    projectId: '',
    signoffId: '',
    attachmentType: 'proof',
    caption: '',
  });

  const contactById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );

  const projectById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const summary = useMemo(() => {
    const pipeline = opportunities
      .filter((item) => item.status === 'open')
      .reduce((total, item) => total + Number(item.estimated_value || 0), 0);
    const quoteTotal = quotes
      .filter((item) => ['draft', 'sent', 'viewed', 'accepted'].includes(item.status))
      .reduce((total, item) => total + Number(item.total_amount || 0), 0);
    const activeProjects = projects.filter((item) => !['completed', 'cancelled'].includes(item.project_status)).length;
    const dueTasks = tasks.filter((task) => task.task_status !== 'done' && task.due_at && new Date(task.due_at).getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000).length;
    return { pipeline, quoteTotal, activeProjects, dueTasks };
  }, [opportunities, quotes, projects, tasks]);

  const loadProvider = async () => {
    if (!user) return;
    const { data, error } = await db.from('providers').select('id').eq('user_id', user.id).maybeSingle();
    if (error) {
      toast.error(copy.loadError);
      return;
    }
    setProviderId(data?.id || null);
  };

  const loadRecords = async (nextProviderId = providerId) => {
    if (!nextProviderId) return;
    setIsLoading(true);
    try {
      const [contactsRes, oppsRes, quotesRes, projectsRes, tasksRes, activitiesRes, signoffsRes, attachmentsRes] = await Promise.all([
        db.from('provider_crm_contacts').select('*').eq('provider_id', nextProviderId).order('updated_at', { ascending: false }).limit(100),
        db.from('provider_crm_opportunities').select('*').eq('provider_id', nextProviderId).order('updated_at', { ascending: false }).limit(100),
        db.from('provider_quote_records').select('*').eq('provider_id', nextProviderId).order('updated_at', { ascending: false }).limit(100),
        db.from('provider_projects').select('*').eq('provider_id', nextProviderId).order('updated_at', { ascending: false }).limit(100),
        db.from('provider_project_tasks').select('*').eq('provider_id', nextProviderId).order('due_at', { ascending: true, nullsFirst: false }).limit(100),
        db.from('provider_crm_activities').select('*').eq('provider_id', nextProviderId).order('created_at', { ascending: false }).limit(100),
        db.from('provider_work_signoffs').select('*').eq('provider_id', nextProviderId).order('created_at', { ascending: false }).limit(100),
        db.from('provider_work_attachments').select('*').eq('provider_id', nextProviderId).order('created_at', { ascending: false }).limit(100),
      ]);

      const firstError = [contactsRes, oppsRes, quotesRes, projectsRes, tasksRes, activitiesRes, signoffsRes, attachmentsRes].find((result) => result.error)?.error;
      if (firstError) throw firstError;

      const attachmentsWithUrls = await Promise.all(
        (attachmentsRes.data || []).map(async (attachment: WorkAttachment) => {
          const { data } = await supabase.storage
            .from(attachment.bucket_id || 'provider-work-media')
            .createSignedUrl(attachment.file_path, 60 * 60);
          return { ...attachment, signed_url: data?.signedUrl || null };
        }),
      );

      setContacts(contactsRes.data || []);
      setOpportunities(oppsRes.data || []);
      setQuotes(quotesRes.data || []);
      setProjects(projectsRes.data || []);
      setTasks(tasksRes.data || []);
      setActivities(activitiesRes.data || []);
      setSignoffs(signoffsRes.data || []);
      setAttachments(attachmentsWithUrls);
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
    if (providerId) loadRecords(providerId);
  }, [providerId]);

  const createContact = async () => {
    if (!providerId || !user) return;
    if (contactForm.fullName.trim().length < 2) {
      toast.error(copy.validationContact);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await db.from('provider_crm_contacts').insert({
        provider_id: providerId,
        created_by: user.id,
        full_name: contactForm.fullName,
        company_name: contactForm.companyName || null,
        email: contactForm.email || null,
        phone: contactForm.phone || null,
        relationship_type: contactForm.relationshipType,
        status: contactForm.status,
        source: contactForm.source,
        priority: contactForm.priority,
        preferred_channel: contactForm.preferredChannel,
        estimated_value: toNumber(contactForm.estimatedValue),
        next_follow_up_at: contactForm.nextFollowUpAt ? new Date(contactForm.nextFollowUpAt).toISOString() : null,
        tags: contactForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        notes: contactForm.notes || null,
      });
      if (error) throw error;
      toast.success(copy.createdContact);
      setContactForm((prev) => ({ ...prev, fullName: '', companyName: '', email: '', phone: '', estimatedValue: '', tags: '', notes: '' }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const createOpportunity = async () => {
    if (!providerId || !user || opportunityForm.title.trim().length < 3) return;
    setIsSaving(true);
    try {
      const { error } = await db.from('provider_crm_opportunities').insert({
        provider_id: providerId,
        contact_id: opportunityForm.contactId || null,
        created_by: user.id,
        title: opportunityForm.title,
        stage: opportunityForm.stage,
        estimated_value: toNumber(opportunityForm.estimatedValue),
        probability: Math.min(100, Math.max(0, Number(opportunityForm.probability) || 0)),
        expected_close_date: opportunityForm.expectedCloseDate || null,
        next_step: opportunityForm.nextStep || null,
      });
      if (error) throw error;
      toast.success(copy.createdOpportunity);
      setOpportunityForm((prev) => ({ ...prev, title: '', estimatedValue: '', nextStep: '' }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const createQuote = async () => {
    if (!providerId || !user) return;
    if (quoteForm.title.trim().length < 3 || quoteForm.serviceScope.trim().length < 5) {
      toast.error(copy.validationQuote);
      return;
    }
    const subtotal = toNumber(quoteForm.subtotal);
    const discountAmount = toNumber(quoteForm.discountAmount);
    const taxAmount = toNumber(quoteForm.taxAmount);

    setIsSaving(true);
    try {
      const { error } = await db.from('provider_quote_records').insert({
        provider_id: providerId,
        contact_id: quoteForm.contactId || null,
        opportunity_id: quoteForm.opportunityId || null,
        created_by: user.id,
        title: quoteForm.title,
        service_scope: quoteForm.serviceScope,
        subtotal,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        total_amount: Math.max(0, subtotal - discountAmount + taxAmount),
        valid_until: quoteForm.validUntil || null,
        status: quoteForm.status,
        sent_at: quoteForm.status === 'sent' ? new Date().toISOString() : null,
      });
      if (error) throw error;
      toast.success(copy.createdQuote);
      setQuoteForm((prev) => ({ ...prev, title: '', serviceScope: '', subtotal: '', discountAmount: '', taxAmount: '' }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const createProject = async (override?: Partial<typeof projectForm> & { quote?: QuoteRecord }) => {
    if (!providerId || !user) return;
    const form = override ? { ...projectForm, ...override } : projectForm;
    const name = form.projectName || override?.quote?.title || '';
    if (name.trim().length < 3) {
      toast.error(copy.validationProject);
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await db.from('provider_projects').insert({
        provider_id: providerId,
        contact_id: form.contactId || override?.quote?.contact_id || null,
        quote_id: form.quoteId || override?.quote?.id || null,
        created_by: user.id,
        project_name: name,
        description: form.description || override?.quote?.service_scope || null,
        project_status: form.projectStatus,
        priority: form.priority,
        budget: toNumber(form.budget) || Number(override?.quote?.total_amount || 0),
        completion_percent: Math.min(100, Math.max(0, Number(form.completionPercent) || 0)),
        due_date: form.dueDate || null,
        next_milestone: form.nextMilestone || null,
        risk_level: 'normal',
      });
      if (error) throw error;
      if (override?.quote?.id) {
        await db.from('provider_quote_records').update({ status: 'converted' }).eq('id', override.quote.id);
      }
      toast.success(override?.quote ? copy.converted : copy.createdProject);
      setProjectForm((prev) => ({ ...prev, projectName: '', description: '', budget: '', completionPercent: '0', nextMilestone: '' }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const createTask = async () => {
    if (!providerId || !user || taskForm.title.trim().length < 3) return;
    setIsSaving(true);
    try {
      const project = projectById.get(taskForm.projectId);
      const { error } = await db.from('provider_project_tasks').insert({
        provider_id: providerId,
        project_id: taskForm.projectId || null,
        contact_id: taskForm.contactId || project?.contact_id || null,
        created_by: user.id,
        title: taskForm.title,
        priority: taskForm.priority,
        due_at: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : null,
      });
      if (error) throw error;
      toast.success(copy.createdTask);
      setTaskForm((prev) => ({ ...prev, title: '' }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const createActivity = async () => {
    if (!providerId || !user) return;
    if (activityForm.subject.trim().length < 3) {
      toast.error(copy.validationActivity);
      return;
    }
    setIsSaving(true);
    try {
      const dueAt = activityForm.dueAt ? new Date(activityForm.dueAt).toISOString() : null;
      const { error } = await db.from('provider_crm_activities').insert({
        provider_id: providerId,
        contact_id: activityForm.contactId || null,
        project_id: activityForm.projectId || null,
        created_by: user.id,
        activity_type: activityForm.activityType,
        subject: activityForm.subject,
        body: activityForm.body || null,
        channel: activityForm.channel,
        due_at: dueAt,
        status: dueAt ? 'scheduled' : 'open',
        metadata: {
          portal_first: true,
        },
      });
      if (error) throw error;

      if (activityForm.contactId && dueAt) {
        await db.from('provider_crm_contacts').update({ next_follow_up_at: dueAt }).eq('id', activityForm.contactId);
      }

      if (dueAt) {
        await db.from('provider_calendar_events').insert({
          provider_id: providerId,
          created_by: user.id,
          event_type: activityForm.activityType === 'payment' ? 'payment_due' : 'follow_up',
          title: activityForm.subject,
          description: activityForm.body || null,
          start_at: dueAt,
          status: 'scheduled',
          notification_offsets_minutes: [1440, 120],
          channel_preferences: ['portal', activityForm.channel].filter((value, index, array) => array.indexOf(value) === index),
          portal_first: true,
          metadata: {
            source: 'provider_crm',
            contact_id: activityForm.contactId || null,
            project_id: activityForm.projectId || null,
          },
        });
      }

      if (activityForm.notify) {
        await db.from('notifications').insert({
          user_id: user.id,
          title: activityForm.subject,
          message: activityForm.body || 'CRM follow-up reminder is ready in your provider portal.',
          type: 'reminder',
          priority: 'normal',
          action_url: '/provider-dashboard',
          metadata: {
            source: 'provider_crm',
            provider_id: providerId,
            due_at: dueAt,
          },
        });

        supabase.functions.invoke('dispatch-push-notification', {
          body: {
            title: activityForm.subject,
            message: activityForm.body || 'CRM follow-up reminder is ready in your provider portal.',
            actionUrl: '/provider-dashboard',
            metadata: { source: 'provider_crm' },
          },
        }).catch(() => {
          // Push dispatch depends on VAPID env vars; portal notification is already saved.
        });
      }

      toast.success(copy.createdActivity);
      setActivityForm((prev) => ({ ...prev, subject: '', body: '' }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const createSignoff = async () => {
    if (!providerId || !user) return;
    if (signoffForm.title.trim().length < 3) {
      toast.error(copy.validationActivity);
      return;
    }
    const contact = contactById.get(signoffForm.contactId);
    setIsSaving(true);
    try {
      const { data, error } = await db.from('provider_work_signoffs').insert({
        provider_id: providerId,
        contact_id: signoffForm.contactId || null,
        quote_id: signoffForm.quoteId || null,
        project_id: signoffForm.projectId || null,
        customer_id: contact?.customer_id || null,
        requested_by: user.id,
        title: signoffForm.title,
        signoff_type: signoffForm.signoffType,
        status: 'requested',
        signer_name: signoffForm.signerName || contact?.full_name || null,
        signer_email: signoffForm.signerEmail || contact?.email || null,
        notes: signoffForm.notes || null,
      }).select('id').single();
      if (error) throw error;
      toast.success(copy.createdSignoff);
      setSignoffForm((prev) => ({ ...prev, title: '', notes: '', selectedSignoffId: data?.id || prev.selectedSignoffId }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const saveSignature = async () => {
    if (!providerId || !user) return;
    if (!signoffForm.selectedSignoffId || !signatureDataUrl) {
      toast.error(copy.signatureRequired);
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await db
        .from('provider_work_signoffs')
        .update({
          status: 'signed',
          signer_name: signoffForm.signerName || null,
          signer_email: signoffForm.signerEmail || null,
          signature_data_url: signatureDataUrl,
          signature_method: 'drawn',
          signed_by: user.id,
          signed_at: new Date().toISOString(),
          signed_user_agent: navigator.userAgent,
        })
        .eq('id', signoffForm.selectedSignoffId)
        .eq('provider_id', providerId);
      if (error) throw error;
      toast.success(copy.signedSignoff);
      setSignatureDataUrl('');
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAttachments = async () => {
    if (!providerId || !user || !attachmentFiles?.length) return;
    const files = Array.from(attachmentFiles);
    const contact = contactById.get(attachmentForm.contactId);
    setIsSaving(true);
    try {
      for (const file of files) {
        const filePath = `${user.id}/${providerId}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from('provider-work-media')
          .upload(filePath, file, { upsert: false });
        if (uploadError) throw uploadError;

        const { error } = await db.from('provider_work_attachments').insert({
          provider_id: providerId,
          contact_id: attachmentForm.contactId || null,
          quote_id: attachmentForm.quoteId || null,
          project_id: attachmentForm.projectId || null,
          signoff_id: attachmentForm.signoffId || null,
          customer_id: contact?.customer_id || null,
          uploaded_by: user.id,
          file_name: file.name,
          file_path: filePath,
          bucket_id: 'provider-work-media',
          file_size: file.size,
          mime_type: file.type || null,
          attachment_type: attachmentForm.attachmentType,
          caption: attachmentForm.caption || null,
        });
        if (error) throw error;
      }
      toast.success(copy.uploadedFiles);
      setAttachmentFiles(null);
      setAttachmentForm((prev) => ({ ...prev, caption: '' }));
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsSaving(false);
    }
  };

  const updateRecord = async (table: string, id: string, updates: Record<string, unknown>) => {
    const { error } = await db.from(table).update(updates).eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(copy.updated);
    await loadRecords();
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Users} label={copy.contacts} value={contacts.length} />
          <Metric icon={Target} label={copy.pipeline} value={formatPrice(summary.pipeline)} />
          <Metric icon={FileText} label={copy.quotes} value={formatPrice(summary.quoteTotal)} />
          <Metric icon={Briefcase} label={copy.projects} value={summary.activeProjects} />
          <Metric icon={Bell} label={copy.tasksDue} value={summary.dueTasks} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.addContact}</CardTitle>
              <CardDescription>{copy.contactDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label={copy.fullName}><Input value={contactForm.fullName} onChange={(event) => setContactForm((prev) => ({ ...prev, fullName: event.target.value }))} /></Field>
                <Field label={copy.company}><Input value={contactForm.companyName} onChange={(event) => setContactForm((prev) => ({ ...prev, companyName: event.target.value }))} /></Field>
                <Field label={copy.email}><Input type="email" value={contactForm.email} onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))} /></Field>
                <Field label={copy.phone}><Input value={contactForm.phone} onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))} /></Field>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <SelectField label={copy.type} value={contactForm.relationshipType} onChange={(value) => setContactForm((prev) => ({ ...prev, relationshipType: value }))} values={relationshipTypes} />
                <SelectField label={copy.status} value={contactForm.status} onChange={(value) => setContactForm((prev) => ({ ...prev, status: value }))} values={contactStatuses} />
                <SelectField label={copy.source} value={contactForm.source} onChange={(value) => setContactForm((prev) => ({ ...prev, source: value }))} values={contactSources} />
                <SelectField label={copy.priority} value={contactForm.priority} onChange={(value) => setContactForm((prev) => ({ ...prev, priority: value }))} values={contactPriorities} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <SelectField label={copy.preferredChannel} value={contactForm.preferredChannel} onChange={(value) => setContactForm((prev) => ({ ...prev, preferredChannel: value }))} values={channels} />
                <Field label={copy.estimatedValue}><Input type="number" min="0" value={contactForm.estimatedValue} onChange={(event) => setContactForm((prev) => ({ ...prev, estimatedValue: event.target.value }))} /></Field>
                <Field label={copy.followUp}><Input type="datetime-local" value={contactForm.nextFollowUpAt} onChange={(event) => setContactForm((prev) => ({ ...prev, nextFollowUpAt: event.target.value }))} /></Field>
              </div>
              <Field label={copy.tags}><Input value={contactForm.tags} onChange={(event) => setContactForm((prev) => ({ ...prev, tags: event.target.value }))} placeholder="vip, referral, monthly" /></Field>
              <Field label={copy.notes}><Textarea value={contactForm.notes} onChange={(event) => setContactForm((prev) => ({ ...prev, notes: event.target.value }))} /></Field>
              <Button onClick={createContact} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {copy.createContact}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.createOpportunity}</CardTitle>
              <CardDescription>{copy.pipeline}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <ContactSelect label={copy.contacts} value={opportunityForm.contactId} contacts={contacts} emptyLabel={copy.allContacts} onChange={(value) => setOpportunityForm((prev) => ({ ...prev, contactId: value }))} />
                <Field label={copy.opportunityTitle}><Input value={opportunityForm.title} onChange={(event) => setOpportunityForm((prev) => ({ ...prev, title: event.target.value }))} /></Field>
                <SelectField label={copy.stage} value={opportunityForm.stage} onChange={(value) => setOpportunityForm((prev) => ({ ...prev, stage: value }))} values={opportunityStages} />
              </div>
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={copy.estimatedValue}><Input type="number" min="0" value={opportunityForm.estimatedValue} onChange={(event) => setOpportunityForm((prev) => ({ ...prev, estimatedValue: event.target.value }))} /></Field>
                  <Field label={copy.probability}><Input type="number" min="0" max="100" value={opportunityForm.probability} onChange={(event) => setOpportunityForm((prev) => ({ ...prev, probability: event.target.value }))} /></Field>
                </div>
                <Field label={copy.closeDate}><Input type="date" value={opportunityForm.expectedCloseDate} onChange={(event) => setOpportunityForm((prev) => ({ ...prev, expectedCloseDate: event.target.value }))} /></Field>
                <Field label={copy.nextStep}><Input value={opportunityForm.nextStep} onChange={(event) => setOpportunityForm((prev) => ({ ...prev, nextStep: event.target.value }))} /></Field>
                <Button onClick={createOpportunity} disabled={isSaving} className="w-full">
                  <Target className="mr-2 h-4 w-4" />
                  {copy.createOpportunity}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{copy.createQuote}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ContactSelect label={copy.contacts} value={quoteForm.contactId} contacts={contacts} emptyLabel={copy.allContacts} onChange={(value) => setQuoteForm((prev) => ({ ...prev, contactId: value }))} />
                <Field label={copy.pipeline}>
                  <Select value={quoteForm.opportunityId || 'none'} onValueChange={(value) => setQuoteForm((prev) => ({ ...prev, opportunityId: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{copy.pipeline}</SelectItem>
                      {opportunities.map((opportunity) => <SelectItem key={opportunity.id} value={opportunity.id}>{opportunity.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={copy.quoteTitle}><Input value={quoteForm.title} onChange={(event) => setQuoteForm((prev) => ({ ...prev, title: event.target.value }))} /></Field>
                <Field label={copy.scope}><Textarea value={quoteForm.serviceScope} onChange={(event) => setQuoteForm((prev) => ({ ...prev, serviceScope: event.target.value }))} /></Field>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label={copy.subtotal}><Input type="number" min="0" value={quoteForm.subtotal} onChange={(event) => setQuoteForm((prev) => ({ ...prev, subtotal: event.target.value }))} /></Field>
                  <Field label={copy.discount}><Input type="number" min="0" value={quoteForm.discountAmount} onChange={(event) => setQuoteForm((prev) => ({ ...prev, discountAmount: event.target.value }))} /></Field>
                  <Field label={copy.tax}><Input type="number" min="0" value={quoteForm.taxAmount} onChange={(event) => setQuoteForm((prev) => ({ ...prev, taxAmount: event.target.value }))} /></Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label={copy.status} value={quoteForm.status} onChange={(value) => setQuoteForm((prev) => ({ ...prev, status: value }))} values={quoteStatuses} />
                  <Field label={copy.validUntil}><Input type="date" value={quoteForm.validUntil} onChange={(event) => setQuoteForm((prev) => ({ ...prev, validUntil: event.target.value }))} /></Field>
                </div>
                <Button onClick={createQuote} disabled={isSaving} className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  {copy.createQuote}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{copy.createProject}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ContactSelect label={copy.contacts} value={projectForm.contactId} contacts={contacts} emptyLabel={copy.allContacts} onChange={(value) => setProjectForm((prev) => ({ ...prev, contactId: value }))} />
                <Field label={copy.projectName}><Input value={projectForm.projectName} onChange={(event) => setProjectForm((prev) => ({ ...prev, projectName: event.target.value }))} /></Field>
                <Field label={copy.notes}><Textarea value={projectForm.description} onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField label={copy.status} value={projectForm.projectStatus} onChange={(value) => setProjectForm((prev) => ({ ...prev, projectStatus: value }))} values={projectStatuses} />
                  <SelectField label={copy.priority} value={projectForm.priority} onChange={(value) => setProjectForm((prev) => ({ ...prev, priority: value }))} values={projectPriorities} />
                  <Field label={copy.budget}><Input type="number" min="0" value={projectForm.budget} onChange={(event) => setProjectForm((prev) => ({ ...prev, budget: event.target.value }))} /></Field>
                  <Field label={copy.dueDate}><Input type="date" value={projectForm.dueDate} onChange={(event) => setProjectForm((prev) => ({ ...prev, dueDate: event.target.value }))} /></Field>
                </div>
                <Field label={copy.milestone}><Input value={projectForm.nextMilestone} onChange={(event) => setProjectForm((prev) => ({ ...prev, nextMilestone: event.target.value }))} /></Field>
                <Button onClick={() => createProject()} disabled={isSaving} className="w-full">
                  <Briefcase className="mr-2 h-4 w-4" />
                  {copy.createProject}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{copy.addActivity}</CardTitle>
              <CardDescription>{copy.createPortalNotification}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <ContactSelect label={copy.contacts} value={activityForm.contactId} contacts={contacts} emptyLabel={copy.allContacts} onChange={(value) => setActivityForm((prev) => ({ ...prev, contactId: value }))} />
                <SelectField label={copy.activityType} value={activityForm.activityType} onChange={(value) => setActivityForm((prev) => ({ ...prev, activityType: value }))} values={activityTypes} />
                <Field label={copy.activitySubject}><Input value={activityForm.subject} onChange={(event) => setActivityForm((prev) => ({ ...prev, subject: event.target.value }))} /></Field>
                <Field label={copy.activityBody}><Textarea value={activityForm.body} onChange={(event) => setActivityForm((prev) => ({ ...prev, body: event.target.value }))} /></Field>
              </div>
              <div className="space-y-3">
                <SelectField label={copy.preferredChannel} value={activityForm.channel} onChange={(value) => setActivityForm((prev) => ({ ...prev, channel: value }))} values={channels} />
                <Field label={copy.dueAt}><Input type="datetime-local" value={activityForm.dueAt} onChange={(event) => setActivityForm((prev) => ({ ...prev, dueAt: event.target.value }))} /></Field>
                <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                  <Checkbox checked={activityForm.notify} onCheckedChange={(checked) => setActivityForm((prev) => ({ ...prev, notify: Boolean(checked) }))} />
                  {copy.createPortalNotification}
                </label>
                <Button onClick={createActivity} disabled={isSaving} className="w-full">
                  <Send className="mr-2 h-4 w-4" />
                  {copy.saveActivity}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                {copy.signoffTitle}
              </CardTitle>
              <CardDescription>{copy.signoffDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                <ContactSelect label={copy.contacts} value={signoffForm.contactId} contacts={contacts} emptyLabel={copy.allContacts} onChange={(value) => setSignoffForm((prev) => ({ ...prev, contactId: value }))} />
                <Field label={copy.quotes}>
                  <Select value={signoffForm.quoteId || 'none'} onValueChange={(value) => setSignoffForm((prev) => ({ ...prev, quoteId: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{copy.quotes}</SelectItem>
                      {quotes.map((quote) => <SelectItem key={quote.id} value={quote.id}>{quote.quote_number || quote.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={copy.projects}>
                  <Select value={signoffForm.projectId || 'none'} onValueChange={(value) => setSignoffForm((prev) => ({ ...prev, projectId: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{copy.projects}</SelectItem>
                      {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.project_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={copy.signoffName}><Input value={signoffForm.title} onChange={(event) => setSignoffForm((prev) => ({ ...prev, title: event.target.value }))} /></Field>
                <SelectField label={copy.signoffType} value={signoffForm.signoffType} onChange={(value) => setSignoffForm((prev) => ({ ...prev, signoffType: value }))} values={signoffTypes} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={copy.signerName}><Input value={signoffForm.signerName} onChange={(event) => setSignoffForm((prev) => ({ ...prev, signerName: event.target.value }))} /></Field>
                  <Field label={copy.signerEmail}><Input type="email" value={signoffForm.signerEmail} onChange={(event) => setSignoffForm((prev) => ({ ...prev, signerEmail: event.target.value }))} /></Field>
                </div>
                <Field label={copy.notes}><Textarea value={signoffForm.notes} onChange={(event) => setSignoffForm((prev) => ({ ...prev, notes: event.target.value }))} /></Field>
                <Button onClick={createSignoff} disabled={isSaving} className="w-full">
                  <PenLine className="mr-2 h-4 w-4" />
                  {copy.createSignoff}
                </Button>
              </div>
              <div className="space-y-3">
                <Field label={copy.captureSignature}>
                  <Select value={signoffForm.selectedSignoffId || 'none'} onValueChange={(value) => setSignoffForm((prev) => ({ ...prev, selectedSignoffId: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{copy.signoffList}</SelectItem>
                      {signoffs.filter((signoff) => signoff.status !== 'signed').map((signoff) => (
                        <SelectItem key={signoff.id} value={signoff.id}>{signoff.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <SignaturePad
                  value={signatureDataUrl}
                  onChange={setSignatureDataUrl}
                  clearLabel={copy.clearSignature}
                  placeholder={copy.captureSignature}
                />
                <Button onClick={saveSignature} disabled={isSaving || !signoffForm.selectedSignoffId} className="w-full">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {copy.saveSignature}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {copy.uploadProof}
              </CardTitle>
              <CardDescription>{copy.signoffDescription}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <ContactSelect label={copy.contacts} value={attachmentForm.contactId} contacts={contacts} emptyLabel={copy.allContacts} onChange={(value) => setAttachmentForm((prev) => ({ ...prev, contactId: value }))} />
                <Field label={copy.quotes}>
                  <Select value={attachmentForm.quoteId || 'none'} onValueChange={(value) => setAttachmentForm((prev) => ({ ...prev, quoteId: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{copy.quotes}</SelectItem>
                      {quotes.map((quote) => <SelectItem key={quote.id} value={quote.id}>{quote.quote_number || quote.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={copy.projects}>
                  <Select value={attachmentForm.projectId || 'none'} onValueChange={(value) => setAttachmentForm((prev) => ({ ...prev, projectId: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{copy.projects}</SelectItem>
                      {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.project_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="space-y-3">
                <Field label={copy.signoffList}>
                  <Select value={attachmentForm.signoffId || 'none'} onValueChange={(value) => setAttachmentForm((prev) => ({ ...prev, signoffId: value === 'none' ? '' : value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{copy.signoffList}</SelectItem>
                      {signoffs.map((signoff) => <SelectItem key={signoff.id} value={signoff.id}>{signoff.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <SelectField label={copy.attachmentType} value={attachmentForm.attachmentType} onChange={(value) => setAttachmentForm((prev) => ({ ...prev, attachmentType: value }))} values={attachmentTypes} />
                <Field label={copy.attachmentCaption}><Input value={attachmentForm.caption} onChange={(event) => setAttachmentForm((prev) => ({ ...prev, caption: event.target.value }))} /></Field>
                <Field label={copy.files}>
                  <Input type="file" multiple accept="image/*,video/*,application/pdf" onChange={(event) => setAttachmentFiles(event.target.files)} />
                </Field>
                <Button onClick={uploadAttachments} disabled={isSaving || !attachmentFiles?.length} className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  {copy.uploadFiles}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{copy.contactList}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? <Loading /> : contacts.length === 0 ? <Empty text={copy.noContacts} /> : contacts.map((contact) => (
                <div key={contact.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{contact.relationship_type}</Badge>
                    <Badge variant="outline">{contact.priority}</Badge>
                    <Badge variant="secondary">{contact.status}</Badge>
                  </div>
                  <p className="font-semibold">{contact.full_name}</p>
                  <p className="text-sm text-muted-foreground">{contact.company_name || contact.email || contact.phone || contact.source}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{contact.next_follow_up_at ? new Date(contact.next_follow_up_at).toLocaleString() : copy.followUp}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateRecord('provider_crm_contacts', contact.id, { status: 'contacted', last_contact_at: new Date().toISOString() })}>
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {copy.markContacted}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.pipeline}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {opportunities.length === 0 ? <Empty text={copy.noOpportunities} /> : opportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{opportunity.stage}</Badge>
                    <Badge variant="outline">{opportunity.probability}%</Badge>
                    <Badge variant="secondary">{opportunity.status}</Badge>
                  </div>
                  <p className="font-semibold">{opportunity.title}</p>
                  <p className="text-sm text-muted-foreground">{opportunity.contact_id ? contactById.get(opportunity.contact_id)?.full_name : copy.allContacts}</p>
                  <p className="mt-2 font-bold">{formatPrice(Number(opportunity.estimated_value || 0))}</p>
                  <div className="mt-3">
                    <Select value={opportunity.stage} onValueChange={(value) => updateRecord('provider_crm_opportunities', opportunity.id, { stage: value, status: value === 'won' ? 'won' : value === 'lost' ? 'lost' : 'open' })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{opportunityStages.map((stage) => <SelectItem key={stage} value={stage}>{stage.replaceAll('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.quoteList}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quotes.length === 0 ? <Empty text={copy.noQuotes} /> : quotes.map((quote) => (
                <div key={quote.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{quote.quote_number || 'quote'}</Badge>
                    <Badge>{quote.status}</Badge>
                  </div>
                  <p className="font-semibold">{quote.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{quote.service_scope}</p>
                  <p className="mt-2 font-bold">{formatPrice(Number(quote.total_amount || 0))}</p>
                  <p className="text-xs text-muted-foreground">{quote.contact_id ? contactById.get(quote.contact_id)?.full_name : copy.allContacts}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Select value={quote.status} onValueChange={(value) => updateRecord('provider_quote_records', quote.id, { status: value, accepted_at: value === 'accepted' ? new Date().toISOString() : null })}>
                      <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{quoteStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => createProject({ quote, projectName: quote.title, description: quote.service_scope, budget: String(quote.total_amount) })}>
                      <Briefcase className="mr-1 h-4 w-4" />
                      {copy.convertToProject}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.projectList}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projects.length === 0 ? <Empty text={copy.noProjects} /> : projects.map((project) => (
                <div key={project.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{project.project_status}</Badge>
                    <Badge variant="outline">{project.priority}</Badge>
                    <Badge variant={project.risk_level === 'high' ? 'destructive' : 'secondary'}>{project.risk_level}</Badge>
                  </div>
                  <p className="font-semibold">{project.project_name}</p>
                  <p className="text-sm text-muted-foreground">{project.next_milestone || project.description || copy.milestone}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${project.completion_percent}%` }} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Select value={project.project_status} onValueChange={(value) => updateRecord('provider_projects', project.id, { project_status: value })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>{projectStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" min="0" max="100" value={project.completion_percent} onChange={(event) => updateRecord('provider_projects', project.id, { completion_percent: Math.min(100, Math.max(0, Number(event.target.value) || 0)) })} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.addTask}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={taskForm.projectId || 'none'} onValueChange={(value) => setTaskForm((prev) => ({ ...prev, projectId: value === 'none' ? '' : value }))}>
                <SelectTrigger><SelectValue placeholder={copy.taskProject} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{copy.taskProject}</SelectItem>
                  {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.project_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Field label={copy.taskTitle}><Input value={taskForm.title} onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label={copy.priority} value={taskForm.priority} onChange={(value) => setTaskForm((prev) => ({ ...prev, priority: value }))} values={projectPriorities} />
                <Field label={copy.dueAt}><Input type="datetime-local" value={taskForm.dueAt} onChange={(event) => setTaskForm((prev) => ({ ...prev, dueAt: event.target.value }))} /></Field>
              </div>
              <Button onClick={createTask} disabled={isSaving} className="w-full">
                <ClipboardList className="mr-2 h-4 w-4" />
                {copy.addTask}
              </Button>
              <div className="space-y-2">
                {tasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.project_id ? projectById.get(task.project_id)?.project_name : copy.taskProject}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => updateRecord('provider_project_tasks', task.id, { task_status: 'done', completed_at: new Date().toISOString() })}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.signoffList}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {signoffs.length === 0 ? <Empty text={copy.noSignoffs} /> : signoffs.slice(0, 10).map((signoff) => (
                <div key={signoff.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{signoff.signoff_type.replaceAll('_', ' ')}</Badge>
                    <Badge variant={signoff.status === 'signed' ? 'default' : 'secondary'}>{signoff.status}</Badge>
                  </div>
                  <p className="font-semibold">{signoff.title}</p>
                  <p className="text-sm text-muted-foreground">{signoff.signer_name || contactById.get(signoff.contact_id || '')?.full_name || copy.signerName}</p>
                  {signoff.signature_data_url && (
                    <img src={signoff.signature_data_url} alt={signoff.title} className="mt-3 max-h-20 rounded-md border bg-background object-contain" />
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {signoff.signed_at ? new Date(signoff.signed_at).toLocaleString() : new Date(signoff.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.attachmentList}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attachments.length === 0 ? <Empty text={copy.noAttachments} /> : attachments.slice(0, 10).map((attachment) => (
                <div key={attachment.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge>{attachment.attachment_type.replaceAll('_', ' ')}</Badge>
                    {attachment.quote_id && <Badge variant="outline">{copy.quotes}</Badge>}
                    {attachment.project_id && <Badge variant="outline">{copy.projects}</Badge>}
                  </div>
                  {attachment.signed_url && attachment.mime_type?.startsWith('image/') ? (
                    <img src={attachment.signed_url} alt={attachment.caption || attachment.file_name} className="mb-3 h-28 w-full rounded-md object-cover" />
                  ) : null}
                  <p className="font-medium">{attachment.file_name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{attachment.caption || contactById.get(attachment.contact_id || '')?.full_name || copy.attachmentCaption}</p>
                  {attachment.signed_url && (
                    <a href={attachment.signed_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">
                      {copy.files}
                    </a>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.activityList}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activities.length === 0 ? <Empty text={copy.noActivities} /> : activities.slice(0, 10).map((activity) => (
                <div key={activity.id} className="rounded-lg border p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge>{activity.activity_type}</Badge>
                    <Badge variant="outline">{activity.channel}</Badge>
                    <Badge variant="secondary">{activity.status}</Badge>
                  </div>
                  <p className="font-medium">{activity.subject}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{activity.body || contactById.get(activity.contact_id || '')?.full_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.due_at ? new Date(activity.due_at).toLocaleString() : new Date(activity.created_at).toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, values }: { label: string; value: string; onChange: (value: string) => void; values: string[] }) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{values.map((item) => <SelectItem key={item} value={item}>{item.replaceAll('_', ' ')}</SelectItem>)}</SelectContent>
      </Select>
    </Field>
  );
}

function ContactSelect({
  label,
  value,
  contacts,
  emptyLabel,
  onChange,
}: {
  label: string;
  value: string;
  contacts: CRMContact[];
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <Select value={value || 'none'} onValueChange={(next) => onChange(next === 'none' ? '' : next)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{emptyLabel}</SelectItem>
          {contacts.map((contact) => <SelectItem key={contact.id} value={contact.id}>{contact.full_name}</SelectItem>)}
        </SelectContent>
      </Select>
    </Field>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-24 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{text}</p>;
}
