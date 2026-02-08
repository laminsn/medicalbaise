
-- Create live_streams table for persistent stream discovery
CREATE TABLE public.live_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  specialty TEXT,
  location TEXT,
  viewer_count INTEGER DEFAULT 0,
  channel_name TEXT NOT NULL,
  is_live BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

-- Anyone can see active live streams
CREATE POLICY "Anyone can view live streams"
  ON public.live_streams FOR SELECT
  USING (true);

-- Providers can create their own streams
CREATE POLICY "Providers can create own streams"
  ON public.live_streams FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.id = live_streams.provider_id
    AND providers.user_id = auth.uid()
  ));

-- Providers can update their own streams (end stream, update viewer count)
CREATE POLICY "Providers can update own streams"
  ON public.live_streams FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.id = live_streams.provider_id
    AND providers.user_id = auth.uid()
  ));

-- Providers can delete their own streams
CREATE POLICY "Providers can delete own streams"
  ON public.live_streams FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.id = live_streams.provider_id
    AND providers.user_id = auth.uid()
  ));

-- Enable realtime for live_streams
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;

-- Index for quick lookup of active streams
CREATE INDEX idx_live_streams_active ON public.live_streams (is_live) WHERE is_live = true;
