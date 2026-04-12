import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Briefcase, Clock, CheckCircle, AlertCircle, MapPin, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { formatPrice } from '@/lib/currency';

interface ActiveJob {
  id: string;
  job_status: string;
  payment_status: string;
  agreed_price: number;
  start_date: string | null;
  expected_completion_date: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    location_address: string | null;
  } | null;
  provider: {
    id: string;
    business_name: string;
  } | null;
}

export function ActiveJobsSection({ onSelectJob }: { onSelectJob?: (jobId: string) => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: activeJobs, isLoading } = useQuery({
    queryKey: ['customer-active-jobs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_jobs')
        .select(`
          id,
          job_status,
          payment_status,
          agreed_price,
          start_date,
          expected_completion_date,
          job:jobs_posted (
            id,
            title,
            description,
            location_address
          ),
          provider:providers!active_jobs_provider_id_fkey (
            id,
            business_name
          )
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ActiveJob[];
    },
    enabled: !!user,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending_start: { color: 'bg-yellow-500/20 text-yellow-500', icon: <Clock className="h-3 w-3" /> },
      in_progress: { color: 'bg-blue-500/20 text-blue-500', icon: <Briefcase className="h-3 w-3" /> },
      completed: { color: 'bg-green-500/20 text-green-500', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { color: 'bg-red-500/20 text-red-500', icon: <AlertCircle className="h-3 w-3" /> },
    };
    const config = statusConfig[status] || statusConfig.pending_start;
    return (
      <Badge className={`${config.color} gap-1`}>
        {config.icon}
        {t(`customerDashboard.jobStatus.${status}`)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          {t('customerDashboard.activeJobs.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeJobs && activeJobs.length > 0 ? (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <Card 
                key={job.id} 
                className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => onSelectJob?.(job.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{job.job?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.provider?.business_name}
                        </p>
                      </div>
                      {getStatusBadge(job.job_status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>{formatPrice(job.agreed_price)}</span>
                      </div>
                      {job.expected_completion_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(job.expected_completion_date), 'MMM dd')}</span>
                        </div>
                      )}
                    </div>

                    {job.job?.location_address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{job.job.location_address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {t('customerDashboard.activeJobs.noJobs')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customerDashboard.activeJobs.postJobPrompt')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
