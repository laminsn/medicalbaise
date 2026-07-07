import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

type AuditEvent = {
  id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  severity: 'info' | 'warning' | 'critical';
  metadata: Record<string, unknown> | null;
  created_at: string;
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
type AuditQuery = QueryResult<AuditEvent[]> & {
  eq: (column: string, value: string) => AuditQuery;
  order: (column: string, options: { ascending: boolean }) => AuditQuery;
  limit: (count: number) => AuditQuery;
};
type AuditQueryBuilder = {
  select: (columns: string) => AuditQuery;
};
type OperationsDb = {
  from: {
    (table: 'providers'): ProviderQuery;
    (table: 'provider_operational_audit_events'): AuditQueryBuilder;
  };
};

const db = supabase as unknown as OperationsDb;

const OPERATIONS_COPY = {
  en: {
    requiredTitle: 'Operations log',
    requiredDescription: 'Create a provider account to view the operational paper trail.',
    title: 'Operations log',
    description: 'Track payment plans, invoices, integrations, messages, and client-facing actions from one provider record.',
    total: 'Total records',
    warnings: 'Warnings',
    critical: 'Critical',
    latest: 'Latest event',
    allSeverity: 'All severity',
    allResources: 'All records',
    export: 'Download CSV',
    refresh: 'Refresh',
    empty: 'No operation records match this view yet.',
    metadata: 'Details',
    actor: 'Actor',
    resource: 'Record',
    loadError: 'Unable to load provider operations.',
    recordsError: 'Unable to load operation records.',
    exported: 'Operations log downloaded.',
  },
  es: {
    requiredTitle: 'Registro operativo',
    requiredDescription: 'Crea una cuenta de proveedor para ver la trazabilidad operativa.',
    title: 'Registro operativo',
    description: 'Controla planes de pago, facturas, integraciones, mensajes y acciones del cliente desde un solo registro del proveedor.',
    total: 'Registros',
    warnings: 'Alertas',
    critical: 'Criticos',
    latest: 'Evento reciente',
    allSeverity: 'Toda severidad',
    allResources: 'Todos los registros',
    export: 'Descargar CSV',
    refresh: 'Actualizar',
    empty: 'Aun no hay registros operativos para esta vista.',
    metadata: 'Detalles',
    actor: 'Actor',
    resource: 'Registro',
    loadError: 'No se pudieron cargar las operaciones del proveedor.',
    recordsError: 'No se pudieron cargar los registros operativos.',
    exported: 'Registro operativo descargado.',
  },
  pt: {
    requiredTitle: 'Registro operacional',
    requiredDescription: 'Crie uma conta de prestador para ver a trilha operacional.',
    title: 'Registro operacional',
    description: 'Acompanhe planos de pagamento, faturas, integracoes, mensagens e acoes do cliente em um unico registro do prestador.',
    total: 'Registros',
    warnings: 'Alertas',
    critical: 'Criticos',
    latest: 'Evento recente',
    allSeverity: 'Toda severidade',
    allResources: 'Todos os registros',
    export: 'Baixar CSV',
    refresh: 'Atualizar',
    empty: 'Ainda nao ha registros operacionais para esta visualizacao.',
    metadata: 'Detalhes',
    actor: 'Ator',
    resource: 'Registro',
    loadError: 'Nao foi possivel carregar as operacoes do prestador.',
    recordsError: 'Nao foi possivel carregar os registros operacionais.',
    exported: 'Registro operacional baixado.',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

const formatAction = (action: string) =>
  action.replace(/[._-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const summarizeMetadata = (metadata: Record<string, unknown> | null) => {
  if (!metadata) return [];
  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 4)
    .map(([key, value]) => {
      const text = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : JSON.stringify(value);
      return `${key.replace(/_/g, ' ')}: ${text}`;
    });
};

const getResourceIcon = (resourceType: string) => {
  if (resourceType.includes('payment') || resourceType.includes('invoice')) return FileText;
  if (resourceType.includes('integration')) return Zap;
  if (resourceType.includes('communication')) return ClipboardList;
  if (resourceType.includes('signoff') || resourceType.includes('approval')) return ShieldCheck;
  return ClipboardList;
};

const toCsvValue = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export function ProviderOperationsLog() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = OPERATIONS_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const [providerId, setProviderId] = useState<string | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');

  const loadProvider = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from('providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      toast.error(copy.loadError);
      setIsLoading(false);
      return;
    }

    setProviderId(data?.id || null);
    if (!data?.id) setIsLoading(false);
  }, [copy.loadError, user]);

  const loadEvents = useCallback(async (nextProviderId = providerId) => {
    if (!nextProviderId) return;
    setIsLoading(true);

    try {
      let query = db
        .from('provider_operational_audit_events')
        .select('id, actor_role, action, resource_type, resource_id, severity, metadata, created_at')
        .eq('provider_id', nextProviderId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (severityFilter !== 'all') query = query.eq('severity', severityFilter);
      if (resourceFilter !== 'all') query = query.eq('resource_type', resourceFilter);

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.recordsError);
    } finally {
      setIsLoading(false);
    }
  }, [copy.recordsError, providerId, resourceFilter, severityFilter]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    if (providerId) loadEvents(providerId);
  }, [loadEvents, providerId]);

  const resourceOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.resource_type))).sort(),
    [events],
  );

  const summary = useMemo(() => {
    const warningCount = events.filter((event) => event.severity === 'warning').length;
    const criticalCount = events.filter((event) => event.severity === 'critical').length;
    const latestEvent = events[0]?.created_at ? new Date(events[0].created_at).toLocaleString() : '-';
    return { warningCount, criticalCount, latestEvent };
  }, [events]);

  const exportCsv = () => {
    const rows = [
      ['created_at', 'severity', 'actor_role', 'action', 'resource_type', 'resource_id', 'metadata'],
      ...events.map((event) => [
        event.created_at,
        event.severity,
        event.actor_role,
        event.action,
        event.resource_type,
        event.resource_id || '',
        JSON.stringify(event.metadata || {}),
      ]),
    ];
    const csv = rows.map((row) => row.map(toCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `baise-provider-operations-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(copy.exported);
  };

  if (!providerId && !isLoading) {
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
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              {copy.title}
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => loadEvents()} disabled={!providerId || isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              {copy.refresh}
            </Button>
            <Button variant="outline" onClick={exportCsv} disabled={events.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              {copy.export}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label={copy.total} value={events.length.toLocaleString()} icon={CheckCircle2} />
          <Metric label={copy.warnings} value={summary.warningCount.toLocaleString()} icon={AlertTriangle} />
          <Metric label={copy.critical} value={summary.criticalCount.toLocaleString()} icon={ShieldCheck} />
          <Metric label={copy.latest} value={summary.latestEvent} icon={ClipboardList} compact />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.allSeverity}</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.allResources}</SelectItem>
              {resourceOptions.map((resource) => (
                <SelectItem key={resource} value={resource}>{resource.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const Icon = getResourceIcon(event.resource_type);
              const metadata = summarizeMetadata(event.metadata);
              return (
                <article key={event.id} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[auto_1fr_auto]">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={event.severity === 'critical' ? 'destructive' : event.severity === 'warning' ? 'secondary' : 'outline'}>
                        {event.severity}
                      </Badge>
                      <Badge variant="secondary">{event.resource_type.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="font-semibold">{formatAction(event.action)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {copy.actor}: {event.actor_role} · {copy.resource}: {event.resource_id || '-'}
                    </p>
                    {metadata.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {metadata.map((item) => (
                          <span key={item} className="max-w-full truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <time className="text-sm text-muted-foreground lg:text-right">
                    {new Date(event.created_at).toLocaleString()}
                  </time>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  compact = false,
}: {
  label: string;
  value: string;
  icon: typeof ClipboardList;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={compact ? 'truncate text-sm font-semibold' : 'text-xl font-bold'}>{value}</p>
      </div>
    </div>
  );
}
