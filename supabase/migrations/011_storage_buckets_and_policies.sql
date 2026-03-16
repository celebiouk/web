-- Migration: ensure required storage buckets and RLS policies exist
-- Fixes product upload failures caused by missing buckets/policies

-- Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('product-covers', 'product-covers', true),
  ('product-files', 'product-files', false),
  ('avatars', 'avatars', true),
  ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Clean up old policies if re-running
DROP POLICY IF EXISTS "Public can view product covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own product files" ON storage.objects;

-- Public read policies for public buckets
CREATE POLICY "Public can view product covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-covers');

CREATE POLICY "Public can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Public can view banners"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');

-- Authenticated users can upload into their own folder namespace
-- Required path pattern used by app: {auth.uid()}/..., including nested headers
CREATE POLICY "Authenticated can upload storage objects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('product-covers', 'product-files', 'avatars', 'banners')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update/delete only their own files
CREATE POLICY "Users can update own storage objects"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('product-covers', 'product-files', 'avatars', 'banners')
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id IN ('product-covers', 'product-files', 'avatars', 'banners')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own storage objects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('product-covers', 'product-files', 'avatars', 'banners')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Private bucket read policy (for creator's own file management and signed URL creation)
CREATE POLICY "Users can read own product files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
