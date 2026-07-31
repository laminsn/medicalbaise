import { supabase } from "@/integrations/supabase/client";
import { getBaiseAppKey, getBaiseAppUrl, getLocaleKey } from '@/lib/providerCommunication';
import { useTranslation } from 'react-i18next';

type LocaleKey = 'en' | 'es' | 'pt';

interface SendNotificationParams {
  type: "work_submitted" | "work_approved" | "work_rejected" | "job_status_changed" | "testimonial_request";
  recipientEmail: string;
  recipientName: string;
  jobTitle: string;
  providerName?: string;
  customerName?: string;
  newStatus?: string;
  feedback?: string;
  actionUrl?: string;
  appKey?: "casa" | "medical" | "legal";
  locale?: LocaleKey;
  providerId?: string;
  jobId?: string;
  activeJobId?: string;
}

export const useEmailNotifications = () => {
  const { i18n } = useTranslation();

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

  const notifyTestimonialRequest = async (
    recipientEmail: string,
    recipientName: string,
    providerName: string,
    jobTitle: string,
    providerId: string,
    jobId?: string,
    activeJobId?: string,
    localeOverride?: LocaleKey
  ) => {
    const locale = localeOverride || getLocaleKey(i18n.resolvedLanguage || i18n.language);
    const requestPath = locale === 'en' ? '/testimonial-request' : `/${locale}/testimonial-request`;
    const requestUrl = new URL(requestPath, getBaiseAppUrl());
    requestUrl.searchParams.set('providerId', providerId);
    requestUrl.searchParams.set('providerName', providerName);
    if (jobId) requestUrl.searchParams.set('jobId', jobId);
    if (activeJobId) requestUrl.searchParams.set('activeJobId', activeJobId);
    return sendNotificationEmail({
      type: 'testimonial_request',
      recipientEmail,
      recipientName,
      providerName,
      jobTitle,
      appKey: getBaiseAppKey(),
      locale,
      providerId,
      jobId,
      activeJobId,
      actionUrl: requestUrl.toString(),
    });
  };

  return {
    sendNotificationEmail,
    notifyWorkSubmitted,
    notifyWorkApproved,
    notifyWorkRejected,
    notifyJobStatusChanged,
    notifyTestimonialRequest,
  };
};
