-- Security: restrict anonymous access so only the app server (service role) can modify data.
-- Run this in Supabase SQL Editor after game_requests, app_config, and request_upvotes exist.
-- Requires SUPABASE_SERVICE_ROLE_KEY in your Next.js server for admin API routes.

-- game_requests: anon can only SELECT and INSERT (e.g. submit new requests). No UPDATE/DELETE.
DROP POLICY IF EXISTS "Allow all for anon" ON game_requests;
CREATE POLICY "Allow anon select" ON game_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon insert" ON game_requests FOR INSERT TO anon WITH CHECK (true);

-- app_config: anon can only SELECT (read enabled consoles). Writes only via service role in admin API.
DROP POLICY IF EXISTS "Allow update for all" ON app_config;
DROP POLICY IF EXISTS "Allow insert for all" ON app_config;
-- "Allow read for all" remains for SELECT

-- request_upvotes: no direct anon access. Voting only via RPC upvote_request (security definer).
DROP POLICY IF EXISTS "Allow insert/select for anon" ON request_upvotes;
-- Ensure anon can call the RPC (Supabase usually grants this by default for definer functions)
GRANT EXECUTE ON FUNCTION upvote_request(uuid, text) TO anon;
