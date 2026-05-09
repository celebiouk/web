-- CeleStudio: AI-powered ebook builder
-- Creators paste plain text -> AI structures into blocks -> rendered with chosen design system

CREATE TABLE IF NOT EXISTS celestudio_ebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Core metadata
  title TEXT NOT NULL DEFAULT 'Untitled Ebook',
  subtitle TEXT,
  description TEXT,
  cover_image_url TEXT,

  -- Design
  design_system TEXT NOT NULL DEFAULT 'minimal-editorial',
    -- 'minimal-editorial' | 'luxury-black-gold' | 'modern-startup' | 'wellness-soft' | 'futuristic-ai' | 'corporate-clean'
  theme_color TEXT, -- Optional override hex color

  -- Content
  source_text TEXT, -- Original plain text input from user
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb, -- Ordered array of block objects
  variation_index INT NOT NULL DEFAULT 0, -- Which variation (0=A, 1=B, 2=C) when multi-variation lands

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
  published_product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Future-proofed table for storing AI variations (Phase 2/3)
CREATE TABLE IF NOT EXISTS celestudio_ebook_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id UUID NOT NULL REFERENCES celestudio_ebooks(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- 'A' | 'B' | 'C'
  blocks JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ebook_id, label)
);

CREATE INDEX IF NOT EXISTS idx_celestudio_ebooks_creator ON celestudio_ebooks(creator_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_celestudio_ebooks_status ON celestudio_ebooks(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_celestudio_variations_ebook ON celestudio_ebook_variations(ebook_id);

-- RLS
ALTER TABLE celestudio_ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE celestudio_ebook_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ebooks" ON celestudio_ebooks
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users manage own ebook variations" ON celestudio_ebook_variations
  FOR ALL USING (auth.uid() = (SELECT creator_id FROM celestudio_ebooks WHERE id = ebook_id));
