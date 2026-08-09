import { useEffect, useMemo, useState } from 'react';
import type { TFunction } from 'i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BadgeDollarSign,
  Calculator,
  CreditCard,
  FileText,
  History,
  Landmark,
  Plus,
  Receipt,
  RefreshCcw,
  Send,
  ShieldCheck,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { CheckoutAddOns, DEFAULT_ADDONS } from '@/components/checkout/CheckoutAddOns';
import { ClientTransactionHistory } from '@/components/payments/ClientTransactionHistory';
import { ProviderPaymentsWorkspace } from '@/components/provider/ProviderPaymentsWorkspace';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice, getUserCurrency } from '@/lib/currency';
import { toast } from 'sonner';

type PosPaymentMethod = 'hosted_checkout' | 'card' | 'wallet' | 'pix' | 'internal_balance' | 'superwall_stripe';
type RefundDestination = 'original_payment_method' | 'service_credit' | 'internal_balance';

const buildPosPaymentMethods = (t: TFunction): { value: PosPaymentMethod; label: string; helper: string }[] => [
  {
    value: 'hosted_checkout',
    label: t('paymentsPage.hostedCheckout', "Hosted checkout"),
    helper: t('paymentsPage.secureStripeHostedCheckout', "Secure Stripe-hosted checkout with eligible wallet options."),
  },
  {
    value: 'wallet',
    label: t('paymentsPage.applePayGooglePay', "Apple Pay / Google Pay"),
    helper: t('paymentsPage.walletReadyCheckoutWhen', "Wallet-ready checkout when enabled for the payment account."),
  },
  {
    value: 'superwall_stripe',
    label: t('paymentsPage.superwallStripe', "Superwall + Stripe"),
    helper: t('paymentsPage.inAppPaywallRoute', "In-app paywall route powered by Superwall with Stripe checkout, receipts, refunds, and ledger records."),
  },
  {
    value: 'pix',
    label: t('paymentsPage.pixCard', "Pix + card"),
    helper: t('paymentsPage.brazilFriendlyCheckoutWith', "Brazil-friendly checkout with Pix when enabled by the processor."),
  },
  {
    value: 'internal_balance',
    label: t('paymentsPage.internalBalance', "Internal balance"),
    helper: t('paymentsPage.recordAPaymentServiced', "Record a payment serviced from client credits or internal balance."),
  },
];

const buildAccountingFeatures = (t: TFunction) => [
  t('paymentsPage.uniqueInvoiceNumberAnd', "Unique invoice number and client ID for every transaction"),
  t('paymentsPage.providerServiceSubcontractorMileston', "Provider, service, subcontractor, milestone, and payment method links"),
  t('paymentsPage.dateTimestampServiceDescription', "Date, timestamp, service description, amount, refund, and credit trail"),
  t('paymentsPage.companyLogoSupportWith', "Company logo support with discreet Baise branding on receipt footer"),
  t('paymentsPage.monthlyMtdAnnualAnd', "Monthly, MTD, annual, and custom transaction export-ready data"),
];

export default function Payments() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const posPaymentMethods = useMemo(() => buildPosPaymentMethods(t), [t]);
  const accountingFeatures = useMemo(() => buildAccountingFeatures(t), [t]);

  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  const [posClientName, setPosClientName] = useState('');
  const [posClientEmail, setPosClientEmail] = useState('');
  const [posServiceDescription, setPosServiceDescription] = useState('');
  const [posAmount, setPosAmount] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PosPaymentMethod>('hosted_checkout');
  const [posReleaseBenchmark, setPosReleaseBenchmark] = useState('');
  const [posCollectedBySubcontractor, setPosCollectedBySubcontractor] = useState(false);
  const [isCreatingPosCheckout, setIsCreatingPosCheckout] = useState(false);

  const [refundTransactionId, setRefundTransactionId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundDestination, setRefundDestination] = useState<RefundDestination>('original_payment_method');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  useEffect(() => {
    const checkTier = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('providers')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.subscription_tier) {
        setSubscriptionTier(data.subscription_tier);
      }
    };

    checkTier();
  }, [user]);

  useEffect(() => {
    const invoice = searchParams.get('invoice');
    if (searchParams.get('pos_success') === 'true' && invoice) {
      toast.success(`POS checkout completed for ${invoice}`);
    }
    if (searchParams.get('pos_canceled') === 'true' && invoice) {
      toast.info(`POS checkout canceled for ${invoice}`);
    }
  }, [searchParams]);

  const isPro = ['pro', 'elite', 'enterprise'].includes(subscriptionTier);
  const predefinedAmounts = [50, 100, 200, 500];

  const posInvoicePreview = useMemo(() => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `INV-${date}-AUTO`;
  }, []);

  const activePosMethod = posPaymentMethods.find((method) => method.value === posPaymentMethod);

  const handleAddOnChange = (addOnId: string, selected: boolean) => {
    if (selected) {
      setSelectedAddOns((prev) => [...prev, addOnId]);
    } else {
      setSelectedAddOns((prev) => prev.filter((id) => id !== addOnId));
    }
  };

  const handleAddFunds = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast.error(t('payments.enterValidAmount', 'Please enter a valid amount'));
      return;
    }
    toast.success(t('payments.fundsAdded', 'Funds added successfully!'));
    setShowAddFunds(false);
    setFundAmount('');
  };

  const handleAddPaymentMethod = () => {
    toast.info(
      t(
        'payments.useStripePortal',
        t('paymentsPage.paymentMethodsAreManaged', "Payment methods are managed through our secure payment processor."),
      ),
    );
    setShowAddPayment(false);
  };

  const handleCreatePosCheckout = async () => {
    const amount = Number(posAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid POS amount.');
      return;
    }

    if (posServiceDescription.trim().length < 3) {
      toast.error('Add a service description for the invoice.');
      return;
    }

    setIsCreatingPosCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pos-checkout', {
        body: {
          amount,
          currency: 'brl',
          clientName: posClientName || undefined,
          clientEmail: posClientEmail || undefined,
          serviceDescription: posServiceDescription,
          paymentMethod: posPaymentMethod,
          releaseBenchmark: posReleaseBenchmark || undefined,
          collectedBySubcontractor: posCollectedBySubcontractor,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      toast.success(`Invoice ${data?.invoiceNumber || posInvoicePreview} recorded for internal balance processing.`);
      setPosAmount('');
      setPosClientName('');
      setPosClientEmail('');
      setPosServiceDescription('');
      setPosReleaseBenchmark('');
      setPosCollectedBySubcontractor(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create POS checkout.';
      toast.error(message);
    } finally {
      setIsCreatingPosCheckout(false);
    }
  };

  const handleProcessRefundOrCredit = async () => {
    if (!refundTransactionId.trim()) {
      toast.error('Enter the original transaction ID.');
      return;
    }

    const amount = refundAmount ? Number(refundAmount) : undefined;
    if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
      toast.error('Enter a valid refund amount or leave it blank for full adjustment.');
      return;
    }

    setIsProcessingRefund(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-refund-or-credit', {
        body: {
          transactionId: refundTransactionId.trim(),
          amount,
          destination: refundDestination,
          reason: refundReason || undefined,
        },
      });

      if (error) throw error;

      toast.success(`Adjustment ${data?.adjustmentId || ''} ${data?.status || 'created'}.`);
      setRefundTransactionId('');
      setRefundAmount('');
      setRefundReason('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process refund or credit.';
      toast.error(message);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-muted-foreground">{t('auth.loginRequired', 'Please sign in to access payments')}</p>
          <Button onClick={() => navigate('/auth')}>{t('auth.signIn', 'Sign In')}</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('profile.payments')} - Baise</title>
      </Helmet>
      <AppLayout>
        <div className="mx-auto max-w-6xl px-4 py-6 pb-24">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{t('profile.payments')}</h1>
                <p className="text-sm text-muted-foreground">{t('paymentsPage.posCheckoutRefundsInternal', "POS checkout, refunds, internal balance, invoices, and provider accounting.")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />{t('paymentsPage.superwallStripe', "Superwall + Stripe")}</Badge>
              <Badge variant="secondary" className="gap-1">
                <Receipt className="h-3.5 w-3.5" />{t('paymentsPage.invoiceIds', "Invoice IDs")}</Badge>
              <Badge variant="secondary" className="gap-1">
                <UsersRound className="h-3.5 w-3.5" />{t('paymentsPage.subcontractors', "Subcontractors")}</Badge>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-6">
              <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                <CardContent className="pt-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Wallet className="h-8 w-8" />
                    <div>
                      <p className="text-sm opacity-90">{t('payments.balance')}</p>
                      <p className="text-3xl font-bold">{formatPrice(profile?.credits_balance || 0)}</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => setShowAddFunds(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('payments.addFunds')}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" />
                    {t('payments.paymentMethods')}
                  </CardTitle>
                  <CardDescription>{t('paymentsPage.cardPixApplePay', "Card, Pix, Apple Pay, Google Pay, Superwall paywalls, and internal balance workflows are handled through secure checkout rails.")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {['Visa', 'Mastercard', 'Amex', 'Discover', 'Apple Pay', 'Google Pay', 'Pix', 'Superwall', 'Stripe', 'Internal'].map((method) => (
                      <div key={method} className="rounded-lg border border-border bg-muted/40 p-3 text-center text-xs font-bold">
                        {method}
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => setShowAddPayment(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('payments.addPaymentMethod')}
                  </Button>
                </CardContent>
              </Card>

              <CheckoutAddOns
                addOns={DEFAULT_ADDONS}
                selectedAddOns={selectedAddOns}
                onAddOnChange={handleAddOnChange}
                isPro={isPro}
              />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <RefreshCcw className="h-4 w-4" />{t('paymentsPage.refundOrServiceCredit', "Refund or service credit")}</CardTitle>
                  <CardDescription>{t('paymentsPage.refundTheOriginalPayment', "Refund the original payment where possible, or credit the client account for future service.")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="refund-transaction">{t('paymentsPage.originalTransactionId', "Original transaction ID")}</Label>
                    <Input
                      id="refund-transaction"
                      value={refundTransactionId}
                      onChange={(event) => setRefundTransactionId(event.target.value)}
                      placeholder="provider_payment_transactions.id"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="refund-amount">Amount</Label>
                      <Input
                        id="refund-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={refundAmount}
                        onChange={(event) => setRefundAmount(event.target.value)}
                        placeholder={t('paymentsPage.leaveBlankForFull', "Leave blank for full")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('paymentsPage.destination', "Destination")}</Label>
                      <Select value={refundDestination} onValueChange={(value) => setRefundDestination(value as RefundDestination)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original_payment_method">{t('paymentsPage.originalPaymentMethod', "Original payment method")}</SelectItem>
                          <SelectItem value="service_credit">{t('paymentsPage.serviceCredit', "Service credit")}</SelectItem>
                          <SelectItem value="internal_balance">{t('paymentsPage.internalBalance', "Internal balance")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refund-reason">Reason</Label>
                    <Textarea
                      id="refund-reason"
                      value={refundReason}
                      onChange={(event) => setRefundReason(event.target.value)}
                      placeholder={t('paymentsPage.optionalAccountingNote', "Optional accounting note")}
                    />
                  </div>
                  <Button onClick={handleProcessRefundOrCredit} disabled={isProcessingRefund} className="w-full">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {isProcessingRefund ? 'Processing adjustment...' : 'Process refund or credit'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BadgeDollarSign className="h-5 w-5 text-primary" />{t('paymentsPage.providerPosCheckout', "Provider POS checkout")}</CardTitle>
                  <CardDescription>{t('paymentsPage.createABrandedInvoice', "Create a branded invoice, client ID, ledger entry, and hosted payment session for on-site or remote collection.")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pos-client-name">{t('paymentsPage.clientName', "Client name")}</Label>
                      <Input
                        id="pos-client-name"
                        value={posClientName}
                        onChange={(event) => setPosClientName(event.target.value)}
                        placeholder={t('paymentsPage.clientOrCompany', "Client or company")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pos-client-email">{t('paymentsPage.clientEmail', "Client email")}</Label>
                      <Input
                        id="pos-client-email"
                        type="email"
                        value={posClientEmail}
                        onChange={(event) => setPosClientEmail(event.target.value)}
                        placeholder="client@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pos-service">{t('paymentsPage.serviceDescription', "Service description")}</Label>
                    <Textarea
                      id="pos-service"
                      value={posServiceDescription}
                      onChange={(event) => setPosServiceDescription(event.target.value)}
                      placeholder={t('paymentsPage.describeTheServiceMaterials', "Describe the service, materials, milestone, or on-site payment.")}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pos-amount">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getUserCurrency()}</span>
                        <Input
                          id="pos-amount"
                          className="pl-12"
                          type="number"
                          min="0"
                          step="0.01"
                          value={posAmount}
                          onChange={(event) => setPosAmount(event.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('paymentsPage.paymentRoute', "Payment route")}</Label>
                      <Select value={posPaymentMethod} onValueChange={(value) => setPosPaymentMethod(value as PosPaymentMethod)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {posPaymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{activePosMethod?.label}</p>
                    <p>{activePosMethod?.helper}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pos-release">{t('paymentsPage.releaseBenchmark', "Release benchmark")}</Label>
                    <Input
                      id="pos-release"
                      value={posReleaseBenchmark}
                      onChange={(event) => setPosReleaseBenchmark(event.target.value)}
                      placeholder={t('paymentsPage.exampleRoughInspectionApproved', "Example: rough inspection approved, materials delivered, final walkthrough")}
                    />
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
                    <Checkbox
                      checked={posCollectedBySubcontractor}
                      onCheckedChange={(checked) => setPosCollectedBySubcontractor(Boolean(checked))}
                    />
                    <span>
                      <span className="block font-medium">{t('paymentsPage.collectedOnSiteBy', "Collected on site by subcontractor")}</span>
                      <span className="block text-muted-foreground">{t('paymentsPage.customerFacingInvoiceKeeps', "Customer-facing invoice keeps contractor branding while the ledger records the subcontractor collection route.")}</span>
                    </span>
                  </label>

                  <div className="grid gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice</p>
                      <p className="text-sm font-semibold">{posInvoicePreview}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Client ID</p>
                      <p className="text-sm font-semibold">{t('paymentsPage.clientAuto', "CLIENT-AUTO")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('paymentsPage.baiseFooter', "Baise footer")}</p>
                      <p className="text-sm font-semibold">Discreet</p>
                    </div>
                  </div>

                  <Button onClick={handleCreatePosCheckout} disabled={isCreatingPosCheckout} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    {isCreatingPosCheckout ? 'Creating checkout...' : 'Create POS checkout'}
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <UsersRound className="h-4 w-4" />{t('paymentsPage.subcontractorAccounting', "Subcontractor accounting")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{t('paymentsPage.assignSubcontractorsCollectPayment', "Assign subcontractors, collect payment without exposing the back-office role, and release balances against agreed benchmarks.")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Scope', 'Collection alias', 'Held funds', 'Release rule'].map((item) => (
                        <div key={item} className="rounded-lg border border-border p-3 font-medium text-foreground">
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Landmark className="h-4 w-4" />{t('paymentsPage.booksAndLedger', "Books and ledger")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <p>{t('paymentsPage.eachPaymentActionCreates', "Each payment action creates accounting records for provider balance, pending funds, credits, refunds, and subcontractor releases.")}</p>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/payouts')}>{t('paymentsPage.managePayoutMethods', "Manage payout methods")}</Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calculator className="h-4 w-4" />{t('paymentsPage.completeInvoiceRequirements', "Complete invoice requirements")}</CardTitle>
                  <CardDescription>{t('paymentsPage.builtForProperAccounting', "Built for proper accounting by provider, service, client, subcontractor, and transaction.")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {accountingFeatures.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-sm">
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />{t('paymentsPage.providerRecords', "Provider records")}</CardTitle>
                  <CardDescription>{t('paymentsPage.fullInvoicesReceiptsExports', "Full invoices, receipts, exports, flexible plans, and transaction filters are available in the provider workspace below.")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => document.getElementById('provider-payment-workspace')?.scrollIntoView({ behavior: 'smooth' })}>{t('paymentsPage.openProviderPaymentWorkspace', "Open provider payment workspace")}</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <ClientTransactionHistory />
          </div>

          <div id="provider-payment-workspace" className="mt-6">
            <ProviderPaymentsWorkspace />
          </div>
        </div>

        <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {t('payments.addFunds')}
              </DialogTitle>
              <DialogDescription>
                {t('payments.addFundsDescription', 'Add credits to your account balance')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {predefinedAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant={fundAmount === String(amount) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFundAmount(String(amount))}
                  >
                    {formatPrice(amount)}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-amount">{t('payments.customAmount', 'Custom Amount')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getUserCurrency()}</span>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="0.00"
                    value={fundAmount}
                    onChange={(event) => setFundAmount(event.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>
              <Button onClick={handleAddFunds} className="w-full">
                {t('payments.addFundsButton', 'Add {{amount}} to Balance', {
                  amount: formatPrice(Number(fundAmount) || 0),
                })}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('payments.addPaymentMethod')}
              </DialogTitle>
              <DialogDescription>
                {t('payments.addPaymentDescription', 'Add a new credit, debit, wallet, or Pix-enabled method')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('paymentsPage.cardAndWalletDetails', "Card and wallet details are collected directly by the PCI-compliant processor. Baise stores accounting records, invoice IDs, payment status, and ledger references, not raw card details.")}</p>
              <Button onClick={handleAddPaymentMethod} className="w-full">
                {t('payments.addCard', 'Open secure payment setup')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
