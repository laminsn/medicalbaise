import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Users, Percent, Loader2, Send } from 'lucide-react';

export function AdminPromoManager() {
  const { t } = useTranslation();
  const [targetEmail, setTargetEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [description, setDescription] = useState('');
  const [applying, setApplying] = useState(false);

  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkApplying, setBulkApplying] = useState(false);

  const applyCreditBonus = async () => {
    if (!targetEmail.trim() || !creditAmount) return;
    setApplying(true);

    const { data: user, error: findErr } = await supabase
      .from('profiles')
      .select('user_id, first_name, credits_balance')
      .or(`email.ilike.%${targetEmail}%,handle.ilike.%${targetEmail}%`)
      .limit(1)
      .maybeSingle();

    if (findErr || !user) {
      toast.error(t('admin.userNotFound'));
      setApplying(false);
      return;
    }

    const bonus = parseFloat(creditAmount);
    if (isNaN(bonus) || bonus <= 0) {
      toast.error(t('admin.invalidAmount'));
      setApplying(false);
      return;
    }

    const newBalance = (user.credits_balance || 0) + bonus;

    const { error } = await supabase
      .from('profiles')
      .update({ credits_balance: newBalance })
      .eq('user_id', user.user_id);

    if (error) {
      toast.error(t('admin.errorApplyingBonus'));
    } else {
      toast.success(t('admin.bonusApplied', {
        amount: bonus,
        name: user.first_name || targetEmail,
        balance: newBalance,
      }));
      setTargetEmail('');
      setCreditAmount('');
      setDescription('');
    }
    setApplying(false);
  };

  const applyBulkCredits = async () => {
    if (!bulkAmount) return;
    setBulkApplying(true);

    const bonus = parseFloat(bulkAmount);
    if (isNaN(bonus) || bonus <= 0) {
      toast.error(t('admin.invalidAmount'));
      setBulkApplying(false);
      return;
    }

    const { data: allUsers, error: fetchErr } = await supabase
      .from('profiles')
      .select('user_id, credits_balance');

    if (fetchErr || !allUsers) {
      toast.error(t('admin.errorLoading'));
      setBulkApplying(false);
      return;
    }

    let successCount = 0;
    for (const u of allUsers) {
      const newBal = (u.credits_balance || 0) + bonus;
      const { error } = await supabase
        .from('profiles')
        .update({ credits_balance: newBal })
        .eq('user_id', u.user_id);
      if (!error) successCount++;
    }

    toast.success(t('admin.bulkApplied', { amount: bonus, count: successCount }));
    setBulkAmount('');
    setBulkApplying(false);
  };

  return (
    <div className="space-y-4">
      {/* Individual Promo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            {t('admin.individualPromo')}
          </CardTitle>
          <CardDescription>
            {t('admin.individualPromoDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{t('admin.userEmailHandle')}</Label>
            <Input
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="user@email.com or @handle"
            />
          </div>

          <div className="space-y-1">
            <Label>{t('admin.creditAmount')}</Label>
            <Input
              type="number"
              min="1"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="50"
            />
          </div>

          <div className="space-y-1">
            <Label>{t('admin.descriptionReason')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin.descriptionPlaceholder')}
              rows={2}
              maxLength={500}
            />
          </div>

          <Button onClick={applyCreditBonus} disabled={applying || !targetEmail || !creditAmount} className="w-full">
            {applying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {t('admin.applyPromoCredit')}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Promo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            {t('admin.bulkBonus')}
          </CardTitle>
          <CardDescription>
            {t('admin.bulkBonusDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{t('admin.bonusPerUser')}</Label>
            <Input
              type="number"
              min="1"
              value={bulkAmount}
              onChange={(e) => setBulkAmount(e.target.value)}
              placeholder="10"
            />
          </div>

          <Button
            onClick={applyBulkCredits}
            disabled={bulkApplying || !bulkAmount}
            variant="secondary"
            className="w-full"
          >
            {bulkApplying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Gift className="h-4 w-4 mr-2" />}
            {t('admin.applyToAll')}
          </Button>
        </CardContent>
      </Card>

      {/* Partner Perks Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-5 w-5 text-green-500" />
            {t('admin.referralPartnerPerks')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{t('admin.customerReferralTiers')}</p>
              <ul className="text-muted-foreground mt-1 space-y-0.5">
                <li>• R$20 per referral</li>
                <li>• 5 referrals → R$50 bonus</li>
                <li>• 10 referrals → R$150 bonus + Featured Badge</li>
                <li>• 20 referrals → R$400 bonus + VIP 6 months</li>
                <li>• 50 referrals → R$1,500 bonus + Lifetime VIP</li>
              </ul>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{t('admin.providerReferralTiers')}</p>
              <ul className="text-muted-foreground mt-1 space-y-0.5">
                <li>• 3 referrals → R$100 + 1 free month</li>
                <li>• 5 referrals → R$300 + 2 free months</li>
                <li>• 10 referrals → R$800 + 3 free months Elite</li>
                <li>• 20 referrals → R$2,000 + 6 free months Enterprise</li>
              </ul>
            </div>
            <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: t('admin.partnerNote') }} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
