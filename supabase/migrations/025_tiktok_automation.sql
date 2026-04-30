-- TikTok comment automation: keyword triggers → auto-reply to comments

CREATE TABLE IF NOT EXISTS tiktok_automation_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tiktok_open_id TEXT NOT NULL,
  tiktok_username TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id)
);

CREATE TABLE IF NOT EXISTS tiktok_automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains', -- 'contains', 'exact', 'starts_with'
  comment_reply TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks the last comment cursor seen per video so we never re-reply
CREATE TABLE IF NOT EXISTS tiktok_video_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  last_cursor BIGINT DEFAULT 0,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, video_id)
);

CREATE TABLE IF NOT EXISTS tiktok_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES tiktok_automation_triggers(id) ON DELETE SET NULL,
  video_id TEXT,
  comment_id TEXT,
  commenter_username TEXT,
  keyword_matched TEXT,
  comment_text TEXT,
  reply_sent BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tiktok_conn_creator ON tiktok_automation_connections(creator_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_triggers_creator ON tiktok_automation_triggers(creator_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tiktok_cursors_creator ON tiktok_video_cursors(creator_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_logs_creator ON tiktok_automation_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_tiktok_logs_created ON tiktok_automation_logs(created_at DESC);

-- RLS
ALTER TABLE tiktok_automation_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_automation_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_video_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiktok_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tiktok automation connection" ON tiktok_automation_connections
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users manage own tiktok automation triggers" ON tiktok_automation_triggers
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users manage own tiktok video cursors" ON tiktok_video_cursors
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users view own tiktok automation logs" ON tiktok_automation_logs
  FOR SELECT USING (auth.uid() = creator_id);
