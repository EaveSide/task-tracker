-- Agent deferral: three separate ways to say "not now" without losing a ticket.
--
--   snoozed_until    - the agent skips it until this timestamp passes, then it
--                      returns to the queue on its own ("circle back tomorrow")
--   deprioritized_at - still worked, but sorts behind every other ticket
--                      regardless of priority ("do this last")
--   dismissed_at     - the agent never picks it up again; the ticket stays on
--                      the board and a human can still work it
--
-- All nullable - NULL means "normal", and clearing a column is the undo. They
-- are independent: a ticket can be snoozed AND deprioritized. Priority is left
-- untouched on purpose, so deferring never destroys real triage information.
--
-- deferral_reason / deferred_by exist so the board can explain a skipped ticket
-- rather than silently hiding it.
--
-- Run this in your Supabase SQL Editor.

ALTER TABLE sprint_tasks
  ADD COLUMN IF NOT EXISTS snoozed_until    timestamptz,
  ADD COLUMN IF NOT EXISTS deprioritized_at timestamptz,
  ADD COLUMN IF NOT EXISTS dismissed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS deferral_reason  text,
  ADD COLUMN IF NOT EXISTS deferred_by      text;

-- The queue reads "not dismissed, and not currently snoozed" on every poll.
CREATE INDEX IF NOT EXISTS sprint_tasks_deferral_idx
  ON sprint_tasks (snoozed_until, dismissed_at)
  WHERE snoozed_until IS NOT NULL OR dismissed_at IS NOT NULL;

-- PostgREST caches the schema; without this the new columns 404 through the API.
NOTIFY pgrst, 'reload schema';
