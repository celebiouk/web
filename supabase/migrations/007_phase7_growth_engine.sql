-- Phase 7: Analytics, Email Marketing, Bundles, Upsells, Affiliates, Notifications

-- ============================================
-- ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'product_view', 'checkout_started', 'purchase', 'email_signup')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country TEXT,
  device TEXT CHECK (device IN ('mobile', 'desktop', 'tablet')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_creator_created
  ON public.analytics_events(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type
  ON public.analytics_events(event_type);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Creators can view own analytics events" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can manage analytics events" ON public.analytics_events;

CREATE POLICY "Creators can view own analytics events" ON public.analytics_events
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Service role can manage analytics events" ON public.analytics_events
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- EMAIL SUBSCRIBERS (extend existing table)
-- ============================================
ALTER TABLE public.email_subscribers
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS subscribed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_email_subscribers_tags
  ON public.email_subscribers USING GIN (tags);

-- ============================================
-- EMAIL MARKETING TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.email_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  preview_text TEXT,
  body_html TEXT NOT NULL,
  segment JSONB DEFAULT '{"type":"all"}'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_broadcasts_creator
  ON public.email_broadcasts(creator_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES public.email_broadcasts(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(broadcast_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS idx_email_sends_broadcast
  ON public.email_sends(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_subscriber
  ON public.email_sends(subscriber_id);

CREATE TABLE IF NOT EXISTS public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('new_subscriber', 'product_purchase', 'course_enrollment', 'booking')),
  trigger_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  delay_days INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  UNIQUE(sequence_id, position)
);

CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.email_sequences(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES public.email_subscribers(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, subscriber_id)
);

CREATE INDEX IF NOT EXISTS idx_email_sequence_enrollments_pending
  ON public.email_sequence_enrollments(next_send_at, completed)
  WHERE completed = false;

ALTER TABLE public.email_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Creators can manage own email broadcasts" ON public.email_broadcasts;
DROP POLICY IF EXISTS "Creators can view own email sends" ON public.email_sends;
DROP POLICY IF EXISTS "Service role can manage email sends" ON public.email_sends;
DROP POLICY IF EXISTS "Creators can manage own email sequences" ON public.email_sequences;
DROP POLICY IF EXISTS "Creators can manage own email sequence steps" ON public.email_sequence_steps;
DROP POLICY IF EXISTS "Creators can view own email sequence enrollments" ON public.email_sequence_enrollments;
DROP POLICY IF EXISTS "Service role can manage email sequence enrollments" ON public.email_sequence_enrollments;

CREATE POLICY "Creators can manage own email broadcasts" ON public.email_broadcasts
  FOR ALL USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can view own email sends" ON public.email_sends
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.email_broadcasts b
      WHERE b.id = broadcast_id AND b.creator_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage email sends" ON public.email_sends
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Creators can manage own email sequences" ON public.email_sequences
  FOR ALL USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can manage own email sequence steps" ON public.email_sequence_steps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences s
      WHERE s.id = sequence_id AND s.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_sequences s
      WHERE s.id = sequence_id AND s.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can view own email sequence enrollments" ON public.email_sequence_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences s
      WHERE s.id = sequence_id AND s.creator_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage email sequence enrollments" ON public.email_sequence_enrollments
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- BUNDLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  price_cents INTEGER NOT NULL,
  original_value_cents INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  show_on_storefront BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bundle_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID REFERENCES public.bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  position INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bundles_creator
  ON public.bundles(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle
  ON public.bundle_products(bundle_id, position);

ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Published bundles are viewable by everyone" ON public.bundles;
DROP POLICY IF EXISTS "Creators can view own bundles" ON public.bundles;
DROP POLICY IF EXISTS "Creators can manage own bundles" ON public.bundles;
DROP POLICY IF EXISTS "Bundle products viewable when parent is viewable" ON public.bundle_products;
DROP POLICY IF EXISTS "Creators can manage own bundle products" ON public.bundle_products;

CREATE POLICY "Published bundles are viewable by everyone" ON public.bundles
  FOR SELECT USING (is_published = true);

CREATE POLICY "Creators can view own bundles" ON public.bundles
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Creators can manage own bundles" ON public.bundles
  FOR ALL USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Bundle products viewable when parent is viewable" ON public.bundle_products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bundles b
      WHERE b.id = bundle_id AND (b.is_published = true OR b.creator_id = auth.uid())
    )
  );

CREATE POLICY "Creators can manage own bundle products" ON public.bundle_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bundles b
      WHERE b.id = bundle_id AND b.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bundles b
      WHERE b.id = bundle_id AND b.creator_id = auth.uid()
    )
  );

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS upsell_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS upsell_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS upsell_price_cents INTEGER;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_form_title TEXT,
  ADD COLUMN IF NOT EXISTS email_form_description TEXT,
  ADD COLUMN IF NOT EXISTS lead_magnet_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS affiliate_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_default_rate DECIMAL DEFAULT 0.2;

-- ============================================
-- AFFILIATES
-- ============================================
CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  affiliate_email TEXT NOT NULL,
  affiliate_name TEXT NOT NULL,
  affiliate_code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  total_referred_sales_cents INTEGER DEFAULT 0,
  total_commission_earned_cents INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sale_amount_cents INTEGER NOT NULL,
  commission_amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  release_at TIMESTAMPTZ DEFAULT (NOW() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_creator
  ON public.affiliates(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate
  ON public.affiliate_conversions(affiliate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_pending_release
  ON public.affiliate_conversions(status, release_at);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Creators can manage own affiliates" ON public.affiliates;
DROP POLICY IF EXISTS "Public can apply as affiliate" ON public.affiliates;
DROP POLICY IF EXISTS "Creators can view own affiliate conversions" ON public.affiliate_conversions;
DROP POLICY IF EXISTS "Creators can update own affiliate conversions" ON public.affiliate_conversions;
DROP POLICY IF EXISTS "Service role can manage affiliate conversions" ON public.affiliate_conversions;

CREATE POLICY "Creators can manage own affiliates" ON public.affiliates
  FOR ALL USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Public can apply as affiliate" ON public.affiliates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can view own affiliate conversions" ON public.affiliate_conversions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators can update own affiliate conversions" ON public.affiliate_conversions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.affiliates a
      WHERE a.id = affiliate_id AND a.creator_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage affiliate conversions" ON public.affiliate_conversions
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_order', 'new_booking', 'new_subscriber', 'new_enrollment', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-runnability)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage notifications" ON public.notifications
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.analytics_events IS 'Privacy-safe analytics events with UTM and device/country metadata';
COMMENT ON TABLE public.email_broadcasts IS 'Email campaign definitions and send status';
COMMENT ON TABLE public.email_sends IS 'Per-subscriber send/open/click telemetry';
COMMENT ON TABLE public.bundles IS 'Creator product bundles with discounted pricing';
COMMENT ON TABLE public.affiliates IS 'Affiliate applications and payout metrics';
COMMENT ON TABLE public.notifications IS 'In-app notification feed for creator dashboards';
