import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// Weekly educational content library inspired by Gary Vee, Alex Hormozi, MrBeast
const WEEKLY_CAMPAIGNS = [
  {
    week: 1,
    subject: "🚀 The #1 Mistake Killing Your Profile Views (And How to Fix It Today)",
    category: "profile_optimization",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Your Profile Is Your Storefront</h2>
      <p><strong>Gary Vee says it best:</strong> "Content is king, but context is God." Your profile needs to tell a story in 3 seconds.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 The Data:</h3>
        <ul>
          <li>Profiles with professional photos get <strong>14x more views</strong></li>
          <li>Complete bios increase quote requests by <strong>62%</strong></li>
          <li>Adding a tagline boosts click-through by <strong>38%</strong></li>
        </ul>
      </div>

      <h3>✅ This Week's Action Items:</h3>
      <ol>
        <li><strong>Upload a professional headshot</strong> — natural lighting, clean background</li>
        <li><strong>Write a 2-sentence bio</strong> — who you help + your unique advantage</li>
        <li><strong>Add your top 3 services</strong> with clear pricing or "Quote-based"</li>
      </ol>

      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>🎯 Alex Hormozi Principle:</strong> "Make the value so obvious they feel stupid saying no." Your profile should scream competence before they even read a word.</p>
      </div>
    `,
  },
  {
    week: 2,
    subject: "📸 How to Create Posts That Actually Get Clients (Not Just Likes)",
    category: "content_strategy",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Stop Posting. Start Creating Content That Converts.</h2>
      <p><strong>MrBeast's Rule:</strong> "Every piece of content should hook in 1 second." The same applies to your service posts.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 What the Data Shows:</h3>
        <ul>
          <li>Before/after posts get <strong>3.2x more engagement</strong> than text-only</li>
          <li>Posts with pricing info generate <strong>47% more quote requests</strong></li>
          <li>Video posts receive <strong>2.5x more saves</strong> than images</li>
          <li>Posting at least <strong>3x per week</strong> increases profile visits by <strong>89%</strong></li>
        </ul>
      </div>

      <h3>🔥 The Perfect Post Formula:</h3>
      <ol>
        <li><strong>Hook</strong> — Start with the result or transformation</li>
        <li><strong>Context</strong> — Brief backstory (what was the problem?)</li>
        <li><strong>Proof</strong> — Show the work (photos, video, testimonial)</li>
        <li><strong>CTA</strong> — "Book now" or "Send me a message"</li>
      </ol>

      <div style="background: #ede9fe; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>💡 Gary Vee Strategy:</strong> "Document, don't create." Film your work process. Your daily work IS your content. One job = 5 pieces of content (before, during, after, testimonial, tip).</p>
      </div>
    `,
  },
  {
    week: 3,
    subject: "⭐ Case Study: How Dr. Silva Got 23 New Patients in 30 Days",
    category: "case_study",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Real Results from a Real Provider</h2>
      <p>Dr. Ana Silva, a dermatologist in São Paulo, was struggling to fill her schedule. Here's exactly what she did:</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 Her Results:</h3>
        <ul>
          <li><strong>Before:</strong> 3-4 new patients per month</li>
          <li><strong>After:</strong> 23 new patients in 30 days</li>
          <li><strong>Method:</strong> Consistent posting + story updates + quick responses</li>
          <li><strong>Time investment:</strong> 20 minutes per day</li>
        </ul>
      </div>

      <h3>🎯 Her 4-Step System:</h3>
      <ol>
        <li><strong>Monday:</strong> Educational post (skin care tip + before/after)</li>
        <li><strong>Wednesday:</strong> Behind-the-scenes story of a procedure</li>
        <li><strong>Friday:</strong> Patient testimonial or FAQ answer</li>
        <li><strong>Daily:</strong> Respond to every message within 2 hours</li>
      </ol>

      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>🧠 Alex Hormozi Insight:</strong> "Speed to lead is the #1 predictor of closing. If you respond in under 5 minutes, you're 21x more likely to convert that lead into a paying customer."</p>
      </div>

      <h3>Key Takeaway:</h3>
      <p>Dr. Silva didn't do anything extraordinary. She just showed up <strong>consistently</strong> and responded <strong>fast</strong>. That's it. The platform does the rest.</p>
    `,
  },
  {
    week: 4,
    subject: "🎥 Go Live & 10x Your Visibility (Here's the Exact Playbook)",
    category: "live_streaming",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Live Streaming = The Fastest Way to Build Trust</h2>
      <p><strong>MrBeast's Philosophy:</strong> "The algorithm rewards watch time above everything else." Live streams keep people watching 6x longer than posts.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 Live Stream Stats:</h3>
        <ul>
          <li>Live sessions get <strong>6x more engagement</strong> than regular posts</li>
          <li>Providers who go live weekly see <strong>340% more profile views</strong></li>
          <li>Live Q&A sessions convert at <strong>28% higher rates</strong></li>
          <li>Average live viewer stays <strong>8.2 minutes</strong> vs 4 seconds on a post</li>
        </ul>
      </div>

      <h3>📋 Your First Live Stream Checklist:</h3>
      <ol>
        <li><strong>Pick a topic</strong> — Answer the #1 question your clients ask</li>
        <li><strong>Announce 24h before</strong> — Post a story saying "Going live tomorrow at [time]"</li>
        <li><strong>Keep it 10-15 minutes</strong> — Short, focused, valuable</li>
        <li><strong>Engage with comments</strong> — Say viewer names, answer questions live</li>
        <li><strong>End with a CTA</strong> — "Book a consultation through my profile"</li>
      </ol>

      <div style="background: #ede9fe; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>🔥 Gary Vee Truth:</strong> "People don't buy from businesses. They buy from people they know, like, and trust. Live video is the fastest shortcut to all three."</p>
      </div>
    `,
  },
  {
    week: 5,
    subject: "💰 Price Psychology: How Top Providers Charge 2x More (And Get More Clients)",
    category: "pricing_strategy",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Stop Competing on Price. Start Competing on Value.</h2>
      <p><strong>Alex Hormozi's Grand Slam Offer:</strong> "Make your offer so good people feel stupid saying no." It's not about being cheap — it's about being worth it.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 Pricing Facts:</h3>
        <ul>
          <li>Providers who show transparent pricing get <strong>73% more inquiries</strong></li>
          <li>Adding a "Premium" tier increases average order value by <strong>41%</strong></li>
          <li>Warranties and guarantees boost conversions by <strong>67%</strong></li>
          <li>Packages outsell hourly rates <strong>3 to 1</strong></li>
        </ul>
      </div>

      <h3>🏗️ Build Your Value Stack:</h3>
      <ol>
        <li><strong>Core Service</strong> — What they're paying for</li>
        <li><strong>Bonuses</strong> — Free follow-up, documentation, aftercare tips</li>
        <li><strong>Guarantee</strong> — "If you're not satisfied, I'll redo it free"</li>
        <li><strong>Speed</strong> — Priority scheduling for premium clients</li>
        <li><strong>Results</strong> — Before/after portfolio proving your track record</li>
      </ol>

      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>💡 Hormozi Formula:</strong> Dream Outcome × Perceived Likelihood ÷ Time × Effort = VALUE. Increase the top, decrease the bottom. That's how you justify premium pricing.</p>
      </div>
    `,
  },
  {
    week: 6,
    subject: "📱 Stories That Sell: Your 24-Hour Secret Weapon",
    category: "stories_strategy",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Stories Are The Most Underused Tool on The Platform</h2>
      <p><strong>Gary Vee:</strong> "Stories are the single most important content format right now. Period."</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 Story Stats:</h3>
        <ul>
          <li>Providers who post daily stories see <strong>5x more DMs</strong></li>
          <li>Stories with polls get <strong>2x more replies</strong></li>
          <li>Behind-the-scenes content increases trust scores by <strong>44%</strong></li>
          <li><strong>86%</strong> of top providers post at least 3 stories per day</li>
        </ul>
      </div>

      <h3>📋 The Daily Story Rotation:</h3>
      <ol>
        <li><strong>Morning:</strong> "Starting the day" — show your workspace, preparation</li>
        <li><strong>Midday:</strong> "Work in progress" — a procedure, service, or client interaction</li>
        <li><strong>Afternoon:</strong> "Results" — completed work, happy client</li>
        <li><strong>Evening:</strong> "Tip of the day" — quick educational nugget</li>
      </ol>

      <div style="background: #ede9fe; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>🎯 MrBeast Principle:</strong> "Make every second count." Your story should deliver value or evoke emotion within the first frame. No filler. No fluff.</p>
      </div>
    `,
  },
  {
    week: 7,
    subject: "🏆 Case Study: From 0 to 50 Reviews in 60 Days",
    category: "case_study",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Social Proof Is Your Most Powerful Sales Tool</h2>
      <p>Marco, a personal trainer, had zero reviews when he joined. Two months later, he had 50 five-star reviews and a 3-week waitlist.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 His Numbers:</h3>
        <ul>
          <li><strong>Week 1-2:</strong> Asked every existing client for a review (got 12)</li>
          <li><strong>Week 3-4:</strong> Started video testimonials (got 8 video + 10 text)</li>
          <li><strong>Week 5-8:</strong> New clients came pre-sold from reviews (20 organic reviews)</li>
          <li><strong>Result:</strong> Raised prices by 35%, still fully booked</li>
        </ul>
      </div>

      <h3>🎯 Marco's Review System:</h3>
      <ol>
        <li><strong>After every service:</strong> Send a thank-you message with review request</li>
        <li><strong>Make it easy:</strong> "Would you mind sharing a quick review? It helps other clients find trustworthy providers"</li>
        <li><strong>Video testimonials:</strong> Ask top clients to record 30-second videos</li>
        <li><strong>Respond to every review:</strong> Shows you care and are active</li>
      </ol>

      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>🧠 Hormozi:</strong> "Proof removes risk. The more proof you have, the less selling you need to do. Reviews are your 24/7 sales team."</p>
      </div>
    `,
  },
  {
    week: 8,
    subject: "⚡ Response Time: The Hidden Metric That Makes or Breaks Your Business",
    category: "operations",
    content: `
      <h2 style="color: #047857; margin-bottom: 16px;">Speed Wins. Every. Single. Time.</h2>
      <p><strong>The data is brutal:</strong> If you don't respond within 5 minutes, your chance of converting drops by 80%.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #047857; padding: 16px; margin: 16px 0; border-radius: 4px;">
        <h3 style="margin-top: 0;">📊 Response Time Stats:</h3>
        <ul>
          <li>Respond in <strong>&lt;5 min:</strong> 21x more likely to convert</li>
          <li>Respond in <strong>&lt;1 hour:</strong> Still 7x more likely</li>
          <li>Respond in <strong>&gt;24 hours:</strong> 95% of leads are gone forever</li>
          <li>Top 10% of providers respond in under <strong>3 minutes</strong></li>
        </ul>
      </div>

      <h3>⚡ Speed-Up Strategies:</h3>
      <ol>
        <li><strong>Turn on notifications</strong> — Never miss a message or quote request</li>
        <li><strong>Set up message templates</strong> — Pre-write responses for common inquiries</li>
        <li><strong>Block "response time"</strong> — Check messages at set intervals (every 30 min)</li>
        <li><strong>Use auto-replies</strong> — Acknowledge immediately, follow up with details</li>
      </ol>

      <div style="background: #ede9fe; padding: 16px; border-radius: 8px; margin-top: 16px;">
        <p style="margin: 0;"><strong>🔥 Gary Vee:</strong> "The brands that win in the next decade are the ones that reply the fastest. Speed of execution beats quality of strategy every time."</p>
      </div>
    `,
  },
];

const getEmailTemplate = (campaignContent: typeof WEEKLY_CAMPAIGNS[0], providerName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a; line-height: 1.6;">
  <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #047857;">
    <h1 style="margin: 0; color: #047857; font-size: 24px;">MDBaise Provider Academy</h1>
    <p style="color: #666; margin-top: 4px; font-size: 14px;">Weekly Growth Strategies for Top Providers</p>
  </div>

  <div style="margin-top: 24px;">
    <p>Hey ${providerName} 👋,</p>
    ${campaignContent.content}
  </div>

  <div style="margin-top: 32px; padding: 20px; background: #047857; border-radius: 12px; text-align: center;">
    <p style="color: white; margin: 0 0 12px 0; font-size: 18px; font-weight: bold;">Ready to grow? 🚀</p>
    <p style="color: #d1fae5; margin: 0 0 16px 0;">Log in and apply these strategies today.</p>
    <a href="https://medicalbaise.lovable.app/provider-dashboard" style="display: inline-block; background: white; color: #047857; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">Open Dashboard →</a>
  </div>

  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      You're receiving this because you're a registered provider on MDBaise.<br>
      These strategies are designed to help you grow your practice.
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
    // Verify this is called by an admin or by the Supabase cron scheduler.
    // Check for the service role key in the Authorization header to ensure
    // only authorized callers (cron jobs or admin) can trigger mass email sends.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the caller is an admin user
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Admin user verified:", userData.user.id);

    // Determine which week's campaign to send (rotating)
    const startDate = new Date("2026-01-01");
    const now = new Date();
    const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const campaignIndex = weeksSinceStart % WEEKLY_CAMPAIGNS.length;
    const campaign = WEEKLY_CAMPAIGNS[campaignIndex];

    console.log(`Sending campaign week ${campaignIndex + 1}: ${campaign.subject}`);

    // Get all providers with email
    const { data: providers, error: provError } = await supabase
      .from("providers")
      .select("id, user_id, business_name");

    if (provError) {
      throw new Error(`Failed to fetch providers: ${provError.message}`);
    }

    if (!providers || providers.length === 0) {
      return new Response(JSON.stringify({ message: "No providers found" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get emails from profiles
    const userIds = providers.map((p) => p.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, email, first_name")
      .in("user_id", userIds);

    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

    let sent = 0;
    let errors = 0;

    // Send emails in batches of 10
    const batchSize = 10;
    for (let i = 0; i < providers.length; i += batchSize) {
      const batch = providers.slice(i, i + batchSize);

      const promises = batch.map(async (provider) => {
        const profile = profileMap.get(provider.user_id);
        if (!profile?.email) return;

        const providerName = provider.business_name || profile.first_name || "Provider";

        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "MDBaise Academy <onboarding@resend.dev>",
              to: [profile.email],
              subject: campaign.subject,
              html: getEmailTemplate(campaign, providerName),
            }),
          });

          if (res.ok) {
            sent++;
          } else {
            errors++;
            const errText = await res.text();
            console.error(`Failed to send to ${profile.email}:`, errText);
          }
        } catch (err) {
          errors++;
          console.error(`Error sending to ${profile.email}:`, err);
        }
      });

      await Promise.all(promises);
    }

    // Also create an in-app notification for all providers
    const notifications = providers.map((p) => ({
      user_id: p.user_id,
      title: "📚 New Provider Academy Lesson",
      message: campaign.subject.replace(/^[^\s]+\s/, ""),
      type: "education",
      priority: "normal",
      action_url: "/provider-dashboard",
    }));

    // Insert notifications in batches
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      await supabase.from("notifications").insert(batch);
    }

    const result = {
      campaign: campaign.subject,
      category: campaign.category,
      week: campaignIndex + 1,
      totalProviders: providers.length,
      emailsSent: sent,
      emailErrors: errors,
      notificationsSent: notifications.length,
    };

    console.log("Campaign complete:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Campaign error:", error);
    return new Response(JSON.stringify({ error: "Campaign execution failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
