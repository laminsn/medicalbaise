import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { APP_BRANDS, normalizeAppKey, reportResendSdkFailure, senderWithDisplayName } from "../_shared/brands.ts";
import { getCorsHeaders, escapeHtml, sanitizeCampaignHtml, rejectNonPostMethod } from "../_shared/security.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const COST_PER_EMAIL = 0.05;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const methodError = rejectNonPostMethod(req, corsHeaders);
  if (methodError) return methodError;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth client to get the user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    // Service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { campaignId } = await req.json();
    if (!campaignId || typeof campaignId !== "string") throw new Error("Missing campaignId");
    // Validate UUID format to prevent injection
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)) {
      throw new Error("Campaign not found");
    }

    // Get the campaign
    const { data: campaign, error: campError } = await supabaseAuth
      .from("provider_email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campError || !campaign) throw new Error("Campaign not found");
    if (campaign.status === "sent") throw new Error("Campaign already sent");

    // Verify provider is Elite or above
    const { data: provider, error: provError } = await supabaseAdmin
      .from("providers")
      .select("id, subscription_tier, business_name, user_id, platform")
      .eq("id", campaign.provider_id)
      .single();

    if (provError || !provider) throw new Error("Provider not found");
    if (provider.user_id !== user.id) throw new Error("Unauthorized");

    const tier = provider.subscription_tier || "free";
    if (tier !== "elite" && tier !== "enterprise") {
      throw new Error("Email campaigns require Elite or Enterprise tier");
    }

    // Get recipients based on type
    let recipientEmails: string[] = [];

    if (campaign.recipient_type === "followers") {
      // Get follower user IDs
      const { data: followers } = await supabaseAdmin
        .from("follows")
        .select("follower_id")
        .eq("following_provider_id", campaign.provider_id);

      if (followers && followers.length > 0) {
        const followerIds = followers.map((f: any) => f.follower_id);
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .in("user_id", followerIds)
          .not("email", "is", null);

        recipientEmails = (profiles || []).map((p: any) => p.email).filter(Boolean);
      }
    } else if (campaign.recipient_type === "customers") {
      // Get customers who have had active jobs with this provider
      const { data: jobs } = await supabaseAdmin
        .from("active_jobs")
        .select("customer_id")
        .eq("provider_id", provider.user_id);

      if (jobs && jobs.length > 0) {
        const customerIds = [...new Set(jobs.map((j: any) => j.customer_id))];
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .in("user_id", customerIds)
          .not("email", "is", null);

        recipientEmails = (profiles || []).map((p: any) => p.email).filter(Boolean);
      }
    }

    // De-duplicate
    recipientEmails = [...new Set(recipientEmails)];

    if (recipientEmails.length === 0) {
      // Update campaign as sent with 0 recipients
      await supabaseAuth
        .from("provider_email_campaigns")
        .update({
          status: "sent",
          total_recipients: 0,
          total_sent: 0,
          total_cost: 0,
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      return new Response(
        JSON.stringify({ success: true, sent: 0, cost: 0, message: "No recipients found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalCost = recipientEmails.length * COST_PER_EMAIL;

    // Payment is handled via Stripe checkout before this function is called
    // No credit balance check needed

    // Update campaign status to sending
    await supabaseAuth
      .from("provider_email_campaigns")
      .update({ status: "sending", total_recipients: recipientEmails.length })
      .eq("id", campaignId);

    // Send emails in batches of 50
    let sentCount = 0;
    const batchSize = 50;

    for (let i = 0; i < recipientEmails.length; i += batchSize) {
      const batch = recipientEmails.slice(i, i + batchSize);
      
      try {
        // Send each email individually via Resend
        // Escape provider business name in "from" and footer to prevent header injection
        const safeBusinessName = escapeHtml(provider.business_name || "Provider");
        const brand = APP_BRANDS[normalizeAppKey(provider.platform)];
        const from = senderWithDisplayName(`${safeBusinessName} via ${brand.name}`, brand);
        for (const email of batch) {
          const result = await resend.emails.send({
            from,
            to: [email],
            subject: escapeHtml(campaign.subject || ""),
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                ${sanitizeCampaignHtml(campaign.body_html)}
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="color: #888; font-size: 12px; text-align: center;">
                  Sent by ${safeBusinessName} via ${brand.name}<br/>
                  <a href="${brand.url}" style="color: #888;">${brand.domain}</a>
                </p>
              </div>
            `,
          });
          reportResendSdkFailure(result, from, "send-provider-campaign");
          if (result.error) throw new Error(`Resend rejected provider campaign: ${result.error.message}`);
          sentCount++;
        }
      } catch (batchError) {
        console.error("Batch send error:", batchError);
      }
    }

    // Update campaign as sent
    await supabaseAuth
      .from("provider_email_campaigns")
      .update({
        status: "sent",
        total_sent: sentCount,
        total_cost: sentCount * COST_PER_EMAIL,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total_recipients: recipientEmails.length,
        cost: sentCount * COST_PER_EMAIL,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Campaign send error:", error);
    // Only expose safe error messages to the client
    const safeMessages = ["Unauthorized", "Campaign not found", "Campaign already sent", "Provider not found", "Missing campaignId", "Email campaigns require Elite or Enterprise tier"];
    const clientMessage = safeMessages.includes(error.message) ? error.message : "An error occurred while sending the campaign";
    return new Response(
      JSON.stringify({ error: clientMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
