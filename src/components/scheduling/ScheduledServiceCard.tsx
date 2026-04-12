import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Repeat, 
  Pause, 
  Play, 
  Trash2,
  DollarSign,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduledService } from '@/hooks/useScheduledServices';
import { formatPrice } from '@/lib/currency';

interface ScheduledServiceCardProps {
  service: ScheduledService;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ScheduledServiceCard({ 
  service, 
  onPause, 
  onResume, 
  onCancel 
}: ScheduledServiceCardProps) {
  const { t } = useTranslation();

  const getStatusBadge = () => {
    switch (service.status) {
      case 'active':
        return <Badge className="bg-green-600">{t('scheduling.active')}</Badge>;
      case 'paused':
        return <Badge variant="secondary">{t('scheduling.paused')}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">{t('scheduling.cancelled')}</Badge>;
      default:
        return null;
    }
  };

  const getScheduleText = () => {
    const freq = FREQUENCY_LABELS[service.frequency] || service.frequency;
    
    if (service.frequency === 'weekly' || service.frequency === 'biweekly') {
      const day = service.day_of_week !== null ? DAY_NAMES[service.day_of_week] : '';
      return `${freq} on ${day}`;
    }
    
    if (service.frequency === 'monthly' && service.day_of_month) {
      return `${freq} on the ${service.day_of_month}${getOrdinalSuffix(service.day_of_month)}`;
    }
    
    return freq;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">{service.title}</h3>
            {service.provider && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <User className="h-3 w-3" />
                {service.provider.business_name}
              </div>
            )}
          </div>
          {getStatusBadge()}
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}

        {/* Schedule Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Repeat className="h-4 w-4" />
            <span>{getScheduleText()}</span>
          </div>
          
          {service.preferred_time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{service.preferred_time}</span>
            </div>
          )}
          
          {service.next_scheduled_date && service.status === 'active' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{t('scheduling.next')}: {format(new Date(service.next_scheduled_date), 'MMM d')}</span>
            </div>
          )}
          
          {service.price_per_visit && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{formatPrice(service.price_per_visit)}/visit</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2">
          <span>{service.total_visits} {t('scheduling.totalVisits')}</span>
          {service.last_completed_date && (
            <span>{t('scheduling.lastVisit')}: {format(new Date(service.last_completed_date), 'MMM d')}</span>
          )}
        </div>

        {/* Actions */}
        {service.status !== 'cancelled' && (
          <div className="flex gap-2 pt-2">
            {service.status === 'active' ? (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onPause(service.id)}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-1" />
                {t('scheduling.pause')}
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onResume(service.id)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                {t('scheduling.resume')}
              </Button>
            )}
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={() => onCancel(service.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
