# Office Game Request Tracker

Next.js 14 (App Router) app with Tailwind CSS and Supabase. Deploy-ready for Vercel.

## Setup

1. **Clone and install**
   ```bash
   cd game-request-tracker
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the SQL editor, run:

   ```sql
   create table game_requests (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     date date not null,
     requester text not null,
     game text not null,
     console text not null check (console in ('PS5', 'Xbox Series X', 'Nintendo Switch', 'PC', 'PS4', 'Xbox One', 'Other')),
     status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
     rejection_reason text check (rejection_reason in ('Over budget', 'Age rating too high', 'Already own similar title', 'Not suitable for office', 'Out of stock / Unavailable', 'Other')),
     available boolean not null default false
   );

   alter table game_requests enable row level security;

   create policy "Allow all for anon" on game_requests
     for all using (true) with check (true);
   ```

   - In Project Settings → API copy the project URL and **Publishable Key** (anon key is legacy and also supported).

3. **Environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY` as fallback)

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push the repo to GitHub.
2. In Vercel, import the project and add the same env vars.
3. Deploy. `npm run build` is used automatically.

## Features

- Table of all game requests with alternating row colors
- "+ New Request" form (name, game, console) with duplicate detection (same game + console)
- Inline edit: status (Pending/Approved/Rejected), rejection reason (when Rejected), available (when Approved)
- Delete with confirmation modal
- Filter by status, sort by date / game / status / requester
- Summary: Total, Pending, Approved, Available (approved + available)
- Real-time updates via Supabase subscription
- Toast notifications and responsive layout
