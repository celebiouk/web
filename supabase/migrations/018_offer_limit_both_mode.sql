-- Support combined offer constraints (timer + claim limit)

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_offer_limit_type_check;

ALTER TABLE public.products
  ADD CONSTRAINT products_offer_limit_type_check
  CHECK (offer_limit_type IN ('none', 'time', 'claims', 'both'));
