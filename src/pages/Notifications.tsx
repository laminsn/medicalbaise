import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2, Check, CheckCheck, Settings, Clock, Calendar, Plus, ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, Notification, ScheduledReminder } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateReminderDialog } from '@/components/notifications/CreateReminderDialog';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'appointment':
      return '📅';
    case 'reminder':
      return '⏰';
    case 'job_update':
      return '🔨';
    case 'bid_update':
      return '💼';
    case 'payment':
      return '💰';
    case 'system':
      return '⚙️';
    default:
      return '🔔';
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return <Badge variant="destructive">Urgent</Badge>;
    case 'high':
      return <Badge className="bg-orange-500">High</Badge>;
    default:
      return null;
  }
};

const getReminderTypeBadge = (type: string) => {
  switch (type) {
    case 'appointment':
      return <Badge variant="secondary">Appointment</Badge>;
    case 'maintenance':
      return <Badge className="bg-blue-500 text-white">Maintenance</Badge>;
    case 'follow_up':
      return <Badge className="bg-purple-500 text-white">Follow-up</Badge>;
    default:
      return <Badge variant="outline">Custom</Badge>;
  }
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const {
    notifications,
    reminders,
    preferences,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteReminder,
    updateReminder,
    updatePreferences,
  } = useNotifications();

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bell className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('notifications.title')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('notifications.loginRequired')}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {t('auth.login')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('notifications.title')}</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unreadCount} {t('notifications.unread')}
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        <Tabs defaultValue="notifications" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t('notifications.notifications')}
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('notifications.reminders')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {t('notifications.settings')}
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground">{t('notifications.noNotifications')}</h3>
                  <p className="text-sm text-muted-foreground">{t('notifications.noNotificationsDesc')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    onNavigate={(url) => navigate(url)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reminders Tab */}
          <TabsContent value="reminders" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateReminder(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('notifications.createReminder')}
              </Button>
            </div>

            {reminders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground">{t('notifications.noReminders')}</h3>
                  <p className="text-sm text-muted-foreground">{t('notifications.noRemindersDesc')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {reminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onToggle={(active) => updateReminder(reminder.id, { is_active: active })}
                    onDelete={() => deleteReminder(reminder.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{t('notifications.preferences')}</CardTitle>
                <CardDescription>{t('notifications.preferencesDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="in-app">{t('notifications.inAppNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('notifications.inAppDesc')}</p>
                  </div>
                  <Switch
                    id="in-app"
                    checked={preferences?.in_app_enabled ?? true}
                    onCheckedChange={(checked) => updatePreferences({ in_app_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email">{t('notifications.emailNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('notifications.emailDesc')}</p>
                  </div>
                  <Switch
                    id="email"
                    checked={preferences?.email_enabled ?? true}
                    onCheckedChange={(checked) => updatePreferences({ email_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push">{t('notifications.pushNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('notifications.pushDesc')}</p>
                  </div>
                  <Switch
                    id="push"
                    checked={preferences?.push_enabled ?? true}
                    onCheckedChange={(checked) => updatePreferences({ push_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sms">{t('notifications.smsNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">{t('notifications.smsDesc')}</p>
                  </div>
                  <Switch
                    id="sms"
                    checked={preferences?.sms_enabled ?? false}
                    onCheckedChange={(checked) => updatePreferences({ sms_enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateReminderDialog 
          open={showCreateReminder} 
          onOpenChange={setShowCreateReminder} 
        />
      </div>
    </AppLayout>
  );
}

function NotificationCard({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  onNavigate 
}: { 
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
  onNavigate: (url: string) => void;
}) {
  return (
    <Card className={cn(!notification.is_read && "border-primary/50 bg-primary/5")}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <span className="text-2xl flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-medium",
                  !notification.is_read ? "text-foreground" : "text-muted-foreground"
                )}>
                  {notification.title}
                </h3>
                {getPriorityBadge(notification.priority)}
              </div>
              <div className="flex items-center gap-1">
                {!notification.is_read && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMarkAsRead}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              {notification.action_url && (
                <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onNavigate(notification.action_url!)}>
                  View Details →
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReminderCard({
  reminder,
  onToggle,
  onDelete,
}: {
  reminder: ScheduledReminder;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  const isPast = new Date(reminder.scheduled_for) < new Date();

  return (
    <Card className={cn(!reminder.is_active && "opacity-60")}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{reminder.title}</h3>
                  {getReminderTypeBadge(reminder.reminder_type)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{reminder.message}</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={reminder.is_active}
                  onCheckedChange={onToggle}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className={cn(isPast && !reminder.repeat_interval && "text-destructive")}>
                {format(new Date(reminder.scheduled_for), 'PPp')}
              </span>
              {reminder.repeat_interval && (
                <Badge variant="outline" className="text-xs">
                  Repeats {reminder.repeat_interval}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
