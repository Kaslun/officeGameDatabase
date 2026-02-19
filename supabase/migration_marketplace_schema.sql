-- Run this in Supabase SQL Editor to switch to the marketplace schema.
-- Back up data first if you need to preserve existing rows.

-- Drop old table (optional: rename to game_requests_backup instead of drop)
DROP TABLE IF EXISTS game_requests;

CREATE TABLE IF NOT EXISTS game_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  requester text NOT NULL,
  game_title text NOT NULL,
  game_image text,
  console text NOT NULL CHECK (console IN ('PS5', 'Xbox Series X', 'Nintendo Switch', 'PC', 'PS4', 'Xbox One', 'Other')),
  rawg_id integer,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  rejection_reason text CHECK (rejection_reason IN ('Over budget', 'Age rating too high', 'Already own similar title', 'Not suitable for office', 'Out of stock / Unavailable', 'Other')),
  available boolean NOT NULL DEFAULT false
);

ALTER TABLE game_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON game_requests;
CREATE POLICY "Allow all for anon" ON game_requests
  FOR ALL USING (true) WITH CHECK (true);

-- Optional: if you renamed your old table to game_requests_backup before dropping, uncomment and run this to copy data:
-- INSERT INTO game_requests (id, created_at, requester, game_title, game_image, console, rawg_id, status, rejection_reason, available)
-- SELECT id, created_at, requester, game, game_image, console, rawg_id, status, rejection_reason, available
-- FROM game_requests_backup;
