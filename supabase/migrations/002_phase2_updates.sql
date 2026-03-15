-- Cele.bio Phase 2 Schema Updates
-- Adds page_theme, duration_minutes, and social_links columns

-- Add page_theme JSONB column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS page_theme JSONB DEFAULT '{
  "primary_color": "#6366f1",
  "font": "modern-sans",
  "dark_mode": false
}';

-- Add social_links JSONB column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]';

-- Add duration_minutes to products table (for coaching sessions)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Ensure cover_image_url exists (should already exist but making sure)
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Index for public page queries - get published products with creator
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(creator_id, is_published) WHERE is_published = true;

-- Comment explaining the page_theme structure
COMMENT ON COLUMN public.profiles.page_theme IS 'Theme settings: { primary_color: hex, font: modern-sans|classic-serif|mono-tech, dark_mode: boolean }';

-- Comment explaining social_links structure
COMMENT ON COLUMN public.profiles.social_links IS 'Array of social links: [{ platform: string, url: string }]';
