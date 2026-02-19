import { getSupabase } from "@/lib/supabase";
import { DEFAULT_FILTER_CONSOLES } from "@/lib/rawg";

const CONFIG_KEY = "enabled_consoles";

/** Server-side: get enabled console names for the Games filter. Defaults to PS5 + Nintendo Switch if not set. */
export async function getEnabledConsoles(): Promise<string[]> {
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from("app_config")
      .select("value")
      .eq("key", CONFIG_KEY)
      .single();
    if (error || !data?.value) return [...DEFAULT_FILTER_CONSOLES];
    if (!Array.isArray(data.value)) return [...DEFAULT_FILTER_CONSOLES];
    const valid = new Set(["PS5", "Nintendo Switch", "PS4", "Xbox One", "Xbox Series X", "PC"]);
    const list = data.value.filter((c): c is string => typeof c === "string" && valid.has(c));
    return list.length > 0 ? list : [...DEFAULT_FILTER_CONSOLES];
  } catch {
    return [...DEFAULT_FILTER_CONSOLES];
  }
}
