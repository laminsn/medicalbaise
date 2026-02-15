import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Warn 2 minutes before logout
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll'] as const;

/**
 * Auto-logout after inactivity. Monitors user interaction events
 * and signs out the user after 30 minutes of no activity.
 */
export function useSessionTimeout() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    if (!user) return;

    // Warning before timeout
    warningRef.current = setTimeout(() => {
      toast({
        title: 'Session expiring soon',
        description: 'You will be logged out in 2 minutes due to inactivity. Move your mouse or press a key to stay logged in.',
      });
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Actual timeout
    timeoutRef.current = setTimeout(() => {
      signOut();
      toast({
        title: 'Session expired',
        description: 'You have been logged out due to inactivity.',
        variant: 'destructive',
      });
    }, INACTIVITY_TIMEOUT_MS);
  }, [user, signOut, toast]);

  useEffect(() => {
    if (!user) return;

    resetTimer();

    const handleActivity = () => {
      // Debounce: only reset if more than 30 seconds since last reset
      if (Date.now() - lastActivityRef.current > 30000) {
        resetTimer();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);
}
