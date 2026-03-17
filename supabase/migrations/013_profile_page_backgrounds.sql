-- Migration: creator page content background preferences

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS page_background_type TEXT NOT NULL DEFAULT 'none'
CHECK (page_background_type IN ('none', 'color', 'gradient', 'image'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS page_background_value TEXT;
