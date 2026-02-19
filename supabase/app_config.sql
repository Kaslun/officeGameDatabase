-- Run this in the Supabase SQL editor to create the app_config table for admin-enabled consoles.
-- The table stores key-value config; we use key 'enabled_consoles' and value as JSON array e.g. ["PS5", "Nintendo Switch"].

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Insert default: both consoles enabled
INSERT INTO app_config (key, value)
VALUES ('enabled_consoles', '["PS5", "Nintendo Switch"]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Allow anon/authenticated to read and update (so the app can read; admin API route writes via anon when authenticated via cookie).
-- If you use a service role key for admin writes, you can restrict RLS to select only for anon.
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for all" ON app_config
  FOR SELECT USING (true);

CREATE POLICY "Allow update for all" ON app_config
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow insert for all" ON app_config
  FOR INSERT WITH CHECK (true);
