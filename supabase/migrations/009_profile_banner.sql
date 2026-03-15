-- Migration: Add banner_url, testimonials_enabled, and template_slug to profiles table
-- This allows creators to upload a custom banner image for their landing page

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add testimonials_enabled flag to control whether testimonials are shown
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS testimonials_enabled BOOLEAN DEFAULT false;

-- Add template_slug to store the selected template directly (not just UUID)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS template_slug TEXT DEFAULT 'minimal-clean';

-- Storage bucket for banners (run in Supabase Dashboard if not using migrations)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Storage policies for banners
-- CREATE POLICY "Anyone can view banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
-- CREATE POLICY "Auth users can upload banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own banners" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own banners" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid()::text = (storage.foldername(name))[1]);
