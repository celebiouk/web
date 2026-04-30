-- Fix SECURITY DEFINER views flagged by Supabase linter.
-- Both views are recreated with security_invoker = true so they respect
-- the querying user's RLS policies instead of running as the view creator.

-- ============================================================
-- 1. commission_monthly_totals  (admin-only reporting view)
-- ============================================================
CREATE OR REPLACE VIEW public.commission_monthly_totals
WITH (security_invoker = true)
AS
SELECT
  date_trunc('month', created_at) AS month,
  SUM(commission_amount_cents)    AS total_commission_cents,
  COUNT(*)                        AS sales_count
FROM public.commission_ledger
GROUP BY 1
ORDER BY 1 DESC;

COMMENT ON VIEW public.commission_monthly_totals IS 'Internal monthly commission totals for admin reporting';

-- ============================================================
-- 2. affiliate_marketplace  (public read view)
-- ============================================================
CREATE OR REPLACE VIEW public.affiliate_marketplace
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.title,
  p.description,
  p.price                    AS price_cents,
  p.cover_image_url,
  p.type                     AS product_type,
  p.affiliate_commission_rate,
  p.total_affiliate_sales,
  p.created_at,
  pr.id                      AS creator_id,
  pr.username,
  pr.full_name,
  pr.avatar_url
FROM public.products p
JOIN public.profiles pr ON p.creator_id = pr.id
WHERE p.affiliate_enabled = true
  AND p.is_published = true;
