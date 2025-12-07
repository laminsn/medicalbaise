import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

export interface WorkApprovalMedia {
  id: string;
  active_job_id: string;
  uploaded_by: string;
  media_url: string;
  media_type: string;
  thumbnail_url: string | null;
  caption: string | null;
  status: 'pending' | 'approved' | 'rejected';
  customer_feedback: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useWorkApproval(activeJobId?: string) {
  const [media, setMedia] = useState<WorkApprovalMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { notifyWorkSubmitted, notifyWorkApproved, notifyWorkRejected } = useEmailNotifications();

  useEffect(() => {
    if (activeJobId) {
      fetchMedia();
    }
  }, [activeJobId]);

  const fetchMedia = async () => {
    if (!activeJobId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_approval_media')
        .select('*')
        .eq('active_job_id', activeJobId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMedia((data || []) as WorkApprovalMedia[]);
    } catch (error) {
      console.error('Error fetching work approval media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getJobDetails = async (activeJobId: string) => {
    const { data: activeJob } = await supabase
      .from('active_jobs')
      .select(`
        *,
        jobs_posted:job_id (title, customer_id),
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
      activeJob,
      jobTitle: (activeJob.jobs_posted as any)?.title || 'Job',
      providerName: (activeJob.providers as any)?.business_name || 'Provider',
      providerEmail: (activeJob.providers as any)?.contact_email,
      customerName: customerProfile ? `${customerProfile.first_name || ''} ${customerProfile.last_name || ''}`.trim() || 'Customer' : 'Customer',
      customerEmail: customerProfile?.email,
    };
  };

  const uploadMedia = async (
    file: File,
    caption?: string
  ) => {
    if (!activeJobId) return false;
    
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${activeJobId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('work-approval')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('work-approval')
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from('work_approval_media')
        .insert({
          active_job_id: activeJobId,
          uploaded_by: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          caption,
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Send email notification to customer
      const jobDetails = await getJobDetails(activeJobId);
      if (jobDetails?.customerEmail) {
        await notifyWorkSubmitted(
          jobDetails.customerEmail,
          jobDetails.customerName,
          jobDetails.providerName,
          jobDetails.jobTitle,
          activeJobId
        );
      }

      toast({
        title: 'Media Uploaded',
        description: 'Work media has been uploaded for customer approval.',
      });

      await fetchMedia();
      return true;
    } catch (error: any) {
      console.error('Error uploading media:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload media',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const approveMedia = async (mediaId: string, feedback?: string) => {
    if (!activeJobId) return false;
    
    try {
      const { error } = await supabase
        .from('work_approval_media')
        .update({
          status: 'approved',
          customer_feedback: feedback,
          approved_at: new Date().toISOString(),
        })
        .eq('id', mediaId);

      if (error) throw error;

      // Send email notification to provider
      const jobDetails = await getJobDetails(activeJobId);
      if (jobDetails?.providerEmail) {
        await notifyWorkApproved(
          jobDetails.providerEmail,
          jobDetails.providerName,
          jobDetails.customerName,
          jobDetails.jobTitle,
          feedback
        );
      }

      toast({
        title: 'Work Approved',
        description: 'You have approved this work.',
      });

      await fetchMedia();
      return true;
    } catch (error: any) {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Failed to approve work',
        variant: 'destructive',
      });
      return false;
    }
  };

  const rejectMedia = async (mediaId: string, feedback: string) => {
    if (!activeJobId) return false;
    
    try {
      const { error } = await supabase
        .from('work_approval_media')
        .update({
          status: 'rejected',
          customer_feedback: feedback,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', mediaId);

      if (error) throw error;

      // Send email notification to provider
      const jobDetails = await getJobDetails(activeJobId);
      if (jobDetails?.providerEmail) {
        await notifyWorkRejected(
          jobDetails.providerEmail,
          jobDetails.providerName,
          jobDetails.customerName,
          jobDetails.jobTitle,
          feedback,
          activeJobId
        );
      }

      toast({
        title: 'Work Rejected',
        description: 'You have requested changes to this work.',
      });

      await fetchMedia();
      return true;
    } catch (error: any) {
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Failed to reject work',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('work_approval_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setMedia(prev => prev.filter(m => m.id !== mediaId));
      
      toast({
        title: 'Media Deleted',
        description: 'Work media has been removed.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete media',
        variant: 'destructive',
      });
      return false;
    }
  };

  const pendingCount = media.filter(m => m.status === 'pending').length;
  const approvedCount = media.filter(m => m.status === 'approved').length;
  const rejectedCount = media.filter(m => m.status === 'rejected').length;

  return {
    media,
    isLoading,
    isUploading,
    uploadMedia,
    approveMedia,
    rejectMedia,
    deleteMedia,
    refetch: fetchMedia,
    pendingCount,
    approvedCount,
    rejectedCount,
  };
}
