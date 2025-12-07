import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, TrendingUp, Eye, MousePointer, DollarSign, Play, Pause, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Ad {
  id: string;
  ad_type: string;
  title: string | null;
  description: string | null;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface AdManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string | null;
}

export function AdManagerDialog({ open, onOpenChange, providerId }: AdManagerDialogProps) {
  const { t } = useTranslation();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [adType, setAdType] = useState<'boost' | 'dedicated'>('dedicated');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAds = async () => {
    if (!providerId) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('promoted_ads')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ads:', error);
    } else {
      setAds(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && providerId) {
      fetchAds();
    }
  }, [open, providerId]);

  const handleCreateAd = async () => {
    if (!providerId || !budget) {
      toast.error(t('socialFeed.budgetRequired'));
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase
        .from('promoted_ads')
        .insert({
          provider_id: providerId,
          ad_type: adType,
          title: title.trim() || null,
          description: description.trim() || null,
          budget: parseFloat(budget),
          start_date: startDate || null,
          end_date: endDate || null,
          status: 'draft',
        });

      if (error) throw error;

      toast.success(t('socialFeed.adCreated'));
      setShowCreateForm(false);
      resetForm();
      fetchAds();
    } catch (error) {
      console.error('Error creating ad:', error);
      toast.error(t('socialFeed.errorCreatingAd'));
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setAdType('dedicated');
    setTitle('');
    setDescription('');
    setBudget('');
    setStartDate('');
    setEndDate('');
  };

  const toggleAdStatus = async (ad: Ad) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';

    const { error } = await supabase
      .from('promoted_ads')
      .update({ status: newStatus })
      .eq('id', ad.id);

    if (error) {
      toast.error(t('socialFeed.errorUpdatingAd'));
    } else {
      fetchAds();
      toast.success(t(`socialFeed.ad${newStatus === 'active' ? 'Activated' : 'Paused'}`));
    }
  };

  const deleteAd = async (adId: string) => {
    const { error } = await supabase
      .from('promoted_ads')
      .delete()
      .eq('id', adId);

    if (error) {
      toast.error(t('socialFeed.errorDeletingAd'));
    } else {
      fetchAds();
      toast.success(t('socialFeed.adDeleted'));
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500',
      paused: 'bg-yellow-500/10 text-yellow-500',
      draft: 'bg-muted text-muted-foreground',
      ended: 'bg-red-500/10 text-red-500',
    };
    return <Badge className={colors[status] || colors.draft}>{status}</Badge>;
  };

  const totalSpent = ads.reduce((sum, ad) => sum + (ad.spent || 0), 0);
  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('socialFeed.adManager')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="campaigns" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campaigns">{t('socialFeed.campaigns')}</TabsTrigger>
            <TabsTrigger value="analytics">{t('socialFeed.adAnalytics')}</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {/* Create New Button */}
            {!showCreateForm && (
              <Button onClick={() => setShowCreateForm(true)} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('socialFeed.createAd')}
              </Button>
            )}

            {/* Create Form */}
            {showCreateForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('socialFeed.newCampaign')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('socialFeed.adType')}</Label>
                    <Select value={adType} onValueChange={(v) => setAdType(v as 'boost' | 'dedicated')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boost">{t('socialFeed.boostExisting')}</SelectItem>
                        <SelectItem value="dedicated">{t('socialFeed.dedicatedAd')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('socialFeed.adTitle')}</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('socialFeed.adTitlePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('socialFeed.adDescription')}</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('socialFeed.adDescriptionPlaceholder')}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>{t('socialFeed.budget')} (R$)</Label>
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="100"
                        min="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('socialFeed.startDate')}</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('socialFeed.endDate')}</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button onClick={handleCreateAd} disabled={creating || !budget}>
                      {creating ? t('common.creating') : t('socialFeed.createCampaign')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ads List */}
            <div className="space-y-3">
              {loading ? (
                <p className="text-center text-muted-foreground py-4">{t('common.loading')}</p>
              ) : ads.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">{t('socialFeed.noAds')}</p>
              ) : (
                ads.map((ad) => (
                  <Card key={ad.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{ad.title || t('socialFeed.untitledCampaign')}</h4>
                            {getStatusBadge(ad.status)}
                            <Badge variant="outline">{ad.ad_type}</Badge>
                          </div>
                          {ad.description && (
                            <p className="text-sm text-muted-foreground mb-2">{ad.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              R${ad.spent?.toFixed(2) || '0.00'} / R${ad.budget?.toFixed(2)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {ad.impressions || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MousePointer className="h-3 w-3" />
                              {ad.clicks || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAdStatus(ad)}
                          >
                            {ad.status === 'active' ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteAd(ad.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">R${totalSpent.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{t('socialFeed.totalSpent')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t('socialFeed.impressions')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <MousePointer className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{t('socialFeed.clicks')}</p>
                </CardContent>
              </Card>
            </div>

            {totalImpressions > 0 && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{t('socialFeed.ctr')}</p>
                  <p className="text-2xl font-bold">
                    {((totalClicks / totalImpressions) * 100).toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
