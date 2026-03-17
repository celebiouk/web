-- Migration: PayPal connect fields for creator payout account linking

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paypal_account_id TEXT;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paypal_account_status TEXT NOT NULL DEFAULT 'not_connected'
CHECK (paypal_account_status IN ('not_connected', 'pending', 'connected'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paypal_email TEXT;
