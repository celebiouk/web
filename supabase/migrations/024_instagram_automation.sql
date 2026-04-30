-- Instagram Automation: keyword triggers that auto-reply to comments + send DMs

CREATE TABLE IF NOT EXISTS instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ig_user_id TEXT NOT NULL,
  ig_username TEXT,
  page_id TEXT,
  page_name TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id)
);

CREATE TABLE IF NOT EXISTS instagram_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains', -- 'contains', 'exact', 'starts_with'
  comment_reply TEXT NOT NULL,
  dm_message TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instagram_automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES instagram_triggers(id) ON DELETE SET NULL,
  comment_id TEXT,
  commenter_ig_id TEXT,
  commenter_username TEXT,
  keyword_matched TEXT,
  comment_text TEXT,
  comment_reply_sent BOOLEAN DEFAULT FALSE,
  dm_sent BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instagram_connections_creator ON instagram_connections(creator_id);
CREATE INDEX IF NOT EXISTS idx_instagram_connections_ig_user ON instagram_connections(ig_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_triggers_creator ON instagram_triggers(creator_id);
CREATE INDEX IF NOT EXISTS idx_instagram_triggers_active ON instagram_triggers(creator_id, is_active);
CREATE INDEX IF NOT EXISTS idx_instagram_logs_creator ON instagram_automation_logs(creator_id);
CREATE INDEX IF NOT EXISTS idx_instagram_logs_created ON instagram_automation_logs(created_at DESC);

-- RLS
ALTER TABLE instagram_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own instagram connection" ON instagram_connections
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users manage own instagram triggers" ON instagram_triggers
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users view own automation logs" ON instagram_automation_logs
  FOR SELECT USING (auth.uid() = creator_id);
