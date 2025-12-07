import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2, ExternalLink, BarChart3, Target } from 'lucide-react';

export function PixelTrackingSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [metaPixelId, setMetaPixelId] = useState('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');

  useEffect(() => {
    const fetchPixelData = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('providers')
        .select('meta_pixel_id, google_analytics_id')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setMetaPixelId(data.meta_pixel_id || '');
        setGoogleAnalyticsId(data.google_analytics_id || '');
      }
      setIsLoading(false);
    };

    fetchPixelData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    
    const { error } = await supabase
      .from('providers')
      .update({
        meta_pixel_id: metaPixelId || null,
        google_analytics_id: googleAnalyticsId || null,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: t('pixelTracking.error'),
        description: t('pixelTracking.errorDescription'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('pixelTracking.saved'),
        description: t('pixelTracking.savedDescription'),
      });
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-primary/10 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <BarChart3 className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('pixelTracking.title')}
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  Enterprise
                </Badge>
              </CardTitle>
              <CardDescription>
                {t('pixelTracking.description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Meta Pixel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{t('pixelTracking.metaPixel.title')}</CardTitle>
              <CardDescription>{t('pixelTracking.metaPixel.description')}</CardDescription>
            </div>
            <a 
              href="https://business.facebook.com/events_manager2/list/pixel/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {t('pixelTracking.getPixelId')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="meta-pixel">{t('pixelTracking.metaPixel.label')}</Label>
            <Input
              id="meta-pixel"
              placeholder="123456789012345"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('pixelTracking.metaPixel.hint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Google Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.84 2.998v18.004c0 .553-.448 1.001-1.001 1.001h-3.003a1.001 1.001 0 0 1-1.001-1.001V2.998c0-.553.448-1.001 1.001-1.001h3.003c.553 0 1.001.448 1.001 1.001zM6.161 22.003h3.003c.553 0 1.001-.448 1.001-1.001v-9.002c0-.553-.448-1.001-1.001-1.001H6.161c-.553 0-1.001.448-1.001 1.001v9.002c0 .553.448 1.001 1.001 1.001zm-5-5.001h3.003c.553 0 1.001-.448 1.001-1.001v-4.001c0-.553-.448-1.001-1.001-1.001H1.161c-.553 0-1.001.448-1.001 1.001v4.001c0 .553.448 1.001 1.001 1.001zM12.663 6c1.381 0 2.502 1.12 2.502 2.502s-1.12 2.502-2.502 2.502-2.502-1.12-2.502-2.502S11.282 6 12.663 6z"/>
              </svg>
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{t('pixelTracking.googleAnalytics.title')}</CardTitle>
              <CardDescription>{t('pixelTracking.googleAnalytics.description')}</CardDescription>
            </div>
            <a 
              href="https://analytics.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              {t('pixelTracking.getPixelId')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="google-analytics">{t('pixelTracking.googleAnalytics.label')}</Label>
            <Input
              id="google-analytics"
              placeholder="G-XXXXXXXXXX or UA-XXXXXXX-X"
              value={googleAnalyticsId}
              onChange={(e) => setGoogleAnalyticsId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('pixelTracking.googleAnalytics.hint')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {t('common.save')}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Target className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{t('pixelTracking.howItWorks.title')}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('pixelTracking.howItWorks.point1')}</li>
                <li>{t('pixelTracking.howItWorks.point2')}</li>
                <li>{t('pixelTracking.howItWorks.point3')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}