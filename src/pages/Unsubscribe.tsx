import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  EMAIL_PREFERENCE_CATEGORIES,
  getPublicEmailPreferenceState,
  saveEmailPreferences,
  type EmailPreferenceState,
} from '@/lib/emailPreferences';

export default function Unsubscribe() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token')?.trim() || '';
  const [preferences, setPreferences] = useState<EmailPreferenceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (active) {
          setLoading(true);
          setFailed(false);
        }
        return getPublicEmailPreferenceState(token);
      })
      .then((state) => {
        if (!active) return;
        setPreferences(state);
        setFailed(!state);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const save = async () => {
    if (!preferences) return;
    setSaving(true);
    setSaved(false);
    setFailed(false);
    try {
      const next = await saveEmailPreferences({
        token: preferences.token,
        unsubscribeAllMarketing: preferences.unsubscribeAllMarketing,
        unsubscribeAllProducts: preferences.unsubscribeAllProducts,
        categoryPreferences: preferences.categoryPreferences,
      });
      setPreferences(next);
      setSaved(true);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10">
      <Helmet>
        <title>{t('emailPreferences.pageTitle')}</title>
      </Helmet>
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-5 w-5" />
          </div>
          <CardTitle>{t('emailPreferences.title')}</CardTitle>
          <CardDescription>{t('emailPreferences.publicDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('emailPreferences.loading')}
            </div>
          ) : preferences ? (
            <>
              <div className="rounded-lg border border-border p-4">
                <p className="font-medium">{preferences.brandName}</p>
                <p className="text-sm text-muted-foreground">{preferences.email}</p>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="unsubscribe-product">{t('emailPreferences.unsubscribeProduct')}</Label>
                  <p className="text-sm text-muted-foreground">{t('emailPreferences.unsubscribeProductDescription')}</p>
                </div>
                <Switch
                  id="unsubscribe-product"
                  checked={preferences.unsubscribeAllMarketing}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, unsubscribeAllMarketing: checked })}
                />
              </div>

              <div className="space-y-4 border-t border-border pt-5">
                <div>
                  <p className="font-medium">{t('emailPreferences.categoriesTitle')}</p>
                  <p className="text-sm text-muted-foreground">{t('emailPreferences.categoriesDescription')}</p>
                </div>
                {EMAIL_PREFERENCE_CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center justify-between gap-4">
                    <Label htmlFor={`email-${category}`} className="font-normal">
                      {t(`emailPreferences.categories.${category}`)}
                    </Label>
                    <Switch
                      id={`email-${category}`}
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

              <div className="flex items-start justify-between gap-4 border-t border-border pt-5">
                <div>
                  <Label htmlFor="unsubscribe-products">{t('emailPreferences.unsubscribeAllProducts')}</Label>
                  <p className="text-sm text-muted-foreground">{t('emailPreferences.unsubscribeAllProductsDescription')}</p>
                </div>
                <Switch
                  id="unsubscribe-products"
                  checked={preferences.unsubscribeAllProducts}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, unsubscribeAllProducts: checked })}
                />
              </div>

              <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                {t('emailPreferences.transactionalNotice')}
              </p>

              {saved && <p className="text-sm text-primary" role="status">{t('emailPreferences.savedDescription')}</p>}
              {failed && <p className="text-sm text-destructive" role="alert">{t('emailPreferences.saveErrorDescription')}</p>}

              <Button className="w-full" onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? t('emailPreferences.saving') : t('emailPreferences.save')}
              </Button>
            </>
          ) : (
            <div className="space-y-3" role="alert">
              <p className="font-medium">{t('emailPreferences.invalidTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('emailPreferences.invalidDescription')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
