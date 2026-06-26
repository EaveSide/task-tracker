-- Spaces + Users tables
-- Run this in your Supabase SQL Editor.

-- Spaces (one per project/workspace). id is a stable slug.
CREATE TABLE IF NOT EXISTS spaces (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  color       text NOT NULL DEFAULT '#64748b',
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Seed the existing four projects so nothing changes on first run.
INSERT INTO spaces (id, name, color, sort_order) VALUES
  ('crm',       'Roof Estimate CRM',      '#3b82f6', 0),
  ('app',       'RoofingLogic App',       '#10b981', 1),
  ('marketing', 'RoofingLogic Marketing', '#f59e0b', 2),
  ('xactimate', 'RoofingLogic Xactimate', '#8b5cf6', 3)
ON CONFLICT (id) DO NOTHING;

-- Team roster. Names populate the "Assignee" dropdown in the ticket creator.
CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  created_at  timestamptz DEFAULT now()
);

-- Seed the existing assignees.
INSERT INTO users (name) VALUES ('George'), ('Will')
ON CONFLICT (name) DO NOTHING;
