import { createClient } from "@supabase/supabase-js";

/** Consoles that can be requested (aligned with filter consoles; admin enables which appear in Games). */
export const CONSOLE_OPTIONS = [
  "PS5",
  "Nintendo Switch",
  "PS4",
  "Xbox One",
  "Xbox Series X",
  "PC",
] as const;

export const STATUS_OPTIONS = ["Pending", "Approved", "Rejected"] as const;

export const REJECTION_REASON_OPTIONS = [
  "Over budget",
  "Age rating too high",
  "Already own similar title",
  "Not suitable for office",
  "Out of stock / Unavailable",
  "Other",
] as const;

export type ConsoleOption = (typeof CONSOLE_OPTIONS)[number];
export type StatusOption = (typeof STATUS_OPTIONS)[number];
export type RejectionReasonOption = (typeof REJECTION_REASON_OPTIONS)[number];

export interface GameRequest {
  id: string;
  created_at: string;
  requester: string;
  game_title: string;
  game_image: string | null;
  console: ConsoleOption;
  rawg_id: number | null;
  status: StatusOption;
  rejection_reason: string | null;
  available: boolean;
  upvotes: number;
}

export interface GameRequestInsert {
  requester: string;
  game_title: string;
  game_image: string | null;
  console: ConsoleOption;
  rawg_id?: number | null;
  status?: StatusOption;
  rejection_reason?: string | null;
  available?: boolean;
}

export interface GameRequestUpdate {
  requester?: string;
  game_title?: string;
  game_image?: string | null;
  console?: ConsoleOption;
  rawg_id?: number | null;
  status?: StatusOption;
  rejection_reason?: string | null;
  available?: boolean;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : (null as ReturnType<typeof createClient> | null);

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      "Supabase client not initialized. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local."
    );
  }
  return supabase;
}
