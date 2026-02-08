import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DollarSign, Plus, Minus, Search, Loader2 } from 'lucide-react';

export function AdminCreditManager() {
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
      .select('*')
      .or(`email.ilike.%${searchEmail}%,handle.ilike.%${searchEmail}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      toast.error('User not found');
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
      toast.error('Invalid amount');
      setApplying(false);
      return;
    }

    let newBalance: number;
    const currentBalance = foundUser.credits_balance || 0;

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

    const { error } = await supabase
      .from('profiles')
      .update({ credits_balance: newBalance })
      .eq('user_id', foundUser.user_id);

    if (error) {
      toast.error('Error updating credits: ' + error.message);
    } else {
      toast.success(`Credits updated: R$${currentBalance} → R$${newBalance}`);
      setFoundUser({ ...foundUser, credits_balance: newBalance });
      setAmount('');
      setReason('');
    }
    setApplying(false);
  };

  return (
    <div className="space-y-4">
      {/* Search User */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adjust User Credits</CardTitle>
          <CardDescription>Search for a user by email or handle to manage their credit balance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Email or @handle..."
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
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    R${foundUser.credits_balance || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Operation</Label>
                  <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">
                        <div className="flex items-center gap-1">
                          <Plus className="h-3 w-3" /> Add
                        </div>
                      </SelectItem>
                      <SelectItem value="subtract">
                        <div className="flex items-center gap-1">
                          <Minus className="h-3 w-3" /> Subtract
                        </div>
                      </SelectItem>
                      <SelectItem value="set">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> Set
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Amount (R$)</Label>
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
                <Label>Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Promotional bonus, partner credit, refund..."
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
                Apply Credit Change
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
