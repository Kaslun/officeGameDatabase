-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates the game_requests table and enables read/write for the app

create table if not exists game_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  requester text not null,
  game text not null,
  console text not null check (console in ('PS5', 'Xbox Series X', 'Nintendo Switch', 'PC', 'PS4', 'Xbox One', 'Other')),
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  duplicate boolean not null default false,
  rejection_reason text check (rejection_reason in ('Over budget', 'Age rating too high', 'Already own similar title', 'Not suitable for office', 'Out of stock / Unavailable', 'Other')),
  purchased boolean not null default false
);

alter table game_requests enable row level security;

drop policy if exists "Allow all for anon" on game_requests;
create policy "Allow all for anon" on game_requests
  for all using (true) with check (true);
