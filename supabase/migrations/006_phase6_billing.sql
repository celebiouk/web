-- Phase 6: Billing System
-- Pricing, subscriptions, commissions, custom domains, and upgrade nudges

-- ============================================
-- PROFILES UPDATES
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_custom_domain_unique
  ON public.profiles (LOWER(custom_domain))
  WHERE custom_domain IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_domain_verified
  ON public.profiles(domain_verified);

-- ============================================
-- SUBSCRIPTIONS UPDATES
-- ============================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_customer
  ON public.subscriptions(stripe_customer_id);

-- ============================================
-- COMMISSION LEDGER
-- ============================================
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  sale_type TEXT DEFAULT 'order' CHECK (sale_type IN ('order', 'booking', 'course_enrollment')),
  sale_reference_id UUID,
  stripe_payment_intent_id TEXT UNIQUE,
  sale_amount_cents INTEGER NOT NULL,
  commission_rate DECIMAL DEFAULT 0.08,
  commission_amount_cents INTEGER NOT NULL,
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_ledger_creator_id ON public.commission_ledger(creator_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_created_at ON public.commission_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_ledger_sale_type ON public.commission_ledger(sale_type);

ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Creators can view own commission ledger" ON public.commission_ledger;
DROP POLICY IF EXISTS "Service role can manage commission ledger" ON public.commission_ledger;

CREATE POLICY "Creators can view own commission ledger" ON public.commission_ledger
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Service role can manage commission ledger" ON public.commission_ledger
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Monthly commission totals for internal/admin reporting
CREATE OR REPLACE VIEW public.commission_monthly_totals AS
SELECT
  date_trunc('month', created_at) AS month,
  SUM(commission_amount_cents) AS total_commission_cents,
  COUNT(*) AS sales_count
FROM public.commission_ledger
GROUP BY 1
ORDER BY 1 DESC;

-- ============================================
-- UPGRADE NUDGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.upgrade_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false,
  converted BOOLEAN DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_upgrade_nudges_user_type
  ON public.upgrade_nudges(user_id, nudge_type);
CREATE INDEX IF NOT EXISTS idx_upgrade_nudges_user_shown_at
  ON public.upgrade_nudges(user_id, shown_at DESC);

ALTER TABLE public.upgrade_nudges ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Users can view own upgrade nudges" ON public.upgrade_nudges;
DROP POLICY IF EXISTS "Users can update own upgrade nudges" ON public.upgrade_nudges;
DROP POLICY IF EXISTS "Service role can manage upgrade nudges" ON public.upgrade_nudges;

CREATE POLICY "Users can view own upgrade nudges" ON public.upgrade_nudges
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own upgrade nudges" ON public.upgrade_nudges
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage upgrade nudges" ON public.upgrade_nudges
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- EMAIL SUBSCRIBERS (for 500-limit nudge tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, email)
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_creator_id
  ON public.email_subscribers(creator_id);

ALTER TABLE public.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Creators can view own email subscribers" ON public.email_subscribers;
DROP POLICY IF EXISTS "Creators can insert own email subscribers" ON public.email_subscribers;
DROP POLICY IF EXISTS "Creators can update own email subscribers" ON public.email_subscribers;
DROP POLICY IF EXISTS "Service role can manage email subscribers" ON public.email_subscribers;

CREATE POLICY "Creators can view own email subscribers" ON public.email_subscribers
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Creators can insert own email subscribers" ON public.email_subscribers
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own email subscribers" ON public.email_subscribers
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Service role can manage email subscribers" ON public.email_subscribers
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.commission_ledger IS 'Tracks cele.bio commission collected from free tier creator sales';
COMMENT ON TABLE public.upgrade_nudges IS 'Tracks in-app and email upgrade nudges shown to creators';
COMMENT ON VIEW public.commission_monthly_totals IS 'Internal monthly commission totals for admin reporting';
COMMENT ON TABLE public.email_subscribers IS 'Creator email subscribers used for subscriber limits and nudges';
