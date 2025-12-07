import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, Plus, Wallet, CreditCard, Building2, FileText, Download, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface PayoutMethod {
  id: string;
  type: 'bank' | 'pix' | 'paypal';
  name: string;
  details: string;
  isDefault: boolean;
}

interface PayoutHistory {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  receiptUrl?: string;
}

export default function Payouts() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [payoutType, setPayoutType] = useState<string>('');
  
  // Mock data - in real implementation, fetch from database
  const [payoutMethods] = useState<PayoutMethod[]>([
    { id: '1', type: 'pix', name: 'PIX Key', details: '***@email.com', isDefault: true },
  ]);

  const [payoutHistory] = useState<PayoutHistory[]>([
    { id: '1', date: '2024-12-01', amount: 1500, status: 'completed', method: 'PIX', receiptUrl: '#' },
    { id: '2', date: '2024-11-15', amount: 2300, status: 'completed', method: 'PIX', receiptUrl: '#' },
    { id: '3', date: '2024-11-01', amount: 890, status: 'completed', method: 'Bank Transfer', receiptUrl: '#' },
  ]);

  const handleAddMethod = () => {
    toast.success('Payout method added successfully');
    setIsAddingMethod(false);
    setPayoutType('');
  };

  const getStatusBadge = (status: PayoutHistory['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    }
  };

  const getMethodIcon = (type: PayoutMethod['type']) => {
    switch (type) {
      case 'bank':
        return <Building2 className="h-4 w-4" />;
      case 'pix':
        return <Wallet className="h-4 w-4" />;
      case 'paypal':
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Payouts - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('common.back')}
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t('payouts.title', 'Payouts')}</h1>
              <p className="text-muted-foreground">{t('payouts.subtitle', 'Manage your payout methods and view history')}</p>
            </div>
          </div>

          {/* Payout Methods Section */}
          <Card className="gradient-border mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  {t('payouts.methods', 'Payout Methods')}
                </CardTitle>
                <CardDescription>{t('payouts.methodsDescription', 'Add and manage your payout accounts')}</CardDescription>
              </div>
              <Dialog open={isAddingMethod} onOpenChange={setIsAddingMethod}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('payouts.addMethod', 'Add Method')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('payouts.addPayoutMethod', 'Add Payout Method')}</DialogTitle>
                    <DialogDescription>
                      {t('payouts.addMethodDescription', 'Choose how you want to receive your payments')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>{t('payouts.methodType', 'Method Type')}</Label>
                      <Select value={payoutType} onValueChange={setPayoutType}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('payouts.selectType', 'Select type')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="bank">{t('payouts.bankTransfer', 'Bank Transfer')}</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {payoutType === 'pix' && (
                      <div className="space-y-2">
                        <Label>{t('payouts.pixKey', 'PIX Key')}</Label>
                        <Input placeholder={t('payouts.pixKeyPlaceholder', 'Email, CPF, phone, or random key')} />
                      </div>
                    )}

                    {payoutType === 'bank' && (
                      <>
                        <div className="space-y-2">
                          <Label>{t('payouts.bankName', 'Bank Name')}</Label>
                          <Input placeholder={t('payouts.bankNamePlaceholder', 'Enter bank name')} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('payouts.agency', 'Agency')}</Label>
                            <Input placeholder="0000" />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('payouts.account', 'Account')}</Label>
                            <Input placeholder="00000-0" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('payouts.accountHolder', 'Account Holder Name')}</Label>
                          <Input placeholder={t('payouts.accountHolderPlaceholder', 'Full name as registered')} />
                        </div>
                      </>
                    )}

                    {payoutType === 'paypal' && (
                      <div className="space-y-2">
                        <Label>{t('payouts.paypalEmail', 'PayPal Email')}</Label>
                        <Input type="email" placeholder={t('payouts.paypalEmailPlaceholder', 'your@email.com')} />
                      </div>
                    )}

                    <Button onClick={handleAddMethod} className="w-full" disabled={!payoutType}>
                      {t('payouts.saveMethod', 'Save Payout Method')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {payoutMethods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t('payouts.noMethods', 'No payout methods added yet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payoutMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {getMethodIcon(method.type)}
                        </div>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.isDefault && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          {t('common.edit', 'Edit')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payout History Section */}
          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('payouts.history', 'Payout History')}
              </CardTitle>
              <CardDescription>{t('payouts.historyDescription', 'View your past payouts and download receipts')}</CardDescription>
            </CardHeader>
            <CardContent>
              {payoutHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{t('payouts.noHistory', 'No payout history yet')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('payouts.date', 'Date')}</TableHead>
                      <TableHead>{t('payouts.amount', 'Amount')}</TableHead>
                      <TableHead>{t('payouts.method', 'Method')}</TableHead>
                      <TableHead>{t('payouts.status', 'Status')}</TableHead>
                      <TableHead className="text-right">{t('payouts.receipt', 'Receipt')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payoutHistory.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>{new Date(payout.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">R$ {payout.amount.toLocaleString()}</TableCell>
                        <TableCell>{payout.method}</TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        <TableCell className="text-right">
                          {payout.receiptUrl && (
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Download className="h-4 w-4" />
                              {t('payouts.download', 'Download')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </>
  );
}
