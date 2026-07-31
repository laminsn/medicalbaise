import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Send,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { recordProviderOperationSilently } from '@/lib/providerOperations';

type AccountBalance = {
  available_balance: number | string;
  pending_balance: number | string;
  internal_credit_balance: number | string;
  currency: string;
};

type ProviderInvoice = {
  id: string;
  invoice_number: string | null;
  client_display_id: string | null;
  service_description: string;
  total_amount: number | string;
  currency: string;
  payment_status: string;
  invoice_type: string;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  client_action_status: string | null;
  last_sent_at: string | null;
};

type ProviderTransaction = {
  id: string;
  invoice_id: string | null;
  amount: number | string;
  currency: string;
  transaction_type: string;
  payment_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  release_benchmark: string | null;
  metadata: Record<string, unknown> | null;
};

type PaymentPlanItem = {
  id: string;
  payment_plan_id: string;
  invoice_id: string | null;
  label: string;
  amount: number | string;
  currency: string;
  due_at: string;
  status: string;
  checkout_url: string | null;
  processor: string | null;
  attempt_count: number | null;
  last_payment_error: string | null;
  client_action_required: boolean | null;
};

type FinanceAction = {
  id: string;
  kind: 'invoice' | 'payment' | 'transaction';
  title: string;
  detail: string;
  status: string;
  date: string | null;
  priority: 'critical' | 'warning' | 'info';
  buttonLabel?: string;
  onAction?: () => void;
};

type SupabaseError = { message: string };
type ProviderRecord = { id: string };
type QueryResult<T> = PromiseLike<{ data: T | null; error: SupabaseError | null }>;
type Query<T> = QueryResult<T[]> & {
  eq: (column: string, value: string) => Query<T>;
  in: (column: string, values: string[]) => Query<T>;
  order: (column: string, options: { ascending: boolean; nullsFirst?: boolean }) => Query<T>;
  limit: (count: number) => Query<T>;
  maybeSingle: () => QueryResult<T>;
};
type Mutation = QueryResult<null> & {
  eq: (column: string, value: string) => Mutation;
};
type Table<T> = {
  select: (columns: string) => Query<T>;
  insert: (values: Record<string, unknown>) => QueryResult<null>;
  update: (values: Record<string, unknown>) => Mutation;
};
type ProviderTable = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => QueryResult<ProviderRecord>;
    };
  };
};
type FinanceDb = {
  from: {
    (table: 'providers'): ProviderTable;
    <T>(table: string): Table<T>;
  };
};

const db = supabase as unknown as FinanceDb;

const FINANCE_COPY = {
  en: {
    requiredTitle: 'Finance command center',
    requiredDescription: 'Create a provider account to manage balances, invoices, payment retries, refunds, credits, and exports.',
    title: 'Finance command center',
    description: 'Close out invoices, payment schedules, refunds, credits, balances, and export-ready records from one money view.',
    refresh: 'Refresh',
    export: 'Export closeout CSV',
    available: 'Available',
    pending: 'Pending',
    credits: 'Internal credits',
    paid: 'Paid revenue',
    actionTitle: 'Money needs attention',
    actionDescription: 'Failed payments, overdue invoices, unsent invoices, refunds, credits, and client action items.',
    upcomingTitle: 'Upcoming scheduled payments',
    upcomingDescription: 'Recurring, split, subscription, and milestone payment items coming due.',
    exportTitle: 'Export-ready records',
    exportDescription: 'Invoices and transactions formatted for tax records, receipts, accounting, and sponsor-ready finance review.',
    emptyActions: 'No urgent finance actions right now.',
    emptyUpcoming: 'No scheduled payment items in this view.',
    loadError: 'Unable to load provider finance workspace.',
    recordsError: 'Unable to load finance records.',
    updateError: 'Unable to update finance record.',
    updated: 'Finance record updated.',
    exported: 'Finance closeout CSV downloaded.',
    noExport: 'No finance records available for export.',
    markSent: 'Mark sent',
    openCheckout: 'Open checkout',
    due: 'Due',
    issued: 'Issued',
    processed: 'Processed',
    client: 'Client',
    failed: 'Failed',
    notSent: 'Not sent',
    attempts: 'attempts',
    rows: 'rows',
  },
  es: {
    requiredTitle: 'Centro financiero',
    requiredDescription: 'Crea una cuenta de proveedor para gestionar saldos, facturas, reintentos, reembolsos, creditos y exportaciones.',
    title: 'Centro financiero',
    description: 'Cierra facturas, planes de pago, reembolsos, creditos, saldos y registros listos para exportar desde una vista.',
    refresh: 'Actualizar',
    export: 'Exportar CSV',
    available: 'Disponible',
    pending: 'Pendiente',
    credits: 'Creditos internos',
    paid: 'Ingresos pagados',
    actionTitle: 'Dinero que necesita atención',
    actionDescription: 'Pagos fallidos, facturas vencidas, facturas no enviadas, reembolsos, creditos y acciones del cliente.',
    upcomingTitle: 'Pagos programados proximos',
    upcomingDescription: 'Pagos recurrentes, divididos, de suscripción y por hitos que vencen pronto.',
    exportTitle: 'Registros listos para exportar',
    exportDescription: 'Facturas y transacciones formateadas para impuestos, recibos, contabilidad y revisión financiera.',
    emptyActions: 'No hay acciones financieras urgentes ahora.',
    emptyUpcoming: 'No hay pagos programados en esta vista.',
    loadError: 'No se pudo cargar el espacio financiero del proveedor.',
    recordsError: 'No se pudieron cargar los registros financieros.',
    updateError: 'No se pudo actualizar el registro financiero.',
    updated: 'Registro financiero actualizado.',
    exported: 'CSV financiero descargado.',
    noExport: 'No hay registros financieros para exportar.',
    markSent: 'Marcar enviada',
    openCheckout: 'Abrir checkout',
    due: 'Vence',
    issued: 'Emitida',
    processed: 'Procesada',
    client: 'Cliente',
    failed: 'Fallida',
    notSent: 'No enviada',
    attempts: 'intentos',
    rows: 'filas',
  },
  pt: {
    requiredTitle: 'Centro financeiro',
    requiredDescription: 'Crie uma conta de prestador para gerenciar saldos, faturas, tentativas de pagamento, reembolsos, creditos e exportações.',
    title: 'Centro financeiro',
    description: 'Feche faturas, planos de pagamento, reembolsos, creditos, saldos e registros prontos para exportar em uma vista.',
    refresh: 'Atualizar',
    export: 'Exportar CSV',
    available: 'Disponível',
    pending: 'Pendente',
    credits: 'Creditos internos',
    paid: 'Receita paga',
    actionTitle: 'Dinheiro que precisa de atencao',
    actionDescription: 'Pagamentos falhos, faturas vencidas, faturas não enviadas, reembolsos, creditos e ações do cliente.',
    upcomingTitle: 'Pagamentos programados proximos',
    upcomingDescription: 'Pagamentos recorrentes, divididos, de assinatura e por marcos com vencimento próximo.',
    exportTitle: 'Registros prontos para exportar',
    exportDescription: 'Faturas e transações formatadas para impostos, recibos, contabilidade e revisao financeira.',
    emptyActions: 'Não ha ações financeiras urgentes agora.',
    emptyUpcoming: 'Não ha pagamentos programados nesta visualização.',
    loadError: 'Não foi possível carregar o espaco financeiro do prestador.',
    recordsError: 'Não foi possível carregar os registros financeiros.',
    updateError: 'Não foi possível atualizar o registro financeiro.',
    updated: 'Registro financeiro atualizado.',
    exported: 'CSV financeiro baixado.',
    noExport: 'Não ha registros financeiros para exportar.',
    markSent: 'Marcar enviada',
    openCheckout: 'Abrir checkout',
    due: 'Vence',
    issued: 'Emitida',
    processed: 'Processada',
    client: 'Cliente',
    failed: 'Falha',
    notSent: 'Não enviada',
    attempts: 'tentativas',
    rows: 'linhas',
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

const getPriorityRank = (priority: FinanceAction['priority']) => {
  if (priority === 'critical') return 0;
  if (priority === 'warning') return 1;
  return 2;
};

const downloadCsv = (filename: string, rows: Array<Record<string, string | number>>) => {
  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? '');
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export function ProviderFinanceCommandCenter() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const copy = useMemo(
    () => FINANCE_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)],
    [i18n.language, i18n.resolvedLanguage],
  );
  const [providerId, setProviderId] = useState<string | null>(null);
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
  const [transactions, setTransactions] = useState<ProviderTransaction[]>([]);
  const [paymentItems, setPaymentItems] = useState<PaymentPlanItem[]>([]);
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
    const [balanceResult, invoicesResult, transactionsResult, itemsResult] = await Promise.all([
      db
        .from<AccountBalance>('provider_account_balances')
        .select('available_balance,pending_balance,internal_credit_balance,currency')
        .eq('provider_id', providerId)
        .maybeSingle(),
      db
        .from<ProviderInvoice>('provider_invoices')
        .select('id,invoice_number,client_display_id,service_description,total_amount,currency,payment_status,invoice_type,issued_at,due_at,paid_at,client_action_status,last_sent_at')
        .eq('provider_id', providerId)
        .in('payment_status', ['draft', 'pending', 'processing', 'paid', 'partially_refunded', 'refunded', 'credited', 'failed'])
        .order('issued_at', { ascending: false })
        .limit(60),
      db
        .from<ProviderTransaction>('provider_payment_transactions')
        .select('id,invoice_id,amount,currency,transaction_type,payment_method,status,created_at,processed_at,release_benchmark,metadata')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .limit(80),
      db
        .from<PaymentPlanItem>('provider_payment_plan_items')
        .select('id,payment_plan_id,invoice_id,label,amount,currency,due_at,status,checkout_url,processor,attempt_count,last_payment_error,client_action_required')
        .eq('provider_id', providerId)
        .in('status', ['scheduled', 'pending', 'processing', 'overdue', 'failed', 'retry_due'])
        .order('due_at', { ascending: true })
        .limit(80),
    ]);

    if (balanceResult.error || invoicesResult.error || transactionsResult.error || itemsResult.error) {
      toast.error(copy.recordsError);
    }

    setBalance(balanceResult.data ?? null);
    setInvoices(invoicesResult.data ?? []);
    setTransactions(transactionsResult.data ?? []);
    setPaymentItems(itemsResult.data ?? []);
    setIsLoadingRecords(false);
  }, [copy.recordsError, providerId]);

  useEffect(() => {
    loadProvider();
  }, [loadProvider]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const markInvoiceSent = useCallback(
    async (invoice: ProviderInvoice) => {
      if (!providerId) return;

      setUpdatingId(invoice.id);
      const now = new Date().toISOString();
      const { error } = await db
        .from<ProviderInvoice>('provider_invoices')
        .update({ client_action_status: 'sent', last_sent_at: now })
        .eq('id', invoice.id)
        .eq('provider_id', providerId);
      setUpdatingId(null);

      if (error) {
        toast.error(copy.updateError);
        return;
      }

      recordProviderOperationSilently({
        action: 'invoice.marked_sent',
        resourceType: 'provider_invoice',
        resourceId: invoice.id,
        metadata: { invoice_number: invoice.invoice_number, client_action_status: 'sent' },
      });
      toast.success(copy.updated);
      await loadRecords();
    },
    [copy.updateError, copy.updated, loadRecords, providerId],
  );

  const nowTimestamp = Date.now();
  const invoiceById = useMemo(() => new Map(invoices.map((invoice) => [invoice.id, invoice])), [invoices]);

  const paidRevenue = useMemo(
    () =>
      invoices
        .filter((invoice) => invoice.payment_status === 'paid')
        .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0),
    [invoices],
  );

  const refundCreditTotal = useMemo(
    () =>
      transactions
        .filter((transaction) =>
          ['refund', 'service_credit', 'internal_balance_transfer'].includes(transaction.transaction_type) ||
          ['refunded', 'credited'].includes(transaction.status),
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions],
  );

  const financeActions = useMemo(() => {
    const invoiceActions: FinanceAction[] = invoices
      .filter(
        (invoice) =>
          invoice.payment_status === 'failed' ||
          isPast(invoice.due_at, nowTimestamp) ||
          invoice.client_action_status === 'not_sent',
      )
      .map((invoice) => ({
        id: invoice.id,
        kind: 'invoice' as const,
        title: invoice.invoice_number || invoice.service_description,
        detail: `${invoice.client_display_id || copy.client} · ${formatMoney(invoice.total_amount, invoice.currency)}${
          invoice.due_at ? ` · ${copy.due} ${formatDate(invoice.due_at)}` : ` · ${copy.issued} ${formatDate(invoice.issued_at)}`
        }`,
        status: invoice.payment_status === 'failed' ? copy.failed : invoice.client_action_status === 'not_sent' ? copy.notSent : formatLabel(invoice.payment_status),
        date: invoice.due_at || invoice.issued_at,
        priority: invoice.payment_status === 'failed' || isPast(invoice.due_at, nowTimestamp) ? ('critical' as const) : ('warning' as const),
        buttonLabel: invoice.client_action_status === 'not_sent' ? copy.markSent : undefined,
        onAction: invoice.client_action_status === 'not_sent' ? () => markInvoiceSent(invoice) : undefined,
      }));

    const paymentActions: FinanceAction[] = paymentItems
      .filter((item) => ['overdue', 'failed', 'retry_due'].includes(item.status) || item.client_action_required)
      .map((item) => ({
        id: item.id,
        kind: 'payment' as const,
        title: item.label,
        detail: `${formatMoney(item.amount, item.currency)} · ${copy.due} ${formatDate(item.due_at)}`,
        status: item.last_payment_error || formatLabel(item.status),
        date: item.due_at,
        priority: item.status === 'failed' || item.status === 'overdue' ? ('critical' as const) : ('warning' as const),
        buttonLabel: item.checkout_url ? copy.openCheckout : undefined,
        onAction: item.checkout_url ? () => window.open(item.checkout_url || '', '_blank', 'noopener,noreferrer') : undefined,
      }));

    const transactionActions: FinanceAction[] = transactions
      .filter((transaction) => ['failed', 'refunded', 'credited'].includes(transaction.status) || ['refund', 'service_credit'].includes(transaction.transaction_type))
      .map((transaction) => {
        const invoice = transaction.invoice_id ? invoiceById.get(transaction.invoice_id) : null;
        return {
          id: transaction.id,
          kind: 'transaction' as const,
          title: invoice?.invoice_number || formatLabel(transaction.transaction_type),
          detail: `${formatMoney(transaction.amount, transaction.currency)} · ${formatLabel(transaction.payment_method)} · ${copy.processed} ${formatDate(transaction.processed_at || transaction.created_at)}`,
          status: formatLabel(transaction.status),
          date: transaction.processed_at || transaction.created_at,
          priority: transaction.status === 'failed' ? ('critical' as const) : ('info' as const),
        };
      });

    return [...invoiceActions, ...paymentActions, ...transactionActions]
      .sort((a, b) => {
        const priorityDelta = getPriorityRank(a.priority) - getPriorityRank(b.priority);
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      })
      .slice(0, 8);
  }, [copy, invoiceById, invoices, markInvoiceSent, nowTimestamp, paymentItems, transactions]);

  const upcomingPayments = useMemo(
    () =>
      paymentItems
        .filter((item) => !isPast(item.due_at, nowTimestamp) && ['scheduled', 'pending', 'processing'].includes(item.status))
        .slice(0, 6),
    [nowTimestamp, paymentItems],
  );

  const exportRows = useMemo(() => {
    const invoiceRows = invoices.map((invoice) => ({
      record_type: 'invoice',
      record_id: invoice.id,
      invoice_number: invoice.invoice_number || '',
      client_id: invoice.client_display_id || '',
      service_description: invoice.service_description,
      amount: Number(invoice.total_amount || 0),
      currency: invoice.currency,
      status: invoice.payment_status,
      method: '',
      transaction_type: invoice.invoice_type,
      issued_or_created_at: invoice.issued_at,
      paid_or_processed_at: invoice.paid_at || '',
      release_benchmark: '',
    }));

    const transactionRows = transactions.map((transaction) => {
      const invoice = transaction.invoice_id ? invoiceById.get(transaction.invoice_id) : null;
      return {
        record_type: 'transaction',
        record_id: transaction.id,
        invoice_number: invoice?.invoice_number || '',
        client_id: invoice?.client_display_id || '',
        service_description: invoice?.service_description || '',
        amount: Number(transaction.amount || 0),
        currency: transaction.currency,
        status: transaction.status,
        method: transaction.payment_method,
        transaction_type: transaction.transaction_type,
        issued_or_created_at: transaction.created_at,
        paid_or_processed_at: transaction.processed_at || '',
        release_benchmark: transaction.release_benchmark || '',
      };
    });

    return [...invoiceRows, ...transactionRows];
  }, [invoiceById, invoices, transactions]);

  const handleExport = async () => {
    if (exportRows.length === 0) {
      toast.info(copy.noExport);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`baise-finance-closeout-${today}.csv`, exportRows);

    if (providerId && user) {
      await db.from('provider_transaction_exports').insert({
        provider_id: providerId,
        created_by: user.id,
        export_type: 'custom',
        date_from: null,
        date_to: today,
        filters: { source: 'finance_command_center' },
        row_count: exportRows.length,
      });
      recordProviderOperationSilently({
        action: 'finance.closeout_exported',
        resourceType: 'provider_transaction_export',
        metadata: { row_count: exportRows.length, date_to: today },
      });
    }

    toast.success(copy.exported);
  };

  const metrics = useMemo(
    () => [
      {
        label: copy.available,
        value: formatMoney(balance?.available_balance || 0, balance?.currency || 'brl'),
        icon: Wallet,
      },
      {
        label: copy.pending,
        value: formatMoney(balance?.pending_balance || 0, balance?.currency || 'brl'),
        icon: Clock,
      },
      {
        label: copy.credits,
        value: formatMoney(balance?.internal_credit_balance || refundCreditTotal, balance?.currency || 'brl'),
        icon: ReceiptText,
      },
      {
        label: copy.paid,
        value: formatMoney(paidRevenue, balance?.currency || 'brl'),
        icon: CheckCircle2,
      },
    ],
    [balance, copy, paidRevenue, refundCreditTotal],
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
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={loadRecords} disabled={isLoadingRecords}>
            {isLoadingRecords ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
            {copy.refresh}
          </Button>
          <Button type="button" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {copy.export}
          </Button>
        </div>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.actionTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.actionDescription}</p>
            </div>
            <div className="divide-y">
              {financeActions.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {copy.emptyActions}
                </div>
              ) : (
                financeActions.map((action) => (
                  <FinanceActionRow key={`${action.kind}-${action.id}`} action={action} isUpdating={updatingId === action.id} />
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border bg-background">
            <div className="border-b p-4">
              <h3 className="font-semibold">{copy.upcomingTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.upcomingDescription}</p>
            </div>
            <div className="divide-y">
              {upcomingPayments.length === 0 ? (
                <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  {copy.emptyUpcoming}
                </div>
              ) : (
                upcomingPayments.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatMoney(item.amount, item.currency)} · {copy.due} {formatDate(item.due_at)}
                        </p>
                      </div>
                      <Badge variant="outline">{formatLabel(item.status)}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.processor && <span>{formatLabel(item.processor)}</span>}
                      {item.attempt_count ? <span>{item.attempt_count} {copy.attempts}</span> : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-lg border bg-background p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold">{copy.exportTitle}</h3>
              <p className="text-sm text-muted-foreground">{copy.exportDescription}</p>
            </div>
            <Badge variant="secondary">{exportRows.length} {copy.rows}</Badge>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}

function FinanceActionRow({
  action,
  isUpdating,
}: {
  action: FinanceAction;
  isUpdating: boolean;
}) {
  const Icon = action.kind === 'invoice' ? FileText : action.kind === 'payment' ? CalendarClock : ReceiptText;
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
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          {action.buttonLabel}
        </Button>
      )}
    </div>
  );
}
