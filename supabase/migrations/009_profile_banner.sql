-- Migration: Add banner_url to profiles table
-- This allows creators to upload a custom banner image for their landing page

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add testimonials_enabled flag to control whether testimonials are shown
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS testimonials_enabled BOOLEAN DEFAULT false;

-- Storage bucket for banners (run in Supabase Dashboard if not using migrations)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies for banners
-- CREATE POLICY "Anyone can view banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
-- CREATE POLICY "Auth users can upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
