import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Image, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WorkApprovalMedia {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  status: string;
  created_at: string;
  active_job: {
    id: string;
    job: {
      title: string;
    } | null;
  } | null;
}

export function CustomerWorkApprovals() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: approvals, isLoading, refetch } = useQuery({
    queryKey: ['customer-work-approvals', user?.id],
    queryFn: async () => {
      // First get all active jobs for this customer
      const { data: activeJobs, error: jobsError } = await supabase
        .from('active_jobs')
        .select('id')
        .eq('customer_id', user?.id);

      if (jobsError) throw jobsError;
      if (!activeJobs?.length) return [];

      const activeJobIds = activeJobs.map(j => j.id);

      // Then get work approval media for those jobs
      const { data, error } = await supabase
        .from('work_approval_media')
        .select(`
          id,
          media_url,
          media_type,
          caption,
          status,
          created_at,
          active_job:active_jobs (
            id,
            job:jobs_posted (
              title
            )
          )
        `)
        .in('active_job_id', activeJobIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as WorkApprovalMedia[];
    },
    enabled: !!user,
  });

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('work_approval_media')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(t('workApproval.approveError'));
    } else {
      toast.success(t('workApproval.approveSuccess'));
      refetch();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('work_approval_media')
      .update({ status: 'rejected', rejected_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast.error(t('workApproval.rejectError'));
    } else {
      toast.success(t('workApproval.rejectSuccess'));
      refetch();
    }
  };

  const pendingApprovals = approvals?.filter(a => a.status === 'pending') || [];
  const recentApprovals = approvals?.slice(0, 5) || [];

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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Image className="h-5 w-5" />
            {t('customerDashboard.workApprovals.title')}
          </CardTitle>
          {pendingApprovals.length > 0 && (
            <Badge variant="destructive">{pendingApprovals.length} {t('customerDashboard.workApprovals.pending')}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recentApprovals.length > 0 ? (
          <div className="space-y-3">
            {recentApprovals.map((item) => (
              <div 
                key={item.id} 
                className="flex gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.media_type === 'video' ? (
                    <video src={item.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm truncate">
                        {item.active_job?.job?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge className={
                      item.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                      item.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      'bg-yellow-500/20 text-yellow-500'
                    }>
                      {item.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {item.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                      {item.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {t(`workApproval.${item.status}`)}
                    </Badge>
                  </div>
                  {item.caption && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.caption}</p>
                  )}
                  {item.status === 'pending' && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="default" onClick={() => handleApprove(item.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t('workApproval.approve')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleReject(item.id)}>
                        <XCircle className="h-3 w-3 mr-1" />
                        {t('workApproval.reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {t('customerDashboard.workApprovals.noApprovals')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('customerDashboard.workApprovals.description')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
