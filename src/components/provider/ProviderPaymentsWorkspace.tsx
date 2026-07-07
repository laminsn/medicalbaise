import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarClock,
  CreditCard,
  Download,
  FileText,
  Filter,
  Loader2,
  ReceiptText,
  RefreshCcw,
  Send,
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
import { formatPrice } from '@/lib/currency';
import { downloadReceiptInvoiceDocument } from '@/lib/providerDocuments';

type ProviderInvoice = {
  id: string;
  invoice_number: string | null;
  client_display_id: string | null;
  service_description: string;
  total_amount: number;
  currency: string;
  payment_status: string;
  invoice_type: string;
  issued_at: string;
  paid_at: string | null;
  metadata?: Record<string, unknown> | null;
};

type ProviderTransaction = {
  id: string;
  invoice_id: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  payment_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  release_benchmark: string | null;
  metadata?: Record<string, unknown> | null;
};

type PaymentPlan = {
  id: string;
  title: string;
  plan_type: string;
  cadence: string;
  total_amount: number;
  deposit_amount: number;
  installment_count: number;
  status: string;
  start_date: string;
  billing_mode?: string | null;
  failure_count?: number | null;
  last_payment_error?: string | null;
  metadata?: Record<string, unknown> | null;
};

type PaymentPlanItem = {
  id: string;
  payment_plan_id: string;
  sequence_number: number;
  label: string;
  amount: number;
  currency: string;
  due_at: string;
  status: string;
  paid_at: string | null;
  checkout_url?: string | null;
  processor?: string | null;
  attempt_count?: number | null;
  last_payment_error?: string | null;
  client_action_required?: boolean | null;
};

const db = supabase as any;

const PLAN_TYPE_VALUES = ['one_time', 'recurring', 'subscription', 'milestone', 'split'] as const;
const CADENCE_VALUES = ['one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annual', 'custom'] as const;

const PAYMENT_COPY = {
  en: {
    planTypes: {
      one_time: 'One-off',
      recurring: 'Recurring',
      subscription: 'Subscription',
      milestone: 'Milestone',
      split: 'Split payment',
    },
    cadences: {
      one_time: 'One time',
      weekly: 'Weekly',
      biweekly: 'Biweekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      annual: 'Annual',
      custom: 'Custom',
    },
    providerRequiredTitle: 'Provider payments workspace',
    providerRequiredDescription: 'Create a provider account to manage POS, invoices, payment plans, and exports.',
    paidRevenue: 'Paid revenue',
    paidRevenueDescription: 'Invoices marked paid in the selected range.',
    pendingPipeline: 'Pending pipeline',
    pendingPipelineDescription: 'Pending, processing, or scheduled invoice value.',
    activePlans: 'Active plans',
    activePlansDescription: 'Recurring, split, subscription, or milestone plans.',
    builderTitle: 'Flexible payment plan builder',
    builderDescription: 'Create one-off, recurring, subscription, split, or milestone payment schedules tied to invoices, reminders, and calendar due dates.',
    planTitle: 'Plan title',
    planTitlePlaceholder: 'Monthly cleaning service',
    clientName: 'Client name',
    clientNamePlaceholder: 'Client or company',
    clientEmail: 'Client email',
    startDate: 'Start date',
    serviceDescription: 'Service description',
    servicePlaceholder: 'Scope, deliverables, inspection points, or recurring service details',
    planType: 'Plan type',
    cadence: 'Cadence',
    total: 'Total',
    deposit: 'Deposit',
    payments: 'Payments',
    paymentMethod: 'Payment method',
    hostedCheckout: 'Hosted checkout',
    superwallStripe: 'Superwall + Stripe',
    pix: 'Pix',
    wallet: 'Wallet',
    internalBalance: 'Internal balance',
    manual: 'Manual',
    benchmark: 'Benchmark',
    benchmarkPlaceholder: 'Inspection approved',
    createPlan: 'Create plan, invoice, calendar, and reminders',
    historyTitle: 'Transaction history and exports',
    historyDescription: 'Filter receipts, invoices, credits, refunds, POS payments, and subcontractor releases for tax records.',
    exportCsv: 'Export CSV',
    downloadReceipt: 'Download receipt',
    preset: 'Preset',
    mtd: 'MTD',
    last30: 'Last 30 days',
    annual: 'Annual',
    custom: 'Custom',
    from: 'From',
    to: 'To',
    status: 'Status',
    allStatuses: 'All statuses',
    pending: 'Pending',
    paid: 'Paid',
    refunded: 'Refunded',
    credited: 'Credited',
    cancelled: 'Cancelled',
    noTransactions: 'No transactions match this filter yet.',
    activePlansTitle: 'Active flexible plans',
    activePlansDescriptionLong: 'Payment schedules are connected to invoices, calendar due dates, and portal reminders.',
    noPlans: 'No flexible payment plans yet.',
    scheduledPayments: 'Scheduled payments',
    due: 'Due',
    paidAt: 'Paid',
    collectPayment: 'Create checkout',
    openCheckout: 'Open checkout',
    checkoutCreated: 'Checkout created for',
    checkoutError: 'Unable to create checkout for this scheduled payment.',
    retryDue: 'Retry due',
    noClientId: 'No client ID',
    validAmount: 'Enter a valid total amount.',
    titleRequired: 'Add a payment plan title.',
    loadError: 'Unable to load provider payment workspace.',
    recordsError: 'Unable to load payment records.',
    created: 'Payment plan created for invoice',
    createError: 'Unable to create payment plan.',
    noExport: 'No transactions match this export filter.',
  },
  es: {
    planTypes: {
      one_time: 'Pago unico',
      recurring: 'Recurrente',
      subscription: 'Suscripcion',
      milestone: 'Por hito',
      split: 'Pago dividido',
    },
    cadences: {
      one_time: 'Una vez',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      annual: 'Anual',
      custom: 'Personalizado',
    },
    providerRequiredTitle: 'Espacio de pagos del proveedor',
    providerRequiredDescription: 'Crea una cuenta de proveedor para gestionar POS, facturas, planes de pago y exportaciones.',
    paidRevenue: 'Ingresos pagados',
    paidRevenueDescription: 'Facturas marcadas como pagadas en el rango seleccionado.',
    pendingPipeline: 'Ingresos pendientes',
    pendingPipelineDescription: 'Valor de facturas pendientes, en proceso o programadas.',
    activePlans: 'Planes activos',
    activePlansDescription: 'Planes recurrentes, divididos, de suscripcion o por hitos.',
    builderTitle: 'Creador de planes de pago flexibles',
    builderDescription: 'Crea pagos unicos, recurrentes, de suscripcion, divididos o por hitos vinculados a facturas, recordatorios y fechas del calendario.',
    planTitle: 'Titulo del plan',
    planTitlePlaceholder: 'Servicio mensual de limpieza',
    clientName: 'Nombre del cliente',
    clientNamePlaceholder: 'Cliente o empresa',
    clientEmail: 'Correo del cliente',
    startDate: 'Fecha de inicio',
    serviceDescription: 'Descripcion del servicio',
    servicePlaceholder: 'Alcance, entregables, puntos de inspeccion o detalles del servicio recurrente',
    planType: 'Tipo de plan',
    cadence: 'Frecuencia',
    total: 'Total',
    deposit: 'Deposito',
    payments: 'Pagos',
    paymentMethod: 'Metodo de pago',
    hostedCheckout: 'Checkout alojado',
    superwallStripe: 'Superwall + Stripe',
    pix: 'Pix',
    wallet: 'Billetera',
    internalBalance: 'Saldo interno',
    manual: 'Manual',
    benchmark: 'Hito',
    benchmarkPlaceholder: 'Inspeccion aprobada',
    createPlan: 'Crear plan, factura, calendario y recordatorios',
    historyTitle: 'Historial de transacciones y exportaciones',
    historyDescription: 'Filtra recibos, facturas, creditos, reembolsos, pagos POS y liberaciones de subcontratistas para registros fiscales.',
    exportCsv: 'Exportar CSV',
    downloadReceipt: 'Descargar recibo',
    preset: 'Periodo',
    mtd: 'Mes actual',
    last30: 'Ultimos 30 dias',
    annual: 'Anual',
    custom: 'Personalizado',
    from: 'Desde',
    to: 'Hasta',
    status: 'Estado',
    allStatuses: 'Todos los estados',
    pending: 'Pendiente',
    paid: 'Pagado',
    refunded: 'Reembolsado',
    credited: 'Acreditado',
    cancelled: 'Cancelado',
    noTransactions: 'No hay transacciones que coincidan con este filtro.',
    activePlansTitle: 'Planes flexibles activos',
    activePlansDescriptionLong: 'Los calendarios de pago se conectan con facturas, vencimientos del calendario y recordatorios del portal.',
    noPlans: 'Aun no hay planes de pago flexibles.',
    scheduledPayments: 'Pagos programados',
    due: 'Vence',
    paidAt: 'Pagado',
    collectPayment: 'Crear checkout',
    openCheckout: 'Abrir checkout',
    checkoutCreated: 'Checkout creado para',
    checkoutError: 'No se pudo crear el checkout para este pago programado.',
    retryDue: 'Reintento pendiente',
    noClientId: 'Sin ID de cliente',
    validAmount: 'Ingresa un total valido.',
    titleRequired: 'Agrega un titulo para el plan de pago.',
    loadError: 'No se pudo cargar el espacio de pagos del proveedor.',
    recordsError: 'No se pudieron cargar los registros de pago.',
    created: 'Plan de pago creado para la factura',
    createError: 'No se pudo crear el plan de pago.',
    noExport: 'Ninguna transaccion coincide con este filtro de exportacion.',
  },
  pt: {
    planTypes: {
      one_time: 'Pagamento unico',
      recurring: 'Recorrente',
      subscription: 'Assinatura',
      milestone: 'Por marco',
      split: 'Pagamento dividido',
    },
    cadences: {
      one_time: 'Uma vez',
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      annual: 'Anual',
      custom: 'Personalizado',
    },
    providerRequiredTitle: 'Area de pagamentos do prestador',
    providerRequiredDescription: 'Crie uma conta de prestador para gerenciar POS, faturas, planos de pagamento e exportacoes.',
    paidRevenue: 'Receita paga',
    paidRevenueDescription: 'Faturas marcadas como pagas no periodo selecionado.',
    pendingPipeline: 'Receita pendente',
    pendingPipelineDescription: 'Valor de faturas pendentes, em processamento ou agendadas.',
    activePlans: 'Planos ativos',
    activePlansDescription: 'Planos recorrentes, divididos, de assinatura ou por marcos.',
    builderTitle: 'Criador de planos de pagamento flexiveis',
    builderDescription: 'Crie pagamentos unicos, recorrentes, de assinatura, divididos ou por marcos vinculados a faturas, lembretes e datas no calendario.',
    planTitle: 'Titulo do plano',
    planTitlePlaceholder: 'Servico mensal de limpeza',
    clientName: 'Nome do cliente',
    clientNamePlaceholder: 'Cliente ou empresa',
    clientEmail: 'Email do cliente',
    startDate: 'Data de inicio',
    serviceDescription: 'Descricao do servico',
    servicePlaceholder: 'Escopo, entregas, pontos de inspecao ou detalhes do servico recorrente',
    planType: 'Tipo de plano',
    cadence: 'Frequencia',
    total: 'Total',
    deposit: 'Entrada',
    payments: 'Pagamentos',
    paymentMethod: 'Metodo de pagamento',
    hostedCheckout: 'Checkout hospedado',
    superwallStripe: 'Superwall + Stripe',
    pix: 'Pix',
    wallet: 'Carteira',
    internalBalance: 'Saldo interno',
    manual: 'Manual',
    benchmark: 'Marco',
    benchmarkPlaceholder: 'Inspecao aprovada',
    createPlan: 'Criar plano, fatura, calendario e lembretes',
    historyTitle: 'Historico de transacoes e exportacoes',
    historyDescription: 'Filtre recibos, faturas, creditos, reembolsos, pagamentos POS e liberacoes de subcontratados para registros fiscais.',
    exportCsv: 'Exportar CSV',
    downloadReceipt: 'Baixar recibo',
    preset: 'Periodo',
    mtd: 'Mes atual',
    last30: 'Ultimos 30 dias',
    annual: 'Anual',
    custom: 'Personalizado',
    from: 'De',
    to: 'Ate',
    status: 'Status',
    allStatuses: 'Todos os status',
    pending: 'Pendente',
    paid: 'Pago',
    refunded: 'Reembolsado',
    credited: 'Creditado',
    cancelled: 'Cancelado',
    noTransactions: 'Nenhuma transacao corresponde a este filtro.',
    activePlansTitle: 'Planos flexiveis ativos',
    activePlansDescriptionLong: 'Os cronogramas de pagamento ficam conectados a faturas, vencimentos no calendario e lembretes do portal.',
    noPlans: 'Ainda nao ha planos de pagamento flexiveis.',
    scheduledPayments: 'Pagamentos programados',
    due: 'Vence',
    paidAt: 'Pago',
    collectPayment: 'Criar checkout',
    openCheckout: 'Abrir checkout',
    checkoutCreated: 'Checkout criado para',
    checkoutError: 'Nao foi possivel criar checkout para este pagamento programado.',
    retryDue: 'Nova tentativa pendente',
    noClientId: 'Sem ID do cliente',
    validAmount: 'Informe um total valido.',
    titleRequired: 'Adicione um titulo para o plano de pagamento.',
    loadError: 'Nao foi possivel carregar a area de pagamentos do prestador.',
    recordsError: 'Nao foi possivel carregar os registros de pagamento.',
    created: 'Plano de pagamento criado para a fatura',
    createError: 'Nao foi possivel criar o plano de pagamento.',
    noExport: 'Nenhuma transacao corresponde a este filtro de exportacao.',
  },
} as const;

const getCopyKey = (language?: string) => {
  if (language?.startsWith('es')) return 'es';
  if (language?.startsWith('pt')) return 'pt';
  return 'en';
};

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);

const getDateRange = (preset: string) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (preset === 'mtd') {
    start.setDate(1);
  } else if (preset === 'monthly') {
    start.setMonth(start.getMonth() - 1);
  } else if (preset === 'annual') {
    start.setMonth(0, 1);
  } else {
    start.setMonth(start.getMonth() - 3);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { from: dateOnly(start), to: dateOnly(end) };
};

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const headers = Object.keys(rows[0] || { empty: '' });
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const getMetadataText = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  const value = metadata?.[key];
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return null;
};

export function ProviderPaymentsWorkspace() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = PAYMENT_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
  const [transactions, setTransactions] = useState<ProviderTransaction[]>([]);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [paymentItems, setPaymentItems] = useState<PaymentPlanItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [collectingItemId, setCollectingItemId] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState('mtd');
  const initialRange = useMemo(() => getDateRange('mtd'), []);
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);

  const [planTitle, setPlanTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [planType, setPlanType] = useState('one_time');
  const [cadence, setCadence] = useState('one_time');
  const [installmentCount, setInstallmentCount] = useState('1');
  const [startDate, setStartDate] = useState(dateOnly(new Date()));
  const [paymentMethod, setPaymentMethod] = useState('hosted_checkout');
  const [releaseBenchmark, setReleaseBenchmark] = useState('');
  const planTypes = useMemo(
    () => PLAN_TYPE_VALUES.map((value) => ({ value, label: copy.planTypes[value] })),
    [copy],
  );
  const cadences = useMemo(
    () => CADENCE_VALUES.map((value) => ({ value, label: copy.cadences[value] })),
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

  const loadRecords = async (nextProviderId = providerId) => {
    if (!nextProviderId) return;
    setIsLoading(true);
    try {
      const fromIso = new Date(`${dateFrom}T00:00:00`).toISOString();
      const toIso = new Date(`${dateTo}T23:59:59`).toISOString();

      let invoiceQuery = db
        .from('provider_invoices')
        .select('id, invoice_number, client_display_id, service_description, total_amount, currency, payment_status, invoice_type, issued_at, paid_at, metadata')
        .eq('provider_id', nextProviderId)
        .gte('issued_at', fromIso)
        .lte('issued_at', toIso)
        .order('issued_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') invoiceQuery = invoiceQuery.eq('payment_status', statusFilter);

      const [invoiceRes, transactionRes, planRes, itemRes] = await Promise.all([
        invoiceQuery,
        db
          .from('provider_payment_transactions')
          .select('id, invoice_id, amount, currency, transaction_type, payment_method, status, created_at, processed_at, release_benchmark, metadata')
          .eq('provider_id', nextProviderId)
          .gte('created_at', fromIso)
          .lte('created_at', toIso)
          .order('created_at', { ascending: false })
          .limit(75),
        db
          .from('provider_payment_plans')
          .select('id, title, plan_type, cadence, total_amount, deposit_amount, installment_count, status, start_date, billing_mode, failure_count, last_payment_error, metadata')
          .eq('provider_id', nextProviderId)
          .order('created_at', { ascending: false })
          .limit(25),
        db
          .from('provider_payment_plan_items')
          .select('id, payment_plan_id, sequence_number, label, amount, currency, due_at, status, paid_at, checkout_url, processor, attempt_count, last_payment_error, client_action_required')
          .eq('provider_id', nextProviderId)
          .order('due_at', { ascending: true })
          .limit(200),
      ]);

      if (invoiceRes.error) throw invoiceRes.error;
      if (transactionRes.error) throw transactionRes.error;
      if (planRes.error) throw planRes.error;
      if (itemRes.error) throw itemRes.error;

      setInvoices(invoiceRes.data || []);
      setTransactions(transactionRes.data || []);
      setPlans(planRes.data || []);
      setPaymentItems(itemRes.data || []);
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
  }, [providerId, statusFilter, dateFrom, dateTo]);

  const totals = useMemo(() => {
    const paid = invoices
      .filter((invoice) => invoice.payment_status === 'paid')
      .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
    const pending = invoices
      .filter((invoice) => ['pending', 'processing'].includes(invoice.payment_status))
      .reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
    return { paid, pending };
  }, [invoices]);

  const handlePresetChange = (value: string) => {
    setDatePreset(value);
    const nextRange = getDateRange(value);
    setDateFrom(nextRange.from);
    setDateTo(nextRange.to);
  };

  const handleCreatePaymentPlan = async () => {
    const amount = Number(totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(copy.validAmount);
      return;
    }
    if (planTitle.trim().length < 3) {
      toast.error(copy.titleRequired);
      return;
    }

    setIsCreatingPlan(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-provider-payment-plan', {
        body: {
          title: planTitle,
          serviceDescription,
          totalAmount: amount,
          depositAmount: Number(depositAmount || 0),
          planType,
          cadence,
          installmentCount: Number(installmentCount || 1),
          startDate,
          clientName,
          clientEmail,
          paymentMethod,
          milestones:
            planType === 'milestone' && releaseBenchmark
              ? [
                  {
                    label: releaseBenchmark,
                    amount,
                    dueAt: startDate,
                    releaseBenchmark,
                  },
                ]
              : undefined,
        },
      });

      if (error) throw error;
      toast.success(`${copy.created} ${data?.invoiceNumber || ''}.`);
      setPlanTitle('');
      setClientName('');
      setClientEmail('');
      setServiceDescription('');
      setTotalAmount('');
      setDepositAmount('');
      setReleaseBenchmark('');
      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.createError);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const exportRows = () => {
    const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
    return transactions.map((transaction) => {
      const invoice = transaction.invoice_id ? invoiceById.get(transaction.invoice_id) : null;
      return {
        transaction_id: transaction.id,
        invoice_number: invoice?.invoice_number || transaction.metadata?.invoice_number || '',
        client_id: invoice?.client_display_id || transaction.metadata?.client_display_id || '',
        service_description: invoice?.service_description || '',
        amount: transaction.amount,
        currency: transaction.currency,
        transaction_type: transaction.transaction_type,
        payment_method: transaction.payment_method,
        status: transaction.status,
        release_benchmark: transaction.release_benchmark || '',
        created_at: transaction.created_at,
        processed_at: transaction.processed_at || '',
      };
    });
  };

  const handleExport = async () => {
    const rows = exportRows();
    if (rows.length === 0) {
      toast.info(copy.noExport);
      return;
    }

    downloadCsv(`baise-transactions-${datePreset}-${dateFrom}-to-${dateTo}.csv`, rows);

    if (providerId && user) {
      await db.from('provider_transaction_exports').insert({
        provider_id: providerId,
        created_by: user.id,
        export_type: datePreset,
        date_from: dateFrom,
        date_to: dateTo,
        row_count: rows.length,
        filters: { status: statusFilter },
      });
    }
  };

  const handleDownloadReceipt = (transaction: ProviderTransaction, invoice?: ProviderInvoice) => {
    downloadReceiptInvoiceDocument({
      invoiceNumber: invoice?.invoice_number || getMetadataText(transaction.metadata, 'invoice_number') || transaction.id,
      clientDisplayId: invoice?.client_display_id || getMetadataText(transaction.metadata, 'client_display_id'),
      serviceDescription: invoice?.service_description || transaction.transaction_type,
      invoiceType: invoice?.invoice_type,
      paymentStatus: invoice?.payment_status || transaction.status,
      totalAmount: transaction.amount,
      currency: transaction.currency,
      issuedAt: invoice?.issued_at || transaction.created_at,
      paidAt: invoice?.paid_at,
      transactionId: transaction.id,
      transactionStatus: transaction.status,
      transactionType: transaction.transaction_type,
      paymentMethod: transaction.payment_method,
      processedAt: transaction.processed_at,
    });
  };

  const handleCollectScheduledPayment = async (item: PaymentPlanItem) => {
    setCollectingItemId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-plan-item-checkout', {
        body: { paymentPlanItemId: item.id },
      });

      if (error) throw error;

      if (data?.url) {
        toast.success(`${copy.checkoutCreated} ${item.label}.`);
        window.location.href = data.url;
        return;
      }

      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.checkoutError);
    } finally {
      setCollectingItemId(null);
    }
  };

  const itemsByPlan = useMemo(() => {
    const grouped = new Map<string, PaymentPlanItem[]>();
    for (const item of paymentItems) {
      const group = grouped.get(item.payment_plan_id) || [];
      group.push(item);
      grouped.set(item.payment_plan_id, group);
    }
    return grouped;
  }, [paymentItems]);

  if (!providerId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{copy.providerRequiredTitle}</CardTitle>
          <CardDescription>{copy.providerRequiredDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{copy.paidRevenue}</CardTitle>
            <CardDescription>{copy.paidRevenueDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{copy.pendingPipeline}</CardTitle>
            <CardDescription>{copy.pendingPipelineDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatPrice(totals.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{copy.activePlans}</CardTitle>
            <CardDescription>{copy.activePlansDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{plans.filter((plan) => plan.status === 'active').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            {copy.builderTitle}
          </CardTitle>
          <CardDescription>
            {copy.builderDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-title">{copy.planTitle}</Label>
                <Input id="plan-title" value={planTitle} onChange={(event) => setPlanTitle(event.target.value)} placeholder={copy.planTitlePlaceholder} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-client">{copy.clientName}</Label>
                <Input id="plan-client" value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder={copy.clientNamePlaceholder} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="plan-email">{copy.clientEmail}</Label>
                <Input id="plan-email" type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} placeholder="client@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-start">{copy.startDate}</Label>
                <Input id="plan-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-description">{copy.serviceDescription}</Label>
              <Textarea id="plan-description" value={serviceDescription} onChange={(event) => setServiceDescription(event.target.value)} placeholder={copy.servicePlaceholder} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{copy.planType}</Label>
                <Select value={planType} onValueChange={(value) => {
                  setPlanType(value);
                  if (value === 'one_time') setCadence('one_time');
                  if (value !== 'one_time' && cadence === 'one_time') setCadence('monthly');
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {planTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{copy.cadence}</Label>
                <Select value={cadence} onValueChange={setCadence}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cadences.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="plan-total">{copy.total}</Label>
                <Input id="plan-total" type="number" min="0" step="0.01" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-deposit">{copy.deposit}</Label>
                <Input id="plan-deposit" type="number" min="0" step="0.01" value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installments">{copy.payments}</Label>
                <Input id="installments" type="number" min="1" max="60" value={installmentCount} onChange={(event) => setInstallmentCount(event.target.value)} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{copy.paymentMethod}</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hosted_checkout">{copy.hostedCheckout}</SelectItem>
                    <SelectItem value="superwall_stripe">{copy.superwallStripe}</SelectItem>
                    <SelectItem value="pix">{copy.pix}</SelectItem>
                    <SelectItem value="wallet">{copy.wallet}</SelectItem>
                    <SelectItem value="internal_balance">{copy.internalBalance}</SelectItem>
                    <SelectItem value="manual">{copy.manual}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="benchmark">{copy.benchmark}</Label>
                <Input id="benchmark" value={releaseBenchmark} onChange={(event) => setReleaseBenchmark(event.target.value)} placeholder={copy.benchmarkPlaceholder} />
              </div>
            </div>
            <Button onClick={handleCreatePaymentPlan} disabled={isCreatingPlan} className="w-full">
              {isCreatingPlan ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {copy.createPlan}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ReceiptText className="h-5 w-5" />
                {copy.historyTitle}
              </CardTitle>
              <CardDescription>
                {copy.historyDescription}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {copy.exportCsv}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Label>{copy.preset}</Label>
              <Select value={datePreset} onValueChange={handlePresetChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mtd">{copy.mtd}</SelectItem>
                  <SelectItem value="monthly">{copy.last30}</SelectItem>
                  <SelectItem value="annual">{copy.annual}</SelectItem>
                  <SelectItem value="custom">{copy.custom}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-from">{copy.from}</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">{copy.to}</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{copy.status}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.allStatuses}</SelectItem>
                  <SelectItem value="pending">{copy.pending}</SelectItem>
                  <SelectItem value="paid">{copy.paid}</SelectItem>
                  <SelectItem value="refunded">{copy.refunded}</SelectItem>
                  <SelectItem value="credited">{copy.credited}</SelectItem>
                  <SelectItem value="cancelled">{copy.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              <Filter className="mx-auto mb-3 h-10 w-10 opacity-50" />
              {copy.noTransactions}
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => {
                const invoice = invoices.find((item) => item.id === transaction.invoice_id);
                return (
                  <div key={transaction.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{transaction.status}</Badge>
                        <Badge variant="outline">{transaction.payment_method}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleString()}</span>
                      </div>
                      <p className="truncate font-medium">
                        {invoice?.invoice_number || transaction.metadata?.invoice_number || transaction.id}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {invoice?.service_description || transaction.transaction_type}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <p className="font-bold">{formatPrice(Number(transaction.amount || 0))}</p>
                      <p className="text-xs text-muted-foreground">{invoice?.client_display_id || transaction.metadata?.client_display_id || copy.noClientId}</p>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(transaction, invoice)}>
                        <Download className="mr-2 h-4 w-4" />
                        {copy.downloadReceipt}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {copy.activePlansTitle}
          </CardTitle>
          <CardDescription>{copy.activePlansDescriptionLong}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.noPlans}</p>
          ) : (
            plans.map((plan) => {
              const items = itemsByPlan.get(plan.id) || [];
              return (
                <div key={plan.id} className="space-y-3 rounded-lg border p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium">{plan.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {plan.plan_type} · {plan.cadence} · {plan.installment_count} payment{plan.installment_count === 1 ? '' : 's'}
                      </p>
                      {plan.last_payment_error && (
                        <p className="mt-1 text-xs text-destructive">{plan.last_payment_error}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{plan.status}</Badge>
                      <span className="font-bold">{formatPrice(Number(plan.total_amount || 0))}</span>
                      <Button variant="ghost" size="icon" onClick={() => loadRecords()}>
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="space-y-2 rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {copy.scheduledPayments}
                      </p>
                      {items.map((item) => {
                        const canCollect = ['scheduled', 'pending', 'overdue', 'failed', 'retry_due'].includes(item.status);
                        return (
                          <div key={item.id} className="grid gap-2 rounded-md bg-background p-3 md:grid-cols-[1fr_auto] md:items-center">
                            <div className="min-w-0">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <Badge variant={item.status === 'paid' ? 'default' : item.status === 'retry_due' ? 'destructive' : 'secondary'}>
                                  {item.status === 'retry_due' ? copy.retryDue : item.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {copy.due} {new Date(item.due_at).toLocaleDateString()}
                                </span>
                                {item.paid_at && (
                                  <span className="text-xs text-muted-foreground">
                                    {copy.paidAt} {new Date(item.paid_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-sm font-medium">{item.label}</p>
                              {item.last_payment_error && (
                                <p className="truncate text-xs text-destructive">{item.last_payment_error}</p>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <span className="font-semibold">{formatPrice(Number(item.amount || 0))}</span>
                              {item.checkout_url && item.status !== 'paid' && (
                                <Button variant="outline" size="sm" onClick={() => { window.location.href = item.checkout_url || '#'; }}>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  {copy.openCheckout}
                                </Button>
                              )}
                              {canCollect && (
                                <Button size="sm" onClick={() => handleCollectScheduledPayment(item)} disabled={collectingItemId === item.id}>
                                  {collectingItemId === item.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CreditCard className="mr-2 h-4 w-4" />
                                  )}
                                  {copy.collectPayment}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
