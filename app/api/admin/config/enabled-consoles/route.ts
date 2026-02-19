import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { ALL_FILTER_CONSOLES, DEFAULT_FILTER_CONSOLES } from "@/lib/rawg";

const CONFIG_KEY = "enabled_consoles";
const VALID_NAMES = new Set<string>(ALL_FILTER_CONSOLES.map((c) => c.name));

function validConsoles(consoles: unknown): string[] {
  if (!Array.isArray(consoles)) return [...DEFAULT_FILTER_CONSOLES];
  return consoles.filter((c): c is string => typeof c === "string" && VALID_NAMES.has(c));
}

export async function GET() {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from("app_config")
      .select("value")
      .eq("key", CONFIG_KEY)
      .single();
    if (error || !data?.value) {
      return NextResponse.json([...DEFAULT_FILTER_CONSOLES]);
    }
    const list = validConsoles(data.value);
    return NextResponse.json(list.length ? list : [...DEFAULT_FILTER_CONSOLES]);
  } catch {
    return NextResponse.json([...DEFAULT_FILTER_CONSOLES]);
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { consoles?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const consoles = validConsoles(body.consoles ?? []);
  try {
    const client = getSupabaseAdmin();
    const { error } = await (client as unknown as ReturnType<typeof getSupabase>)
      .from("app_config")
      .upsert({ key: CONFIG_KEY, value: consoles }, { onConflict: "key" });
    if (error) throw error;
    return NextResponse.json(consoles);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save" },
      { status: 500 }
    );
  }
}
