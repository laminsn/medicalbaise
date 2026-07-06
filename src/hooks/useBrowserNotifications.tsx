import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const db = supabase as any;

const getVapidPublicKey = () =>
  (import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || import.meta.env.VITE_VAPID_PUBLIC_KEY || '').trim();

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export const useBrowserNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [subscriptionSaved, setSubscriptionSaved] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  useEffect(() => {
    const supported = 'Notification' in window;
    const pushSupported = supported && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    setIsPushSupported(pushSupported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Notification permission failed');
      return false;
    }
  }, [isSupported]);

  const saveSubscription = useCallback(async (subscription: PushSubscription) => {
    const userId = user?.id;
    if (!userId) return false;
    const json = subscription.toJSON();
    const endpoint = json.endpoint;
    const keys = json.keys || {};

    if (!endpoint || !keys.p256dh || !keys.auth) {
      setRegistrationError('Push subscription is missing browser keys');
      return false;
    }

    const { error } = await db.from('web_push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        subscription_json: json,
        user_agent: navigator.userAgent,
        device_label: navigator.platform || 'Browser',
        is_active: true,
        failure_count: 0,
      },
      { onConflict: 'endpoint' },
    );

    if (error) {
      setRegistrationError(error.message);
      return false;
    }

    setSubscriptionSaved(true);
    return true;
  }, [user?.id]);

  const registerPushSubscription = useCallback(async () => {
    setRegistrationError(null);
    if (!isSupported) return false;

    const granted = permission === 'granted' ? true : await requestPermission();
    if (!granted) return false;

    if (!isPushSupported) {
      setRegistrationError('Push messaging is not supported in this browser');
      return false;
    }

    const publicKey = getVapidPublicKey();
    if (!publicKey) {
      setRegistrationError('VITE_WEB_PUSH_PUBLIC_KEY is not configured');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/push-sw.js');
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      return saveSubscription(subscription);
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Push registration failed');
      return false;
    }
  }, [isSupported, isPushSupported, permission, requestPermission, saveSubscription]);

  const unsubscribePushSubscription = useCallback(async () => {
    const userId = user?.id;
    if (!isPushSupported || !userId) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration('/push-sw.js');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await db
          .from('web_push_subscriptions')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('endpoint', endpoint);
      }
      setSubscriptionSaved(false);
      return true;
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Push unsubscribe failed');
      return false;
    }
  }, [isPushSupported, user?.id]);

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return null;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.data?.url) {
          const url = options.data.url;
          if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) {
            window.location.href = url;
          }
        }
      };

      return notification;
    } catch (error) {
      return null;
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    isPushSupported,
    hasVapidPublicKey: Boolean(getVapidPublicKey()),
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    subscriptionSaved,
    registrationError,
    requestPermission,
    registerPushSubscription,
    unsubscribePushSubscription,
    sendNotification,
  };
};
