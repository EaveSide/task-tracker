-- Completion-notification opt-in moves to submission time: the submitter
-- chooses "email me when complete" on the submit form, and approval carries
-- it onto the created task automatically.
-- Run this in your Supabase SQL Editor.

ALTER TABLE feature_submissions
  ADD COLUMN IF NOT EXISTS notify_on_complete boolean NOT NULL DEFAULT false;
