-- Affiliate Marketplace Feature
-- Allows creators to enable affiliate programs on their products
-- and other users to promote those products for commission

-- Add affiliate columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_commission_rate DECIMAL(5,4) DEFAULT 0.20,
  ADD COLUMN IF NOT EXISTS total_affiliate_sales INTEGER DEFAULT 0;

-- Table to track which products a user is promoting
CREATE TABLE IF NOT EXISTS public.affiliate_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  display_mode TEXT DEFAULT 'list' CHECK (display_mode IN ('list', 'carousel')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(promoter_id, product_id)
);

-- Table to track affiliate clicks and conversions
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.affiliate_promotions(id) ON DELETE CASCADE,
  visitor_id TEXT, -- anonymous visitor tracking
  ip_hash TEXT, -- hashed IP for deduplication
  converted BOOLEAN DEFAULT false,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table to track affiliate earnings and payouts
CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  commission_rate DECIMAL(5,4) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- View for the public affiliate marketplace
CREATE OR REPLACE VIEW public.affiliate_marketplace AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.price AS price_cents,
  p.cover_image_url,
  p.type AS product_type,
  p.affiliate_commission_rate,
  p.total_affiliate_sales,
  p.created_at,
  pr.id AS creator_id,
  pr.username,
  pr.full_name,
  pr.avatar_url
FROM public.products p
JOIN public.profiles pr ON p.creator_id = pr.id
WHERE p.affiliate_enabled = true
AND p.is_published = true;

-- RLS policies
ALTER TABLE public.affiliate_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- Promotions: users can see all, but only manage their own
CREATE POLICY "Public can view promotions" ON public.affiliate_promotions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own promotions" ON public.affiliate_promotions
  FOR ALL USING (auth.uid() = promoter_id);

-- Clicks: only system can insert, users can view their own promotion clicks
CREATE POLICY "Users can view clicks on their promotions" ON public.affiliate_clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliate_promotions ap 
      WHERE ap.id = promotion_id AND ap.promoter_id = auth.uid()
    )
  );

-- Earnings: users can view their own
CREATE POLICY "Users can view own earnings" ON public.affiliate_earnings
  FOR SELECT USING (auth.uid() = promoter_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_promotions_promoter ON public.affiliate_promotions(promoter_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_promotions_product ON public.affiliate_promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_promotion ON public.affiliate_clicks(promotion_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_earnings_promoter ON public.affiliate_earnings(promoter_id);
CREATE INDEX IF NOT EXISTS idx_products_affiliate_enabled ON public.products(affiliate_enabled) WHERE affiliate_enabled = true;

-- Function to increment affiliate sales count
CREATE OR REPLACE FUNCTION increment_affiliate_sales()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET total_affiliate_sales = total_affiliate_sales + 1
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment sales
DROP TRIGGER IF EXISTS trigger_increment_affiliate_sales ON public.affiliate_earnings;
CREATE TRIGGER trigger_increment_affiliate_sales
  AFTER INSERT ON public.affiliate_earnings
  FOR EACH ROW
  EXECUTE FUNCTION increment_affiliate_sales();
