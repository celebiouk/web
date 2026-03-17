-- Migration: add missing course storage buckets and policies
-- Fixes "Bucket not found" when creating/editing courses and lessons

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('course-covers', 'course-covers', true),
  ('course-videos', 'course-videos', true),
  ('lesson-files', 'lesson-files', true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

DROP POLICY IF EXISTS "Public can view course covers" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course videos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view lesson files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own course covers" ON storage.objects;
DROP POLICY IF EXISTS "Creators can upload files for own courses" ON storage.objects;
DROP POLICY IF EXISTS "Creators can update files for own courses" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete files for own courses" ON storage.objects;

CREATE POLICY "Public can view course covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-covers');

CREATE POLICY "Public can view course videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-videos');

CREATE POLICY "Public can view lesson files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'lesson-files');

CREATE POLICY "Users can upload own course covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Creators can upload files for own courses"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('course-videos', 'lesson-files')
  AND EXISTS (
    SELECT 1
    FROM public.courses c
    WHERE c.id::text = (storage.foldername(name))[1]
      AND c.creator_id = auth.uid()
  )
);

CREATE POLICY "Creators can update files for own courses"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('course-covers', 'course-videos', 'lesson-files')
  AND (
    (bucket_id = 'course-covers' AND (storage.foldername(name))[1] = auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.creator_id = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id IN ('course-covers', 'course-videos', 'lesson-files')
  AND (
    (bucket_id = 'course-covers' AND (storage.foldername(name))[1] = auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.creator_id = auth.uid()
    )
  )
);

CREATE POLICY "Creators can delete files for own courses"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('course-covers', 'course-videos', 'lesson-files')
  AND (
    (bucket_id = 'course-covers' AND (storage.foldername(name))[1] = auth.uid()::text)
    OR EXISTS (
      SELECT 1
      FROM public.courses c
      WHERE c.id::text = (storage.foldername(name))[1]
        AND c.creator_id = auth.uid()
    )
  )
);
