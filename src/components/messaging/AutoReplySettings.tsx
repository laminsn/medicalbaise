import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot, Crown, Clock, MessageSquare, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutoReplySettingsProps {
  providerTier: string;
}

export function AutoReplySettings({ providerTier }: AutoReplySettingsProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    enabled: false,
    responseDelay: '0',
    welcomeMessage: 'Thank you for your message! I typically respond within a few hours.',
    awayMessage: 'I\'m currently unavailable but will get back to you as soon as possible.',
    businessHoursOnly: true,
    aiAssisted: false,
  });

  const isEliteOrAbove = providerTier === 'elite' || providerTier === 'enterprise';

  const handleSave = async () => {
    if (!isEliteOrAbove) {
      toast.error(t('autoReply.eliteRequired'));
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(t('autoReply.saved'));
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>{t('autoReply.title')}</CardTitle>
          </div>
          <Badge className="bg-amber-500">
            <Crown className="w-3 h-3 mr-1" />
            Elite+
          </Badge>
        </div>
        <CardDescription>{t('autoReply.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEliteOrAbove ? (
          <div className="bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 rounded-lg p-6 text-center">
            <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h4 className="font-semibold text-lg mb-2">{t('autoReply.eliteFeature')}</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {t('autoReply.upgradeDescription')}
            </p>
            <Button className="bg-amber-500 hover:bg-amber-600">
              {t('common.upgradeToElite')}
            </Button>
          </div>
        ) : (
          <>
            {/* Enable Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-reply-enabled">{t('autoReply.enable')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('autoReply.enableDescription')}
                </p>
              </div>
              <Switch
                id="auto-reply-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {/* AI Assisted */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ai-assisted">{t('autoReply.aiAssisted')}</Label>
                  <Badge variant="outline" className="text-xs">AI</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('autoReply.aiAssistedDescription')}
                </p>
              </div>
              <Switch
                id="ai-assisted"
                checked={settings.aiAssisted}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, aiAssisted: checked }))
                }
              />
            </div>

            {/* Response Delay */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('autoReply.responseDelay')}
              </Label>
              <Select
                value={settings.responseDelay}
                onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, responseDelay: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('autoReply.immediate')}</SelectItem>
                  <SelectItem value="30">30 {t('autoReply.seconds')}</SelectItem>
                  <SelectItem value="60">1 {t('autoReply.minute')}</SelectItem>
                  <SelectItem value="300">5 {t('autoReply.minutes')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Business Hours Only */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="business-hours">{t('autoReply.businessHoursOnly')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('autoReply.businessHoursDescription')}
                </p>
              </div>
              <Switch
                id="business-hours"
                checked={settings.businessHoursOnly}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, businessHoursOnly: checked }))
                }
              />
            </div>

            {/* Welcome Message */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('autoReply.welcomeMessage')}
              </Label>
              <Textarea
                value={settings.welcomeMessage}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, welcomeMessage: e.target.value }))
                }
                placeholder={t('autoReply.welcomePlaceholder')}
                rows={3}
              />
            </div>

            {/* Away Message */}
            <div className="space-y-2">
              <Label>{t('autoReply.awayMessage')}</Label>
              <Textarea
                value={settings.awayMessage}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, awayMessage: e.target.value }))
                }
                placeholder={t('autoReply.awayPlaceholder')}
                rows={3}
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('autoReply.saveSettings')}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
