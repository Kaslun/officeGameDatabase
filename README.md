# Attensi Game Hub

A game discovery and request hub for the office. Browse games (powered by the RAWG API), request titles for your workplace library, upvote requests, and manage everything from the admin panel.

## What it does

- **Discover** — Home page with popular games, new releases, and genre categories. Search from the navbar.
- **Games** — Browse and filter the full catalog by platform and genre. Request any game with one click.
- **Requests** — View all game requests, filter by status/console, and upvote. Admins manage requests in the Admin panel.
- **Admin** — Approve or reject requests, set rejection reasons, mark games as available, and configure which consoles appear in the Games filter.

## Tech

- **Next.js 15** (App Router), **React 19**, **Tailwind CSS**
- **Supabase** — Game requests, upvotes, and app config (enabled consoles)
- **RAWG Video Games API** — Game data, search, and images
- **ESLint 9** with flat config

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the SQL migrations in the SQL Editor (in order):
     - `supabase/game_requests.sql` (or `migration_marketplace_schema.sql` if starting fresh)
     - `supabase/migration_add_upvotes.sql`
     - `supabase/migration_one_upvote_per_voter.sql`
     - `supabase/app_config.sql`
     - `supabase/migration_rls_secure.sql` (restricts anon to read/insert; admin uses service role)
     - `supabase/migration_remove_upvote.sql` (optional; allows users to remove their upvote)
   - In Project Settings → API, copy the **Project URL**, **Publishable (anon) key**, and **Service role key** (for admin).

3. **RAWG API**
   - Get an API key at [rawg.io/apidocs](https://rawg.io/apidocs).

4. **Environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `SUPABASE_SERVICE_ROLE_KEY` (required for admin edit/delete and config)
   - `NEXT_PUBLIC_RAWG_API_KEY`
   - `ADMIN_PASSWORD` (for admin login)

   Optional: `ADMIN_SESSION_SALT`, `NEXT_PUBLIC_SUPPORT_EMAIL` (shown in the Help modal).

5. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

Add the same environment variables in the Vercel project settings. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set so admin actions (edit/delete requests, save config) work. Run the Supabase migrations on your hosted project before going live.

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
