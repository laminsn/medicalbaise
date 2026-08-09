import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { APP_BRANDS, type AppKey, reportResendFailure } from "../_shared/brands.ts";
import { getCorsHeaders, authenticateRequest, createErrorResponse, escapeHtml, isSafeUrl, rejectNonPostMethod } from "../_shared/security.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

type LocaleKey = "en" | "es" | "pt";

interface NotificationEmailRequest {
  type: "work_submitted" | "work_approved" | "work_rejected" | "job_status_changed" | "testimonial_request";
  recipientEmail: string;
  recipientName: string;
  jobTitle: string;
  providerName?: string;
  customerName?: string;
  newStatus?: string;
  feedback?: string;
  actionUrl?: string;
  appKey?: AppKey;
  locale?: LocaleKey;
  providerId?: string;
  jobId?: string;
  activeJobId?: string;
  googleReviewUrl?: string;
}

const VALID_TYPES = ["work_submitted", "work_approved", "work_rejected", "job_status_changed", "testimonial_request"];

const getAppKey = (appKey?: string): AppKey => {
  if (appKey === "medical" || appKey === "legal" || appKey === "casa") return appKey;
  const envKey = String(Deno.env.get("BAISE_APP_KEY") || "casa").toLowerCase();
  if (envKey === "medical" || envKey === "legal" || envKey === "casa") return envKey;
  return "casa";
};

const getBrand = (appKey?: string) => APP_BRANDS[getAppKey(appKey)];

const getLocale = (locale?: string): LocaleKey => {
  const normalized = String(locale || "").toLowerCase();
  if (normalized.startsWith("pt")) return "pt";
  if (normalized.startsWith("es")) return "es";
  return "en";
};

const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));

const TESTIMONIAL_EMAIL_COPY = {
  en: {
    heading: "Share your experience",
    subject: (provider: string) => `How was your service with ${provider}?`,
    greeting: "Hello",
    completed: (job: string, provider: string) =>
      `Your service <strong>${job}</strong>${provider ? ` with <strong>${provider}</strong>` : ""} has been completed.`,
    intro: "If you had a good experience, you can help future clients choose with confidence and earn future service credit once approved.",
    google: "<strong>Google review:</strong> R$50 future service credit after approval.",
    video: "<strong>Video testimonial:</strong> R$100 future service credit after approval.",
    maximum: "Maximum testimonial credit: R$150 per client.",
    cta: "Submit testimonial",
    finePrint: "Each client may receive one Google review credit and one video testimonial credit. Credits are reviewed before being applied to future services.",
    thanks: "Thank you for using",
  },
  es: {
    heading: "Comparte tu experiencia",
    subject: (provider: string) => `¿Cómo fue tu servicio con ${provider}?`,
    greeting: "Hola",
    completed: (job: string, provider: string) =>
      `Tu servicio <strong>${job}</strong>${provider ? ` con <strong>${provider}</strong>` : ""} fue completado.`,
    intro: "Si tuviste una buena experiencia, puedes ayudar a futuros clientes a elegir con confianza y ganar crédito para servicios futuros después de la aprobación.",
    google: "<strong>Reseña de Google:</strong> R$50 de crédito para servicios futuros después de la aprobación.",
    video: "<strong>Vídeo testimonial:</strong> R$100 de crédito para servicios futuros después de la aprobación.",
    maximum: "Crédito máximo por testimonios: R$150 por cliente.",
    cta: "Enviar testimonio",
    finePrint: "Cada cliente puede recibir un crédito por reseña de Google y un crédito por vídeo testimonial. Los créditos se revisan antes de aplicarse a servicios futuros.",
    thanks: "Gracias por usar",
  },
  pt: {
    heading: "Compartilhe sua experiência",
    subject: (provider: string) => `Como foi seu serviço com ${provider}?`,
    greeting: "Olá",
    completed: (job: string, provider: string) =>
      `Seu serviço <strong>${job}</strong>${provider ? ` com <strong>${provider}</strong>` : ""} foi concluído.`,
    intro: "Se você teve uma boa experiência, pode ajudar futuros clientes a escolher com confiança e ganhar crédito para serviços futuros após a aprovação.",
    google: "<strong>Avaliação no Google:</strong> R$50 de crédito para serviços futuros após aprovação.",
    video: "<strong>Vídeo depoimento:</strong> R$100 de crédito para serviços futuros após aprovação.",
    maximum: "Crédito máximo por depoimentos: R$150 por cliente.",
    cta: "Enviar depoimento",
    finePrint: "Cada cliente pode receber um crédito por avaliação no Google e um crédito por vídeo depoimento. Os créditos são analisados antes de serem aplicados a serviços futuros.",
    thanks: "Obrigado por usar",
  },
} as const;

const getEmailContent = (request: NotificationEmailRequest) => {
  const brand = getBrand(request.appKey);
  // Escape ALL user-provided data before inserting into HTML to prevent injection
  const recipientName = escapeHtml(request.recipientName);
  const jobTitle = escapeHtml(request.jobTitle);
  const providerName = escapeHtml(request.providerName);
  const customerName = escapeHtml(request.customerName);
  const feedback = escapeHtml(request.feedback);
  // Validate actionUrl is a safe URL
  const actionUrl = request.actionUrl && isSafeUrl(request.actionUrl) ? request.actionUrl : '';
  const newStatus = escapeHtml(request.newStatus);
  const testimonialUrl = actionUrl || `${brand.url}/testimonial-request`;

  switch (request.type) {
    case "work_submitted":
      return {
        subject: `Work Submitted for Approval - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #047857;">Work Submitted for Your Review</h1>
            <p>Hello ${recipientName},</p>
            <p><strong>${providerName}</strong> has submitted work for your approval on the job: <strong>${jobTitle}</strong></p>
            <p>Please review the submitted work and provide your feedback.</p>
            ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Review Work</a>` : ''}
            <p style="margin-top: 24px; color: #666;">Thank you for using ${brand.name}!</p>
          </div>
        `,
      };

    case "work_approved":
      return {
        subject: `Work Approved - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #047857;">Your Work Has Been Approved!</h1>
            <p>Hello ${recipientName},</p>
            <p>Great news! <strong>${customerName}</strong> has approved your work on: <strong>${jobTitle}</strong></p>
            ${feedback ? `<p><strong>Customer Feedback:</strong> ${feedback}</p>` : ''}
            <p style="margin-top: 24px; color: #666;">Keep up the great work!</p>
          </div>
        `,
      };

    case "work_rejected":
      return {
        subject: `Work Needs Revision - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Work Revision Requested</h1>
            <p>Hello ${recipientName},</p>
            <p><strong>${customerName}</strong> has requested revisions on your work for: <strong>${jobTitle}</strong></p>
            ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
            <p>Please review the feedback and submit updated work.</p>
            ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Details</a>` : ''}
            <p style="margin-top: 24px; color: #666;">Thank you for your understanding.</p>
          </div>
        `,
      };

    case "job_status_changed": {
      const statusColors: Record<string, string> = {
        'in_progress': '#047857',
        'completed': '#059669',
        'cancelled': '#dc2626',
      };
      const rawStatus = request.newStatus || '';
      const statusColor = statusColors[rawStatus] || '#047857';

      return {
        subject: `Job Status Updated - ${jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: ${statusColor};">Job Status Updated</h1>
            <p>Hello ${recipientName},</p>
            <p>The status of <strong>${jobTitle}</strong> has been updated to: <strong style="color: ${statusColor};">${newStatus?.replace('_', ' ').toUpperCase()}</strong></p>
            ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; background-color: #047857; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Job</a>` : ''}
            <p style="margin-top: 24px; color: #666;">Thank you for using ${brand.name}!</p>
          </div>
        `,
      };
    }

    case "testimonial_request": {
      const testimonialCopy = TESTIMONIAL_EMAIL_COPY[getLocale(request.locale)];
      return {
        subject: testimonialCopy.subject(providerName || brand.name),
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: ${brand.color}; color: white; padding: 24px 28px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">${testimonialCopy.heading}</h1>
              <p style="margin: 6px 0 0; opacity: 0.9;">${brand.name}</p>
            </div>
            <div style="padding: 28px; border: 1px solid #eeeeee; border-top: 0; border-radius: 0 0 12px 12px;">
              <p>${testimonialCopy.greeting} ${recipientName},</p>
              <p>${testimonialCopy.completed(jobTitle, providerName || "")}</p>
              <p>${testimonialCopy.intro}</p>
              <div style="display: grid; gap: 12px; margin: 22px 0;">
                <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px;">
                  ${testimonialCopy.google}
                </div>
                <div style="border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px;">
                  ${testimonialCopy.video}
                </div>
              </div>
              <p style="font-weight: 700;">${testimonialCopy.maximum}</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${testimonialUrl}" style="display: inline-block; background-color: ${brand.color}; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: 700;">${testimonialCopy.cta}</a>
              </div>
              <p style="font-size: 13px; color: #667085;">${testimonialCopy.finePrint}</p>
              <p style="margin-top: 24px; color: #666;">${testimonialCopy.thanks} ${brand.name}.</p>
            </div>
          </div>
        `,
      };
    }

    default:
      return {
        subject: `Notification - ${jobTitle}`,
        html: `<p>You have a new notification regarding ${jobTitle}.</p>`,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    // Authenticate user
    const { user } = await authenticateRequest(req);

    if (!RESEND_API_KEY) {
      throw new Error("Email service not configured");
    }

    const request: NotificationEmailRequest = await req.json();

    // Validate request type
    if (!request.type || !VALID_TYPES.includes(request.type)) {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate required fields
    if (!request.recipientEmail || !request.recipientName || !request.jobTitle) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.recipientEmail)) {
      return new Response(JSON.stringify({ error: "Invalid recipient email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Verify recipient email belongs to a platform user to prevent email relay abuse
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

    const { data: recipientProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("email", request.recipientEmail)
      .maybeSingle();

    if (!recipientProfile) {
      return new Response(JSON.stringify({ error: "Recipient not found on platform" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (request.type === "testimonial_request" && isUuid(request.providerId)) {
      const appKey = getAppKey(request.appKey);
      const requestRecord = {
        app_key: appKey,
        provider_id: request.providerId,
        customer_id: recipientProfile.user_id,
        job_id: isUuid(request.jobId) ? request.jobId : null,
        active_job_id: isUuid(request.activeJobId) ? request.activeJobId : null,
        recipient_email: request.recipientEmail,
        recipient_name: request.recipientName,
        request_source: "service_completion",
        google_review_url: request.googleReviewUrl || null,
        status: "sent",
        last_sent_at: new Date().toISOString(),
        metadata: {
          job_title: request.jobTitle,
          provider_name: request.providerName || null,
        },
      };

      if (requestRecord.job_id) {
        const { data: existingRequest } = await supabaseAdmin
          .from("client_testimonial_requests")
          .select("id, monthly_reminder_count")
          .eq("app_key", appKey)
          .eq("customer_id", recipientProfile.user_id)
          .eq("provider_id", request.providerId)
          .eq("job_id", requestRecord.job_id)
          .maybeSingle();

        if (existingRequest?.id) {
          await supabaseAdmin
            .from("client_testimonial_requests")
            .update({
              last_sent_at: requestRecord.last_sent_at,
              monthly_reminder_count: Number(existingRequest.monthly_reminder_count || 0) + 1,
              status: "sent",
              metadata: requestRecord.metadata,
            })
            .eq("id", existingRequest.id);
        } else {
          await supabaseAdmin.from("client_testimonial_requests").insert(requestRecord);
        }
      } else {
        await supabaseAdmin.from("client_testimonial_requests").insert(requestRecord);
      }
    }

    const emailContent = getEmailContent(request);
    const brand = getBrand(request.appKey);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: brand.from,
        to: [request.recipientEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    await reportResendFailure(res, brand.from, "send-notification-email");

    if (!res.ok) {
      console.error("[SEND-NOTIFICATION] Resend API error:", res.status);
      throw new Error("Failed to send email");
    }

    const data = await res.json();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    return createErrorResponse(error, corsHeaders, "SEND-NOTIFICATION");
  }
};

serve(handler);
