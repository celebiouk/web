-- Cele.bio Supabase Schema
-- Phase 1: Core tables with RLS enabled from day one
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- Stores user profile data, subscription info, and template selection
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_account_id TEXT, -- For Stripe Connect (Phase 3)
  stripe_customer_id TEXT, -- For billing subscriptions
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  template_id UUID,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster username lookups (public pages)
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- ============================================
-- TEMPLATES TABLE
-- Pre-built page templates for creators to choose from
-- ============================================
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('minimal', 'bold', 'elegant', 'creative', 'professional')),
  preview_image_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false, -- For future Pro-only templates
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- Digital products, courses, and coaching services
-- ============================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0, -- Price in cents
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('digital', 'course', 'coaching')),
  cover_image_url TEXT,
  file_url TEXT, -- For digital downloads
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Flexible storage for type-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster creator lookup
CREATE INDEX idx_products_creator ON public.products(creator_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Tracks user billing subscriptions
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro_monthly', 'pro_yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user subscription lookup
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_customer ON public.subscriptions(stripe_customer_id);

-- ============================================
-- COMMISSION LEDGER TABLE
-- Tracks platform commission collected on free tier sales
-- ============================================
CREATE TABLE public.commission_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID, -- References orders from Phase 3 migration
  sale_type TEXT DEFAULT 'order' CHECK (sale_type IN ('order', 'booking', 'course_enrollment')),
  sale_reference_id UUID,
  stripe_payment_intent_id TEXT UNIQUE,
  sale_amount_cents INTEGER NOT NULL,
  commission_rate DECIMAL DEFAULT 0.08,
  commission_amount_cents INTEGER NOT NULL,
  stripe_transfer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_commission_ledger_creator ON public.commission_ledger(creator_id);
CREATE INDEX idx_commission_ledger_created_at ON public.commission_ledger(created_at);

CREATE OR REPLACE VIEW public.commission_monthly_totals AS
SELECT
  date_trunc('month', created_at) AS month,
  SUM(commission_amount_cents) AS total_commission_cents,
  COUNT(*) AS sales_count
FROM public.commission_ledger
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================
-- UPGRADE NUDGES TABLE
-- Tracks helpful upgrade prompts shown to free creators
-- ============================================
CREATE TABLE public.upgrade_nudges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false,
  UNIQUE(user_id, nudge_type)
);

-- ============================================
-- EMAIL SUBSCRIBERS TABLE
-- Tracks creator subscribers for email list growth nudges
-- ============================================
CREATE TABLE public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(creator_id, email)
);

CREATE INDEX idx_email_subscribers_creator ON public.email_subscribers(creator_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - CRITICAL!
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upgrade_nudges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Active templates are viewable by everyone" ON public.templates;
DROP POLICY IF EXISTS "Published products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Creators can view own products" ON public.products;
DROP POLICY IF EXISTS "Creators can insert own products" ON public.products;
DROP POLICY IF EXISTS "Creators can update own products" ON public.products;
DROP POLICY IF EXISTS "Creators can delete own products" ON public.products;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Creators can view own commission ledger" ON public.commission_ledger;
DROP POLICY IF EXISTS "Users can view own nudges" ON public.upgrade_nudges;
DROP POLICY IF EXISTS "Users can update own nudges" ON public.upgrade_nudges;
DROP POLICY IF EXISTS "Creators can view own email subscribers" ON public.email_subscribers;
DROP POLICY IF EXISTS "Creators can insert own email subscribers" ON public.email_subscribers;
DROP POLICY IF EXISTS "Creators can update own email subscribers" ON public.email_subscribers;

-- PROFILES POLICIES
-- Users can read any profile (for public pages)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- TEMPLATES POLICIES
-- Everyone can view active templates
CREATE POLICY "Active templates are viewable by everyone"
  ON public.templates FOR SELECT
  USING (is_active = true);

-- PRODUCTS POLICIES
-- Published products are viewable by everyone (for public pages)
CREATE POLICY "Published products are viewable by everyone"
  ON public.products FOR SELECT
  USING (is_published = true);

-- Creators can view all their own products (including drafts)
CREATE POLICY "Creators can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = creator_id);

-- Creators can insert their own products
CREATE POLICY "Creators can insert own products"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Creators can update their own products
CREATE POLICY "Creators can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own products
CREATE POLICY "Creators can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = creator_id);

-- SUBSCRIPTIONS POLICIES
-- Users can only view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system (service role) can insert/update subscriptions
-- This is handled by Stripe webhooks using the service role key

-- COMMISSION LEDGER POLICIES
CREATE POLICY "Creators can view own commission ledger"
  ON public.commission_ledger FOR SELECT
  USING (auth.uid() = creator_id);

-- UPGRADE NUDGES POLICIES
CREATE POLICY "Users can view own nudges"
  ON public.upgrade_nudges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own nudges"
  ON public.upgrade_nudges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- EMAIL SUBSCRIBERS POLICIES
CREATE POLICY "Creators can view own email subscribers"
  ON public.email_subscribers FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own email subscribers"
  ON public.email_subscribers FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own email subscribers"
  ON public.email_subscribers FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to create a profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED DATA: 10 Templates
-- ============================================

INSERT INTO public.templates (name, slug, category, description, preview_image_url, thumbnail_url, sort_order) VALUES
(
  'Clean Slate',
  'clean-slate',
  'minimal',
  'A minimalist template perfect for creators who want their content to speak for itself.',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
  1
),
(
  'Bold Creator',
  'bold-creator',
  'bold',
  'Make a statement with vibrant colors and strong typography.',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80',
  2
),
(
  'Luxe',
  'luxe',
  'elegant',
  'Sophisticated and refined. Perfect for premium brands and high-end services.',
  'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&q=80',
  'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=400&q=80',
  3
),
(
  'Neon Dreams',
  'neon-dreams',
  'creative',
  'Cyberpunk-inspired gradients for tech-savvy creators.',
  'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=800&q=80',
  'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400&q=80',
  4
),
(
  'Executive',
  'executive',
  'professional',
  'Professional and trustworthy. Ideal for consultants and business coaches.',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
  5
),
(
  'Soft Focus',
  'soft-focus',
  'minimal',
  'Gentle gradients and soft shadows for a calming presence.',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&q=80',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=80',
  6
),
(
  'Street Style',
  'street-style',
  'bold',
  'Urban and edgy. Perfect for lifestyle and fashion creators.',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  7
),
(
  'Golden Hour',
  'golden-hour',
  'elegant',
  'Warm tones and golden accents for a welcoming feel.',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
  8
),
(
  'Creative Canvas',
  'creative-canvas',
  'creative',
  'Artistic and expressive. Show your creative side.',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=80',
  9
),
(
  'Startup',
  'startup',
  'professional',
  'Modern and dynamic. Built for entrepreneurs and founders.',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
  10
);

-- ============================================
-- STORAGE BUCKETS (run separately in Supabase Storage settings)
-- ============================================
-- Create these buckets in your Supabase dashboard:
-- 1. avatars - for user profile pictures (public)
-- 2. products - for product cover images (public)
-- 3. downloads - for digital product files (private, authenticated access)

-- Storage policies would be set up in the Supabase dashboard
