-- Phase 2: Rich product descriptions + verified testimonial pipeline

-- Rich HTML description field for long-form sales copy
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS description_html TEXT;

-- Testimonial requests (creator -> verified buyer)
CREATE TABLE IF NOT EXISTS public.testimonial_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id)
);

-- Verified testimonials submitted by buyers from request links
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  testimonial_request_id UUID REFERENCES public.testimonial_requests(id) ON DELETE SET NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_avatar_url TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  content_html TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_testimonial_requests_creator ON public.testimonial_requests(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonial_requests_order ON public.testimonial_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_creator ON public.testimonials(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_product ON public.testimonials(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_published ON public.testimonials(creator_id, is_published);

ALTER TABLE public.testimonial_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can view own testimonial requests" ON public.testimonial_requests;
DROP POLICY IF EXISTS "Creators can insert own testimonial requests" ON public.testimonial_requests;
DROP POLICY IF EXISTS "Creators can update own testimonial requests" ON public.testimonial_requests;

CREATE POLICY "Creators can view own testimonial requests"
ON public.testimonial_requests
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own testimonial requests"
ON public.testimonial_requests
FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own testimonial requests"
ON public.testimonial_requests
FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators can view own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Creators can update own testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Public can view published testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Service role can insert testimonials" ON public.testimonials;

CREATE POLICY "Creators can view own testimonials"
ON public.testimonials
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update own testimonials"
ON public.testimonials
FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Public can view published testimonials"
ON public.testimonials
FOR SELECT
USING (is_published = true);

CREATE POLICY "Service role can insert testimonials"
ON public.testimonials
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_testimonials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS testimonials_updated_at ON public.testimonials;
CREATE TRIGGER testimonials_updated_at
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonials_updated_at();

CREATE OR REPLACE FUNCTION update_testimonial_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS testimonial_requests_updated_at ON public.testimonial_requests;
CREATE TRIGGER testimonial_requests_updated_at
  BEFORE UPDATE ON public.testimonial_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_requests_updated_at();
