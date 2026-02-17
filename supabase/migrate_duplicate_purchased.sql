-- Run this in Supabase SQL Editor if you already have game_requests with old columns.
-- Removes duplicate column and renames purchased → available.

alter table game_requests drop column if exists duplicate;
alter table game_requests rename column purchased to available;
