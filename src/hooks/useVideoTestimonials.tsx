import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VideoTestimonial {
  id: string;
  provider_id: string;
  customer_id: string;
  job_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  duration_seconds: number | null;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  approved_at: string | null;
  customer_name?: string;
  customer_avatar?: string;
}

export function useVideoTestimonials(providerId?: string) {
  const [testimonials, setTestimonials] = useState<VideoTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (providerId) {
      fetchTestimonials();
    }
  }, [providerId]);

  const fetchTestimonials = async () => {
    if (!providerId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_testimonials')
        .select('*')
        .eq('provider_id', providerId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch customer profiles for each testimonial
      const testimonialsWithProfiles = await Promise.all(
        (data || []).map(async (testimonial) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('user_id', testimonial.customer_id)
            .single();

          return {
            ...testimonial,
            customer_name: profile 
              ? `${profile.first_name || ''} ${profile.last_name?.charAt(0) || ''}.`.trim()
              : 'Customer',
            customer_avatar: profile?.avatar_url || undefined,
          };
        })
      );

      setTestimonials(testimonialsWithProfiles);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const uploadTestimonial = async (
    file: File,
    providerId: string,
    title: string,
    description?: string,
    jobId?: string
  ) => {
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file type and size
      const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!allowedVideoTypes.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: MP4, MOV, WebM');
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB max
        throw new Error('File too large. Maximum: 100MB');
      }

      // Sanitize file extension and upload
      const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('testimonials')
        .getPublicUrl(fileName);

      // Create testimonial record
      const { error: insertError } = await supabase
        .from('video_testimonials')
        .insert({
          provider_id: providerId,
          customer_id: user.id,
          job_id: jobId || null,
          video_url: publicUrl,
          title,
          description,
          is_approved: false, // Requires approval
        });

      if (insertError) throw insertError;

      toast({
        title: 'Testimonial Submitted',
        description: 'Your video testimonial has been submitted for review.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload testimonial',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteTestimonial = async (testimonialId: string) => {
    try {
      // Only allow the customer who created the testimonial to delete it
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('video_testimonials')
        .delete()
        .eq('id', testimonialId)
        .eq('customer_id', user.id);

      if (error) throw error;

      setTestimonials(prev => prev.filter(t => t.id !== testimonialId));
      
      toast({
        title: 'Testimonial Deleted',
        description: 'Your video testimonial has been removed.',
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete testimonial',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    testimonials,
    isLoading,
    isUploading,
    uploadTestimonial,
    deleteTestimonial,
    refetch: fetchTestimonials,
  };
}
