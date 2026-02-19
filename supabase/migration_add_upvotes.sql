-- Add upvotes to game requests. Run in Supabase SQL Editor.
ALTER TABLE game_requests
  ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN game_requests.upvotes IS 'Number of upvotes; used for sorting.';
