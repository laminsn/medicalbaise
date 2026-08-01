import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AiProviderConfigurationError, requestAiChatCompletion } from "../_shared/ai-provider.ts";

const ALLOWED_ORIGINS = [
  "https://mdbaise.com",
  "https://www.mdbaise.com",
  ...(Deno.env.get("ENVIRONMENT") !== "production" ? ["http://localhost:8080"] : []),
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user — AI chat must not be accessible without auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Validate messages input
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize messages — strip any that don't have valid role/content
    const sanitizedMessages = messages
      .filter((m: { role?: string; content?: string }) =>
        m && typeof m.role === "string" && typeof m.content === "string" &&
        ["user", "assistant"].includes(m.role) && m.content.length <= 10000
      )
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content.slice(0, 10000),
      }));

    if (sanitizedMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the Medical Baise platform support assistant.

Your role is to:
- Explain account, scheduling, messaging, billing, and provider-discovery features.
- Keep answers concise, professional, and limited to platform support.
- Never diagnose, recommend treatment, interpret symptoms, or request/repeat health information.
- Tell users not to place symptoms, diagnoses, treatment details, insurance identifiers, or appointment details in chat.
- For urgent or emergency concerns, direct the user to local emergency services.
- If platform-specific information is unavailable, direct the user to Medical Baise support.`;

    const response = await requestAiChatCompletion({
      messages: [
        { role: "system", content: systemPrompt },
        ...sanitizedMessages,
      ],
      stream: true,
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI provider request failed:", response.status);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    if (error instanceof AiProviderConfigurationError) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
