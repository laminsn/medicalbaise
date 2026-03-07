import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALLOWED_ORIGINS = [
  "https://medicalbaise.lovable.app",
  "https://mdbaise.com",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

/** Escape HTML entities to prevent XSS in email templates */
function escapeHtml(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Validate that a URL is safe for use in email links (https only) */
function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return '';
    // Only allow our own domains
    const allowedHosts = ['medicalbaise.lovable.app', 'mdbaise.com'];
    if (!allowedHosts.some(h => parsed.hostname === h || parsed.hostname.endsWith('.' + h))) {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}

const VALID_EMAIL_TYPES = ["work_submitted", "work_approved", "work_rejected", "job_status_changed"];

interface NotificationEmailRequest {
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

const getEmailContent = (request: NotificationEmailRequest) => {
  // Escape ALL user-provided values to prevent XSS in email HTML
  const recipientName = escapeHtml(request.recipientName);
  const jobTitle = escapeHtml(request.jobTitle);
  const providerName = escapeHtml(request.providerName);
  const customerName = escapeHtml(request.customerName);
  const feedback = escapeHtml(request.feedback);
  const actionUrl = sanitizeUrl(request.actionUrl);
  const newStatus = escapeHtml(request.newStatus);
  const type = request.type;

  switch (type) {
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
            <p style="margin-top: 24px; color: #666;">Thank you for using Brasil Base!</p>
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
            <p style="margin-top: 24px; color: #666;">Thank you for using Brasil Base!</p>
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

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate the JWT token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const request: NotificationEmailRequest = await req.json();

    // Validate required fields and type
    if (!request.type || !VALID_EMAIL_TYPES.includes(request.type)) {
      return new Response(JSON.stringify({ error: "Invalid notification type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    if (!request.recipientEmail || !request.recipientName || !request.jobTitle) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.recipientEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Sending notification email:", {
      type: request.type,
      job: request.jobTitle,
      requestedBy: user.id,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Brasil Base <onboarding@resend.dev>",
        to: [request.recipientEmail],
        subject: getEmailContent(request).subject,
        html: getEmailContent(request).html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
