import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPin, DollarSign, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const quoteRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  location_address: z.string().min(5, 'Please enter a valid address').max(200),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional(),
});

type QuoteRequestFormData = z.infer<typeof quoteRequestSchema>;

interface QuoteRequestFormProps {
  providerId?: string;
  providerName?: string;
  categoryId?: string;
  categoryName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuoteRequestForm({
  providerId,
  providerName,
  categoryId,
  categoryName,
  isOpen,
  onClose,
}: QuoteRequestFormProps) {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [urgency, setUrgency] = useState('normal');
  const [timelineFlexibility, setTimelineFlexibility] = useState('flexible');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<QuoteRequestFormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: {
      customer_email: profile?.email || '',
      customer_phone: profile?.phone || '',
    },
  });

  const onSubmit = async (data: QuoteRequestFormData) => {
    if (!user) {
      toast({
        title: t('auth.loginRequired'),
        description: t('quote.loginToRequest'),
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('quote_requests').insert({
        customer_id: user.id,
        provider_id: providerId || null,
        category_id: categoryId || null,
        title: data.title,
        description: data.description,
        budget_min: data.budget_min ? parseFloat(data.budget_min) : null,
        budget_max: data.budget_max ? parseFloat(data.budget_max) : null,
        preferred_start_date: preferredDate ? format(preferredDate, 'yyyy-MM-dd') : null,
        timeline_flexibility: timelineFlexibility,
        location_address: data.location_address,
        urgency,
        customer_phone: data.customer_phone || null,
        customer_email: data.customer_email || profile?.email || null,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: t('quote.requestSent'),
        description: t('quote.requestSentDescription'),
      });

      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast({
        title: t('errors.somethingWentWrong'),
        description: t('quote.requestError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('quote.requestQuote')}</DialogTitle>
          <DialogDescription>
            {providerId && providerName
              ? t('quote.requestFromProvider', { provider: providerName })
              : categoryName
              ? t('quote.requestForCategory', { category: categoryName })
              : t('quote.requestDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('quote.serviceTitle')}</Label>
            <Input
              id="title"
              placeholder={t('quote.titlePlaceholder')}
              {...register('title')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('quote.serviceDescription')}</Label>
            <Textarea
              id="description"
              placeholder={t('quote.descriptionPlaceholder')}
              rows={4}
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Budget Range */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t('quote.budgetRange')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="number"
                  placeholder={t('quote.minBudget')}
                  {...register('budget_min')}
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder={t('quote.maxBudget')}
                  {...register('budget_max')}
                />
              </div>
            </div>
          </div>

          {/* Preferred Start Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {t('quote.preferredDate')}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !preferredDate && 'text-muted-foreground'
                  )}
                >
                  {preferredDate ? format(preferredDate, 'PPP') : t('quote.selectDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={preferredDate}
                  onSelect={setPreferredDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Timeline Flexibility */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('quote.timelineFlexibility')}
            </Label>
            <Select value={timelineFlexibility} onValueChange={setTimelineFlexibility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flexible">{t('quote.flexible')}</SelectItem>
                <SelectItem value="somewhat_flexible">{t('quote.somewhatFlexible')}</SelectItem>
                <SelectItem value="fixed">{t('quote.fixedDate')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label>{t('quote.urgency')}</Label>
            <Select value={urgency} onValueChange={setUrgency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('quote.urgencyLow')}</SelectItem>
                <SelectItem value="normal">{t('quote.urgencyNormal')}</SelectItem>
                <SelectItem value="high">{t('quote.urgencyHigh')}</SelectItem>
                <SelectItem value="emergency">{t('quote.urgencyEmergency')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t('quote.serviceLocation')}
            </Label>
            <Input
              placeholder={t('quote.locationPlaceholder')}
              {...register('location_address')}
              className={errors.location_address ? 'border-destructive' : ''}
            />
            {errors.location_address && (
              <p className="text-sm text-destructive">{errors.location_address.message}</p>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <Label>{t('quote.contactInfo')}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="email"
                placeholder={t('auth.email')}
                {...register('customer_email')}
              />
              <Input
                type="tel"
                placeholder={t('quote.phone')}
                {...register('customer_phone')}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                t('common.loading')
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {t('quote.sendRequest')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}