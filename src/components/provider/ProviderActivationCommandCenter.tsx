import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BadgeCheck,
  CheckCircle2,
  FileLock2,
  KeyRound,
  Loader2,
  LockKeyhole,
  Megaphone,
  RefreshCcw,
  Send,
  ShieldCheck,
  UserCheck,
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
import { getBaiseAppKey } from '@/lib/providerCommunication';

type ContactRecord = {
  id: string;
  customer_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship_type: string;
  status: string;
  estimated_value: number | string;
  lifetime_value: number | string;
};

type TemplateRecord = {
  id: string;
  template_key: string;
  campaign_type: string;
  audience: string;
  locale: string;
  subject: string;
  provider_id: string | null;
};

type SummaryRecord = {
  id: string;
  status?: string;
  event_type?: string;
  gate_type?: string;
  category?: string;
  check_type?: string;
  subject?: string;
};

const db = supabase as any;

const COPY = {
  en: {
    requiredTitle: 'Client activation system',
    requiredDescription: 'Create a provider account to manage client access, conversion, gates, vault records, campaign sends, and launch QA.',
    title: 'Client activation system',
    description: 'Turn member interest into clean client access, required next steps, documents, lifecycle campaigns, and launch-readiness records.',
    refresh: 'Refresh',
    contact: 'Contact',
    noContacts: 'No CRM contacts yet. Create a contact in the CRM first.',
    activeAccess: 'Active access',
    lifecycleEvents: 'Lifecycle events',
    openGates: 'Open gates',
    vaultItems: 'Vault items',
    campaignTemplates: 'Campaign templates',
    qaWarnings: 'QA warnings',
    accessTitle: 'Access and conversion',
    grantAccess: 'Grant client access',
    upgradeClient: 'Upgrade member to client',
    logReason: 'Log conversion reason',
    conversionReason: 'Conversion reason',
    projectedLtv: 'Projected LTV',
    gateTitle: 'Payment and signature gates',
    gateType: 'Gate type',
    gateStatus: 'Gate status',
    requiredAction: 'Required action',
    clientMessage: 'Client message',
    updateGate: 'Update gate',
    vaultTitle: 'Document vault record',
    vaultCategory: 'Category',
    vaultVisibility: 'Visibility',
    vaultItemTitle: 'Title',
    fileName: 'File name',
    filePath: 'File path',
    createVault: 'Create vault record',
    campaignTitle: 'Lifecycle campaigns',
    seedTemplates: 'Seed templates',
    sendTemplate: 'Send selected template',
    qaTitle: 'Visibility QA',
    qaCheckType: 'Check type',
    qaStatus: 'Status',
    qaCheckTitle: 'QA title',
    recordQa: 'Record QA check',
    created: 'Activation action completed.',
    loadError: 'Unable to load activation records.',
    actionError: 'Unable to complete activation action.',
  },
  es: {
    requiredTitle: 'Sistema de activación de clientes',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar acceso, conversión, pasos requeridos, documentos, campanas y QA.',
    title: 'Sistema de activación de clientes',
    description: 'Convierte interes en acceso de cliente, proximos pasos, documentos, campanas de ciclo de vida y registros de lanzamiento.',
    refresh: 'Actualizar',
    contact: 'Contacto',
    noContacts: 'Aún no hay contactos CRM. Crea un contacto primero.',
    activeAccess: 'Accesos activos',
    lifecycleEvents: 'Eventos',
    openGates: 'Bloqueos abiertos',
    vaultItems: 'Documentos',
    campaignTemplates: 'Plantillas',
    qaWarnings: 'Alertas QA',
    accessTitle: 'Acceso y conversión',
    grantAccess: 'Dar acceso de cliente',
    upgradeClient: 'Convertir a cliente',
    logReason: 'Registrar razón',
    conversionReason: 'Razón de conversión',
    projectedLtv: 'LTV proyectado',
    gateTitle: 'Bloqueos de pago y firma',
    gateType: 'Tipo',
    gateStatus: 'Estado',
    requiredAction: 'Acción requerida',
    clientMessage: 'Mensaje al cliente',
    updateGate: 'Actualizar bloqueo',
    vaultTitle: 'Registro del vault',
    vaultCategory: 'Categoría',
    vaultVisibility: 'Visibilidad',
    vaultItemTitle: 'Título',
    fileName: 'Archivo',
    filePath: 'Ruta del archivo',
    createVault: 'Crear registro',
    campaignTitle: 'Campanas de ciclo',
    seedTemplates: 'Crear plantillas',
    sendTemplate: 'Enviar plantilla',
    qaTitle: 'QA de visibilidad',
    qaCheckType: 'Tipo',
    qaStatus: 'Estado',
    qaCheckTitle: 'Título QA',
    recordQa: 'Guardar QA',
    created: 'Acción completada.',
    loadError: 'No se pudieron cargar los registros.',
    actionError: 'No se pudo completar la acción.',
  },
  pt: {
    requiredTitle: 'Sistema de ativação de clientes',
    requiredDescription: 'Crie uma conta de prestador para gerenciar acesso, conversao, etapas, documentos, campanhas e QA.',
    title: 'Sistema de ativação de clientes',
    description: 'Transforme interesse em acesso de cliente, proximos passos, documentos, campanhas de ciclo de vida e registros de lancamento.',
    refresh: 'Atualizar',
    contact: 'Contato',
    noContacts: 'Ainda não ha contatos CRM. Crie um contato primeiro.',
    activeAccess: 'Acessos ativos',
    lifecycleEvents: 'Eventos',
    openGates: 'Bloqueios abertos',
    vaultItems: 'Documentos',
    campaignTemplates: 'Modelos',
    qaWarnings: 'Alertas QA',
    accessTitle: 'Acesso e conversao',
    grantAccess: 'Liberar acesso de cliente',
    upgradeClient: 'Converter em cliente',
    logReason: 'Registrar motivo',
    conversionReason: 'Motivo da conversao',
    projectedLtv: 'LTV projetado',
    gateTitle: 'Bloqueios de pagamento e assinatura',
    gateType: 'Tipo',
    gateStatus: 'Status',
    requiredAction: 'Ação obrigatoria',
    clientMessage: 'Mensagem ao cliente',
    updateGate: 'Atualizar bloqueio',
    vaultTitle: 'Registro do cofre',
    vaultCategory: 'Categoria',
    vaultVisibility: 'Visibilidade',
    vaultItemTitle: 'Título',
    fileName: 'Arquivo',
    filePath: 'Caminho do arquivo',
    createVault: 'Criar registro',
    campaignTitle: 'Campanhas de ciclo',
    seedTemplates: 'Criar modelos',
    sendTemplate: 'Enviar modelo',
    qaTitle: 'QA de visibilidade',
    qaCheckType: 'Tipo',
    qaStatus: 'Status',
    qaCheckTitle: 'Título QA',
    recordQa: 'Salvar QA',
    created: 'Ação concluida.',
    loadError: 'Não foi possível carregar os registros.',
    actionError: 'Não foi possível concluir a ação.',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

const numberValue = (value: number | string | null | undefined) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export function ProviderActivationCommandCenter() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const copy = useMemo(
    () => COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)],
    [i18n.language, i18n.resolvedLanguage],
  );
  const [providerId, setProviderId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [entitlements, setEntitlements] = useState<SummaryRecord[]>([]);
  const [events, setEvents] = useState<SummaryRecord[]>([]);
  const [gates, setGates] = useState<SummaryRecord[]>([]);
  const [vaultItems, setVaultItems] = useState<SummaryRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [sends, setSends] = useState<SummaryRecord[]>([]);
  const [qaChecks, setQaChecks] = useState<SummaryRecord[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [conversionReason, setConversionReason] = useState('Booked after portal consultation');
  const [projectedLtv, setProjectedLtv] = useState('0');
  const [gateType, setGateType] = useState('payment');
  const [gateStatus, setGateStatus] = useState('locked');
  const [requiredAction, setRequiredAction] = useState('Payment required before next step');
  const [clientMessage, setClientMessage] = useState('Open your portal to complete the required next step.');
  const [vaultCategory, setVaultCategory] = useState('general');
  const [vaultVisibility, setVaultVisibility] = useState('staff');
  const [vaultTitle, setVaultTitle] = useState('Client document');
  const [fileName, setFileName] = useState('document.pdf');
  const [filePath, setFilePath] = useState('');
  const [qaCheckType, setQaCheckType] = useState('env_vars');
  const [qaStatus, setQaStatus] = useState('pending');
  const [qaTitle, setQaTitle] = useState('Launch readiness check');
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const appKey = getBaiseAppKey();

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId],
  );

  const loadRecords = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: provider, error: providerError } = await db
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (providerError) throw providerError;
      if (!provider?.id) {
        setProviderId(null);
        return;
      }

      setProviderId(provider.id);

      const [
        contactRes,
        entitlementRes,
        eventRes,
        gateRes,
        vaultRes,
        templateRes,
        sendRes,
        qaRes,
      ] = await Promise.all([
        db
          .from('provider_crm_contacts')
          .select('id,customer_id,full_name,email,phone,relationship_type,status,estimated_value,lifetime_value')
          .eq('provider_id', provider.id)
          .order('updated_at', { ascending: false })
          .limit(24),
        db
          .from('provider_access_entitlements')
          .select('id,status')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(40),
        db
          .from('member_lifecycle_events')
          .select('id,event_type')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(40),
        db
          .from('provider_engagement_gates')
          .select('id,gate_type,status')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(40),
        db
          .from('provider_document_vault_items')
          .select('id,category,status:review_status')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(40),
        db
          .from('provider_email_campaign_templates')
          .select('id,provider_id,template_key,campaign_type,audience,locale,subject')
          .or(`provider_id.is.null,provider_id.eq.${provider.id}`)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(60),
        db
          .from('provider_email_campaign_sends')
          .select('id,status,subject')
          .eq('provider_id', provider.id)
          .order('created_at', { ascending: false })
          .limit(40),
        db
          .from('provider_visibility_qa_checks')
          .select('id,check_type,status')
          .or(`provider_id.is.null,provider_id.eq.${provider.id}`)
          .order('checked_at', { ascending: false })
          .limit(40),
      ]);

      const firstError = [
        contactRes,
        entitlementRes,
        eventRes,
        gateRes,
        vaultRes,
        templateRes,
        sendRes,
        qaRes,
      ].find((result) => result.error)?.error;
      if (firstError) throw firstError;

      const contactRows = contactRes.data || [];
      setContacts(contactRows);
      setSelectedContactId((current) => current || contactRows[0]?.id || '');
      setEntitlements(entitlementRes.data || []);
      setEvents(eventRes.data || []);
      setGates(gateRes.data || []);
      setVaultItems(vaultRes.data || []);
      setTemplates(templateRes.data || []);
      setSelectedTemplateId((current) => current || templateRes.data?.[0]?.id || '');
      setSends(sendRes.data || []);
      setQaChecks(qaRes.data || []);
    } catch (error) {
      toast.error(copy.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [copy.loadError, user]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const runAction = async (action: () => Promise<void>) => {
    setIsActing(true);
    try {
      await action();
      toast.success(copy.created);
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.actionError);
    } finally {
      setIsActing(false);
    }
  };

  const contactRequired = () => {
    if (!providerId || !selectedContact) {
      toast.error(copy.noContacts);
      return false;
    }
    return true;
  };

  const metrics = [
    {
      label: copy.activeAccess,
      value: entitlements.filter((item) => item.status === 'active').length,
      icon: KeyRound,
    },
    { label: copy.lifecycleEvents, value: events.length, icon: UserCheck },
    {
      label: copy.openGates,
      value: gates.filter((item) => !['unlocked', 'satisfied', 'cancelled'].includes(item.status || '')).length,
      icon: LockKeyhole,
    },
    { label: copy.vaultItems, value: vaultItems.length, icon: FileLock2 },
    { label: copy.campaignTemplates, value: templates.length, icon: Megaphone },
    {
      label: copy.qaWarnings,
      value: qaChecks.filter((item) => ['warning', 'failed', 'pending'].includes(item.status || '')).length,
      icon: ShieldCheck,
    },
  ];

  if (isLoading) {
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
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={loadRecords} disabled={isLoading || isActing}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {copy.refresh}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="rounded-lg border bg-background p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-3 text-2xl font-semibold">{metric.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-2">
            <Label>{copy.contact}</Label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger>
                <SelectValue placeholder={copy.contact} />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.full_name} {contact.email ? `- ${contact.email}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedContact && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{selectedContact.relationship_type}</Badge>
                <Badge variant="secondary">{selectedContact.status}</Badge>
                <span>{selectedContact.email || selectedContact.phone || copy.noContacts}</span>
              </div>
            )}
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="text-sm text-muted-foreground">Pipeline value</div>
            <div className="mt-2 text-2xl font-semibold">
              {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(
                numberValue(selectedContact?.estimated_value) + numberValue(selectedContact?.lifetime_value),
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-lg border bg-background p-4">
            <div className="mb-4 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{copy.accessTitle}</h3>
            </div>
            <div className="space-y-3">
              <Textarea value={conversionReason} onChange={(event) => setConversionReason(event.target.value)} placeholder={copy.conversionReason} />
              <Input value={projectedLtv} onChange={(event) => setProjectedLtv(event.target.value)} placeholder={copy.projectedLtv} type="number" />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={isActing}
                  onClick={() =>
                    contactRequired() &&
                    runAction(async () => {
                      await db.rpc('grant_client_access', {
                        target_provider_id: providerId,
                        target_contact_id: selectedContact?.id,
                        target_client_user_id: selectedContact?.customer_id,
                        access_level_value: 'client',
                        access_source_value: 'portal',
                        access_metadata: { app_key: appKey },
                      });
                    })
                  }
                >
                  <KeyRound className="mr-2 h-4 w-4" />
                  {copy.grantAccess}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isActing}
                  onClick={() =>
                    contactRequired() &&
                    runAction(async () => {
                      await db.rpc('upgrade_member_to_client', {
                        target_provider_id: providerId,
                        target_contact_id: selectedContact?.id,
                        target_member_user_id: selectedContact?.customer_id,
                        conversion_reason_text: conversionReason,
                        projected_ltv_value: Number(projectedLtv || 0),
                        conversion_metadata: { app_key: appKey },
                      });
                    })
                  }
                >
                  <BadgeCheck className="mr-2 h-4 w-4" />
                  {copy.upgradeClient}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isActing}
                  onClick={() =>
                    contactRequired() &&
                    runAction(async () => {
                      await db.rpc('log_member_lifecycle_event', {
                        target_provider_id: providerId,
                        target_contact_id: selectedContact?.id,
                        target_member_user_id: selectedContact?.customer_id,
                        lifecycle_event_type: 'conversion_reason_logged',
                        lifecycle_stage_value: 'client',
                        conversion_reason_text: conversionReason,
                        event_notes: conversionReason,
                        event_metadata: { app_key: appKey },
                        projected_ltv_value: Number(projectedLtv || 0),
                        target_app_key: appKey,
                      });
                    })
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {copy.logReason}
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-background p-4">
            <div className="mb-4 flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{copy.gateTitle}</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={copy.gateType}>
                <Select value={gateType} onValueChange={setGateType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['payment', 'signature', 'document', 'onboarding', 'review', 'access', 'custom'].map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={copy.gateStatus}>
                <Select value={gateStatus} onValueChange={setGateStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['locked', 'unlocked', 'satisfied', 'paused', 'failed', 'cancelled'].map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={copy.requiredAction}><Input value={requiredAction} onChange={(event) => setRequiredAction(event.target.value)} /></Field>
              <Field label={copy.clientMessage}><Input value={clientMessage} onChange={(event) => setClientMessage(event.target.value)} /></Field>
            </div>
            <Button
              type="button"
              className="mt-4"
              disabled={isActing}
              onClick={() =>
                contactRequired() &&
                runAction(async () => {
                  await db.rpc('update_provider_engagement_gate', {
                    target_provider_id: providerId,
                    target_contact_id: selectedContact?.id,
                    target_client_user_id: selectedContact?.customer_id,
                    gate_type_value: gateType,
                    gate_status_value: gateStatus,
                    required_action_text: requiredAction,
                    client_message_text: clientMessage,
                    resource_type_value: null,
                    resource_uuid: null,
                    gate_metadata: { app_key: appKey },
                  });
                })
              }
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {copy.updateGate}
            </Button>
          </section>

          <section className="rounded-lg border bg-background p-4">
            <div className="mb-4 flex items-center gap-2">
              <FileLock2 className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{copy.vaultTitle}</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={copy.vaultCategory}>
                <Select value={vaultCategory} onValueChange={setVaultCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['identity', 'contract', 'invoice', 'receipt', 'tax', 'photo', 'proof', 'quote', 'estimate', 'signature', 'reconciliation', 'p_and_l', 'general'].map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={copy.vaultVisibility}>
                <Select value={vaultVisibility} onValueChange={setVaultVisibility}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['staff', 'client', 'both'].map((value) => (
                      <SelectItem key={value} value={value}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={copy.vaultItemTitle}><Input value={vaultTitle} onChange={(event) => setVaultTitle(event.target.value)} /></Field>
              <Field label={copy.fileName}><Input value={fileName} onChange={(event) => setFileName(event.target.value)} /></Field>
              <div className="sm:col-span-2">
                <Field label={copy.filePath}><Input value={filePath} onChange={(event) => setFilePath(event.target.value)} placeholder="provider-document-vault/path/file.pdf" /></Field>
              </div>
            </div>
            <Button
              type="button"
              className="mt-4"
              disabled={isActing}
              onClick={() =>
                contactRequired() &&
                runAction(async () => {
                  await db.rpc('create_document_vault_item', {
                    target_provider_id: providerId,
                    target_contact_id: selectedContact?.id,
                    target_client_user_id: selectedContact?.customer_id,
                    item_category: vaultCategory,
                    item_title: vaultTitle,
                    item_file_name: fileName,
                    item_bucket_id: 'provider-document-vault',
                    item_file_path: filePath,
                    item_visibility: vaultVisibility,
                    item_metadata: { app_key: appKey },
                  });
                })
              }
            >
              <FileLock2 className="mr-2 h-4 w-4" />
              {copy.createVault}
            </Button>
          </section>

          <section className="rounded-lg border bg-background p-4">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">{copy.campaignTitle}</h3>
            </div>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder={copy.campaignTemplates} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.subject} - {template.locale}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isActing}
                onClick={() =>
                  runAction(async () => {
                    await db.rpc('seed_provider_lifecycle_campaign_templates', {
                      target_provider_id: providerId,
                      target_app_key: appKey,
                    });
                  })
                }
              >
                <Megaphone className="mr-2 h-4 w-4" />
                {copy.seedTemplates}
              </Button>
              <Button
                type="button"
                disabled={isActing || !selectedTemplateId}
                onClick={() =>
                  contactRequired() &&
                  runAction(async () => {
                    await db.rpc('queue_provider_campaign_template_send', {
                      target_provider_id: providerId,
                      target_template_id: selectedTemplateId,
                      target_contact_id: selectedContact?.id,
                      target_recipient_user_id: selectedContact?.customer_id,
                      target_recipient_email: selectedContact?.email,
                      send_metadata: { app_key: appKey },
                    });
                  })
                }
              >
                <Send className="mr-2 h-4 w-4" />
                {copy.sendTemplate}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{sends.length} queued or historical sends.</p>
          </section>
        </div>

        <section className="rounded-lg border bg-background p-4">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{copy.qaTitle}</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label={copy.qaCheckType}>
              <Select value={qaCheckType} onValueChange={setQaCheckType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['env_vars', 'supabase_tables', 'rls', 'email_send', 'portal_roles', 'document_upload', 'client_view', 'member_view', 'partner_view', 'edge_functions', 'custom'].map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={copy.qaStatus}>
              <Select value={qaStatus} onValueChange={setQaStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pending', 'passed', 'warning', 'failed'].map((value) => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="md:col-span-2">
              <Field label={copy.qaCheckTitle}><Input value={qaTitle} onChange={(event) => setQaTitle(event.target.value)} /></Field>
            </div>
          </div>
          <Button
            type="button"
            className="mt-4"
            disabled={isActing}
            onClick={() =>
              runAction(async () => {
                await db.rpc('record_visibility_qa_check', {
                  target_provider_id: providerId,
                  target_app_key: appKey,
                  qa_check_type: qaCheckType,
                  qa_status: qaStatus,
                  qa_title: qaTitle,
                  qa_detail: `${qaCheckType} recorded from provider activation command center.`,
                  qa_evidence: { app_key: appKey, source: 'provider_activation_command_center' },
                });
              })
            }
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {copy.recordQa}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
