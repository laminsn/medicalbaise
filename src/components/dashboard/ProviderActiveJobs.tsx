import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  DollarSign, 
  Calendar,
  Play,
  Check,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useJobStatusUpdate } from '@/hooks/useJobStatusUpdate';
import { format } from 'date-fns';
import { enUS, es as esLocale, ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ActiveJob {
  id: string;
  job_status: string;
  payment_status: string;
  agreed_price: number;
  start_date: string | null;
  expected_completion_date: string | null;
  customer_id: string;
  job: {
    id: string;
    title: string;
    description: string;
    location_address: string | null;
  } | null;
  customer: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export function ProviderActiveJobs() {
  const { t, i18n } = useTranslation();
  const isPt = i18n.resolvedLanguage?.startsWith('pt') || i18n.language.startsWith('pt');
  const isEs = i18n.resolvedLanguage?.startsWith('es') || i18n.language.startsWith('es');
  const dateLocale = isPt ? ptBR : isEs ? esLocale : enUS;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { startJob, completeJob, cancelJob, isUpdating } = useJobStatusUpdate();

  const { data: activeJobs, isLoading } = useQuery({
    queryKey: ['provider-active-jobs', user?.id],
    queryFn: async () => {
      // First get provider ID
      const { data: provider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!provider) return [];

      const { data, error } = await supabase
        .from('active_jobs')
        .select(`
          id,
          job_status,
          payment_status,
          agreed_price,
          start_date,
          expected_completion_date,
          customer_id,
          job:jobs_posted (
            id,
            title,
            description,
            location_address
          )
        `)
        .eq('provider_id', provider.id)
        .in('job_status', ['pending_start', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles
      const jobsWithCustomers = await Promise.all(
        (data || []).map(async (job) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('user_id', job.customer_id)
            .single();
          
          return { ...job, customer: profile };
        })
      );

      return jobsWithCustomers as ActiveJob[];
    },
    enabled: !!user,
  });

  const handleStatusUpdate = async (jobId: string, action: 'start' | 'complete' | 'cancel') => {
    let success = false;
    switch (action) {
      case 'start':
        success = await startJob(jobId);
        break;
      case 'complete':
        success = await completeJob(jobId);
        break;
      case 'cancel':
        success = await cancelJob(jobId);
        break;
    }
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['provider-active-jobs'] });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending_start: { color: 'bg-yellow-500/20 text-yellow-500', icon: <Clock className="h-3 w-3" /> },
      in_progress: { color: 'bg-blue-500/20 text-blue-500', icon: <Briefcase className="h-3 w-3" /> },
      completed: { color: 'bg-green-500/20 text-green-500', icon: <CheckCircle className="h-3 w-3" /> },
      cancelled: { color: 'bg-red-500/20 text-red-500', icon: <AlertCircle className="h-3 w-3" /> },
    };
    const statusLabels: Record<string, string> = {
      pending_start: isPt ? 'aguardando início' : isEs ? 'pendiente de inicio' : 'pending start',
      in_progress: isPt ? 'em andamento' : isEs ? 'en curso' : 'in progress',
      completed: isPt ? 'concluído' : isEs ? 'completado' : 'completed',
      cancelled: isPt ? 'cancelado' : isEs ? 'cancelado' : 'cancelled',
    };
    const config = statusConfig[status] || statusConfig.pending_start;
    return (
      <Badge className={`${config.color} gap-1`}>
        {config.icon}
        {statusLabels[status] || status.replace('_', ' ')}
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
          {t('providerDashboard.activeJobs', 'Active Jobs')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeJobs && activeJobs.length > 0 ? (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <Card key={job.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{job.job?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {job.customer?.first_name} {job.customer?.last_name}
                        </p>
                      </div>
                      {getStatusBadge(job.job_status)}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>R$ {job.agreed_price.toLocaleString()}</span>
                      </div>
                      {job.expected_completion_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(job.expected_completion_date), 'MMM dd', { locale: dateLocale })}</span>
                        </div>
                      )}
                    </div>

                    {job.job?.location_address && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{job.job.location_address}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      {job.job_status === 'pending_start' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusUpdate(job.id, 'start')}
                          disabled={isUpdating}
                          className="gap-1"
                        >
                          {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                          {isPt ? 'Iniciar trabalho' : isEs ? 'Iniciar trabajo' : 'Start Job'}
                        </Button>
                      )}
                      
                      {job.job_status === 'in_progress' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="default" className="gap-1" disabled={isUpdating}>
                              <Check className="h-3 w-3" />
                              {isPt ? 'Marcar como concluído' : isEs ? 'Marcar como completado' : 'Mark Complete'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{isPt ? 'Concluir este trabalho?' : isEs ? '¿Completar este trabajo?' : 'Complete this job?'}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {isPt
                                  ? 'Isso marcará o trabalho como concluído e notificará o cliente.'
                                  : isEs
                                    ? 'Esto marcará el trabajo como completado y notificará al cliente.'
                                    : 'This will mark the job as completed and notify the customer.'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{isPt ? 'Cancelar' : isEs ? 'Cancelar' : 'Cancel'}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleStatusUpdate(job.id, 'complete')}>
                                {isPt ? 'Concluir' : isEs ? 'Completar' : 'Complete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive" disabled={isUpdating}>
                            <X className="h-3 w-3" />
                            {isPt ? 'Cancelar' : isEs ? 'Cancelar' : 'Cancel'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{isPt ? 'Cancelar este trabalho?' : isEs ? '¿Cancelar este trabajo?' : 'Cancel this job?'}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {isPt
                                ? 'Esta ação não pode ser desfeita. O cliente será notificado sobre o cancelamento.'
                                : isEs
                                  ? 'Esta acción no se puede deshacer. El cliente será notificado de la cancelación.'
                                  : 'This action cannot be undone. The customer will be notified about the cancellation.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{isPt ? 'Voltar' : isEs ? 'Volver' : 'Go Back'}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleStatusUpdate(job.id, 'cancel')}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isPt ? 'Cancelar trabalho' : isEs ? 'Cancelar trabajo' : 'Cancel Job'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {t('providerDashboard.noActiveJobs', 'No active jobs')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
