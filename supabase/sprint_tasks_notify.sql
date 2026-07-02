-- Completion notifications: when a task is moved to Done, optionally email the
-- person who submitted it. notify_email holds the recipient (null = no notice);
-- notified_at guards against sending the same completion email twice.
-- Run this in your Supabase SQL Editor.

ALTER TABLE sprint_tasks
  ADD COLUMN IF NOT EXISTS notify_email text,
  ADD COLUMN IF NOT EXISTS notified_at  timestamptz;
