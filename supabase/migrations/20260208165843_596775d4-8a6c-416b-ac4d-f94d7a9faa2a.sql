-- Drop overly permissive storage policies for testimonials bucket
DROP POLICY IF EXISTS "Providers can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Providers can update their media" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their media" ON storage.objects;

-- Recreate with proper scoping - providers can only manage files in their own folder
CREATE POLICY "Providers can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'testimonials' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can update own media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'testimonials' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM providers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Providers can delete own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'testimonials' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM providers WHERE user_id = auth.uid()
  )
);
