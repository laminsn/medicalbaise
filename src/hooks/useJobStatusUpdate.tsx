import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

export function useJobStatusUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const { notifyJobStatusChanged } = useEmailNotifications();

  const getJobParticipants = async (activeJobId: string) => {
    const { data: activeJob } = await supabase
      .from('active_jobs')
      .select(`
        customer_id,
        provider_id,
        jobs_posted:job_id (id, title),
        providers:provider_id (business_name, contact_email, user_id)
      `)
      .eq('id', activeJobId)
      .single();

    if (!activeJob) return null;

    const { data: customerProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('user_id', activeJob.customer_id)
      .single();

    return {
      jobTitle: (activeJob.jobs_posted as any)?.title || 'Job',
      jobId: (activeJob.jobs_posted as any)?.id,
      providerName: (activeJob.providers as any)?.business_name || 'Provider',
      providerEmail: (activeJob.providers as any)?.contact_email,
      customerName: customerProfile 
        ? `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim() || 'Customer' 
        : 'Customer',
      customerEmail: customerProfile?.email,
      customerId: activeJob.customer_id,
      providerId: activeJob.provider_id,
    };
  };

  const updateJobStatus = async (
    activeJobId: string, 
    newStatus: 'in_progress' | 'completed' | 'cancelled',
    notifyParticipants: boolean = true
  ) => {
    setIsUpdating(true);
    try {
      // Verify the user is a participant (customer or provider) before allowing status update
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: jobCheck } = await supabase
        .from('active_jobs')
        .select('customer_id, provider_id')
        .eq('id', activeJobId)
        .single();

      if (!jobCheck) throw new Error('Job not found');

      // Check if user is the customer or provider for this job
      const { data: userProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', jobCheck.provider_id)
        .maybeSingle();

      const isCustomer = jobCheck.customer_id === user.id;
      const isProvider = !!userProvider;

      if (!isCustomer && !isProvider) {
        throw new Error('Not authorized to update this job');
      }

      const updateData: Record<string, any> = {
        job_status: newStatus,
      };

      if (newStatus === 'completed') {
        updateData.actual_completion_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('active_jobs')
        .update(updateData)
        .eq('id', activeJobId);

      if (error) throw error;

      // Also update the jobs_posted status
      const { data: activeJob } = await supabase
        .from('active_jobs')
        .select('job_id')
        .eq('id', activeJobId)
        .single();

      if (activeJob?.job_id) {
        await supabase
          .from('jobs_posted')
          .update({ status: newStatus })
          .eq('id', activeJob.job_id);
      }

      // Send email notifications
      if (notifyParticipants) {
        const participants = await getJobParticipants(activeJobId);
        
        if (participants) {
          // Notify customer about status change
          if (participants.customerEmail) {
            await notifyJobStatusChanged(
              participants.customerEmail,
              participants.customerName,
              participants.jobTitle,
              newStatus,
              activeJobId
            );
          }

          // If job is completed, also notify provider
          if (newStatus === 'completed' && participants.providerEmail) {
            await notifyJobStatusChanged(
              participants.providerEmail,
              participants.providerName,
              participants.jobTitle,
              newStatus,
              activeJobId
            );
          }
        }
      }

      toast({
        title: 'Status Updated',
        description: `Job status changed to ${newStatus.replace('_', ' ')}.`,
      });

      return true;
    } catch (error: any) {

      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update job status',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const startJob = (activeJobId: string) => updateJobStatus(activeJobId, 'in_progress');
  const completeJob = (activeJobId: string) => updateJobStatus(activeJobId, 'completed');
  const cancelJob = (activeJobId: string) => updateJobStatus(activeJobId, 'cancelled');

  return {
    updateJobStatus,
    startJob,
    completeJob,
    cancelJob,
    isUpdating,
  };
}
