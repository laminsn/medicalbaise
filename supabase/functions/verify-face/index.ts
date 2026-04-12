import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://medicalbaise.com",
  "https://www.medicalbaise.com",
  "https://mdbaise.com",
  "https://casabaise.com",
  "https://legalbaise.com",
  "https://api.baiseapps.com",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Euclidean distance between two face descriptor arrays
function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

const MATCH_THRESHOLD = 0.6; // Standard face-api.js threshold
const MAX_ATTEMPTS_PER_MINUTE = 5;
const attemptTracker = new Map<string, { count: number; resetAt: number }>();

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const now = Date.now();
    const tracker = attemptTracker.get(clientIP);
    if (tracker && tracker.resetAt > now && tracker.count >= MAX_ATTEMPTS_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: "Too many attempts. Try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }
    if (!tracker || tracker.resetAt <= now) {
      attemptTracker.set(clientIP, { count: 1, resetAt: now + 60000 });
    } else {
      tracker.count++;
    }

    const { descriptor, email } = await req.json();

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return new Response(
        JSON.stringify({ error: "Invalid face descriptor" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Use service role to access face descriptors (never expose to client)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find the user by email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id, email, face_descriptor")
      .eq("email", email.toLowerCase())
      .not("face_descriptor", "is", null)
      .maybeSingle();

    if (profileError || !profile || !profile.face_descriptor) {
      // Generic error — don't reveal whether the email exists
      return new Response(
        JSON.stringify({ match: false, error: "Face verification failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Parse stored descriptor
    let storedDescriptor: number[];
    try {
      storedDescriptor = typeof profile.face_descriptor === "string"
        ? JSON.parse(profile.face_descriptor)
        : profile.face_descriptor;
    } catch {
      return new Response(
        JSON.stringify({ match: false, error: "Face verification failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Compare descriptors
    const distance = euclideanDistance(descriptor, storedDescriptor);
    const match = distance < MATCH_THRESHOLD;

    if (match) {
      // Generate OTP for the matched user
      const { error: otpError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: profile.email,
      });

      if (otpError) {
        console.error("OTP generation error:", otpError.message);
      }

      return new Response(
        JSON.stringify({ match: true, email: profile.email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ match: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("verify-face error:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
