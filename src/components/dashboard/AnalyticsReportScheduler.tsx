import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Mail, Calendar, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ReportSchedule {
  id: string;
  provider_id: string;
  email: string;
  frequency: string;
  day_of_week: number | null;
  day_of_month: number | null;
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string | null;
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

export function AnalyticsReportScheduler() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ReportSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        // Get provider ID
        const { data: provider } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!provider) {
          setLoading(false);
          return;
        }

        setProviderId(provider.id);

        // Get existing schedule
        const { data: existingSchedule } = await supabase
          .from('analytics_report_schedules')
          .select('*')
          .eq('provider_id', provider.id)
          .maybeSingle();

        if (existingSchedule) {
          setSchedule(existingSchedule);
          setEmail(existingSchedule.email);
          setFrequency(existingSchedule.frequency);
          setDayOfWeek(existingSchedule.day_of_week?.toString() || '1');
          setDayOfMonth(existingSchedule.day_of_month?.toString() || '1');
          setIsActive(existingSchedule.is_active);
        } else if (user.email) {
          setEmail(user.email);
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const calculateNextSendAt = () => {
    const now = new Date();
    const nextSend = new Date();

    if (frequency === 'weekly') {
      const targetDay = parseInt(dayOfWeek);
      const currentDay = now.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      nextSend.setDate(now.getDate() + daysUntil);
    } else {
      const targetDayOfMonth = parseInt(dayOfMonth);
      nextSend.setDate(targetDayOfMonth);
      if (nextSend <= now) {
        nextSend.setMonth(nextSend.getMonth() + 1);
      }
    }

    nextSend.setHours(9, 0, 0, 0); // Send at 9 AM
    return nextSend.toISOString();
  };

  const handleSave = async () => {
    if (!providerId || !email) return;

    setSaving(true);
    try {
      const scheduleData = {
        provider_id: providerId,
        email,
        frequency,
        day_of_week: frequency === 'weekly' ? parseInt(dayOfWeek) : null,
        day_of_month: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
        is_active: isActive,
        next_send_at: isActive ? calculateNextSendAt() : null,
      };

      if (schedule) {
        // Update existing
        const { error } = await supabase
          .from('analytics_report_schedules')
          .update(scheduleData)
          .eq('id', schedule.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('analytics_report_schedules')
          .insert(scheduleData);

        if (error) throw error;
      }

      toast.success(t('tracking.scheduleSaved', 'Report schedule saved successfully'));
      
      // Refresh schedule
      const { data: updatedSchedule } = await supabase
        .from('analytics_report_schedules')
        .select('*')
        .eq('provider_id', providerId)
        .maybeSingle();
      
      setSchedule(updatedSchedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error(t('tracking.scheduleError', 'Failed to save schedule'));
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestReport = async () => {
    if (!providerId) return;

    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-analytics-report', {
        body: { providerId, manual: true },
      });

      if (error) throw error;
      toast.success(t('tracking.testReportSent', 'Test report sent to your email'));
    } catch (error) {
      console.error('Error sending test report:', error);
      toast.error(t('tracking.testReportError', 'Failed to send test report'));
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          {t('tracking.emailReports', 'Email Reports')}
        </CardTitle>
        <CardDescription>
          {t('tracking.emailReportsDesc', 'Schedule automatic analytics reports to your email')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('tracking.reportEmail', 'Email Address')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label>{t('tracking.frequency', 'Frequency')}</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">{t('tracking.weekly', 'Weekly')}</SelectItem>
              <SelectItem value="monthly">{t('tracking.monthly', 'Monthly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {frequency === 'weekly' && (
          <div className="space-y-2">
            <Label>{t('tracking.dayOfWeek', 'Day of Week')}</Label>
            <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {t(`tracking.${day.label.toLowerCase()}`, day.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {frequency === 'monthly' && (
          <div className="space-y-2">
            <Label>{t('tracking.dayOfMonth', 'Day of Month')}</Label>
            <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between py-2">
          <div>
            <Label>{t('tracking.enableReports', 'Enable Reports')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('tracking.enableReportsDesc', 'Receive automated reports on schedule')}
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {schedule?.last_sent_at && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('tracking.lastSent', 'Last sent')}: {format(new Date(schedule.last_sent_at), 'MMM d, yyyy HH:mm')}
          </div>
        )}

        {schedule?.next_send_at && isActive && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('tracking.nextReport', 'Next report')}: {format(new Date(schedule.next_send_at), 'MMM d, yyyy')}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving || !email}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('common.save', 'Save')}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendTestReport} 
            disabled={sendingTest || !email}
          >
            {sendingTest ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {t('tracking.sendTestReport', 'Send Test Report')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
