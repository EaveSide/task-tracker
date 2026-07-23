-- Per-user accounts: each team member logs in with their own email +
-- password instead of the shared team password. password_hash format is
-- pbkdf2$<iterations>$<salt-hex>$<hash-hex> (hashed by the app, never stored
-- in plain text). A user with an email but no password_hash hasn't claimed
-- their account yet — they set a password on first login using the team
-- password as the invite code.
-- Run this in your Supabase SQL Editor.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email         text,
  ADD COLUMN IF NOT EXISTS password_hash text;

-- Emails are stored lowercased; enforce uniqueness where set.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users (email) WHERE email IS NOT NULL;

-- Bootstrap: give Will his email so the first account can be claimed right
-- after deploy (everyone else gets an email via the Team modal).
UPDATE users SET email = 'williamshaner3@gmail.com'
  WHERE name = 'Will' AND email IS NULL;
