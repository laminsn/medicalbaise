import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const COST_PER_EMAIL = 0.05; // R$0.05 per email

const ALLOWED_ORIGINS = [
  "https://medicalbaise.lovable.app",
  "https://mdbaise.com",
  ...(Deno.env.get("ENVIRONMENT") !== "production" ? ["http://localhost:8080"] : []),
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROVIDER-CAMPAIGN] ${step}${detailsStr}`);
};

/** Escape HTML entities to prevent XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Strip dangerous tags from provider HTML content (basic server-side sanitization) */
function sanitizeEmailHtml(html: string): string {
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^>]*>.*?<\/form>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '');
}

const wrapEmailHtml = (subject: string, htmlContent: string, providerName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #047857;">
    <h1 style="margin: 0; color: #047857; font-size: 20px;">${escapeHtml(providerName)}</h1>
  </div>
  <div style="margin-top: 24px;">
    ${sanitizeEmailHtml(htmlContent)}
  </div>
  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      You're receiving this because you follow ${escapeHtml(providerName)} on MDBaise.
    </p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const userId = userData.user.id;
    logStep("User authenticated");

    // Get provider info and check subscription tier
    const { data: provider, error: provError } = await supabase
      .from("providers")
      .select("id, business_name, subscription_tier, user_id")
      .eq("user_id", userId)
      .single();

    if (provError || !provider) throw new Error("Provider not found");

    const tier = provider.subscription_tier;
    if (tier !== "elite" && tier !== "enterprise") {
      throw new Error("Email campaigns require Elite or Enterprise subscription");
    }
    logStep("Provider verified", { providerId: provider.id, tier });

    // Parse request body
    const { campaignId } = await req.json();
    if (!campaignId) throw new Error("Campaign ID required");

    // Get campaign details
    const { data: campaign, error: campError } = await supabase
      .from("provider_email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("provider_id", provider.id)
      .single();

    if (campError || !campaign) throw new Error("Campaign not found");
    if (campaign.status !== "draft") throw new Error("Campaign already sent");
    logStep("Campaign found", { subject: campaign.subject });

    // Get follower emails
    const { data: followers, error: followError } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_provider_id", provider.id);

    if (followError) throw new Error("Failed to fetch followers");
    if (!followers || followers.length === 0) throw new Error("No followers to send to");

    const followerIds = followers.map((f) => f.follower_id);
    logStep("Followers found", { count: followerIds.length });

    // Check credit balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("user_id", userId)
      .single();

    const creditsBalance = profile?.credits_balance || 0;
    const totalCost = followerIds.length * COST_PER_EMAIL;

    if (creditsBalance < totalCost) {
      throw new Error(
        `Insufficient credits. Need R$${totalCost.toFixed(2)} (${followerIds.length} emails × R$${COST_PER_EMAIL}). Current balance: R$${creditsBalance.toFixed(2)}`
      );
    }
    logStep("Credits check passed", { balance: creditsBalance, cost: totalCost });

    // Mark campaign as sending
    await supabase
      .from("provider_email_campaigns")
      .update({ status: "sending", total_recipients: followerIds.length })
      .eq("id", campaignId);

    // Get follower email addresses
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, first_name")
      .in("user_id", followerIds);

    if (!profiles || profiles.length === 0) throw new Error("No follower profiles found");

    const emailRecipients = profiles.filter((p) => p.email);
    logStep("Email recipients", { count: emailRecipients.length });

    let sent = 0;
    let errors = 0;

    // Send emails in batches of 10
    const batchSize = 10;
    for (let i = 0; i < emailRecipients.length; i += batchSize) {
      const batch = emailRecipients.slice(i, i + batchSize);

      const promises = batch.map(async (recipient) => {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: `${provider.business_name} via MDBaise <onboarding@resend.dev>`,
              to: [recipient.email],
              subject: campaign.subject,
              html: wrapEmailHtml(campaign.subject, campaign.html_content, provider.business_name),
            }),
          });

          if (res.ok) {
            sent++;
          } else {
            errors++;
            const errText = await res.text();
            console.error(`Failed to send email to recipient:`, errText);
          }
        } catch (err) {
          errors++;
          console.error(`Error sending email to recipient:`, err);
        }
      });

      await Promise.all(promises);
    }

    // Deduct credits atomically — use conditional update to prevent race conditions.
    // Only deduct if balance is still sufficient (another request may have consumed credits).
    const actualCost = sent * COST_PER_EMAIL;
    const { data: deductResult, error: deductError } = await supabase
      .from("profiles")
      .update({ credits_balance: creditsBalance - actualCost })
      .eq("user_id", userId)
      .gte("credits_balance", actualCost)
      .select("credits_balance")
      .single();

    if (deductError || !deductResult) {
      logStep("WARNING: Credit deduction failed — possible race condition", { actualCost });
    }

    // Update campaign record
    await supabase
      .from("provider_email_campaigns")
      .update({
        status: "completed",
        emails_sent: sent,
        emails_failed: errors,
        total_cost: actualCost,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    const result = {
      campaignId,
      subject: campaign.subject,
      totalRecipients: emailRecipients.length,
      emailsSent: sent,
      emailsFailed: errors,
      totalCost: actualCost,
      remainingCredits: creditsBalance - actualCost,
    };

    logStep("Campaign complete", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
