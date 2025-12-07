import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';

export const NotificationPermissionBanner = () => {
  const { t } = useTranslation();
  const { isSupported, permission, requestPermission } = useBrowserNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if not supported, already granted/denied, or dismissed
  if (!isSupported || permission !== 'default' || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    await requestPermission();
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-lg p-4 shadow-lg z-40">
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 rounded-full p-2">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm">{t('notifications.enableTitle')}</h4>
          <p className="text-xs text-muted-foreground mt-1">
            {t('notifications.enableDescription')}
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleEnable}>
              {t('notifications.enable')}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
              {t('notifications.later')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
