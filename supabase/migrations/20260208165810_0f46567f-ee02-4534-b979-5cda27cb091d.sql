-- Create testimonials storage bucket for social posts media
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonials', 'testimonials', true);

-- Allow authenticated users to upload to their provider folder
CREATE POLICY "Providers can upload media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'testimonials');

-- Allow public read access
CREATE POLICY "Public can view testimonial media"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonials');

-- Allow providers to update their own uploads
CREATE POLICY "Providers can update their media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'testimonials');

-- Allow providers to delete their own uploads
CREATE POLICY "Providers can delete their media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'testimonials');
