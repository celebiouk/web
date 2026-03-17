CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  site_name TEXT NOT NULL DEFAULT 'cele.bio',
  site_url TEXT NOT NULL DEFAULT 'https://cele.bio',
  support_email TEXT NOT NULL DEFAULT 'support@cele.bio',
  commission_rate NUMERIC NOT NULL DEFAULT 8,
  pro_monthly_price NUMERIC NOT NULL DEFAULT 19.99,
  pro_yearly_price NUMERIC NOT NULL DEFAULT 167.90,
  max_free_subscribers INTEGER NOT NULL DEFAULT 500,
  enable_new_signups BOOLEAN NOT NULL DEFAULT TRUE,
  enable_stripe_connect BOOLEAN NOT NULL DEFAULT TRUE,
  require_email_verification BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.admin_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;