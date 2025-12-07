import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Video, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';

const meetingSchema = z.object({
  meeting_type: z.string(),
  scheduled_date: z.date(),
  scheduled_time: z.string(),
  duration_minutes: z.number().min(15).max(180),
  notes: z.string().optional(),
  meeting_url: z.string().url().optional().or(z.literal('')),
});

type MeetingFormValues = z.infer<typeof meetingSchema>;

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestUserId?: string;
  jobId?: string;
  activeJobId?: string;
  providerTier?: string;
}

export function ScheduleMeetingDialog({ 
  open, 
  onOpenChange,
  guestUserId,
  jobId,
  activeJobId,
  providerTier = 'free',
}: ScheduleMeetingDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isProOrAbove = ['pro', 'elite', 'enterprise'].includes(providerTier);

  const form = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      meeting_type: 'zoom',
      scheduled_date: new Date(),
      scheduled_time: '10:00',
      duration_minutes: 30,
      notes: '',
      meeting_url: '',
    },
  });

  const onSubmit = async (data: MeetingFormValues) => {
    if (!user) return;

    if (!isProOrAbove) {
      toast({
        title: t('video.proRequired'),
        description: t('video.proRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const [hours, minutes] = data.scheduled_time.split(':').map(Number);
    const scheduledAt = new Date(data.scheduled_date);
    scheduledAt.setHours(hours, minutes, 0, 0);

    const { error } = await supabase
      .from('video_meetings')
      .insert({
        host_user_id: user.id,
        guest_user_id: guestUserId || null,
        job_id: jobId || null,
        active_job_id: activeJobId || null,
        meeting_type: data.meeting_type,
        meeting_url: data.meeting_url || null,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: data.duration_minutes,
        notes: data.notes || null,
        status: 'scheduled',
      });

    setIsSubmitting(false);

    if (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: t('common.error'),
        description: t('video.createError'),
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: t('video.meetingScheduled'),
      description: t('video.meetingScheduledDesc'),
    });

    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            {t('video.scheduleMeeting')}
          </DialogTitle>
          <DialogDescription>
            {t('video.scheduleMeetingDesc')}
          </DialogDescription>
        </DialogHeader>

        {!isProOrAbove && (
          <div className="bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-foreground">{t('video.proFeature')}</span>
              <Badge className="bg-amber-500 text-white">Pro+</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('video.upgradeToSchedule')}
            </p>
            <Button className="mt-3" size="sm" variant="outline">
              {t('common.upgradeToPro')}
            </Button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="meeting_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('video.meetingType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="zoom">
                        <div className="flex items-center gap-2">
                          <span>🎥</span> Zoom
                        </div>
                      </SelectItem>
                      <SelectItem value="google_meet">
                        <div className="flex items-center gap-2">
                          <span>📹</span> Google Meet
                        </div>
                      </SelectItem>
                      <SelectItem value="in_app">
                        <div className="flex items-center gap-2">
                          <span>📱</span> {t('video.inAppCall')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="meeting_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('video.meetingUrl')} ({t('common.optional')})</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://zoom.us/j/..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('notifications.date')}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t('notifications.pickDate')}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('notifications.time')}</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('video.duration')}</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(Number(val))} 
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="15">15 {t('video.minutes')}</SelectItem>
                      <SelectItem value="30">30 {t('video.minutes')}</SelectItem>
                      <SelectItem value="45">45 {t('video.minutes')}</SelectItem>
                      <SelectItem value="60">1 {t('video.hour')}</SelectItem>
                      <SelectItem value="90">1.5 {t('video.hours')}</SelectItem>
                      <SelectItem value="120">2 {t('video.hours')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('video.notes')} ({t('common.optional')})</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('video.notesPlaceholder')} 
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting || !isProOrAbove}>
                {isSubmitting ? t('common.scheduling') : t('video.scheduleMeeting')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
