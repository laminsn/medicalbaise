import { supabase } from "@/integrations/supabase/client";

interface SendNotificationParams {
  type: "work_submitted" | "work_approved" | "work_rejected" | "job_status_changed";
  recipientEmail: string;
  recipientName: string;
  jobTitle: string;
  providerName?: string;
  customerName?: string;
  newStatus?: string;
  feedback?: string;
  actionUrl?: string;
}

export const useEmailNotifications = () => {
  const sendNotificationEmail = async (params: SendNotificationParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification-email', {
        body: params,
      });

      if (error) {
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  const notifyWorkSubmitted = async (
    customerEmail: string,
    customerName: string,
    providerName: string,
    jobTitle: string,
    jobId: string
  ) => {
    return sendNotificationEmail({
      type: 'work_submitted',
      recipientEmail: customerEmail,
      recipientName: customerName,
      providerName,
      jobTitle,
      actionUrl: `${window.location.origin}/dashboard`,
    });
  };

  const notifyWorkApproved = async (
    providerEmail: string,
    providerName: string,
    customerName: string,
    jobTitle: string,
    feedback?: string
  ) => {
    return sendNotificationEmail({
      type: 'work_approved',
      recipientEmail: providerEmail,
      recipientName: providerName,
      customerName,
      jobTitle,
      feedback,
    });
  };

  const notifyWorkRejected = async (
    providerEmail: string,
    providerName: string,
    customerName: string,
    jobTitle: string,
    feedback: string,
    jobId: string
  ) => {
    return sendNotificationEmail({
      type: 'work_rejected',
      recipientEmail: providerEmail,
      recipientName: providerName,
      customerName,
      jobTitle,
      feedback,
      actionUrl: `${window.location.origin}/my-jobs`,
    });
  };

  const notifyJobStatusChanged = async (
    recipientEmail: string,
    recipientName: string,
    jobTitle: string,
    newStatus: string,
    jobId: string
  ) => {
    return sendNotificationEmail({
      type: 'job_status_changed',
      recipientEmail: recipientEmail,
      recipientName: recipientName,
      jobTitle,
      newStatus,
      actionUrl: `${window.location.origin}/my-jobs`,
    });
  };

  return {
    sendNotificationEmail,
    notifyWorkSubmitted,
    notifyWorkApproved,
    notifyWorkRejected,
    notifyJobStatusChanged,
  };
};
