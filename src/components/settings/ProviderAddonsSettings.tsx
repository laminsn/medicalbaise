import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, GripVertical, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatPrice, getUserCurrency } from '@/lib/currency';

interface ProviderAddon {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
  order_index: number;
}

interface ProviderAddonsSettingsProps {
  providerId: string;
}

export function ProviderAddonsSettings({ providerId }: ProviderAddonsSettingsProps) {
  const { t } = useTranslation();
  const [addons, setAddons] = useState<ProviderAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New addon form state
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAddons();
  }, [providerId]);

  const fetchAddons = async () => {
    const { data, error } = await supabase
      .from('provider_addons')
      .select('*')
      .eq('provider_id', providerId)
      .order('order_index', { ascending: true });

    if (error) {

    } else {
      setAddons(data || []);
    }
    setLoading(false);
  };

  const handleAddAddon = async () => {
    if (!newName.trim() || !newPrice) {
      toast.error(t('settings.addonNamePriceRequired', 'Name and price are required'));
      return;
    }

    setSaving(true);
    
    const { data, error } = await supabase
      .from('provider_addons')
      .insert({
        provider_id: providerId,
        name: newName.trim(),
        description: newDescription.trim() || null,
        price: parseFloat(newPrice),
        order_index: addons.length,
      })
      .select()
      .single();

    if (error) {

      toast.error(t('settings.addonAddError', 'Failed to add add-on'));
    } else {
      setAddons([...addons, data]);
      setNewName('');
      setNewDescription('');
      setNewPrice('');
      setShowAddForm(false);
      toast.success(t('settings.addonAdded', 'Add-on added successfully'));
    }
    
    setSaving(false);
  };

  const handleToggleActive = async (addonId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('provider_addons')
      .update({ is_active: isActive })
      .eq('id', addonId);

    if (error) {

      toast.error(t('settings.addonUpdateError', 'Failed to update add-on'));
    } else {
      setAddons(addons.map(a => a.id === addonId ? { ...a, is_active: isActive } : a));
    }
  };

  const handleDeleteAddon = async (addonId: string) => {
    const { error } = await supabase
      .from('provider_addons')
      .delete()
      .eq('id', addonId);

    if (error) {

      toast.error(t('settings.addonDeleteError', 'Failed to delete add-on'));
    } else {
      setAddons(addons.filter(a => a.id !== addonId));
      toast.success(t('settings.addonDeleted', 'Add-on deleted'));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('common.loading')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" />
          {t('settings.addOnServices', 'Add-on Services')}
          <Badge variant="secondary" className="ml-auto">
            {t('checkout.proFeature', 'Pro+')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('settings.addOnServicesDescription', 'Create add-on services that customers can select during checkout.')}
        </p>

        {/* Existing Add-ons */}
        {addons.length > 0 && (
          <div className="space-y-3">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{addon.name}</span>
                    <span className="text-primary font-semibold">
                      {formatPrice(addon.price)}
                    </span>
                  </div>
                  {addon.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {addon.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={addon.is_active}
                    onCheckedChange={(checked) => handleToggleActive(addon.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteAddon(addon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Form */}
        {showAddForm ? (
          <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
            <div className="space-y-2">
              <Label>{t('settings.addonName', 'Add-on Name')} *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('settings.addonNamePlaceholder', 'e.g., Priority Service')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.addonDescription', 'Description')}</Label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder={t('settings.addonDescriptionPlaceholder', 'Brief description of the add-on...')}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.addonPrice', 'Price')} *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{getUserCurrency()}</span>
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-10"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddAddon} disabled={saving}>
                {saving ? t('common.saving') : t('common.add')}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.addNewAddon', 'Add New Add-on')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
