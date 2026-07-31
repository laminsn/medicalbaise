import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Download, Filter, Loader2, ReceiptText, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/currency';
import { downloadReceiptInvoiceDocument } from '@/lib/providerDocuments';

type ClientInvoice = {
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
  due_at: string | null;
};

type ClientTransaction = {
  id: string;
  invoice_id: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  payment_method: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  refund_destination: string | null;
};

type ClientPaymentItem = {
  id: string;
  payment_plan_id: string;
  invoice_id: string | null;
  sequence_number: number;
  label: string;
  amount: number;
  currency: string;
  due_at: string;
  status: string;
  paid_at: string | null;
  checkout_url?: string | null;
  last_payment_error?: string | null;
};

const db = supabase as any;

const HISTORY_COPY = {
  en: {
    title: 'Client transaction history',
    description: 'Pull receipts, invoices, payment proof, credits, refunds, and tax-ready records from your client account.',
    preset: 'Preset',
    mtd: 'MTD',
    monthly: 'Last 30 days',
    annual: 'Annual',
    custom: 'Custom',
    from: 'From',
    to: 'To',
    status: 'Status',
    all: 'All statuses',
    pending: 'Pending',
    paid: 'Paid',
    refunded: 'Refunded',
    credited: 'Credited',
    cancelled: 'Cancelled',
    export: 'Export CSV',
    refresh: 'Refresh',
    scheduledPayments: 'Scheduled payments',
    due: 'Due',
    payNow: 'Pay now',
    openCheckout: 'Open checkout',
    downloadReceipt: 'Download receipt',
    checkoutCreated: 'Checkout created',
    checkoutError: 'Unable to open payment checkout.',
    empty: 'No client transactions match this filter yet.',
    noInvoice: 'No invoice',
    noTransactions: 'No transactions match this export filter.',
    recordsError: 'Unable to load client transaction history.',
  },
  es: {
    title: 'Historial de transacciones del cliente',
    description: 'Descarga recibos, facturas, comprobantes, creditos, reembolsos y registros listos para impuestos desde tu cuenta.',
    preset: 'Período',
    mtd: 'Mes actual',
    monthly: 'Ultimos 30 días',
    annual: 'Anual',
    custom: 'Personalizado',
    from: 'Desde',
    to: 'Hasta',
    status: 'Estado',
    all: 'Todos los estados',
    pending: 'Pendiente',
    paid: 'Pagado',
    refunded: 'Reembolsado',
    credited: 'Acreditado',
    cancelled: 'Cancelado',
    export: 'Exportar CSV',
    refresh: 'Actualizar',
    scheduledPayments: 'Pagos programados',
    due: 'Vence',
    payNow: 'Pagar ahora',
    openCheckout: 'Abrir checkout',
    downloadReceipt: 'Descargar recibo',
    checkoutCreated: 'Checkout creado',
    checkoutError: 'No se pudo abrir el checkout de pago.',
    empty: 'No hay transacciones de cliente que coincidan con este filtro.',
    noInvoice: 'Sin factura',
    noTransactions: 'Ninguna transacción coincide con este filtro de exportación.',
    recordsError: 'No se pudo cargar el historial de transacciones del cliente.',
  },
  pt: {
    title: 'Histórico de transações do cliente',
    description: 'Baixe recibos, faturas, comprovantes, creditos, reembolsos e registros para impostos pela sua conta.',
    preset: 'Período',
    mtd: 'Mês atual',
    monthly: 'Ultimos 30 dias',
    annual: 'Anual',
    custom: 'Personalizado',
    from: 'De',
    to: 'Até',
    status: 'Status',
    all: 'Todos os status',
    pending: 'Pendente',
    paid: 'Pago',
    refunded: 'Reembolsado',
    credited: 'Creditado',
    cancelled: 'Cancelado',
    export: 'Exportar CSV',
    refresh: 'Atualizar',
    scheduledPayments: 'Pagamentos programados',
    due: 'Vence',
    payNow: 'Pagar agora',
    openCheckout: 'Abrir checkout',
    downloadReceipt: 'Baixar recibo',
    checkoutCreated: 'Checkout criado',
    checkoutError: 'Não foi possível abrir o checkout de pagamento.',
    empty: 'Nenhuma transação de cliente corresponde a este filtro.',
    noInvoice: 'Sem fatura',
    noTransactions: 'Nenhuma transação corresponde a este filtro de exportação.',
    recordsError: 'Não foi possível carregar o histórico de transações do cliente.',
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

export function ClientTransactionHistory() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const copy = HISTORY_COPY[getCopyKey(i18n.resolvedLanguage || i18n.language)];
  const initialRange = useMemo(() => getDateRange('mtd'), []);
  const [datePreset, setDatePreset] = useState('mtd');
  const [dateFrom, setDateFrom] = useState(initialRange.from);
  const [dateTo, setDateTo] = useState(initialRange.to);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [payingItemId, setPayingItemId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [transactions, setTransactions] = useState<ClientTransaction[]>([]);
  const [paymentItems, setPaymentItems] = useState<ClientPaymentItem[]>([]);

  const loadRecords = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fromIso = new Date(`${dateFrom}T00:00:00`).toISOString();
      const toIso = new Date(`${dateTo}T23:59:59`).toISOString();
      let invoiceQuery = db
        .from('provider_invoices')
        .select('id, invoice_number, client_display_id, service_description, total_amount, currency, payment_status, invoice_type, issued_at, paid_at, due_at')
        .eq('customer_id', user.id)
        .gte('issued_at', fromIso)
        .lte('issued_at', toIso)
        .order('issued_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') invoiceQuery = invoiceQuery.eq('payment_status', statusFilter);

      const { data: invoiceData, error: invoiceError } = await invoiceQuery;
      if (invoiceError) throw invoiceError;

      const nextInvoices = invoiceData || [];
      setInvoices(nextInvoices);

      const invoiceIds = nextInvoices.map((invoice) => invoice.id);
      if (invoiceIds.length === 0) {
        setTransactions([]);
        setPaymentItems([]);
        return;
      }

      const [transactionRes, itemRes] = await Promise.all([
        db
          .from('provider_payment_transactions')
          .select('id, invoice_id, amount, currency, transaction_type, payment_method, status, created_at, processed_at, refund_destination')
          .in('invoice_id', invoiceIds)
          .gte('created_at', fromIso)
          .lte('created_at', toIso)
          .order('created_at', { ascending: false })
          .limit(150),
        db
          .from('provider_payment_plan_items')
          .select('id, payment_plan_id, invoice_id, sequence_number, label, amount, currency, due_at, status, paid_at, checkout_url, last_payment_error')
          .in('invoice_id', invoiceIds)
          .order('due_at', { ascending: true })
          .limit(150),
      ]);

      if (transactionRes.error) throw transactionRes.error;
      if (itemRes.error) throw itemRes.error;
      setTransactions(transactionRes.data || []);
      setPaymentItems(itemRes.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.recordsError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [user?.id, statusFilter, dateFrom, dateTo]);

  const handlePresetChange = (value: string) => {
    setDatePreset(value);
    const nextRange = getDateRange(value);
    setDateFrom(nextRange.from);
    setDateTo(nextRange.to);
  };

  const exportRows = () => {
    const transactionByInvoice = new Map(transactions.map((transaction) => [transaction.invoice_id, transaction]));
    return invoices.map((invoice) => {
      const transaction = transactionByInvoice.get(invoice.id);
      return {
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_display_id,
        service_description: invoice.service_description,
        invoice_type: invoice.invoice_type,
        payment_status: invoice.payment_status,
        invoice_total: invoice.total_amount,
        currency: invoice.currency,
        issued_at: invoice.issued_at,
        due_at: invoice.due_at || '',
        paid_at: invoice.paid_at || '',
        transaction_id: transaction?.id || '',
        transaction_status: transaction?.status || '',
        transaction_type: transaction?.transaction_type || '',
        payment_method: transaction?.payment_method || '',
        processed_at: transaction?.processed_at || '',
      };
    });
  };

  const handleExport = () => {
    const rows = exportRows();
    if (rows.length === 0) {
      toast.info(copy.noTransactions);
      return;
    }
    downloadCsv(`baise-client-history-${datePreset}-${dateFrom}-to-${dateTo}.csv`, rows);
  };

  const handleDownloadReceipt = (invoice: ClientInvoice, transaction?: ClientTransaction) => {
    downloadReceiptInvoiceDocument({
      invoiceNumber: invoice.invoice_number,
      clientDisplayId: invoice.client_display_id,
      serviceDescription: invoice.service_description,
      invoiceType: invoice.invoice_type,
      paymentStatus: invoice.payment_status,
      totalAmount: invoice.total_amount,
      currency: invoice.currency,
      issuedAt: invoice.issued_at,
      dueAt: invoice.due_at,
      paidAt: invoice.paid_at,
      transactionId: transaction?.id,
      transactionStatus: transaction?.status,
      transactionType: transaction?.transaction_type,
      paymentMethod: transaction?.payment_method,
      processedAt: transaction?.processed_at,
    });
  };

  const handlePayScheduledItem = async (item: ClientPaymentItem) => {
    setPayingItemId(item.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-plan-item-checkout', {
        body: { paymentPlanItemId: item.id },
      });

      if (error) throw error;

      if (data?.url) {
        toast.success(copy.checkoutCreated);
        window.location.href = data.url;
        return;
      }

      await loadRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.checkoutError);
    } finally {
      setPayingItemId(null);
    }
  };

  const itemsByInvoice = useMemo(() => {
    const grouped = new Map<string, ClientPaymentItem[]>();
    for (const item of paymentItems) {
      if (!item.invoice_id) continue;
      const group = grouped.get(item.invoice_id) || [];
      group.push(item);
      grouped.set(item.invoice_id, group);
    }
    return grouped;
  }, [paymentItems]);

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-5 w-5" />
              {copy.title}
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={loadRecords} disabled={isLoading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {copy.refresh}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              {copy.export}
            </Button>
          </div>
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
                <SelectItem value="monthly">{copy.monthly}</SelectItem>
                <SelectItem value="annual">{copy.annual}</SelectItem>
                <SelectItem value="custom">{copy.custom}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-history-from">{copy.from}</Label>
            <Input id="client-history-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-history-to">{copy.to}</Label>
            <Input id="client-history-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{copy.status}</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.all}</SelectItem>
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
        ) : invoices.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <Filter className="mx-auto mb-3 h-10 w-10 opacity-50" />
            {copy.empty}
          </div>
        ) : (
          <div className="space-y-2">
            {invoices.map((invoice) => {
              const transaction = transactions.find((item) => item.invoice_id === invoice.id);
              const scheduledItems = itemsByInvoice.get(invoice.id) || [];
              return (
                <div key={invoice.id} className="space-y-3 rounded-lg border p-3">
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{invoice.payment_status}</Badge>
                        <Badge variant="outline">{invoice.invoice_type}</Badge>
                        {transaction && <Badge>{transaction.payment_method}</Badge>}
                      </div>
                      <p className="truncate font-medium">{invoice.invoice_number || copy.noInvoice}</p>
                      <p className="truncate text-sm text-muted-foreground">{invoice.service_description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {invoice.client_display_id} · {new Date(invoice.issued_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <p className="font-bold">{formatPrice(Number(invoice.total_amount || 0))}</p>
                      <p className="text-xs text-muted-foreground">{transaction?.status || invoice.payment_status}</p>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(invoice, transaction)}>
                        <Download className="mr-2 h-4 w-4" />
                        {copy.downloadReceipt}
                      </Button>
                    </div>
                  </div>
                  {scheduledItems.length > 0 && (
                    <div className="space-y-2 rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {copy.scheduledPayments}
                      </p>
                      {scheduledItems.map((item) => {
                        const canPay = ['scheduled', 'pending', 'overdue', 'failed', 'retry_due'].includes(item.status);
                        return (
                          <div key={item.id} className="grid gap-2 rounded-md bg-background p-3 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <Badge variant={item.status === 'paid' ? 'default' : item.status === 'retry_due' ? 'destructive' : 'secondary'}>
                                  {item.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {copy.due} {new Date(item.due_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{item.label}</p>
                              {item.last_payment_error && (
                                <p className="text-xs text-destructive">{item.last_payment_error}</p>
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
                              {canPay && (
                                <Button size="sm" onClick={() => handlePayScheduledItem(item)} disabled={payingItemId === item.id}>
                                  {payingItemId === item.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CreditCard className="mr-2 h-4 w-4" />
                                  )}
                                  {copy.payNow}
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
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
