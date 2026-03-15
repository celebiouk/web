-- Migration: product subtitle + header banner, and profile avatar-on-banner toggle

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS subtitle TEXT;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS header_banner_url TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS show_avatar_on_banner BOOLEAN DEFAULT true;

-- Optional storage bucket for large product header banners (if you want separate storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-banners', 'product-banners', true);

-- Optional storage policies for product-banners
-- CREATE POLICY "Anyone can view product banners" ON storage.objects FOR SELECT USING (bucket_id = 'product-banners');
-- CREATE POLICY "Auth users can upload product banners" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-banners' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own product banners" ON storage.objects FOR UPDATE USING (bucket_id = 'product-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own product banners" ON storage.objects FOR DELETE USING (bucket_id = 'product-banners' AND auth.uid()::text = (storage.foldername(name))[1]);
