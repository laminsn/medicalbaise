import { useState, useEffect } from 'react';
import { formatPrice, getUserCurrency } from '@/lib/currency';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CreditCard, Plus, History, Wallet } from 'lucide-react';
import { CheckoutAddOns, DEFAULT_ADDONS, AddOn } from '@/components/checkout/CheckoutAddOns';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Payments() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');

  // Check user's subscription tier
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

  const isPro = ['pro', 'elite', 'enterprise'].includes(subscriptionTier);

  const handleAddOnChange = (addOnId: string, selected: boolean) => {
    if (selected) {
      setSelectedAddOns(prev => [...prev, addOnId]);
    } else {
      setSelectedAddOns(prev => prev.filter(id => id !== addOnId));
    }
  };

  const addOnsTotal = DEFAULT_ADDONS
    .filter(addon => selectedAddOns.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);

  if (!user) {
    navigate('/auth');
    return null;
  }

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
    // Payment method collection must be handled via Stripe Elements or
    // a PCI-compliant payment processor. Raw card data must never be
    // stored in application state or transmitted to our servers.
    toast.info(t('payments.stripeRedirect', 'You will be redirected to our secure payment processor.'));
    setShowAddPayment(false);
  };

  const predefinedAmounts = [50, 100, 200, 500];

  return (
    <>
      <Helmet>
        <title>{t('profile.payments')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('profile.payments')}</h1>
          </div>

          <div className="space-y-6">
            {/* Balance */}
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Wallet className="h-8 w-8" />
                  <div>
                    <p className="text-sm opacity-90">{t('payments.balance')}</p>
                    <p className="text-3xl font-bold">{formatPrice(profile?.credits_balance || 0)}</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setShowAddFunds(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('payments.addFunds')}
                </Button>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t('payments.paymentMethods')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-muted rounded flex items-center justify-center text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm font-medium">•••• 4242</p>
                      <p className="text-xs text-muted-foreground">{t('payments.expires')} 12/25</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{t('payments.default')}</Badge>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowAddPayment(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('payments.addPaymentMethod')}
                </Button>
              </CardContent>
            </Card>

            {/* Checkout Add-ons for Pro+ users */}
            <CheckoutAddOns
              addOns={DEFAULT_ADDONS}
              selectedAddOns={selectedAddOns}
              onAddOnChange={handleAddOnChange}
              isPro={isPro}
            />

            {/* Transaction History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4" />
                  {t('payments.transactionHistory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{t('payments.noTransactions')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('payments.subscription')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{t('pricing.free')}</p>
                    <p className="text-sm text-muted-foreground">{t('payments.currentPlan')}</p>
                  </div>
                  <Badge>{t('payments.active')}</Badge>
                </div>
                <Button onClick={() => navigate('/pricing')} className="w-full">
                  {t('payments.upgradePlan')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Funds Dialog */}
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
              <div className="grid grid-cols-4 gap-2">
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
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleAddFunds} className="w-full">
                {t('payments.addFundsButton', 'Add {{amount}} to Balance', { amount: formatPrice(Number(fundAmount) || 0) })}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Payment Method Dialog */}
        <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('payments.addPaymentMethod')}
              </DialogTitle>
              <DialogDescription>
                {t('payments.addPaymentDescription', 'Add a new credit or debit card')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('payments.securePaymentNote', 'For your security, card details are collected directly by our PCI-compliant payment processor. You will be securely redirected.')}
              </p>
              <Button onClick={handleAddPaymentMethod} className="w-full">
                {t('payments.addCard', 'Add Card')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
