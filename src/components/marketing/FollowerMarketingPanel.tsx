import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFollowerStats } from '@/hooks/useFollowerStats';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Send,
  Users,
  Megaphone,
  CalendarPlus,
  Tag,
  Loader2,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  recipient_count: number;
}

export function FollowerMarketingPanel() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [providerName, setProviderName] = useState('');
  const { followersCount, isLoading: statsLoading } = useFollowerStats(providerId);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('announcement');
  const [isSending, setIsSending] = useState(false);

  // History
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Fetch provider info
  useEffect(() => {
    const fetchProvider = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('providers')
        .select('id, business_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProviderId(data.id);
        setProviderName(data.business_name);
      }
    };

    fetchProvider();
  }, [user]);

  // Fetch notification history (recent blasts sent by this provider)
  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);

    // We'll query notifications where metadata contains our provider_id
    // and type is one of the marketing types
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, type, created_at, metadata')
      .eq('type', 'marketing_blast')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      // Group by title+message+created_at to approximate blast batches
      const blasts = new Map<string, NotificationHistory>();
      data.forEach((n) => {
        const meta = n.metadata as Record<string, unknown> | null;
        if (meta?.provider_id !== providerId) return;

        const key = `${n.title}|${n.created_at}`;
        if (blasts.has(key)) {
          const existing = blasts.get(key)!;
          existing.recipient_count += 1;
        } else {
          blasts.set(key, {
            id: n.id,
            title: n.title,
            message: n.message,
            type: (meta?.blast_type as string) || 'announcement',
            created_at: n.created_at,
            recipient_count: 1,
          });
        }
      });

      setHistory(Array.from(blasts.values()));
    }

    setLoadingHistory(false);
  }, [user, providerId]);

  useEffect(() => {
    if (providerId) fetchHistory();
  }, [providerId, fetchHistory]);

  const handleSendBlast = async () => {
    if (!providerId || !title.trim() || !message.trim()) {
      toast.error(t('marketing.fillAllFields', 'Please fill in all fields'));
      return;
    }

    if (followersCount === 0) {
      toast.error(t('marketing.noFollowers', 'You have no followers yet'));
      return;
    }

    setIsSending(true);

    try {
      // Get all follower IDs
      const { data: followers, error: followError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_provider_id', providerId);

      if (followError || !followers?.length) {
        toast.error(t('marketing.errorFetchingFollowers', 'Could not fetch followers'));
        setIsSending(false);
        return;
      }

      // Create notification for each follower
      const notifications = followers.map((f) => ({
        user_id: f.follower_id,
        title: title.trim(),
        message: message.trim(),
        type: 'marketing_blast' as string,
        priority: 'normal' as string,
        action_url: `/provider/${providerId}`,
        metadata: {
          provider_id: providerId,
          provider_name: providerName,
          blast_type: notificationType,
        } as Record<string, string>,
      }));

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        const { error } = await supabase.from('notifications').insert(batch);
        if (error) {

          throw error;
        }
      }

      toast.success(
        t('marketing.blastSent', 'Notification sent to {{count}} followers!', {
          count: followers.length,
        })
      );

      // Reset form
      setTitle('');
      setMessage('');
      setNotificationType('announcement');
      fetchHistory();
    } catch (err) {

      toast.error(t('marketing.blastError', 'Failed to send notifications'));
    } finally {
      setIsSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promotion':
        return <Tag className="h-4 w-4 text-primary" />;
      case 'event':
        return <CalendarPlus className="h-4 w-4 text-primary" />;
      case 'update':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      default:
        return <Megaphone className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'promotion':
        return t('marketing.typePromotion', 'Promotion');
      case 'event':
        return t('marketing.typeEvent', 'Event');
      case 'update':
        return t('marketing.typeUpdate', 'Update');
      default:
        return t('marketing.typeAnnouncement', 'Announcement');
    }
  };

  const templates = [
    {
      type: 'promotion',
      title: t('marketing.templatePromoTitle', '🔥 Special Offer!'),
      message: t(
        'marketing.templatePromoMsg',
        'Exclusive discount for my followers! Book this week and get 20% off. Limited spots available.'
      ),
    },
    {
      type: 'event',
      title: t('marketing.templateEventTitle', '📅 New Availability'),
      message: t(
        'marketing.templateEventMsg',
        'I just opened new appointment slots this week. Book now before they fill up!'
      ),
    },
    {
      type: 'update',
      title: t('marketing.templateUpdateTitle', '✨ New Service Added'),
      message: t(
        'marketing.templateUpdateMsg',
        'I\'m now offering a new service! Check out my profile for details and pricing.'
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {statsLoading ? '—' : followersCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('marketing.totalFollowers', 'Total Followers')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-secondary">
              <Send className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{history.length}</p>
              <p className="text-xs text-muted-foreground">
                {t('marketing.blastsSent', 'Blasts Sent')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {history.reduce((sum, h) => sum + h.recipient_count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('marketing.totalReached', 'Total Reached')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Send Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('marketing.sendNotification', 'Send Notification to Followers')}
          </CardTitle>
          <CardDescription>
            {t(
              'marketing.sendDesc',
              'Send a direct notification to all your followers. Use it for promotions, updates, or announcements.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Templates */}
          <div>
            <p className="text-sm font-medium mb-2">
              {t('marketing.quickTemplates', 'Quick Templates')}
            </p>
            <div className="flex flex-wrap gap-2">
              {templates.map((tmpl) => (
                <Button
                  key={tmpl.type}
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setTitle(tmpl.title);
                    setMessage(tmpl.message);
                    setNotificationType(tmpl.type);
                  }}
                >
                  {getTypeIcon(tmpl.type)}
                  {getTypeLabel(tmpl.type)}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('marketing.notificationType', 'Type')}
            </label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    {t('marketing.typeAnnouncement', 'Announcement')}
                  </span>
                </SelectItem>
                <SelectItem value="promotion">
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {t('marketing.typePromotion', 'Promotion')}
                  </span>
                </SelectItem>
                <SelectItem value="event">
                  <span className="flex items-center gap-2">
                    <CalendarPlus className="h-4 w-4" />
                    {t('marketing.typeEvent', 'Event')}
                  </span>
                </SelectItem>
                <SelectItem value="update">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {t('marketing.typeUpdate', 'Update')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('marketing.title', 'Title')}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('marketing.titlePlaceholder', 'e.g. Special offer this week!')}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {title.length}/100
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('marketing.message', 'Message')}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(
                'marketing.messagePlaceholder',
                'Write your message to followers...'
              )}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500
            </p>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {t('marketing.preview', 'Preview')}
              </p>
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title || '...'}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {message || '...'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('marketing.fromProvider', 'From {{name}}', {
                      name: providerName,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button
            className="w-full gap-2"
            onClick={handleSendBlast}
            disabled={
              isSending || !title.trim() || !message.trim() || followersCount === 0
            }
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('marketing.sending', 'Sending...')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('marketing.sendTo', 'Send to {{count}} followers', {
                  count: followersCount,
                })}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('marketing.history', 'Notification History')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                {t(
                  'marketing.noHistory',
                  "You haven't sent any notifications yet"
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((blast) => (
                <div
                  key={blast.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="mt-0.5">{getTypeIcon(blast.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{blast.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {blast.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {blast.recipient_count}{' '}
                        {t('marketing.reached', 'reached')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(blast.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-primary mt-1 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
