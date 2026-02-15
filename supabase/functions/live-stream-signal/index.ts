import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = [
  "https://medicalbaise.lovable.app",
  "https://mdbaise.com",
  "http://localhost:8080",
];

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LiveStream {
  id: string;
  provider_id: string;
  title: string;
  description: string;
  status: 'live' | 'ended';
  viewer_count: number;
  started_at: string;
  ended_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, streamId, providerId, title, description, viewerId } = await req.json();

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in live-stream-signal:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
