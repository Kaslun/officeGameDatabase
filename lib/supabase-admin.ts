/**
 * Server-only Supabase client for admin writes (bypasses RLS).
 * Use only in authenticated admin API routes. Never expose the key to the client.
 *
 * Prefer the new Secret key (sb_secret_...) from Dashboard → API Keys.
 * The legacy service_role JWT key also works but is being phased out.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Admin writes require NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in .env.local. Use the Secret key from Dashboard → API Keys, or the legacy service_role key."
    );
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

let adminClient: ReturnType<typeof createClient> | null = null;

/** Server-only: get Supabase client with service role (bypasses RLS). Use in admin API routes only. */
export function getSupabaseAdmin(): ReturnType<typeof createClient> {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin must not be called on the client");
  }
  if (!adminClient) {
    adminClient = getAdminClient() as unknown as ReturnType<typeof createClient>;
  }
  return adminClient;
}
