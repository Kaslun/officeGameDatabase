# Office Game Hub

A browsable game marketplace powered by the RAWG API and Supabase. Find games, request them for the office, and manage requests in an admin tracker.

- **Home** — Hero search + popular games grid (RAWG)
- **Search** — Results grid from RAWG
- **Game detail** — Cover, description, platforms; “Request this game” modal; existing request status
- **Requests** — Admin table: filter, sort, edit (pen), delete (trash), status/rejection/available; optional editor key

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - Run the migration in the SQL Editor: see `supabase/migration_marketplace_schema.sql`.
   - In Project Settings → API copy the **Project URL** and **Publishable Key**.

3. **RAWG API**
   - Get an API key at [rawg.io/apidocs](https://rawg.io/apidocs).

4. **Environment**
   ```bash
   cp .env.local.example .env.local
   ```
   Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - `NEXT_PUBLIC_RAWG_API_KEY`
   - Optionally `NEXT_PUBLIC_EDITOR_KEY` to restrict who can edit status/rejection/available on the Requests page.

5. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

Add the same env vars in the Vercel project settings and deploy.

## Tech

- Next.js 14 (App Router), Tailwind CSS, Supabase, RAWG Video Games API
- `next/image` for RAWG images (media.rawg.io allowed in `next.config.js`)
