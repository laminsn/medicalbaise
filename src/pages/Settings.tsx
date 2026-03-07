import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Bell, Moon, Globe, Lock, Trash2, Check, Package, ChevronRight, ScanFace, ShieldCheck } from 'lucide-react';
import { ProviderAddonsSettings } from '@/components/settings/ProviderAddonsSettings';
import { supabase } from '@/integrations/supabase/client';
import { FaceAuthEnroll } from '@/components/auth/FaceAuthEnroll';
import { useFaceAuth } from '@/hooks/useFaceAuth';
import { useToast } from '@/hooks/use-toast';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { checkEnrollment, removeFaceEnrollment } = useFaceAuth();

  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);
  const [faceLoading, setFaceLoading] = useState(true);

  // Check if user is a provider with Pro+ tier
  useEffect(() => {
    const checkProvider = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('providers')
        .select('id, subscription_tier')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProviderId(data.id);
        setIsPro(['pro', 'elite', 'enterprise'].includes(data.subscription_tier || ''));
      }
    };

    checkProvider();
  }, [user]);

  // Check face enrollment status
  useEffect(() => {
    const check = async () => {
      if (!user) return;
      setFaceLoading(true);
      const enrolled = await checkEnrollment();
      setFaceEnrolled(enrolled);
      setFaceLoading(false);
    };
    check();
  }, [user, checkEnrollment]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const isDarkMode = theme === 'dark';
  const resolvedLanguage = i18n.resolvedLanguage || i18n.language;
  const selectedLanguage = languages.find((lang) => resolvedLanguage.startsWith(lang.code))?.code || 'pt';

  const handleRemoveFace = async () => {
    const success = await removeFaceEnrollment();
    if (success) {
      setFaceEnrolled(false);
      toast({
        title: t('security.faceRemoved'),
        description: t('security.faceRemovedDescription'),
      });
    } else {
      toast({
        title: t('common.error'),
        description: t('security.faceRemoveFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleFaceEnrollSuccess = () => {
    setFaceEnrolled(true);
    setShowFaceEnroll(false);
    toast({
      title: t('security.faceEnrolled'),
      description: t('security.faceEnrolledDescription'),
    });
  };

  return (
    <>
      <Helmet>
        <title>{t('profile.settings')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 pb-24 max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">{t('profile.settings')}</h1>
          </div>

          <div className="space-y-6">
            {/* Services (Providers only) */}
            {providerId && (
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => navigate('/services-settings')}
                    className="flex items-center gap-3 w-full p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <Package className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{t('settings.myServices', 'My Services')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.manageServices', 'Manage your service offerings')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Face Authentication */}
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ScanFace className="h-4 w-4 text-primary" />
                  {t('security.faceAuthentication')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {showFaceEnroll ? (
                  <FaceAuthEnroll
                    onSuccess={handleFaceEnrollSuccess}
                    onCancel={() => setShowFaceEnroll(false)}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{t('security.faceLoginEnabled')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {faceEnrolled
                            ? t('security.faceEnrolledStatus')
                            : t('security.faceNotEnrolledStatus')}
                        </p>
                      </div>
                      {!faceLoading && (
                        faceEnrolled ? (
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                        ) : null
                      )}
                    </div>

                    {faceEnrolled ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowFaceEnroll(true)}
                        >
                          {t('security.reEnrollFace')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleRemoveFace}
                        >
                          {t('security.removeFace')}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setShowFaceEnroll(true)}
                        className="w-full"
                      >
                        <ScanFace className="w-4 h-4 mr-2" />
                        {t('security.setupFaceLogin')}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t('settings.notifications')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications" className="flex-1">
                    {t('settings.pushNotifications')}
                  </Label>
                  <Switch
                    id="push-notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="flex-1">
                    {t('settings.emailNotifications')}
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Provider Add-ons (Pro+ only) */}
            {providerId && isPro && (
              <ProviderAddonsSettings providerId={providerId} />
            )}

            {/* Appearance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  {t('settings.appearance')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode" className="flex-1">
                    {t('settings.darkMode')}
                  </Label>
                  <Switch
                    id="dark-mode"
                    checked={isDarkMode}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('settings.language')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedLanguage}
                  onValueChange={(value) => i18n.changeLanguage(value)}
                  className="space-y-3"
                >
                  {languages.map((lang) => (
                    <div
                      key={lang.code}
                      className="flex items-center space-x-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => i18n.changeLanguage(lang.code)}
                    >
                      <RadioGroupItem value={lang.code} id={lang.code} />
                      <Label
                        htmlFor={lang.code}
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </Label>
                      {selectedLanguage === lang.code && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  {t('settings.privacy')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  {t('settings.changePassword')}
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  {t('settings.twoFactor')}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  {t('settings.dangerZone')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" className="w-full">
                  {t('settings.deleteAccount')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
