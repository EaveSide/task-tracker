-- PR link: optional URL to the pull request that implements a task.
-- Run this in your Supabase SQL Editor.

ALTER TABLE sprint_tasks
  ADD COLUMN IF NOT EXISTS pr_url text;
