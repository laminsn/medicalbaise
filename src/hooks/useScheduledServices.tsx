import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, addWeeks, addMonths, format } from 'date-fns';

export interface ScheduledService {
  id: string;
  customer_id: string;
  provider_id: string;
  service_id: string | null;
  title: string;
  description: string | null;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  day_of_week: number | null;
  day_of_month: number | null;
  preferred_time: string | null;
  duration_minutes: number;
  price_per_visit: number | null;
  status: 'active' | 'paused' | 'cancelled';
  next_scheduled_date: string | null;
  last_completed_date: string | null;
  total_visits: number;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  provider?: {
    business_name: string;
  };
}

export interface ServiceInstance {
  id: string;
  scheduled_service_id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
}

interface CreateScheduledServiceParams {
  providerId: string;
  serviceId?: string;
  title: string;
  description?: string;
  frequency: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  preferredTime?: string;
  durationMinutes?: number;
  pricePerVisit?: number;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export function useScheduledServices() {
  const [services, setServices] = useState<ScheduledService[]>([]);
  const [instances, setInstances] = useState<ServiceInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's provider IDs first to avoid raw sub-select injection
      const { data: userProviders } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id);
      const providerIds = userProviders?.map(p => p.id) || [];

      let serviceQuery = supabase
        .from('scheduled_services')
        .select(`
          *,
          provider:providers(business_name)
        `)
        .order('next_scheduled_date', { ascending: true });

      if (providerIds.length > 0) {
        serviceQuery = serviceQuery.or(`customer_id.eq.${user.id},provider_id.in.(${providerIds.join(',')})`);
      } else {
        serviceQuery = serviceQuery.eq('customer_id', user.id);
      }

      const { data, error } = await serviceQuery;

      if (error) throw error;
      setServices((data || []) as unknown as ScheduledService[]);
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const fetchInstances = async (scheduledServiceId: string) => {
    try {
      const { data, error } = await supabase
        .from('service_instances')
        .select('*')
        .eq('scheduled_service_id', scheduledServiceId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setInstances((data || []) as ServiceInstance[]);
      return data as ServiceInstance[];
    } catch (error) {

      return [];
    }
  };

  const calculateNextDate = (frequency: string, startDate: Date, dayOfWeek?: number, dayOfMonth?: number): Date => {
    const today = new Date();
    let nextDate = startDate > today ? startDate : today;

    switch (frequency) {
      case 'daily':
        return nextDate;
      case 'weekly':
        if (dayOfWeek !== undefined) {
          while (nextDate.getDay() !== dayOfWeek) {
            nextDate = addDays(nextDate, 1);
          }
        }
        return nextDate;
      case 'biweekly':
        if (dayOfWeek !== undefined) {
          while (nextDate.getDay() !== dayOfWeek) {
            nextDate = addDays(nextDate, 1);
          }
        }
        return nextDate;
      case 'monthly':
        if (dayOfMonth !== undefined) {
          nextDate.setDate(dayOfMonth);
          if (nextDate < today) {
            nextDate = addMonths(nextDate, 1);
          }
        }
        return nextDate;
      default:
        return nextDate;
    }
  };

  const createScheduledService = async (params: CreateScheduledServiceParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const nextDate = calculateNextDate(
        params.frequency,
        params.startDate,
        params.dayOfWeek,
        params.dayOfMonth
      );

      const { data, error } = await supabase
        .from('scheduled_services')
        .insert({
          customer_id: user.id,
          provider_id: params.providerId,
          service_id: params.serviceId || null,
          title: params.title,
          description: params.description,
          frequency: params.frequency,
          day_of_week: params.dayOfWeek,
          day_of_month: params.dayOfMonth,
          preferred_time: params.preferredTime,
          duration_minutes: params.durationMinutes || 60,
          price_per_visit: params.pricePerVisit,
          start_date: format(params.startDate, 'yyyy-MM-dd'),
          end_date: params.endDate ? format(params.endDate, 'yyyy-MM-dd') : null,
          next_scheduled_date: format(nextDate, 'yyyy-MM-dd'),
          notes: params.notes,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial service instance
      if (data) {
        await supabase
          .from('service_instances')
          .insert({
            scheduled_service_id: data.id,
            scheduled_date: format(nextDate, 'yyyy-MM-dd'),
            scheduled_time: params.preferredTime,
            status: 'scheduled',
          });
      }

      toast({
        title: 'Service Scheduled',
        description: 'Your recurring service has been set up successfully.',
      });

      await fetchServices();
      return data;
    } catch (error: any) {

      toast({
        title: 'Scheduling Failed',
        description: error.message || 'Failed to create scheduled service',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateServiceStatus = async (serviceId: string, status: 'active' | 'paused' | 'cancelled') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Only allow the customer who created the service to update it
      const { error } = await supabase
        .from('scheduled_services')
        .update({ status })
        .eq('id', serviceId)
        .eq('customer_id', user.id);

      if (error) throw error;

      toast({
        title: status === 'cancelled' ? 'Service Cancelled' : `Service ${status}`,
        description: `The scheduled service has been ${status}.`,
      });

      await fetchServices();
      return true;
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update service',
        variant: 'destructive',
      });
      return false;
    }
  };

  const completeInstance = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from('service_instances')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', instanceId);

      if (error) throw error;

      toast({
        title: 'Service Completed',
        description: 'The service visit has been marked as completed.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to complete service',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelInstance = async (instanceId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('service_instances')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', instanceId);

      if (error) throw error;

      toast({
        title: 'Visit Cancelled',
        description: 'The service visit has been cancelled.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel service',
        variant: 'destructive',
      });
      return false;
    }
  };

  const activeServices = services.filter(s => s.status === 'active');
  const pausedServices = services.filter(s => s.status === 'paused');

  return {
    services,
    instances,
    isLoading,
    activeServices,
    pausedServices,
    createScheduledService,
    updateServiceStatus,
    completeInstance,
    cancelInstance,
    fetchInstances,
    refetch: fetchServices,
  };
}
