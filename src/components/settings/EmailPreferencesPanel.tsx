import { useCallback, useEffect, useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getBaiseAppKey } from '@/lib/providerCommunication';
import {
  EMAIL_PREFERENCE_CATEGORIES,
  getAuthenticatedEmailPreferenceState,
  saveEmailPreferences,
  type EmailPreferenceState,
} from '@/lib/emailPreferences';

export function EmailPreferencesPanel() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<EmailPreferenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const appKey = getBaiseAppKey();

  const loadPreferences = useCallback(async () => {
    try {
      setPreferences(await getAuthenticatedEmailPreferenceState(appKey));
    } catch {
      toast({
        title: t('emailPreferences.loadErrorTitle'),
        description: t('emailPreferences.loadErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [appKey, t, toast]);

  useEffect(() => {
    void Promise.resolve().then(loadPreferences);
  }, [loadPreferences]);

  const save = async () => {
    if (!preferences) return;
    setSaving(true);
    try {
      const next = await saveEmailPreferences({
        brand: appKey,
        unsubscribeAllMarketing: preferences.unsubscribeAllMarketing,
        unsubscribeAllProducts: preferences.unsubscribeAllProducts,
        categoryPreferences: preferences.categoryPreferences,
      });
      setPreferences(next);
      toast({
        title: t('emailPreferences.savedTitle'),
        description: t('emailPreferences.savedDescription'),
      });
    } catch {
      toast({
        title: t('emailPreferences.saveErrorTitle'),
        description: t('emailPreferences.saveErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="h-4 w-4" />
          {t('emailPreferences.title')}
        </CardTitle>
        <CardDescription>{t('emailPreferences.settingsDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('emailPreferences.loading')}
          </div>
        ) : preferences ? (
          <>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{preferences.brandName}</p>
              <p className="text-xs text-muted-foreground">{preferences.email}</p>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="settings-unsubscribe-all">{t('emailPreferences.unsubscribeProduct')}</Label>
                <p className="text-xs text-muted-foreground">{t('emailPreferences.unsubscribeProductDescription')}</p>
              </div>
              <Switch
                id="settings-unsubscribe-all"
                checked={preferences.unsubscribeAllMarketing}
                onCheckedChange={(checked) => setPreferences({ ...preferences, unsubscribeAllMarketing: checked })}
              />
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium">{t('emailPreferences.categoriesTitle')}</p>
              {EMAIL_PREFERENCE_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center justify-between gap-4">
                  <Label htmlFor={`settings-email-${category}`} className="font-normal">
                    {t(`emailPreferences.categories.${category}`)}
                  </Label>
                  <Switch
                    id={`settings-email-${category}`}
                    checked={preferences.categoryPreferences[category]}
                    disabled={preferences.unsubscribeAllMarketing}
                    onCheckedChange={(checked) => setPreferences({
                      ...preferences,
                      categoryPreferences: { ...preferences.categoryPreferences, [category]: checked },
                    })}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
              <div>
                <Label htmlFor="settings-unsubscribe-products">{t('emailPreferences.unsubscribeAllProducts')}</Label>
                <p className="text-xs text-muted-foreground">{t('emailPreferences.unsubscribeAllProductsDescription')}</p>
              </div>
              <Switch
                id="settings-unsubscribe-products"
                checked={preferences.unsubscribeAllProducts}
                onCheckedChange={(checked) => setPreferences({ ...preferences, unsubscribeAllProducts: checked })}
              />
            </div>

            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              {t('emailPreferences.transactionalNotice')}
            </p>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? t('emailPreferences.saving') : t('emailPreferences.save')}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              void loadPreferences();
            }}
          >
            {t('emailPreferences.retry')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
