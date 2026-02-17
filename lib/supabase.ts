import { createClient } from "@supabase/supabase-js";

export const CONSOLE_OPTIONS = [
  "PS5",
  "Xbox Series X",
  "Nintendo Switch",
  "PC",
  "PS4",
  "Xbox One",
  "Other",
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
  date: string;
  requester: string;
  game: string;
  console: ConsoleOption;
  status: StatusOption;
  duplicate: boolean;
  rejection_reason: string | null;
  purchased: boolean;
}

export interface GameRequestInsert {
  date: string;
  requester: string;
  game: string;
  console: ConsoleOption;
  status?: StatusOption;
  duplicate?: boolean;
  rejection_reason?: string | null;
  purchased?: boolean;
}

export interface GameRequestUpdate {
  date?: string;
  requester?: string;
  game?: string;
  console?: ConsoleOption;
  status?: StatusOption;
  duplicate?: boolean;
  rejection_reason?: string | null;
  purchased?: boolean;
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
