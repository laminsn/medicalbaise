import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Calendar, Clock, Repeat, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { getUserCurrency } from '@/lib/currency';

interface CreateScheduledServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  serviceId?: string;
  serviceName?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function CreateScheduledServiceDialog({
  open,
  onOpenChange,
  providerId,
  providerName,
  serviceId,
  serviceName,
}: CreateScheduledServiceDialogProps) {
  const { t } = useTranslation();
  const { createScheduledService } = useScheduledServices();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(serviceName || '');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [preferredTime, setPreferredTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !startDate) return;
    
    setIsSubmitting(true);
    
    const result = await createScheduledService({
      providerId,
      serviceId,
      title: title.trim(),
      description: description.trim() || undefined,
      frequency,
      dayOfWeek: frequency === 'weekly' || frequency === 'biweekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      preferredTime: preferredTime || undefined,
      durationMinutes: parseInt(duration) || 60,
      pricePerVisit: price ? parseFloat(price) : undefined,
      startDate,
      endDate,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);
    
    if (result) {
      onOpenChange(false);
      // Reset form
      setTitle(serviceName || '');
      setDescription('');
      setFrequency('weekly');
      setDayOfWeek(1);
      setPreferredTime('09:00');
      setPrice('');
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5 text-primary" />
            {t('scheduling.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('scheduling.createDescription', { provider: providerName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('scheduling.serviceTitle')}</Label>
            <Input
              id="title"
              placeholder={t('scheduling.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('scheduling.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('scheduling.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>{t('scheduling.frequency')}</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t('scheduling.daily')}</SelectItem>
                <SelectItem value="weekly">{t('scheduling.weekly')}</SelectItem>
                <SelectItem value="biweekly">{t('scheduling.biweekly')}</SelectItem>
                <SelectItem value="monthly">{t('scheduling.monthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day of Week (for weekly/biweekly) */}
          {(frequency === 'weekly' || frequency === 'biweekly') && (
            <div className="space-y-2">
              <Label>{t('scheduling.dayOfWeek')}</Label>
              <Select 
                value={dayOfWeek.toString()} 
                onValueChange={(v) => setDayOfWeek(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label>{t('scheduling.dayOfMonth')}</Label>
              <Select 
                value={dayOfMonth.toString()} 
                onValueChange={(v) => setDayOfMonth(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('scheduling.preferredTime')}</Label>
              <Input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('scheduling.duration')}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>{t('scheduling.startDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : t('scheduling.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Price per Visit */}
          <div className="space-y-2">
            <Label>{t('scheduling.pricePerVisit')}</Label>
            <Input
              type="number"
              placeholder={`${getUserCurrency()} 0.00`}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('scheduling.notes')}</Label>
            <Textarea
              placeholder={t('scheduling.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('scheduling.creating')}
              </>
            ) : (
              <>
                <Repeat className="h-4 w-4 mr-2" />
                {t('scheduling.create')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
