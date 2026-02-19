/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS - use only in authenticated admin API routes.
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Server-side Supabase admin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
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
