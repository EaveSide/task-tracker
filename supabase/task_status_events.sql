-- Status change log: one row per status transition on a task.
-- from_status is null for the creation event (task first appeared with to_status).
-- Rows are written server-side by POST /api/tasks; they are never updated or deleted.
-- Run this in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS task_status_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     text NOT NULL,
  from_status text,          -- null = task created
  to_status   text NOT NULL,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

-- History is always read per-task in chronological order.
CREATE INDEX IF NOT EXISTS idx_task_status_events_task
  ON task_status_events(task_id, changed_at);
