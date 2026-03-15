-- Cele.bio Phase 3 Schema Updates
-- Digital Products + Stripe Connect + Orders

-- Add stripe_account_status to track Connect onboarding state
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_account_status TEXT DEFAULT 'not_connected';
-- Values: not_connected | pending | complete

-- Add file_path column to products (stores private file path for delivery)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add preview_file_url for free preview files
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preview_file_url TEXT;

-- Orders table - tracks all purchases
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  buyer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER DEFAULT 0,
  net_amount_cents INTEGER GENERATED ALWAYS AS (amount_cents - platform_fee_cents) STORED,
  stripe_payment_intent_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  delivery_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order downloads table - tracks file download attempts
CREATE TABLE IF NOT EXISTS public.order_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_creator_id ON public.orders(creator_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON public.orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_order_downloads_order_id ON public.order_downloads(order_id);

-- RLS Policies for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Creators can view their own orders
CREATE POLICY "Creators can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = creator_id);

-- Service role can insert/update (used by webhooks)
CREATE POLICY "Service role can manage orders" ON public.orders
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for order_downloads
ALTER TABLE public.order_downloads ENABLE ROW LEVEL SECURITY;

-- Creators can view downloads for their orders
CREATE POLICY "Creators can view own order downloads" ON public.order_downloads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_downloads.order_id 
      AND orders.creator_id = auth.uid()
    )
  );

-- Service role can insert (used by download API)
CREATE POLICY "Service role can manage order downloads" ON public.order_downloads
  FOR ALL USING (auth.role() = 'service_role');

-- Updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- Storage buckets setup instructions (run in Supabase Dashboard)
-- CREATE BUCKET product-covers WITH PUBLIC ACCESS
-- CREATE BUCKET product-files WITH PRIVATE ACCESS

COMMENT ON TABLE public.orders IS 'Stores all product purchases';
COMMENT ON TABLE public.order_downloads IS 'Tracks download attempts for order verification';
COMMENT ON COLUMN public.orders.platform_fee_cents IS 'cele.bio commission (8% for free tier, 0% for pro)';
COMMENT ON COLUMN public.orders.net_amount_cents IS 'Amount creator receives after platform fee';
