-- Phase 4: Bookings System
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- Types
-- ============================================

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'confirmed',
    'cancelled_by_creator',
    'cancelled_by_buyer',
    'completed',
    'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cancellation_policy AS ENUM (
    'full_refund',
    'no_refund',
    'refund_if_24hrs'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- Availability Schedules Table
-- ============================================

CREATE TABLE IF NOT EXISTS availability_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  weekly_schedule JSONB NOT NULL DEFAULT '{
    "monday": {"enabled": false, "start": "09:00", "end": "17:00", "break_start": null, "break_end": null},
    "tuesday": {"enabled": false, "start": "09:00", "end": "17:00", "break_start": null, "break_end": null},
    "wednesday": {"enabled": false, "start": "09:00", "end": "17:00", "break_start": null, "break_end": null},
    "thursday": {"enabled": false, "start": "09:00", "end": "17:00", "break_start": null, "break_end": null},
    "friday": {"enabled": false, "start": "09:00", "end": "17:00", "break_start": null, "break_end": null},
    "saturday": {"enabled": false, "start": "09:00", "end": "17:00", "break_start": null, "break_end": null},
    "sunday": {"enabled": false, "start": "09:00", "end": "17:00", "break_start": null, "break_end": null}
  }'::jsonb,
  buffer_minutes INTEGER DEFAULT 15 CHECK (buffer_minutes >= 0 AND buffer_minutes <= 60),
  max_bookings_per_day INTEGER DEFAULT 10 CHECK (max_bookings_per_day >= 1),
  min_notice_hours INTEGER DEFAULT 4 CHECK (min_notice_hours >= 0),
  cancellation_policy TEXT DEFAULT 'refund_if_24hrs' CHECK (cancellation_policy IN ('full_refund', 'no_refund', 'refund_if_24hrs')),
  custom_confirmation_message TEXT,
  video_platform TEXT DEFAULT 'whereby' CHECK (video_platform IN ('whereby', 'zoom', 'google_meet', 'custom')),
  custom_video_url TEXT,
  intake_questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Blocked Dates Table
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, blocked_date)
);

-- ============================================
-- Bookings Table
-- ============================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_notes TEXT,
  intake_answers JSONB DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  platform_fee_cents INTEGER DEFAULT 0 CHECK (platform_fee_cents >= 0),
  net_amount_cents INTEGER GENERATED ALWAYS AS (amount_cents - platform_fee_cents) STORED,
  stripe_payment_intent_id TEXT UNIQUE,
  video_call_url TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled_by_creator', 'cancelled_by_buyer', 'completed', 'no_show')),
  cancellation_token UUID DEFAULT gen_random_uuid(),
  reschedule_token UUID DEFAULT gen_random_uuid(),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  creator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_creator_id ON bookings(creator_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_token ON bookings(cancellation_token);
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_token ON bookings(reschedule_token);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_creator_date ON blocked_dates(creator_id, blocked_date);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Availability Schedules: Creator can read/write own
CREATE POLICY "Users can read own availability" ON availability_schedules
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can insert own availability" ON availability_schedules
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own availability" ON availability_schedules
  FOR UPDATE USING (creator_id = auth.uid());

-- Public read for booking flow
CREATE POLICY "Public can read availability for booking" ON availability_schedules
  FOR SELECT USING (true);

-- Blocked Dates: Creator can read/write own
CREATE POLICY "Users can read own blocked dates" ON blocked_dates
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can insert own blocked dates" ON blocked_dates
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete own blocked dates" ON blocked_dates
  FOR DELETE USING (creator_id = auth.uid());

-- Public read for booking flow
CREATE POLICY "Public can read blocked dates for booking" ON blocked_dates
  FOR SELECT USING (true);

-- Bookings: Creator can read/write own
CREATE POLICY "Creators can read own bookings" ON bookings
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Creators can update own bookings" ON bookings
  FOR UPDATE USING (creator_id = auth.uid());

-- Public can read bookings by token (for cancel/reschedule)
CREATE POLICY "Public can read bookings by cancellation token" ON bookings
  FOR SELECT USING (true); -- We'll filter by token in the query

-- Allow inserts from service role (API routes)
CREATE POLICY "Service role can insert bookings" ON bookings
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Update Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_availability_schedules_updated_at ON availability_schedules;
CREATE TRIGGER update_availability_schedules_updated_at
  BEFORE UPDATE ON availability_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Add duration_minutes to products if not exists
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'duration_minutes') THEN
    ALTER TABLE products ADD COLUMN duration_minutes INTEGER DEFAULT 60;
  END IF;
END $$;
