-- Payout routing + manual payout ops
-- Countries in Paystack set (NG, GH, ZA, KE, CI) use Paystack subaccount split
-- Countries in Stripe-supported set use Stripe Connect
-- Others use manual bank payouts (9th and 24th)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_country_code TEXT,
  ADD COLUMN IF NOT EXISTS payout_provider TEXT NOT NULL DEFAULT 'manual_bank'
    CHECK (payout_provider IN ('stripe', 'paystack', 'manual_bank')),
  ADD COLUMN IF NOT EXISTS payout_processor_fee_borne_by_creator BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS payout_schedule TEXT NOT NULL DEFAULT 'automatic'
    CHECK (payout_schedule IN ('automatic', 'manual_9_24')),
  ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_subaccount_status TEXT NOT NULL DEFAULT 'not_connected'
    CHECK (paystack_subaccount_status IN ('not_connected', 'pending', 'connected', 'failed')),
  ADD COLUMN IF NOT EXISTS manual_bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_name TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_code TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_iban TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_swift TEXT,
  ADD COLUMN IF NOT EXISTS manual_payout_notes TEXT;

CREATE TABLE IF NOT EXISTS public.manual_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled')),
  reminder_2d_sent_at TIMESTAMPTZ,
  reminder_1d_sent_at TIMESTAMPTZ,
  reminder_0d_sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  paid_by_admin_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, payout_date, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS public.manual_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES public.manual_payouts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

ALTER TABLE public.manual_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payout_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own manual payouts" ON public.manual_payouts;
CREATE POLICY "Users can view own manual payouts"
ON public.manual_payouts
FOR SELECT
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Users can view own manual payout items" ON public.manual_payout_items;
CREATE POLICY "Users can view own manual payout items"
ON public.manual_payout_items
FOR SELECT
USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_manual_payouts_creator ON public.manual_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_manual_payouts_due ON public.manual_payouts(status, payout_date);
CREATE INDEX IF NOT EXISTS idx_manual_payout_items_payout_id ON public.manual_payout_items(payout_id);
CREATE INDEX IF NOT EXISTS idx_manual_payout_items_creator ON public.manual_payout_items(creator_id);
