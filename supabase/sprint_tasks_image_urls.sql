-- Add image_urls to sprint_tasks so screenshots from a feature submission
-- carry over when it's converted into a ticket.
-- Run this in your Supabase SQL Editor.

ALTER TABLE sprint_tasks
  ADD COLUMN IF NOT EXISTS image_urls text[];
