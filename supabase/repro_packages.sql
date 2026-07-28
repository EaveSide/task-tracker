-- Repro Capture packages: the machine-readable artifacts behind a bug ticket.
-- Run this in your Supabase SQL Editor.
--
-- The package is stored as one JSONB document rather than a normalized set of
-- tables. It is written once, read whole by an agent, and never queried
-- field-by-field, so decomposing it would buy nothing and would couple the
-- tracker's schema to the extension's payload version.

CREATE TABLE IF NOT EXISTS repro_packages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       text REFERENCES sprint_tasks(id) ON DELETE CASCADE,
  -- Payload schema version, so an older extension stays readable.
  version       int  NOT NULL DEFAULT 1,
  -- The full ReproSession minus screenshots (see screenshots column).
  session       jsonb NOT NULL,
  -- The generated Playwright test.
  spec          text,
  -- repro:verified | repro:unverified | repro:broken
  label         text,
  validation    jsonb,
  -- Kept apart from `session` so the agent-facing document stays small: these
  -- are for humans and are never part of the agent's critical path.
  screenshots   jsonb,
  submitted_by  uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repro_packages_task_id_idx ON repro_packages (task_id);

-- Surface the label on the task itself so the board can badge it without a join.
ALTER TABLE sprint_tasks
  ADD COLUMN IF NOT EXISTS repro_label text;
