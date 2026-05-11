-- Content Scheduling: multi-platform social media post scheduler (Pro feature)
-- Creators connect social accounts, draft one post, schedule it across IG/TikTok/X/YouTube/LinkedIn/Threads/FB Pages.
-- Note: separate from the Instagram/TikTok comment-automation tables (024/025) — those store tokens scoped to
-- comment management, while these store tokens scoped to content publishing. A creator may connect both.

-- =====================================================================
-- 1. Connected social accounts (one row per creator + platform identity)
-- =====================================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  platform TEXT NOT NULL CHECK (platform IN (
    'instagram', 'tiktok', 'twitter', 'youtube', 'linkedin', 'threads', 'facebook'
  )),

  -- Platform identity
  platform_user_id TEXT NOT NULL,   -- The user's ID on that platform
  platform_username TEXT,           -- Their @handle
  display_name TEXT,
  avatar_url TEXT,

  -- Platform-specific extras (e.g. FB page_id, IG business account id, YT channel id)
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- OAuth tokens (RLS-protected; matches existing pattern in 024/025)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scopes TEXT[],

  -- Health
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'expired', 'revoked', 'error'
  )),
  last_error TEXT,
  last_refreshed_at TIMESTAMPTZ,

  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(creator_id, platform, platform_user_id)
);

-- =====================================================================
-- 2. Scheduled posts (the draft + when to publish + which platforms)
-- =====================================================================
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Content
  caption TEXT NOT NULL DEFAULT '',
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Array of: { url, type: 'image'|'video', width, height, duration?, alt? }

  -- Targeting
  platforms TEXT[] NOT NULL,        -- e.g. ARRAY['instagram','twitter','linkedin']
  platform_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Per-platform tweaks: { instagram: { caption, first_comment }, twitter: { caption } }

  -- Schedule
  scheduled_for TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Lifecycle
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN (
    'draft', 'scheduled', 'posting', 'posted', 'failed', 'cancelled'
  )),

  -- "Promote this product" linkage
  promoted_product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- UTM campaign tag auto-applied to any cele.bio link in the caption
  utm_campaign TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- =====================================================================
-- 3. Per-platform post results (one row per (scheduled_post, platform))
-- =====================================================================
CREATE TABLE IF NOT EXISTS post_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_post_id UUID NOT NULL REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  platform TEXT NOT NULL,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE SET NULL,

  -- Result
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'posting', 'posted', 'failed', 'skipped'
  )),
  platform_post_id TEXT,
  platform_post_url TEXT,

  -- Failure + retry
  error_message TEXT,
  error_code TEXT,
  attempts INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,

  -- Analytics (refreshed by background job after posting)
  views INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  shares INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,    -- via UTM tracking on cele.bio link
  last_metrics_fetched_at TIMESTAMPTZ,

  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(scheduled_post_id, platform)
);

-- =====================================================================
-- Indexes
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_social_accounts_creator           ON social_accounts(creator_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_creator_platform  ON social_accounts(creator_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_expiring          ON social_accounts(token_expires_at) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_creator           ON scheduled_posts(creator_id, scheduled_for DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due               ON scheduled_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status            ON scheduled_posts(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_product           ON scheduled_posts(promoted_product_id) WHERE promoted_product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_post_results_post                 ON post_results(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_post_results_creator              ON post_results(creator_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_results_retry                ON post_results(next_retry_at) WHERE status = 'failed' AND next_retry_at IS NOT NULL;

-- =====================================================================
-- Row Level Security
-- =====================================================================
ALTER TABLE social_accounts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_results     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social accounts" ON social_accounts
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users manage own scheduled posts" ON scheduled_posts
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users view own post results" ON post_results
  FOR SELECT USING (auth.uid() = creator_id);

-- =====================================================================
-- updated_at triggers (reuses update_updated_at_column() from migration 004)
-- =====================================================================
CREATE TRIGGER set_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_post_results_updated_at
  BEFORE UPDATE ON post_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
