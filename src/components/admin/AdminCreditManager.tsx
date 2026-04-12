import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { sanitizePostgrestValue } from '@/lib/sanitize';
import { toast } from 'sonner';
import { DollarSign, Plus, Minus, Search, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';

export function AdminCreditManager() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [reason, setReason] = useState('');
  const [applying, setApplying] = useState(false);

  const searchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFoundUser(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, email, phone, user_type, status, handle, bio, city, state, credits_balance, created_at, last_login_at, referral_code')
      .or(`email.ilike.%${sanitizePostgrestValue(searchEmail)}%,handle.ilike.%${sanitizePostgrestValue(searchEmail)}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error(t('admin.userNotFound'));
    } else {
      setFoundUser(data);
    }
    setSearching(false);
  };

  const applyCredit = async () => {
    if (!foundUser || !amount) return;
    setApplying(true);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error(t('admin.invalidAmount'));
      setApplying(false);
      return;
    }

    // Re-fetch current balance to avoid stale read-then-write race condition
    const { data: freshUser, error: fetchErr } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('user_id', foundUser.user_id)
      .single();

    if (fetchErr || !freshUser) {
      toast.error(t('admin.userNotFound'));
      setApplying(false);
      return;
    }

    const currentBalance = freshUser.credits_balance || 0;
    let newBalance: number;

    switch (operation) {
      case 'add':
        newBalance = currentBalance + numAmount;
        break;
      case 'subtract':
        newBalance = Math.max(0, currentBalance - numAmount);
        break;
      case 'set':
        newBalance = numAmount;
        break;
    }

    // Optimistic lock: only update if balance hasn't changed since we read it
    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ credits_balance: newBalance })
      .eq('user_id', foundUser.user_id)
      .eq('credits_balance', currentBalance)
      .select('credits_balance')
      .maybeSingle();

    if (error) {
      toast.error(t('admin.errorSaving') + ': ' + error.message);
    } else if (!updated) {
      toast.error(
        isPt
          ? 'O saldo foi alterado simultaneamente. Tente novamente.'
          : isEs
            ? 'El saldo se modificó simultáneamente. Inténtalo de nuevo.'
            : 'Balance was modified concurrently. Please try again.',
      );
      // Refresh displayed balance
      setFoundUser({ ...foundUser, credits_balance: currentBalance });
    } else {
      toast.success(t('admin.creditsUpdated', { from: currentBalance, to: newBalance }));
      setFoundUser({ ...foundUser, credits_balance: newBalance });
      setAmount('');
      setReason('');
    }
    setApplying(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.adjustCredits')}</CardTitle>
          <CardDescription>{t('admin.adjustCreditsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t('admin.emailOrHandle')}
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUser()}
            />
            <Button onClick={searchUser} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {foundUser && (
            <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{foundUser.first_name} {foundUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                  {foundUser.handle && (
                    <p className="text-sm text-primary">@{foundUser.handle}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('admin.currentBalance')}</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(foundUser.credits_balance || 0)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>{t('admin.operation')}</Label>
                  <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-1">
                          <Plus className="h-3 w-3" /> {t('admin.add')}
                        </div>
                      </SelectItem>
                      <SelectItem value="subtract">
                        <div className="flex items-center gap-1">
                          <Minus className="h-3 w-3" /> {t('admin.subtract')}
                        </div>
                      </SelectItem>
                      <SelectItem value="set">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> {t('admin.set')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>{t('admin.amount')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>{t('admin.reason')}</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('admin.reasonPlaceholder')}
                  rows={2}
                  maxLength={500}
                />
              </div>

              <Button onClick={applyCredit} disabled={applying || !amount} className="w-full">
                {applying ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                {t('admin.applyCreditChange')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
