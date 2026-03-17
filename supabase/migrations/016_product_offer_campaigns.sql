-- Product-level offer campaigns (discounts + countdown + claim limits + bonus product)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS offer_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_discount_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS offer_limit_type TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS offer_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offer_max_claims INTEGER,
  ADD COLUMN IF NOT EXISTS offer_claims_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_bonus_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_offer_limit_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_offer_limit_type_check
  CHECK (offer_limit_type IN ('none', 'time', 'claims'));

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_offer_discount_non_negative_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_offer_discount_non_negative_check
  CHECK (offer_discount_price_cents IS NULL OR offer_discount_price_cents >= 0);

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_offer_claims_bounds_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_offer_claims_bounds_check
  CHECK (
    (offer_max_claims IS NULL OR (offer_max_claims BETWEEN 1 AND 1000))
    AND offer_claims_used >= 0
    AND (offer_max_claims IS NULL OR offer_claims_used <= offer_max_claims)
  );

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS offer_applied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_discount_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_bonus_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bonus_from_order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_offer_discount_non_negative_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_offer_discount_non_negative_check
  CHECK (offer_discount_cents >= 0);

CREATE INDEX IF NOT EXISTS idx_products_offer_enabled ON public.products (offer_enabled);
CREATE INDEX IF NOT EXISTS idx_products_offer_bonus_product_id ON public.products (offer_bonus_product_id);
CREATE INDEX IF NOT EXISTS idx_orders_bonus_from_order_id ON public.orders (bonus_from_order_id);
