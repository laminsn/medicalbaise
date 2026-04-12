import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';

const DISMISSED_KEY = 'notification_dismissed_at';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function shouldShowBanner(): boolean {
  if (typeof window === 'undefined') return false;
  const dismissedAt = localStorage.getItem(DISMISSED_KEY);
  if (!dismissedAt) return true;
  return Date.now() - Number(dismissedAt) >= THIRTY_DAYS_MS;
}

export const NotificationPermissionBanner = () => {
  const { t } = useTranslation();
  const { isSupported, permission, requestPermission } = useBrowserNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isSupported && permission === 'default') {
      setVisible(shouldShowBanner());
    }
  }, [isSupported, permission]);

  // Don't show if not supported, already granted/denied, or dismissed within 30 days
  if (!isSupported || permission !== 'default' || !visible) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleEnable = async () => {
    await requestPermission();
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-lg p-4 shadow-lg z-40">
      <button
        onClick={handleDismiss}
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
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              {t('notifications.later')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
