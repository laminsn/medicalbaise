import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Award, Loader2, Save, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function WarrantyGuaranteeEditor() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [warrantyInfo, setWarrantyInfo] = useState('');
  const [guaranteeInfo, setGuaranteeInfo] = useState('');
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchWarrantyData();
    }
  }, [user]);

  const fetchWarrantyData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('id, warranty_info, guarantee_info')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          throw error;
        }
        return;
      }

      if (data) {
        setProviderId(data.id);
        setWarrantyInfo(data.warranty_info || '');
        setGuaranteeInfo(data.guarantee_info || '');
      }
    } catch (error) {
      console.error('Error fetching warranty data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!providerId) {
      toast.error(t('provider.noProviderProfile', 'No provider profile found'));
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('providers')
        .update({
          warranty_info: warrantyInfo.trim() || null,
          guarantee_info: guaranteeInfo.trim() || null,
        })
        .eq('id', providerId);

      if (error) throw error;

      toast.success(t('provider.warrantyUpdated', 'Warranty & guarantee information updated'));
    } catch (error: any) {
      console.error('Error saving warranty data:', error);
      toast.error(error.message || t('provider.saveFailed', 'Failed to save'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!providerId) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          {t('provider.warrantyGuarantee', 'Warranty & Guarantees')}
        </CardTitle>
        <CardDescription>
          {t('provider.warrantyDescription', 'Add information about warranties and guarantees you offer to build customer trust')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            {t('provider.warrantyTip', 'Customers are more likely to book services from providers who offer clear warranties and satisfaction guarantees.')}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="warranty-info" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('provider.warrantyInfo', 'Service Warranty')}
          </Label>
          <Textarea
            id="warranty-info"
            placeholder={t('provider.warrantyPlaceholder', 'e.g., "1-year warranty on all installations. Free repairs for any defects in workmanship."')}
            value={warrantyInfo}
            onChange={(e) => setWarrantyInfo(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{warrantyInfo.length}/500</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="guarantee-info" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            {t('provider.guaranteeInfo', 'Satisfaction Guarantee')}
          </Label>
          <Textarea
            id="guarantee-info"
            placeholder={t('provider.guaranteePlaceholder', 'e.g., "100% satisfaction guaranteed. If you\'re not happy with our work, we\'ll redo it for free."')}
            value={guaranteeInfo}
            onChange={(e) => setGuaranteeInfo(e.target.value)}
            rows={3}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{guaranteeInfo.length}/500</p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('common.saving', 'Saving...')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('common.save', 'Save Changes')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
