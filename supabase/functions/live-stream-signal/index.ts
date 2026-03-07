import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication for all live stream operations
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, streamId, providerId, title, description, viewerId } = await req.json();

    // Validate action is one of the allowed values
    const validActions = ['start_stream', 'end_stream', 'join_stream', 'leave_stream', 'get_live_streams'];
    if (!action || !validActions.includes(action)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Live stream signal:', { action, streamId, providerId });

    switch (action) {
      case 'start_stream': {
        // Create a new live stream entry
        const streamData = {
          id: crypto.randomUUID(),
          provider_id: providerId,
          title: title || 'Live Stream',
          description: description || '',
          status: 'live',
          viewer_count: 0,
          started_at: new Date().toISOString(),
        };

        console.log('Starting stream:', streamData);

        return new Response(JSON.stringify({ 
          success: true, 
          stream: streamData,
          message: 'Stream started successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'end_stream': {
        console.log('Ending stream:', streamId);

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Stream ended successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'join_stream': {
        console.log('Viewer joining stream:', { streamId, viewerId });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Joined stream successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'leave_stream': {
        console.log('Viewer leaving stream:', { streamId, viewerId });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Left stream successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_live_streams': {
        // Return mock live streams for now
        console.log('Fetching live streams');

        return new Response(JSON.stringify({ 
          success: true, 
          streams: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Unknown action' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('Error in live-stream-signal:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'An internal error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
