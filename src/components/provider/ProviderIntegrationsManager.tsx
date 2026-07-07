import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrainCircuit,
  Building2,
  CalendarDays,
  Cloud,
  Copy,
  CreditCard,
  KeyRound,
  Landmark,
  Loader2,
  Mail,
  MessageCircle,
  PlugZap,
  RefreshCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type IntegrationRecord = {
  id: string;
  integration_key: string;
  display_name: string;
  category: string;
  status: string;
  scopes: string[];
  last_sync_at: string | null;
  metadata?: Record<string, unknown> | null;
};

type ProviderApiKey = {
  id: string;
  key_name: string;
  key_prefix: string;
  key_last_four: string;
  scopes: string[];
  status: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
};

const db = supabase as any;

const CATALOG_META = [
  {
    key: 'gmail',
    name: 'Gmail',
    category: 'email',
    icon: Mail,
  },
  {
    key: 'google_calendar',
    name: 'Google Calendar',
    category: 'calendar',
    icon: CalendarDays,
  },
  {
    key: 'google_drive',
    name: 'Google Drive',
    category: 'storage',
    icon: Cloud,
  },
  {
    key: 'microsoft_office',
    name: 'Microsoft 365',
    category: 'productivity',
    icon: Building2,
  },
  {
    key: 'openai_chatgpt',
    name: 'ChatGPT / OpenAI',
    category: 'ai',
    icon: BrainCircuit,
  },
  {
    key: 'anthropic_claude',
    name: 'Claude',
    category: 'ai',
    icon: BrainCircuit,
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    icon: Landmark,
  },
  {
    key: 'plaid',
    name: 'Plaid',
    category: 'banking',
    icon: Landmark,
  },
  {
    key: 'whatsapp_business',
    name: 'WhatsApp Business',
    category: 'messaging',
    icon: MessageCircle,
  },
  {
    key: 'postiz',
    name: 'Postiz',
    category: 'social',
    icon: Send,
  },
  {
    key: 'superwall_stripe',
    name: 'Superwall + Stripe',
    category: 'payments',
    icon: CreditCard,
  },
] as const;

const INTEGRATION_COPY = {
  en: {
    catalog: {
      gmail: 'Send branded confirmations, receipts, follow-ups, and support responses from connected Gmail.',
      google_calendar: 'Sync bookings, cancellations, follow-ups, campaigns, inspections, and payment due dates.',
      google_drive: 'Attach proposals, job files, receipts, before/after photos, and client documents.',
      microsoft_office: 'Connect Outlook, calendar, OneDrive files, spreadsheets, and document workflows.',
      openai_chatgpt: 'Generate campaign drafts, service summaries, SOPs, replies, content, and internal AI tools.',
      anthropic_claude: 'Support long-form planning, document review, provider playbooks, and client communication drafts.',
      quickbooks: 'Sync invoices, customers, payments, refunds, credits, subcontractor costs, and tax records.',
      plaid: 'Verify bank accounts, reconcile payouts, and enrich transaction visibility.',
      whatsapp_business: 'Send fallback reminders and campaign messages while keeping the portal as the source of truth.',
      postiz: 'Schedule and sync provider social content across connected Postiz channels while keeping campaigns tied to Baise records.',
      superwall_stripe: 'Run in-app paywalls with Superwall while Stripe handles checkout, subscriptions, refunds, receipts, and revenue records.',
    },
    requiredTitle: 'API integrations',
    requiredDescription: 'Create a provider account to connect productivity, AI, accounting, banking, and messaging tools.',
    title: 'API integration hub',
    description: 'Connect outside tools only where they make the Baise portal stronger. The portal remains the primary workspace for bookings, files, messages, invoices, analytics, receipts, and campaigns.',
    credentialNeeded: 'Credential needed:',
    lastSync: 'Last sync:',
    connect: 'Connect',
    disable: 'Disable',
    saved: 'saved. Configure',
    beforeSync: 'before live sync.',
    registered: 'registered',
    disabled: 'disabled',
    manageError: 'Unable to manage',
    loadError: 'Unable to load provider integrations.',
    recordsError: 'Unable to load integrations.',
    modelTitle: 'Integration operating model',
    modelDescription: 'These integrations are intentionally portal-centered.',
    sourceTitle: 'Portal is source of truth',
    sourceDescription: 'External tools sync into Baise records instead of replacing the provider workflow.',
    serverTitle: 'Credentials stay server-side',
    serverDescription: 'The portal stores integration status and config, not raw API secrets in the browser.',
    recordsTitle: 'Campaigns stay tied to records',
    recordsDescription: 'Messages, invoices, receipts, and calendar activity remain connected for proof and taxes.',
    apiKeyTitle: 'AI API keys',
    apiKeyDescription: 'Generate provider-scoped keys for approved AI assistants and automation tools. Full keys are shown once.',
    keyName: 'Key name',
    createKey: 'Generate key',
    revokeKey: 'Revoke',
    oneTimeKey: 'Copy this key now. It will not be shown again.',
    copyKey: 'Copy key',
    copied: 'Copied.',
    keyCreated: 'API key generated.',
    keyRevoked: 'API key revoked.',
    keyError: 'Unable to manage API keys.',
    noKeys: 'No AI API keys yet.',
  },
  es: {
    catalog: {
      gmail: 'Envia confirmaciones, recibos, seguimientos y respuestas de soporte desde Gmail conectado.',
      google_calendar: 'Sincroniza reservas, cancelaciones, seguimientos, campanas, inspecciones y vencimientos de pago.',
      google_drive: 'Adjunta propuestas, archivos de trabajo, recibos, fotos antes/despues y documentos del cliente.',
      microsoft_office: 'Conecta Outlook, calendario, OneDrive, hojas de calculo y flujos de documentos.',
      openai_chatgpt: 'Genera borradores de campanas, resumenes de servicios, SOP, respuestas, contenido y herramientas internas de IA.',
      anthropic_claude: 'Apoya planificacion larga, revision de documentos, manuales del proveedor y borradores de comunicacion.',
      quickbooks: 'Sincroniza facturas, clientes, pagos, reembolsos, creditos, costos de subcontratistas y registros fiscales.',
      plaid: 'Verifica cuentas bancarias, reconcilia pagos y mejora la visibilidad de transacciones.',
      whatsapp_business: 'Envia recordatorios y campanas de apoyo mientras el portal sigue siendo la fuente principal.',
      postiz: 'Programa y sincroniza contenido social del proveedor en canales conectados de Postiz manteniendo campanas ligadas a Baise.',
      superwall_stripe: 'Usa paywalls dentro de la app con Superwall mientras Stripe gestiona checkout, suscripciones, reembolsos, recibos y registros de ingresos.',
    },
    requiredTitle: 'Integraciones API',
    requiredDescription: 'Crea una cuenta de proveedor para conectar herramientas de productividad, IA, contabilidad, banca y mensajes.',
    title: 'Centro de integraciones API',
    description: 'Conecta herramientas externas solo cuando fortalecen el portal Baise. El portal sigue siendo el espacio principal para reservas, archivos, mensajes, facturas, analitica, recibos y campanas.',
    credentialNeeded: 'Credencial requerida:',
    lastSync: 'Ultima sincronizacion:',
    connect: 'Conectar',
    disable: 'Desactivar',
    saved: 'guardado. Configura',
    beforeSync: 'antes de sincronizar en vivo.',
    registered: 'registrado',
    disabled: 'desactivado',
    manageError: 'No se pudo gestionar',
    loadError: 'No se pudieron cargar las integraciones del proveedor.',
    recordsError: 'No se pudieron cargar las integraciones.',
    modelTitle: 'Modelo operativo de integraciones',
    modelDescription: 'Estas integraciones estan centradas intencionalmente en el portal.',
    sourceTitle: 'El portal es la fuente de verdad',
    sourceDescription: 'Las herramientas externas sincronizan registros en Baise sin reemplazar el flujo del proveedor.',
    serverTitle: 'Las credenciales quedan en el servidor',
    serverDescription: 'El portal guarda estado y configuracion, no secretos API en el navegador.',
    recordsTitle: 'Las campanas quedan ligadas a registros',
    recordsDescription: 'Mensajes, facturas, recibos y calendario permanecen conectados para prueba e impuestos.',
    apiKeyTitle: 'Claves API de IA',
    apiKeyDescription: 'Genera claves del proveedor para asistentes de IA y automatizaciones aprobadas. La clave completa se muestra una sola vez.',
    keyName: 'Nombre de clave',
    createKey: 'Generar clave',
    revokeKey: 'Revocar',
    oneTimeKey: 'Copia esta clave ahora. No se mostrara otra vez.',
    copyKey: 'Copiar clave',
    copied: 'Copiado.',
    keyCreated: 'Clave API generada.',
    keyRevoked: 'Clave API revocada.',
    keyError: 'No se pudieron gestionar las claves API.',
    noKeys: 'Aun no hay claves API de IA.',
  },
  pt: {
    catalog: {
      gmail: 'Envie confirmacoes, recibos, acompanhamentos e respostas de suporte pelo Gmail conectado.',
      google_calendar: 'Sincronize reservas, cancelamentos, acompanhamentos, campanhas, inspecoes e vencimentos de pagamento.',
      google_drive: 'Anexe propostas, arquivos de trabalho, recibos, fotos antes/depois e documentos do cliente.',
      microsoft_office: 'Conecte Outlook, calendario, OneDrive, planilhas e fluxos de documentos.',
      openai_chatgpt: 'Gere rascunhos de campanhas, resumos de servicos, SOPs, respostas, conteudo e ferramentas internas de IA.',
      anthropic_claude: 'Apoie planejamento longo, revisao de documentos, manuais do prestador e rascunhos de comunicacao.',
      quickbooks: 'Sincronize faturas, clientes, pagamentos, reembolsos, creditos, custos de subcontratados e registros fiscais.',
      plaid: 'Verifique contas bancarias, reconcilie repasses e melhore a visibilidade das transacoes.',
      whatsapp_business: 'Envie lembretes e campanhas de apoio mantendo o portal como fonte principal.',
      postiz: 'Agende e sincronize conteudo social do prestador nos canais conectados do Postiz mantendo campanhas ligadas ao Baise.',
      superwall_stripe: 'Use paywalls dentro do app com Superwall enquanto a Stripe processa checkout, assinaturas, reembolsos, recibos e registros de receita.',
    },
    requiredTitle: 'Integracoes API',
    requiredDescription: 'Crie uma conta de prestador para conectar ferramentas de produtividade, IA, contabilidade, bancos e mensagens.',
    title: 'Central de integracoes API',
    description: 'Conecte ferramentas externas somente quando fortalecem o portal Baise. O portal continua sendo o espaco principal para reservas, arquivos, mensagens, faturas, analitica, recibos e campanhas.',
    credentialNeeded: 'Credencial necessaria:',
    lastSync: 'Ultima sincronizacao:',
    connect: 'Conectar',
    disable: 'Desativar',
    saved: 'salvo. Configure',
    beforeSync: 'antes da sincronizacao ativa.',
    registered: 'registrado',
    disabled: 'desativado',
    manageError: 'Nao foi possivel gerenciar',
    loadError: 'Nao foi possivel carregar as integracoes do prestador.',
    recordsError: 'Nao foi possivel carregar as integracoes.',
    modelTitle: 'Modelo operacional das integracoes',
    modelDescription: 'Estas integracoes sao intencionalmente centradas no portal.',
    sourceTitle: 'O portal e a fonte de verdade',
    sourceDescription: 'Ferramentas externas sincronizam registros no Baise sem substituir o fluxo do prestador.',
    serverTitle: 'Credenciais ficam no servidor',
    serverDescription: 'O portal guarda status e configuracao, nao segredos de API no navegador.',
    recordsTitle: 'Campanhas ficam ligadas aos registros',
    recordsDescription: 'Mensagens, faturas, recibos e calendario permanecem conectados para prova e impostos.',
    apiKeyTitle: 'Chaves API de IA',
    apiKeyDescription: 'Gere chaves do prestador para assistentes de IA e automacoes aprovadas. A chave completa aparece uma unica vez.',
    keyName: 'Nome da chave',
    createKey: 'Gerar chave',
    revokeKey: 'Revogar',
    oneTimeKey: 'Copie esta chave agora. Ela nao sera exibida novamente.',
    copyKey: 'Copiar chave',
    copied: 'Copiado.',
    keyCreated: 'Chave API gerada.',
    keyRevoked: 'Chave API revogada.',
    keyError: 'Nao foi possivel gerenciar chaves API.',
    noKeys: 'Ainda nao ha chaves API de IA.',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

export function ProviderIntegrationsManager() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = INTEGRATION_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const catalog = useMemo(
    () => CATALOG_META.map((integration) => ({
      ...integration,
      copy: copy.catalog[integration.key],
    })),
    [copy],
  );
  const [providerId, setProviderId] = useState<string | null>(null);
  const [records, setRecords] = useState<IntegrationRecord[]>([]);
  const [apiKeys, setApiKeys] = useState<ProviderApiKey[]>([]);
  const [keyName, setKeyName] = useState('Provider AI key');
  const [createdApiKey, setCreatedApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [apiKeyBusy, setApiKeyBusy] = useState(false);

  const recordsByKey = useMemo(
    () => new Map(records.map((record) => [record.integration_key, record])),
    [records],
  );

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
      const [{ data, error }, apiKeysRes] = await Promise.all([
        db
        .from('provider_integrations')
        .select('id, integration_key, display_name, category, status, scopes, last_sync_at, metadata')
        .eq('provider_id', nextProviderId)
        .order('display_name', { ascending: true }),
        db
          .from('provider_ai_api_keys')
          .select('id, key_name, key_prefix, key_last_four, scopes, status, created_at, last_used_at, expires_at')
          .eq('provider_id', nextProviderId)
          .order('created_at', { ascending: false }),
      ]);
      if (error) throw error;
      if (apiKeysRes.error) throw apiKeysRes.error;
      setRecords(data || []);
      setApiKeys(apiKeysRes.data || []);
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

  const manageIntegration = async (integration: typeof catalog[number], action: 'connect' | 'disconnect' | 'sync') => {
    setBusyKey(integration.key);
    try {
      const { data, error } = await supabase.functions.invoke('manage-provider-integration', {
        body: {
          action,
          integrationKey: integration.key,
          displayName: integration.name,
          category: integration.category,
        },
      });
      if (error) throw error;

      if (data?.requiresConfiguration) {
        toast.info(`${integration.name} ${copy.saved} ${data.envHint || 'API credentials'} ${copy.beforeSync}`);
      } else {
        toast.success(`${integration.name} ${action === 'disconnect' ? copy.disabled : copy.registered}.`);
      }
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${copy.manageError} ${integration.name}.`);
    } finally {
      setBusyKey(null);
    }
  };

  const createApiKey = async () => {
    setApiKeyBusy(true);
    setCreatedApiKey('');
    try {
      const { data, error } = await supabase.functions.invoke('manage-provider-ai-api-key', {
        body: {
          action: 'create',
          keyName,
          scopes: ['ai.records.read', 'ai.records.write', 'ai.campaigns.write'],
        },
      });
      if (error) throw error;
      setCreatedApiKey(data?.apiKey || '');
      toast.success(copy.keyCreated);
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.keyError);
    } finally {
      setApiKeyBusy(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    setApiKeyBusy(true);
    try {
      const { error } = await supabase.functions.invoke('manage-provider-ai-api-key', {
        body: { action: 'revoke', keyId },
      });
      if (error) throw error;
      toast.success(copy.keyRevoked);
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.keyError);
    } finally {
      setApiKeyBusy(false);
    }
  };

  const copyCreatedKey = async () => {
    if (!createdApiKey) return;
    await navigator.clipboard.writeText(createdApiKey);
    toast.success(copy.copied);
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
            <PlugZap className="h-5 w-5" />
            {copy.title}
          </CardTitle>
          <CardDescription>
            {copy.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {catalog.map((integration) => {
            const record = recordsByKey.get(integration.key);
            const Icon = integration.icon;
            const isBusy = busyKey === integration.key;
            const status = record?.status || 'not_connected';
            return (
              <article key={integration.key} className="flex flex-col rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <Badge variant={status === 'connected' ? 'default' : status === 'needs_attention' ? 'destructive' : 'secondary'}>
                    {status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <h3 className="font-semibold">{integration.name}</h3>
                <p className="mt-1 min-h-16 text-sm leading-relaxed text-muted-foreground">{integration.copy}</p>
                {record?.metadata?.env_hint && (
                  <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {copy.credentialNeeded} {String(record.metadata.env_hint)}
                  </p>
                )}
                {record?.last_sync_at && (
                  <p className="mt-2 text-xs text-muted-foreground">{copy.lastSync} {new Date(record.last_sync_at).toLocaleString()}</p>
                )}
                {typeof record?.metadata?.channels_count === 'number' && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {record.metadata.channels_count} Postiz channel{record.metadata.channels_count === 1 ? '' : 's'} synced
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1" disabled={isBusy} onClick={() => manageIntegration(integration, 'connect')}>
                    {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlugZap className="mr-2 h-4 w-4" />}
                    {copy.connect}
                  </Button>
                  <Button size="sm" variant="outline" disabled={isBusy || !record} onClick={() => manageIntegration(integration, 'sync')}>
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" disabled={isBusy || !record} onClick={() => manageIntegration(integration, 'disconnect')}>
                    {copy.disable}
                  </Button>
                </div>
              </article>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {copy.apiKeyTitle}
          </CardTitle>
          <CardDescription>{copy.apiKeyDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-3 rounded-lg border p-4">
            <label className="space-y-2 text-sm font-medium">
              <span>{copy.keyName}</span>
              <Input value={keyName} onChange={(event) => setKeyName(event.target.value)} />
            </label>
            <Button onClick={createApiKey} disabled={apiKeyBusy || keyName.trim().length < 3} className="w-full">
              {apiKeyBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              {copy.createKey}
            </Button>
            {createdApiKey && (
              <div className="space-y-2 rounded-md border bg-muted p-3">
                <p className="text-xs font-medium text-muted-foreground">{copy.oneTimeKey}</p>
                <code className="block break-all rounded bg-background p-2 text-xs">{createdApiKey}</code>
                <Button size="sm" variant="outline" onClick={copyCreatedKey}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copy.copyKey}
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {apiKeys.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{copy.noKeys}</p>
            ) : apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{apiKey.key_name}</p>
                    <p className="text-xs text-muted-foreground">{apiKey.key_prefix}_...{apiKey.key_last_four}</p>
                  </div>
                  <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>{apiKey.status}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {apiKey.scopes.map((scope) => <Badge key={scope} variant="outline">{scope}</Badge>)}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">{new Date(apiKey.created_at).toLocaleString()}</p>
                  <Button size="sm" variant="outline" disabled={apiKeyBusy || apiKey.status !== 'active'} onClick={() => revokeApiKey(apiKey.id)}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {copy.revokeKey}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.modelTitle}</CardTitle>
          <CardDescription>
            {copy.modelDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{copy.sourceTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.sourceDescription}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{copy.serverTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.serverDescription}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{copy.recordsTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.recordsDescription}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
