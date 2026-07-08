import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Megaphone,
  QrCode,
  RefreshCcw,
  Save,
  Share2,
  Target,
  Users,
  WalletCards,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { getBaiseAppKey, getBaiseAppUrl, getLocaleKey } from '@/lib/providerCommunication';
import { supabase } from '@/integrations/supabase/client';

type Campaign = {
  id: string;
  app_key: 'casa' | 'medical' | 'legal';
  name: string;
  slug: string;
  campaign_type: string;
  description: string | null;
  status: string;
  commission_type: string;
  commission_value: number;
  currency: string;
};

type Membership = {
  id: string;
  campaign_id: string;
  partner_user_id: string;
  status: string;
  partner_code: string;
  custom_code: string | null;
  landing_path: string;
  tracking_url: string | null;
  qr_payload: string | null;
  leads_count: number;
  conversions_count: number;
  partner_profit: number;
  last_lead_at: string | null;
  last_conversion_at: string | null;
  approved_at: string | null;
  created_at: string;
  partner_campaigns?: Campaign | Campaign[] | null;
};

type PartnerPayout = {
  id: string;
  campaign_id: string | null;
  membership_id: string | null;
  payout_period_start: string;
  payout_period_end: string;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  payment_reference: string | null;
  receipt_number: string;
  partner_campaigns?: Pick<Campaign, 'name'> | Pick<Campaign, 'name'>[] | null;
};

type PartnerReceipt = {
  id: string;
  period_type: 'monthly' | 'quarterly' | 'annual' | 'custom' | 'single';
  period_start: string;
  period_end: string;
  total_amount: number;
  currency: string;
  receipt_number: string;
  generated_at: string;
};

type PartnerApplication = {
  id: string;
  status: string;
  full_name: string;
  email: string;
  total_followers: number;
  campaign_interests: string[] | null;
  review_due_at: string | null;
  application_submitted_at: string | null;
  created_at: string;
  partner_campaigns?: Pick<Campaign, 'name'> | Pick<Campaign, 'name'>[] | null;
};

type EventMetrics = {
  visitors: number;
  conversions: number;
  monthlyEarnings: number;
};

const db = supabase as any;

const COPY = {
  en: {
    eyebrow: 'Partner portal',
    title: 'Your campaigns, customers, and payouts',
    description: 'A clean view of the people you brought in, the customers who converted, and the money paid or ready for you.',
    refresh: 'Refresh',
    emptyTitle: 'No approved partner campaigns yet',
    emptyDescription: 'Once Baise approves you for a campaign, your link, QR code, customer conversions, payouts, and receipts will appear here.',
    apply: 'Apply for influencer campaigns',
    stats: {
      visitors: 'Website views',
      visitorsDetail: 'People who reached Baise through your link, QR code, or identifier.',
      conversions: 'Customers converted',
      conversionsDetail: 'Customers credited to your campaign tracking.',
      monthly: 'This month',
      monthlyDetail: 'Approved partner earnings for the current month.',
      lifetime: 'Lifetime earnings',
      lifetimeDetail: 'Total partner earnings credited to your account.',
    },
    campaignsTitle: 'My campaigns',
    campaignsDescription: 'Approved campaigns you can share right now.',
    selected: 'Selected',
    approved: 'Approved',
    pending: 'Pending',
    paused: 'Paused',
    rejected: 'Rejected',
    completed: 'Completed',
    shareTitle: 'Share kit',
    shareDescription: 'Use your link, QR code, or custom identifier so visitors and new customers are credited to you.',
    customCode: 'Custom identifier',
    assignedCode: 'Assigned identifier',
    trackingLink: 'Tracking link',
    qrCode: 'QR code',
    saveCode: 'Save',
    copyCode: 'Copy code',
    copyLink: 'Copy link',
    openLink: 'Open',
    downloadQr: 'Download QR',
    payoutTitle: 'Payouts',
    payoutDescription: 'What you were paid, when you were paid, and the receipt for each payout.',
    receiptTitle: 'Receipt center',
    receiptDescription: 'Generate monthly, quarterly, or annual partner payout receipts for your records.',
    generateMonthly: 'Monthly receipt',
    generateQuarterly: 'Quarterly receipt',
    generateAnnual: 'Annual receipt',
    recentReceipts: 'Recent receipts',
    noPayouts: 'No payouts have been recorded yet.',
    noReceipts: 'No partner receipts generated yet.',
    campaign: 'Campaign',
    datePaid: 'Date paid',
    period: 'Period',
    amount: 'Amount',
    status: 'Status',
    receipt: 'Receipt',
    download: 'Download',
    copied: 'Copied',
    saved: 'Partner identifier saved',
    saveError: 'Unable to save partner identifier',
    receiptCreated: 'Receipt generated',
    receiptError: 'Unable to generate receipt',
    loadError: 'Partner dashboard data is not available yet.',
    noDate: 'Not yet',
    applicationsTitle: 'Application status',
    applicationsDescription: 'Applications submitted from partner and influencer pages stay connected to this portal.',
    applicationReview: 'Review due',
    completeApplication: 'Complete application',
  },
  es: {
    eyebrow: 'Portal de socios',
    title: 'Tus campanas, clientes y pagos',
    description: 'Una vista simple de las personas que trajiste, los clientes convertidos y el dinero pagado o listo para ti.',
    refresh: 'Actualizar',
    emptyTitle: 'Aun no hay campanas aprobadas',
    emptyDescription: 'Cuando Baise te apruebe para una campana, veras aqui tu enlace, QR, conversiones, pagos y recibos.',
    apply: 'Aplicar a campanas de influencers',
    stats: {
      visitors: 'Visitas al sitio',
      visitorsDetail: 'Personas que llegaron a Baise con tu enlace, QR o identificador.',
      conversions: 'Clientes convertidos',
      conversionsDetail: 'Clientes acreditados a tu campana.',
      monthly: 'Este mes',
      monthlyDetail: 'Ganancias de socio aprobadas en el mes actual.',
      lifetime: 'Ganancias totales',
      lifetimeDetail: 'Total acreditado a tu cuenta de socio.',
    },
    campaignsTitle: 'Mis campanas',
    campaignsDescription: 'Campanas aprobadas que puedes compartir ahora.',
    selected: 'Seleccionada',
    approved: 'Aprobada',
    pending: 'Pendiente',
    paused: 'Pausada',
    rejected: 'Rechazada',
    completed: 'Completada',
    shareTitle: 'Kit para compartir',
    shareDescription: 'Usa tu enlace, QR o identificador para acreditar visitas y nuevos clientes.',
    customCode: 'Identificador personalizado',
    assignedCode: 'Identificador asignado',
    trackingLink: 'Enlace de seguimiento',
    qrCode: 'Codigo QR',
    saveCode: 'Guardar',
    copyCode: 'Copiar codigo',
    copyLink: 'Copiar enlace',
    openLink: 'Abrir',
    downloadQr: 'Descargar QR',
    payoutTitle: 'Pagos',
    payoutDescription: 'Lo que recibiste, cuando se pago y el recibo de cada pago.',
    receiptTitle: 'Centro de recibos',
    receiptDescription: 'Genera recibos mensuales, trimestrales o anuales de pagos de socio.',
    generateMonthly: 'Recibo mensual',
    generateQuarterly: 'Recibo trimestral',
    generateAnnual: 'Recibo anual',
    recentReceipts: 'Recibos recientes',
    noPayouts: 'Aun no hay pagos registrados.',
    noReceipts: 'Aun no hay recibos generados.',
    campaign: 'Campana',
    datePaid: 'Fecha de pago',
    period: 'Periodo',
    amount: 'Monto',
    status: 'Estado',
    receipt: 'Recibo',
    download: 'Descargar',
    copied: 'Copiado',
    saved: 'Identificador de socio guardado',
    saveError: 'No se pudo guardar el identificador',
    receiptCreated: 'Recibo generado',
    receiptError: 'No se pudo generar el recibo',
    loadError: 'Los datos del portal de socios aun no estan disponibles.',
    noDate: 'Aun no',
    applicationsTitle: 'Estado de solicitud',
    applicationsDescription: 'Las solicitudes de paginas de socios e influencers quedan conectadas a este portal.',
    applicationReview: 'Revision antes de',
    completeApplication: 'Completar solicitud',
  },
  pt: {
    eyebrow: 'Portal de parceiros',
    title: 'Suas campanhas, clientes e pagamentos',
    description: 'Uma visao simples das pessoas que voce trouxe, dos clientes convertidos e do dinheiro pago ou pronto para voce.',
    refresh: 'Atualizar',
    emptyTitle: 'Ainda nao ha campanhas aprovadas',
    emptyDescription: 'Quando a Baise aprovar voce para uma campanha, seu link, QR code, conversoes, pagamentos e recibos aparecerao aqui.',
    apply: 'Inscrever-se para campanhas de influenciadores',
    stats: {
      visitors: 'Visitas ao site',
      visitorsDetail: 'Pessoas que chegaram a Baise pelo seu link, QR code ou identificador.',
      conversions: 'Clientes convertidos',
      conversionsDetail: 'Clientes creditados ao rastreamento da sua campanha.',
      monthly: 'Este mes',
      monthlyDetail: 'Ganhos de parceiro aprovados no mes atual.',
      lifetime: 'Ganhos totais',
      lifetimeDetail: 'Total creditado a sua conta de parceiro.',
    },
    campaignsTitle: 'Minhas campanhas',
    campaignsDescription: 'Campanhas aprovadas que voce pode compartilhar agora.',
    selected: 'Selecionada',
    approved: 'Aprovada',
    pending: 'Pendente',
    paused: 'Pausada',
    rejected: 'Rejeitada',
    completed: 'Concluida',
    shareTitle: 'Kit de compartilhamento',
    shareDescription: 'Use seu link, QR code ou identificador para creditar visitas e novos clientes.',
    customCode: 'Identificador personalizado',
    assignedCode: 'Identificador atribuido',
    trackingLink: 'Link de rastreamento',
    qrCode: 'QR code',
    saveCode: 'Salvar',
    copyCode: 'Copiar codigo',
    copyLink: 'Copiar link',
    openLink: 'Abrir',
    downloadQr: 'Baixar QR',
    payoutTitle: 'Pagamentos',
    payoutDescription: 'O que voce recebeu, quando recebeu e o recibo de cada pagamento.',
    receiptTitle: 'Central de recibos',
    receiptDescription: 'Gere recibos mensais, trimestrais ou anuais dos pagamentos de parceiro.',
    generateMonthly: 'Recibo mensal',
    generateQuarterly: 'Recibo trimestral',
    generateAnnual: 'Recibo anual',
    recentReceipts: 'Recibos recentes',
    noPayouts: 'Ainda nao ha pagamentos registrados.',
    noReceipts: 'Ainda nao ha recibos gerados.',
    campaign: 'Campanha',
    datePaid: 'Data do pagamento',
    period: 'Periodo',
    amount: 'Valor',
    status: 'Status',
    receipt: 'Recibo',
    download: 'Baixar',
    copied: 'Copiado',
    saved: 'Identificador de parceiro salvo',
    saveError: 'Nao foi possivel salvar o identificador',
    receiptCreated: 'Recibo gerado',
    receiptError: 'Nao foi possivel gerar o recibo',
    loadError: 'Os dados do portal de parceiros ainda nao estao disponiveis.',
    noDate: 'Ainda nao',
    applicationsTitle: 'Status da inscricao',
    applicationsDescription: 'Inscricoes feitas nas paginas de parceiros e influenciadores ficam conectadas a este portal.',
    applicationReview: 'Revisao ate',
    completeApplication: 'Completar inscricao',
  },
} as const;

type PartnerCopy = typeof COPY.en;
type ReceiptPeriod = PartnerReceipt['period_type'];

const campaignStatusTone: Record<string, string> = {
  approved: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  lead: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
  submitted: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  under_review: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  waitlist: 'border-slate-500/25 bg-slate-500/10 text-slate-700',
  declined: 'border-destructive/25 bg-destructive/10 text-destructive',
  pending: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  paused: 'border-slate-500/25 bg-slate-500/10 text-slate-700',
  completed: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
  rejected: 'border-destructive/25 bg-destructive/10 text-destructive',
};

const payoutStatusTone: Record<string, string> = {
  paid: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700',
  scheduled: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
  processing: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
  failed: 'border-destructive/25 bg-destructive/10 text-destructive',
  void: 'border-slate-500/25 bg-slate-500/10 text-slate-700',
};

function getCampaign(membership: Membership): Campaign | null {
  const campaign = membership.partner_campaigns;
  if (Array.isArray(campaign)) return campaign[0] || null;
  return campaign || null;
}

function getPayoutCampaign(payout: PartnerPayout): Pick<Campaign, 'name'> | null {
  const campaign = payout.partner_campaigns;
  if (Array.isArray(campaign)) return campaign[0] || null;
  return campaign || null;
}

function formatCurrency(amount: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: amount >= 100 ? 0 : 2,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount || 0);
  } catch {
    return `${currency} ${(amount || 0).toFixed(2)}`;
  }
}

function formatDate(value: string | null, fallback: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

function formatPeriod(start: string, end: string, fallback: string) {
  if (!start && !end) return fallback;
  if (start === end) return formatDate(start, fallback);
  return `${formatDate(start, fallback)} - ${formatDate(end, fallback)}`;
}

function humanizeKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusLabel(copy: PartnerCopy, status: string) {
  switch (status) {
    case 'approved':
      return copy.approved;
    case 'pending':
      return copy.pending;
    case 'paused':
      return copy.paused;
    case 'rejected':
      return copy.rejected;
    case 'completed':
      return copy.completed;
    default:
      return humanizeKey(status);
  }
}

function getPeriodStart(period: Exclude<ReceiptPeriod, 'custom' | 'single'>) {
  const today = new Date();
  if (period === 'annual') {
    return new Date(Date.UTC(today.getFullYear(), 0, 1)).toISOString().slice(0, 10);
  }
  if (period === 'quarterly') {
    const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
    return new Date(Date.UTC(today.getFullYear(), quarterMonth, 1)).toISOString().slice(0, 10);
  }
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)).toISOString().slice(0, 10);
}

function isInCurrentMonth(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
}

function buildReceiptHtml({
  brand,
  receiptNumber,
  period,
  amount,
  currency,
  generatedAt,
}: {
  brand: string;
  receiptNumber: string;
  period: string;
  amount: number;
  currency: string;
  generatedAt: string;
}) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${brand} Partner Receipt ${receiptNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111827; margin: 40px; }
      .receipt { max-width: 720px; border: 1px solid #e5e7eb; padding: 28px; border-radius: 12px; }
      .muted { color: #6b7280; }
      .row { display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding: 14px 0; }
      .total { font-size: 26px; font-weight: 700; }
      footer { margin-top: 32px; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <main class="receipt">
      <p class="muted">Partner payout receipt</p>
      <h1>${brand}</h1>
      <div class="row"><strong>Receipt</strong><span>${receiptNumber}</span></div>
      <div class="row"><strong>Period</strong><span>${period}</span></div>
      <div class="row"><strong>Generated</strong><span>${generatedAt}</span></div>
      <div class="row"><strong>Partner earnings</strong><span class="total">${formatCurrency(amount, currency)}</span></div>
      <footer>Generated by ${brand}. This receipt summarizes partner payouts credited through the Baise partner program.</footer>
    </main>
  </body>
</html>`;
}

export function PartnerCampaignCommandCenter() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const locale = getLocaleKey(i18n.resolvedLanguage || i18n.language);
  const copy = COPY[locale] as PartnerCopy;
  const appKey = getBaiseAppKey();
  const brandName = appKey === 'medical' ? 'Medical Baise' : appKey === 'legal' ? 'Legal Baise' : 'Casa Baise';
  const qrRef = useRef<HTMLDivElement>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayout[]>([]);
  const [receipts, setReceipts] = useState<PartnerReceipt[]>([]);
  const [eventMetrics, setEventMetrics] = useState<EventMetrics>({ visitors: 0, conversions: 0, monthlyEarnings: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState<ReceiptPeriod | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedMembership = useMemo(() => {
    return memberships.find((membership) => membership.id === selectedId) || memberships[0] || null;
  }, [memberships, selectedId]);

  const selectedCampaign = selectedMembership ? getCampaign(selectedMembership) : null;
  const selectedCode = selectedMembership?.custom_code || selectedMembership?.partner_code || '';
  const trackingUrl = selectedMembership?.tracking_url || `${getBaiseAppUrl()}/discover?partner=${selectedCode}`;
  const qrPayload = selectedMembership?.qr_payload || trackingUrl;
  const selectedCurrency = selectedCampaign?.currency || payouts[0]?.currency || 'USD';

  const paidPayouts = useMemo(() => payouts.filter((payout) => payout.status === 'paid'), [payouts]);

  const stats = useMemo(() => {
    const membershipConversions = memberships.reduce((total, membership) => total + (membership.conversions_count || 0), 0);
    const membershipEarnings = memberships.reduce((total, membership) => total + (membership.partner_profit || 0), 0);
    const monthlyPaid = paidPayouts
      .filter((payout) => isInCurrentMonth(payout.paid_at || payout.payout_period_end))
      .reduce((total, payout) => total + (payout.amount || 0), 0);
    const lifetimePaid = paidPayouts.reduce((total, payout) => total + (payout.amount || 0), 0);

    return {
      visitors: eventMetrics.visitors || memberships.reduce((total, membership) => total + (membership.leads_count || 0), 0),
      conversions: eventMetrics.conversions || membershipConversions,
      monthlyEarnings: monthlyPaid || eventMetrics.monthlyEarnings,
      lifetimeEarnings: lifetimePaid || membershipEarnings,
    };
  }, [eventMetrics, memberships, paidPayouts]);

  const loadPartnerDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await db
        .from('partner_campaign_memberships')
        .select(`
          id,
          campaign_id,
          partner_user_id,
          status,
          partner_code,
          custom_code,
          landing_path,
          tracking_url,
          qr_payload,
          leads_count,
          conversions_count,
          partner_profit,
          last_lead_at,
          last_conversion_at,
          approved_at,
          created_at,
          partner_campaigns (
            id,
            app_key,
            name,
            slug,
            campaign_type,
            description,
            status,
            commission_type,
            commission_value,
            currency
          )
        `)
        .eq('partner_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data || []) as Membership[];
      setMemberships(records);
      setSelectedId((current) => (current && records.some((membership) => membership.id === current) ? current : records[0]?.id || null));

      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const [visitorResult, conversionResult, earningEventsResult, payoutResult, receiptResult, applicationResult] = await Promise.all([
        db
          .from('partner_campaign_events')
          .select('id', { count: 'exact', head: true })
          .eq('partner_user_id', user.id)
          .eq('event_type', 'click'),
        db
          .from('partner_campaign_events')
          .select('id', { count: 'exact', head: true })
          .eq('partner_user_id', user.id)
          .in('event_type', ['booking', 'conversion']),
        db
          .from('partner_campaign_events')
          .select('profit_amount')
          .eq('partner_user_id', user.id)
          .in('event_type', ['booking', 'conversion', 'payout'])
          .gte('occurred_at', monthStart),
        db
          .from('partner_campaign_payouts')
          .select(`
            id,
            campaign_id,
            membership_id,
            payout_period_start,
            payout_period_end,
            amount,
            currency,
            status,
            paid_at,
            payment_reference,
            receipt_number,
            partner_campaigns ( name )
          `)
          .eq('partner_user_id', user.id)
          .order('paid_at', { ascending: false, nullsFirst: false })
          .limit(12),
        db
          .from('partner_payout_receipts')
          .select('id, period_type, period_start, period_end, total_amount, currency, receipt_number, generated_at')
          .eq('partner_user_id', user.id)
          .order('generated_at', { ascending: false })
          .limit(8),
        db
          .from('partner_influencer_applications')
          .select(`
            id,
            status,
            full_name,
            email,
            total_followers,
            campaign_interests,
            review_due_at,
            application_submitted_at,
            created_at,
            partner_campaigns ( name )
          `)
          .eq('app_key', appKey)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (visitorResult.error) throw visitorResult.error;
      if (conversionResult.error) throw conversionResult.error;
      if (earningEventsResult.error) throw earningEventsResult.error;
      if (payoutResult.error) throw payoutResult.error;
      if (receiptResult.error) throw receiptResult.error;
      if (applicationResult.error) throw applicationResult.error;

      const monthlyEarnings = (earningEventsResult.data || []).reduce(
        (total: number, event: { profit_amount?: number }) => total + (event.profit_amount || 0),
        0,
      );

      setEventMetrics({
        visitors: visitorResult.count || 0,
        conversions: conversionResult.count || 0,
        monthlyEarnings,
      });
      setPayouts((payoutResult.data || []) as PartnerPayout[]);
      setReceipts((receiptResult.data || []) as PartnerReceipt[]);
      setApplications((applicationResult.data || []) as PartnerApplication[]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartnerDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (selectedMembership) {
      setCustomCode(selectedMembership.custom_code || selectedMembership.partner_code || '');
    }
  }, [selectedMembership?.id, selectedMembership?.custom_code, selectedMembership?.partner_code]);

  const copyToClipboard = async (value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    toast.success(copy.copied);
  };

  const saveCustomCode = async () => {
    if (!selectedMembership) return;

    setSaving(true);
    try {
      const { error } = await db.rpc('update_partner_campaign_code', {
        target_membership_id: selectedMembership.id,
        requested_code: customCode,
      });

      if (error) throw error;
      toast.success(copy.saved);
      await loadPartnerDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const generateReceipt = async (period: Exclude<ReceiptPeriod, 'custom' | 'single'>) => {
    setGeneratingReceipt(period);
    try {
      const { error } = await db.rpc('generate_partner_payout_receipt', {
        target_period_type: period,
        target_period_start: getPeriodStart(period),
      });

      if (error) throw error;
      toast.success(copy.receiptCreated);
      await loadPartnerDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : copy.receiptError);
    } finally {
      setGeneratingReceipt(null);
    }
  };

  const downloadQrCode = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg || !selectedCode) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const image = new Image();

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      const link = document.createElement('a');
      link.download = `baise-partner-${selectedCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const downloadReceipt = (receipt: PartnerReceipt) => {
    const html = buildReceiptHtml({
      brand: brandName,
      receiptNumber: receipt.receipt_number,
      period: formatPeriod(receipt.period_start, receipt.period_end, copy.noDate),
      amount: receipt.total_amount,
      currency: receipt.currency,
      generatedAt: formatDate(receipt.generated_at, copy.noDate),
    });
    triggerReceiptDownload(html, `${receipt.receipt_number}.html`);
  };

  const downloadPayoutReceipt = (payout: PartnerPayout) => {
    const html = buildReceiptHtml({
      brand: brandName,
      receiptNumber: payout.receipt_number,
      period: formatPeriod(payout.payout_period_start, payout.payout_period_end, copy.noDate),
      amount: payout.amount,
      currency: payout.currency,
      generatedAt: formatDate(payout.paid_at, copy.noDate),
    });
    triggerReceiptDownload(html, `${payout.receipt_number}.html`);
  };

  if (loading) {
    return (
      <section className="rounded-lg border bg-card p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="mt-3 text-sm text-muted-foreground">{copy.title}</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section id="partner-overview" className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="border-b bg-muted/30 px-4 py-5 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{copy.eyebrow}</span>
                <Badge variant="secondary" className="rounded-md">{brandName}</Badge>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy.description}</p>
            </div>
            <Button type="button" variant="outline" className="gap-2 self-start" onClick={loadPartnerDashboard}>
              <RefreshCcw className="h-4 w-4" />
              {copy.refresh}
            </Button>
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile icon={Users} label={copy.stats.visitors} value={stats.visitors} detail={copy.stats.visitorsDetail} />
          <MetricTile icon={Target} label={copy.stats.conversions} value={stats.conversions} detail={copy.stats.conversionsDetail} />
          <MetricTile icon={CalendarDays} label={copy.stats.monthly} value={formatCurrency(stats.monthlyEarnings, selectedCurrency)} detail={copy.stats.monthlyDetail} />
          <MetricTile icon={BadgeDollarSign} label={copy.stats.lifetime} value={formatCurrency(stats.lifetimeEarnings, selectedCurrency)} detail={copy.stats.lifetimeDetail} />
        </div>
      </section>

      {loadError && (
        <section className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-sm font-medium text-amber-800">{copy.loadError}</p>
          <p className="mt-1 text-xs text-amber-800/80">{loadError}</p>
        </section>
      )}

      {applications.length > 0 && (
        <ApplicationStatusPanel applications={applications} copy={copy} />
      )}

      {memberships.length === 0 ? (
        <EmptyState copy={copy} />
      ) : (
        <>
          <section id="partner-campaigns" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="border-b px-4 py-4 sm:px-5">
                <h2 className="font-semibold">{copy.campaignsTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{copy.campaignsDescription}</p>
              </div>
              <div className="overflow-x-auto p-4 sm:p-5">
                <div className="flex min-w-full gap-3">
                  {memberships.map((membership) => (
                    <CampaignCard
                      key={membership.id}
                      copy={copy}
                      membership={membership}
                      selected={selectedMembership?.id === membership.id}
                      onSelect={() => setSelectedId(membership.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-sky-500/10 p-2 text-sky-700">
                  <QrCode className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-semibold">{copy.shareTitle}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{copy.shareDescription}</p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="partner-code">{copy.customCode}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="partner-code"
                      value={customCode}
                      onChange={(event) => setCustomCode(event.target.value)}
                      disabled={selectedMembership?.status !== 'approved'}
                      className="font-mono uppercase"
                      maxLength={32}
                    />
                    <Button
                      type="button"
                      onClick={saveCustomCode}
                      disabled={saving || selectedMembership?.status !== 'approved' || customCode.trim().length < 4}
                      className="gap-2"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {copy.saveCode}
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border bg-muted/25 p-3">
                  <p className="text-xs font-medium text-muted-foreground">{copy.assignedCode}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate text-sm font-semibold">{selectedCode}</code>
                    <Button type="button" size="icon" variant="ghost" onClick={() => copyToClipboard(selectedCode)} aria-label={copy.copyCode}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border bg-muted/25 p-3">
                  <p className="text-xs font-medium text-muted-foreground">{copy.trackingLink}</p>
                  <p className="mt-2 break-all text-xs leading-5">{trackingUrl}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => copyToClipboard(trackingUrl)}>
                      <Copy className="h-4 w-4" />
                      {copy.copyLink}
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => window.open(trackingUrl, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="h-4 w-4" />
                      {copy.openLink}
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border bg-white p-4 text-center">
                  <div ref={qrRef} className="inline-flex rounded-md bg-white p-2">
                    <QRCodeSVG value={qrPayload} size={156} />
                  </div>
                  <Button type="button" variant="outline" size="sm" className="mt-3 w-full gap-2" onClick={downloadQrCode}>
                    <Download className="h-4 w-4" />
                    {copy.downloadQr}
                  </Button>
                </div>
              </div>
            </section>
          </section>

          <section id="partner-payouts" className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <h2 className="font-semibold">{copy.payoutTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{copy.payoutDescription}</p>
              </div>
              <WalletCards className="hidden h-5 w-5 text-muted-foreground sm:block" />
            </div>
            {payouts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">{copy.noPayouts}</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.datePaid}</TableHead>
                      <TableHead>{copy.campaign}</TableHead>
                      <TableHead>{copy.period}</TableHead>
                      <TableHead>{copy.amount}</TableHead>
                      <TableHead>{copy.status}</TableHead>
                      <TableHead className="text-right">{copy.receipt}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => {
                      const campaign = getPayoutCampaign(payout);
                      return (
                        <TableRow key={payout.id}>
                          <TableCell>{formatDate(payout.paid_at, copy.noDate)}</TableCell>
                          <TableCell className="font-medium">{campaign?.name || copy.campaign}</TableCell>
                          <TableCell>{formatPeriod(payout.payout_period_start, payout.payout_period_end, copy.noDate)}</TableCell>
                          <TableCell>{formatCurrency(payout.amount, payout.currency)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={payoutStatusTone[payout.status] || ''}>
                              {humanizeKey(payout.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => downloadPayoutReceipt(payout)}>
                              <Download className="h-4 w-4" />
                              {copy.download}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section id="partner-receipts" className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-lg border bg-card p-4 shadow-sm sm:p-5">
              <div className="flex items-start gap-3">
                <span className="rounded-md bg-primary/10 p-2 text-primary">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-semibold">{copy.receiptTitle}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{copy.receiptDescription}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                <Button type="button" variant="outline" className="justify-start gap-2" onClick={() => generateReceipt('monthly')} disabled={!!generatingReceipt}>
                  {generatingReceipt === 'monthly' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                  {copy.generateMonthly}
                </Button>
                <Button type="button" variant="outline" className="justify-start gap-2" onClick={() => generateReceipt('quarterly')} disabled={!!generatingReceipt}>
                  {generatingReceipt === 'quarterly' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                  {copy.generateQuarterly}
                </Button>
                <Button type="button" variant="outline" className="justify-start gap-2" onClick={() => generateReceipt('annual')} disabled={!!generatingReceipt}>
                  {generatingReceipt === 'annual' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
                  {copy.generateAnnual}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-card shadow-sm">
              <div className="border-b px-4 py-4 sm:px-5">
                <h2 className="font-semibold">{copy.recentReceipts}</h2>
              </div>
              {receipts.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">{copy.noReceipts}</div>
              ) : (
                <div className="divide-y">
                  {receipts.map((receipt) => (
                    <div key={receipt.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div>
                        <p className="font-medium">{receipt.receipt_number}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {humanizeKey(receipt.period_type)} - {formatPeriod(receipt.period_start, receipt.period_end, copy.noDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
                        <span className="font-semibold tabular-nums">{formatCurrency(receipt.total_amount, receipt.currency)}</span>
                        <Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => downloadReceipt(receipt)}>
                          <Download className="h-4 w-4" />
                          {copy.download}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function triggerReceiptDownload(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function MetricTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="min-h-[126px] bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

function CampaignCard({
  copy,
  membership,
  selected,
  onSelect,
}: {
  copy: PartnerCopy;
  membership: Membership;
  selected: boolean;
  onSelect: () => void;
}) {
  const campaign = getCampaign(membership);
  const campaignCode = membership.custom_code || membership.partner_code;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'min-h-[206px] w-[292px] shrink-0 rounded-lg border bg-background p-4 text-left transition hover:border-primary/50 hover:bg-muted/30',
        selected && 'border-primary shadow-sm ring-1 ring-primary/20',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md bg-primary/10 p-2 text-primary">
          {campaign?.campaign_type === 'influencer' ? <Megaphone className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </span>
        <Badge variant="outline" className={campaignStatusTone[membership.status] || ''}>
          {getStatusLabel(copy, membership.status)}
        </Badge>
      </div>
      <p className="mt-4 line-clamp-2 text-base font-semibold">{campaign?.name || copy.campaignsTitle}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{campaign?.description || copy.shareDescription}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <MiniStat label={copy.stats.conversions} value={membership.conversions_count || 0} />
        <MiniStat label={copy.assignedCode} value={campaignCode} />
      </div>
      {selected && (
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {copy.selected}
        </div>
      )}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="min-w-0 rounded-md bg-muted/50 p-2">
      <span className="block truncate font-semibold tabular-nums">{value}</span>
      <span className="mt-0.5 block truncate text-muted-foreground">{label}</span>
    </span>
  );
}

function ApplicationStatusPanel({
  applications,
  copy,
}: {
  applications: PartnerApplication[];
  copy: PartnerCopy;
}) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 className="font-semibold">{copy.applicationsTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.applicationsDescription}</p>
        </div>
        <FileText className="hidden h-5 w-5 text-muted-foreground sm:block" />
      </div>
      <div className="divide-y">
        {applications.map((application) => {
          const campaign = getPayoutCampaign({ partner_campaigns: application.partner_campaigns } as PartnerPayout);
          const needsFullApplication = application.status === 'lead';
          return (
            <div key={application.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{campaign?.name || copy.apply}</p>
                  <Badge variant="outline" className={campaignStatusTone[application.status] || ''}>
                    {getStatusLabel(copy, application.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.applicationReview}: {formatDate(application.review_due_at, copy.noDate)}
                </p>
              </div>
              {needsFullApplication ? (
                <Button asChild size="sm" className="gap-2 sm:self-center">
                  <Link to="/influencer-application">
                    {copy.completeApplication}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EmptyState({ copy }: { copy: PartnerCopy }) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex rounded-md bg-primary/10 p-2 text-primary">
            <Share2 className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-semibold">{copy.emptyTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.emptyDescription}</p>
          <Button asChild className="mt-4">
            <Link to="/influencer-partners">{copy.apply}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
