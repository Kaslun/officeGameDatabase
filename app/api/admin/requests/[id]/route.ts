import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSupabase, STATUS_OPTIONS } from "@/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  let body: { status?: string; upvotes?: number; available?: boolean; rejection_reason?: string | null };
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: Record<string, unknown> = {};
  if (typeof body.status === "string" && STATUS_OPTIONS.includes(body.status as (typeof STATUS_OPTIONS)[number])) {
    updates.status = body.status;
  }
  if (typeof body.upvotes === "number" && body.upvotes >= 0) {
    updates.upvotes = body.upvotes;
  }
  if (typeof body.available === "boolean") {
    updates.available = body.available;
  }
  if (body.rejection_reason !== undefined) {
    updates.rejection_reason = body.rejection_reason == null ? null : String(body.rejection_reason);
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates" }, { status: 400 });
  }
  try {
    const client = getSupabaseAdmin();
    const typedClient = client as unknown as ReturnType<typeof getSupabase>;
    const { data, error } = await typedClient
      .from("game_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  try {
    const client = getSupabaseAdmin();
    const typedClient = client as unknown as ReturnType<typeof getSupabase>;
    const { error } = await typedClient.from("game_requests").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 }
    );
  }
}
