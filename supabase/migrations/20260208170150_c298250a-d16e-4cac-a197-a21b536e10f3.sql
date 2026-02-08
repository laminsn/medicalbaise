-- Enable realtime for social_posts so feed updates in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;