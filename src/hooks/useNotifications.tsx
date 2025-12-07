import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: Json;
  created_at: string;
  expires_at: string | null;
}

export interface ScheduledReminder {
  id: string;
  user_id: string;
  title: string;
  message: string;
  reminder_type: string;
  scheduled_for: string;
  repeat_interval: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  next_trigger_at: string | null;
  related_job_id: string | null;
  related_provider_id: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  reminder_lead_time: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  };

  // Fetch reminders
  const fetchReminders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('scheduled_reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching reminders:', error);
      return;
    }

    setReminders(data || []);
  };

  // Fetch preferences
  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching preferences:', error);
      return;
    }

    if (data) {
      setPreferences(data);
    } else {
      // Create default preferences
      const { data: newPrefs, error: createError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (!createError && newPrefs) {
        setPreferences(newPrefs);
      }
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return;
    }

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return;
    }

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Create reminder
  const createReminder = async (reminder: {
    title: string;
    message: string;
    reminder_type: string;
    scheduled_for: string;
    repeat_interval: string | null;
    is_active: boolean;
    related_job_id: string | null;
    related_provider_id: string | null;
    metadata: Json;
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('scheduled_reminders')
      .insert({
        title: reminder.title,
        message: reminder.message,
        reminder_type: reminder.reminder_type,
        scheduled_for: reminder.scheduled_for,
        repeat_interval: reminder.repeat_interval,
        is_active: reminder.is_active,
        related_job_id: reminder.related_job_id,
        related_provider_id: reminder.related_provider_id,
        metadata: reminder.metadata,
        user_id: user.id,
        next_trigger_at: reminder.scheduled_for,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create reminder',
        variant: 'destructive',
      });
      return null;
    }

    setReminders(prev => [...prev, data as ScheduledReminder]);
    toast({
      title: 'Reminder Created',
      description: 'Your reminder has been scheduled',
    });
    return data;
  };

  // Update reminder
  const updateReminder = async (reminderId: string, updates: { is_active?: boolean }) => {
    const { error } = await supabase
      .from('scheduled_reminders')
      .update(updates)
      .eq('id', reminderId);

    if (error) {
      console.error('Error updating reminder:', error);
      return false;
    }

    setReminders(prev =>
      prev.map(r => r.id === reminderId ? { ...r, ...updates } : r)
    );
    return true;
  };

  // Delete reminder
  const deleteReminder = async (reminderId: string) => {
    const { error } = await supabase
      .from('scheduled_reminders')
      .delete()
      .eq('id', reminderId);

    if (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }

    setReminders(prev => prev.filter(r => r.id !== reminderId));
    return true;
  };

  // Update preferences
  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return false;

    const { error } = await supabase
      .from('notification_preferences')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating preferences:', error);
      return false;
    }

    setPreferences(prev => prev ? { ...prev, ...updates } : null);
    return true;
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setReminders([]);
      setPreferences(null);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    Promise.all([fetchNotifications(), fetchReminders(), fetchPreferences()])
      .finally(() => setIsLoading(false));

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    reminders,
    preferences,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createReminder,
    updateReminder,
    deleteReminder,
    updatePreferences,
    refreshNotifications: fetchNotifications,
    refreshReminders: fetchReminders,
  };
}
