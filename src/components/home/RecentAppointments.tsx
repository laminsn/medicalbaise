import { Link } from 'react-router-dom';
import { Clock, MapPin, Banknote, AlertCircle, Calendar, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MEDICAL_CATEGORIES } from '@/lib/constants';

interface Appointment {
  id: string;
  title: string;
  category_id: string;
  location: string | null;
  consultation_fee_min: number | null;
  consultation_fee_max: number | null;
  urgency: 'emergency' | 'urgent' | 'routine' | 'follow-up' | null;
  available_slots: number | null;
  created_at: string;
}

export function RecentAppointments() {
  const { t, i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt';
  const dateLocale = isPortuguese ? ptBR : enUS;

  const { data: appointments, isLoading, error } = useQuery({
    queryKey: ['recent-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          title,
          category_id,
          location,
          consultation_fee_min,
          consultation_fee_max,
          urgency,
          available_slots,
          created_at
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Appointment[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const getUrgencyBadge = (urgency: string | null) => {
    switch (urgency) {
      case 'emergency':
        return (
          <Badge variant="destructive" className="text-xs px-2 py-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t('appointments.emergency')}
          </Badge>
        );
      case 'urgent':
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-xs px-2 py-0">
            <Clock className="w-3 h-3 mr-1" />
            {t('appointments.urgent')}
          </Badge>
        );
      case 'follow-up':
        return (
          <Badge variant="secondary" className="text-xs px-2 py-0">
            <Calendar className="w-3 h-3 mr-1" />
            {t('appointments.followUp')}
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <section className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {t('appointments.recentAppointments')}
            </h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl p-4 border border-border">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-center">
            <p className="text-sm">{t('appointments.errorLoading')}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <section className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {t('appointments.recentAppointments')}
            </h2>
          </div>
          <div className="text-center py-8 bg-card rounded-xl border border-border">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {t('appointments.noRecentAppointments')}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t('appointments.recentAppointments')}
          </h2>
          <Link 
            to="/browse" 
            className="text-sm text-primary font-medium hover:underline"
          >
            {t('common.viewAll')}
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {appointments.map((appointment) => {
            const category = MEDICAL_CATEGORIES.find(c => c.id === appointment.category_id);
            const categoryName = category 
              ? (isPortuguese ? category.name_pt : category.name_en)
              : appointment.category_id;

            return (
              <Link
                key={appointment.id}
                to={`/jobs/${appointment.id}`}
                className="block bg-card rounded-xl border border-border hover:border-primary/50 p-4 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {getUrgencyBadge(appointment.urgency)}
                      <Badge variant="outline" className="text-xs px-2 py-0">
                        {categoryName}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-foreground line-clamp-2">
                      {appointment.title}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {appointment.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>{appointment.location}</span>
                    </div>
                  )}
                  
                  {appointment.consultation_fee_min && appointment.consultation_fee_max && (
                    <div className="flex items-center gap-1">
                      <Banknote className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                      <span>
                        R${appointment.consultation_fee_min} - R${appointment.consultation_fee_max}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    <span>
                      {formatDistanceToNow(new Date(appointment.created_at), { 
                        addSuffix: true, 
                        locale: dateLocale 
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>
                      {appointment.available_slots || 0}{' '}
                      {(appointment.available_slots || 0) === 1 
                        ? t('appointments.doctorAvailable') 
                        : t('appointments.doctorsAvailable')
                      }
                    </span>
                  </div>
                  <span className="text-xs font-medium text-primary">
                    {t('appointments.viewDetails')} →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
