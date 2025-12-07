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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';

const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  reminder_type: z.string(),
  scheduled_date: z.date(),
  scheduled_time: z.string(),
  repeat_interval: z.string().optional(),
});

type ReminderFormValues = z.infer<typeof reminderSchema>;

interface CreateReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateReminderDialog({ open, onOpenChange }: CreateReminderDialogProps) {
  const { t } = useTranslation();
  const { createReminder } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      title: '',
      message: '',
      reminder_type: 'custom',
      scheduled_date: new Date(),
      scheduled_time: '09:00',
      repeat_interval: '',
    },
  });

  const onSubmit = async (data: ReminderFormValues) => {
    setIsSubmitting(true);
    
    const [hours, minutes] = data.scheduled_time.split(':').map(Number);
    const scheduledFor = new Date(data.scheduled_date);
    scheduledFor.setHours(hours, minutes, 0, 0);

    await createReminder({
      title: data.title,
      message: data.message,
      reminder_type: data.reminder_type,
      scheduled_for: scheduledFor.toISOString(),
      repeat_interval: data.repeat_interval || null,
      is_active: true,
      related_job_id: null,
      related_provider_id: null,
      metadata: {},
    });

    setIsSubmitting(false);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('notifications.createReminder')}</DialogTitle>
          <DialogDescription>
            {t('notifications.createReminderDesc')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notifications.reminderTitle')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('notifications.reminderTitlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notifications.reminderMessage')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('notifications.reminderMessagePlaceholder')} 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminder_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notifications.reminderType')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="custom">{t('notifications.typeCustom')}</SelectItem>
                      <SelectItem value="appointment">{t('notifications.typeAppointment')}</SelectItem>
                      <SelectItem value="maintenance">{t('notifications.typeMaintenance')}</SelectItem>
                      <SelectItem value="follow_up">{t('notifications.typeFollowUp')}</SelectItem>
                    </SelectContent>
                  </Select>
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
              name="repeat_interval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notifications.repeat')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('notifications.noRepeat')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">{t('notifications.noRepeat')}</SelectItem>
                      <SelectItem value="daily">{t('notifications.daily')}</SelectItem>
                      <SelectItem value="weekly">{t('notifications.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('notifications.monthly')}</SelectItem>
                      <SelectItem value="yearly">{t('notifications.yearly')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t('common.creating') : t('notifications.createReminder')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
