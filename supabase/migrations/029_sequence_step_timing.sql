-- Add send-time precision to email sequence steps.
-- delay_days already exists; send_at_hour + send_at_minute let creators say
-- "send Day 3's email at 9:30 AM UTC" instead of just "Day 3".

ALTER TABLE email_sequence_steps
  ADD COLUMN IF NOT EXISTS send_at_hour   INT NOT NULL DEFAULT 9
    CHECK (send_at_hour BETWEEN 0 AND 23),
  ADD COLUMN IF NOT EXISTS send_at_minute INT NOT NULL DEFAULT 0
    CHECK (send_at_minute BETWEEN 0 AND 59);

-- Index used by the cron when it calculates which enrollments are due.
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_due
  ON email_sequence_enrollments(next_send_at)
  WHERE completed = false;
