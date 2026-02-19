import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabase } from "@/lib/supabase";
import type { GameRequest } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const client = getSupabase();
    const { data, error } = await client
      .from("game_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const requests = (data ?? []) as GameRequest[];
    const total = requests.length;
    const byStatus = { Pending: 0, Approved: 0, Rejected: 0 };
    const byConsole: Record<string, number> = {};
    const byDate: Record<string, number> = {};
    const gameUpvotes: Record<string, { title: string; upvotes: number; count: number }> = {};
    for (const r of requests) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byConsole[r.console] = (byConsole[r.console] ?? 0) + 1;
      const date = r.created_at.slice(0, 10);
      byDate[date] = (byDate[date] ?? 0) + 1;
      const key = r.rawg_id ? String(r.rawg_id) : r.game_title;
      if (!gameUpvotes[key]) {
        gameUpvotes[key] = { title: r.game_title, upvotes: r.upvotes ?? 0, count: 1 };
      } else {
        gameUpvotes[key].upvotes += r.upvotes ?? 0;
        gameUpvotes[key].count += 1;
      }
    }
    const sortedDates = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    const topGames = Object.values(gameUpvotes)
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 15);
    return NextResponse.json({
      requests,
      total,
      byStatus,
      byConsole,
      requestsOverTime: sortedDates.map(([date, count]) => ({ date, count })),
      topGames,
      available: requests.filter((r) => r.status === "Approved" && r.available).length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load" },
      { status: 500 }
    );
  }
}
