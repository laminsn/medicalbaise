import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Plug, ExternalLink, Check, X, Settings2,
  Webhook, Calendar, CreditCard, BarChart3,
  MessageSquare, Bell, Zap, Database
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Integration {
  id: string;
  nameKey: string;
  descriptionKey: string;
  icon: React.ElementType;
  category: 'marketing' | 'payments' | 'productivity' | 'communication';
  connected: boolean;
  popular?: boolean;
  enterprise?: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'meta-pixel',
    nameKey: 'metaPixel',
    descriptionKey: 'metaPixelDesc',
    icon: BarChart3,
    category: 'marketing',
    connected: false,
    popular: true,
    enterprise: true,
  },
  {
    id: 'google-analytics',
    nameKey: 'googleAnalytics',
    descriptionKey: 'googleAnalyticsDesc',
    icon: BarChart3,
    category: 'marketing',
    connected: false,
    popular: true,
    enterprise: true,
  },
  {
    id: 'google-calendar',
    nameKey: 'googleCalendar',
    descriptionKey: 'googleCalendarDesc',
    icon: Calendar,
    category: 'productivity',
    connected: false,
    popular: true,
  },
  {
    id: 'stripe',
    nameKey: 'stripe',
    descriptionKey: 'stripeDesc',
    icon: CreditCard,
    category: 'payments',
    connected: false,
    popular: true,
  },
  {
    id: 'paypal',
    nameKey: 'paypal',
    descriptionKey: 'paypalDesc',
    icon: CreditCard,
    category: 'payments',
    connected: false,
  },
  {
    id: 'whatsapp-business',
    nameKey: 'whatsappBusiness',
    descriptionKey: 'whatsappBusinessDesc',
    icon: MessageSquare,
    category: 'communication',
    connected: false,
    popular: true,
  },
  {
    id: 'slack',
    nameKey: 'slack',
    descriptionKey: 'slackDesc',
    icon: Bell,
    category: 'communication',
    connected: false,
  },
  {
    id: 'zapier',
    nameKey: 'zapier',
    descriptionKey: 'zapierDesc',
    icon: Zap,
    category: 'productivity',
    connected: false,
    enterprise: true,
  },
  {
    id: 'webhooks',
    nameKey: 'customWebhooks',
    descriptionKey: 'customWebhooksDesc',
    icon: Webhook,
    category: 'productivity',
    connected: false,
    enterprise: true,
  },
  {
    id: 'api-access',
    nameKey: 'apiAccess',
    descriptionKey: 'apiAccessDesc',
    icon: Database,
    category: 'productivity',
    connected: false,
    enterprise: true,
  },
];

export default function Integrations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [configValue, setConfigValue] = useState('');

  const CATEGORY_LABELS: Record<string, string> = {
    marketing: t('integrations.marketingAnalytics'),
    payments: t('integrations.payments'),
    productivity: t('integrations.productivity'),
    communication: t('integrations.communication'),
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center mb-4">
            <Plug className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('integrations.loginRequired')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('integrations.loginToAccess')}
          </p>
          <Button onClick={() => navigate('/auth')}>{t('auth.signIn')}</Button>
        </div>
      </AppLayout>
    );
  }

  const handleConnect = (integration: Integration) => {
    if (integration.id === 'meta-pixel' || integration.id === 'google-analytics') {
      setConfiguring(integration);
      setConfigValue('');
    } else {
      // Simulate connection
      setIntegrations(prev =>
        prev.map(i =>
          i.id === integration.id ? { ...i, connected: true } : i
        )
      );
      toast.success(t('integrations.connectedSuccessfully', { name: t(`integrations.${integration.nameKey}`) }));
    }
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(i =>
        i.id === integrationId ? { ...i, connected: false } : i
      )
    );
    toast.success(t('integrations.disconnected'));
  };

  const handleSaveConfig = () => {
    if (!configValue.trim()) {
      toast.error(t('integrations.enterValidId'));
      return;
    }

    setIntegrations(prev =>
      prev.map(i =>
        i.id === configuring?.id ? { ...i, connected: true } : i
      )
    );
    toast.success(t('integrations.configured', { name: configuring ? t(`integrations.${configuring.nameKey}`) : '' }));
    setConfiguring(null);
    setConfigValue('');
  };

  const groupedIntegrations = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    category: key,
    label,
    items: integrations.filter(i => i.category === key),
  }));

  return (
    <>
      <Helmet>
        <title>{t('integrations.title')} - Brasil Base</title>
      </Helmet>
      <AppLayout>
        <div className="px-4 py-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                <Plug className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('integrations.title')}</h1>
                <p className="text-muted-foreground">
                  {t('integrations.subtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Connected Integrations */}
          {integrations.some(i => i.connected) && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                {t('integrations.connected')}
              </h2>
              <div className="rounded-xl gradient-border overflow-hidden">
                <div className="bg-card divide-y divide-border">
                  {integrations.filter(i => i.connected).map((integration) => {
                    const Icon = integration.icon;
                    return (
                      <div
                        key={integration.id}
                        className="flex items-center gap-4 p-4"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{t(`integrations.${integration.nameKey}`)}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {t(`integrations.${integration.descriptionKey}`)}
                          </p>
                        </div>
                        <Badge className="bg-primary/10 text-primary">
                          <Check className="w-3 h-3 mr-1" />
                          {t('integrations.connected')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Available Integrations by Category */}
          {groupedIntegrations.map((group) => {
            const availableInCategory = group.items.filter(i => !i.connected);
            if (availableInCategory.length === 0) return null;

            return (
              <div key={group.category} className="mb-6">
                <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                  {group.label}
                </h2>
                <div className="rounded-xl gradient-border overflow-hidden">
                  <div className="bg-card divide-y divide-border">
                    {availableInCategory.map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div
                          key={integration.id}
                          className="flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{t(`integrations.${integration.nameKey}`)}</p>
                              {integration.popular && (
                                <Badge variant="secondary" className="text-xs">{t('integrations.popular')}</Badge>
                              )}
                              {integration.enterprise && (
                                <Badge className="text-xs bg-foreground text-background">{t('integrations.enterprise')}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {t(`integrations.${integration.descriptionKey}`)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnect(integration)}
                            className="gradient-border"
                          >
                            {t('integrations.connect')}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* API Documentation Link */}
          <div className="mt-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card gradient-border p-4">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{t('integrations.needCustom')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('integrations.customDescription')}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                {t('integrations.viewApiDocs')}
              </Button>
            </div>
          </div>
        </div>

        {/* Configuration Dialog */}
        <Dialog open={!!configuring} onOpenChange={() => setConfiguring(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('integrations.configureTitle', { name: configuring ? t(`integrations.${configuring.nameKey}`) : '' })}</DialogTitle>
              <DialogDescription>
                {t('integrations.configureDescription', { name: configuring ? t(`integrations.${configuring.nameKey}`) : '' })}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="config-id">
                {configuring?.id === 'meta-pixel' ? t('integrations.pixelId') : t('integrations.measurementId')}
              </Label>
              <Input
                id="config-id"
                placeholder={configuring?.id === 'meta-pixel' ? t('integrations.pixelIdPlaceholder') : t('integrations.measurementIdPlaceholder')}
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {configuring?.id === 'meta-pixel'
                  ? t('integrations.metaHelp')
                  : t('integrations.googleHelp')}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfiguring(null)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveConfig}>
                <Settings2 className="w-4 h-4 mr-2" />
                {t('integrations.saveConfiguration')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
