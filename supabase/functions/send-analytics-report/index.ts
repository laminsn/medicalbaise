import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALLOWED_ORIGINS = [
  "https://medicalbaise.lovable.app",
  "https://mdbaise.com",
  "http://localhost:8080",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsData {
  totalViews: number;
  totalLeads: number;
  conversionRate: string;
  eventBreakdown: Record<string, number>;
}

function generateEmailHTML(businessName: string, data: AnalyticsData, frequency: string, dateRange: string): string {
  const eventRows = Object.entries(data.eventBreakdown)
    .map(([event, count]) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${event}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${count}</td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #047857 0%, #065f46 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0 0 10px 0; font-size: 24px;">📊 ${frequency === 'weekly' ? 'Weekly' : 'Monthly'} Analytics Report</h1>
          <p style="margin: 0; opacity: 0.9;">${businessName}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #666; margin-bottom: 20px;">Here's your conversion analytics summary for ${dateRange}:</p>
          
          <table style="width: 100%; margin-bottom: 30px;">
            <tr>
              <td style="background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; width: 33%;">
                <div style="font-size: 32px; font-weight: bold; color: #047857;">${data.totalViews}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Total Visitors</div>
              </td>
              <td style="width: 10px;"></td>
              <td style="background: #ecfeff; padding: 20px; border-radius: 8px; text-align: center; width: 33%;">
                <div style="font-size: 32px; font-weight: bold; color: #0891b2;">${data.totalLeads}</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Total Leads</div>
              </td>
              <td style="width: 10px;"></td>
              <td style="background: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; width: 33%;">
                <div style="font-size: 32px; font-weight: bold; color: #d97706;">${data.conversionRate}%</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">Conversion Rate</div>
              </td>
            </tr>
          </table>
          
          <h2 style="font-size: 18px; color: #333; margin-bottom: 15px;">Event Breakdown</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Event Type</th>
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151;">Count</th>
              </tr>
            </thead>
            <tbody>
              ${eventRows}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This is an automated report from Brasil Base.<br>
              To manage your report settings, visit your Provider Dashboard.
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: "Brasil Base <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate the JWT token and get user
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("User authenticated:", user.id);

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { providerId, manual } = await req.json().catch(() => ({}));
    
    console.log("Starting analytics report send", { providerId, manual, requestedBy: user.id });

    // If providerId is specified, verify the user owns that provider
    if (providerId) {
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("user_id")
        .eq("id", providerId)
        .single();
      
      if (providerError || !provider) {
        console.error("Provider not found:", providerError);
        return new Response(JSON.stringify({ error: "Provider not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (provider.user_id !== user.id) {
        console.error("User does not own this provider");
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Get schedules to process
    let schedulesQuery = supabase
      .from("analytics_report_schedules")
      .select(`
        *,
        providers:provider_id (
          id,
          business_name,
          user_id
        )
      `)
      .eq("is_active", true);

    if (providerId) {
      schedulesQuery = schedulesQuery.eq("provider_id", providerId);
    } else {
      // For cron: only get schedules where next_send_at is in the past
      // Also filter to only schedules owned by the requesting user
      schedulesQuery = schedulesQuery.lte("next_send_at", new Date().toISOString());
    }

    const { data: schedules, error: schedulesError } = await schedulesQuery;

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw schedulesError;
    }

    // Filter to only schedules where user owns the provider
    const userSchedules = (schedules || []).filter((schedule: any) => {
      const provider = schedule.providers as { id: string; business_name: string; user_id: string };
      return provider && provider.user_id === user.id;
    });

    if (userSchedules.length === 0) {
      console.log("No schedules to process for user", user.id);
      return new Response(JSON.stringify({ message: "No schedules to process" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Processing ${userSchedules.length} schedules for user ${user.id}`);

    const results = [];

    for (const schedule of userSchedules) {
      try {
        const provider = schedule.providers as { id: string; business_name: string; user_id: string };
        
        // Calculate date range based on frequency
        const now = new Date();
        const startDate = new Date();
        if (schedule.frequency === "weekly") {
          startDate.setDate(now.getDate() - 7);
        } else {
          startDate.setMonth(now.getMonth() - 1);
        }

        // Fetch conversion events for the period
        const { data: events, error: eventsError } = await supabase
          .from("conversion_events")
          .select("*")
          .eq("provider_id", provider.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", now.toISOString());

        if (eventsError) {
          console.error("Error fetching events:", eventsError);
          continue;
        }

        // Calculate analytics
        const eventBreakdown: Record<string, number> = {
          "Profile Views": 0,
          "Quote Requests": 0,
          "Messages": 0,
          "Phone Calls": 0,
          "Favorites": 0,
          "Bookings": 0,
        };

        const eventNameMap: Record<string, string> = {
          profile_view: "Profile Views",
          quote_request: "Quote Requests",
          message_click: "Messages",
          phone_click: "Phone Calls",
          add_to_favorites: "Favorites",
          booking_initiated: "Bookings",
        };

        (events || []).forEach((event: { event_name: string }) => {
          const label = eventNameMap[event.event_name] || event.event_name;
          eventBreakdown[label] = (eventBreakdown[label] || 0) + 1;
        });

        const totalViews = eventBreakdown["Profile Views"];
        const totalLeads = eventBreakdown["Quote Requests"] + eventBreakdown["Messages"] + eventBreakdown["Phone Calls"];
        const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : "0";

        const dateRange = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

        const analyticsData: AnalyticsData = {
          totalViews,
          totalLeads,
          conversionRate,
          eventBreakdown,
        };

        // Send email
        const emailResponse = await sendEmail(
          schedule.email,
          `Your ${schedule.frequency === "weekly" ? "Weekly" : "Monthly"} Analytics Report - ${provider.business_name}`,
          generateEmailHTML(provider.business_name, analyticsData, schedule.frequency, dateRange)
        );

        console.log("Email sent successfully:", emailResponse);

        // Calculate next send date
        let nextSendAt = new Date();
        if (schedule.frequency === "weekly") {
          nextSendAt.setDate(nextSendAt.getDate() + 7);
        } else {
          nextSendAt.setMonth(nextSendAt.getMonth() + 1);
        }

        // Update schedule
        await supabase
          .from("analytics_report_schedules")
          .update({
            last_sent_at: now.toISOString(),
            next_send_at: nextSendAt.toISOString(),
          })
          .eq("id", schedule.id);

        results.push({ providerId: provider.id, success: true });
      } catch (err) {
        console.error("Error processing schedule:", err);
        results.push({ providerId: schedule.provider_id, success: false, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-analytics-report:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
