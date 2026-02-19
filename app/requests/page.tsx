"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSupabase, CONSOLE_OPTIONS, STATUS_OPTIONS, type GameRequest } from "@/lib/supabase";
import RequestCard from "@/components/RequestCard";
import Toast, { type ToastItem } from "@/components/Toast";

const EDITOR_STORAGE_KEY = "office-game-editor-unlocked";

function addToast(
  setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>>,
  message: string,
  type: ToastItem["type"]
) {
  const id = Math.random().toString(36).slice(2);
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<GameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [editorUnlocked, setEditorUnlocked] = useState(false);

  const hasEditorKey =
    typeof process.env.NEXT_PUBLIC_EDITOR_KEY === "string" &&
    process.env.NEXT_PUBLIC_EDITOR_KEY.length > 0;

  useEffect(() => {
    if (!hasEditorKey) return;
    try {
      if (sessionStorage.getItem(EDITOR_STORAGE_KEY) === "1") setEditorUnlocked(true);
    } catch {
      // ignore
    }
  }, [hasEditorKey]);

  const canEditStatus = !hasEditorKey || editorUnlocked;
  const onToast = useCallback((message: string, type: ToastItem["type"]) => {
    addToast(setToasts, message, type);
  }, []);

  const fetchRequests = useCallback(async () => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    ) {
      setLoading(false);
      return;
    }
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from("game_requests")
        .select("*")
        .order("upvotes", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data as GameRequest[]) ?? []);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Failed to load requests.", "error");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    )
      return;
    const client = getSupabase();
    const channel = client
      .channel("game_requests_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "game_requests" }, () => {
        fetchRequests();
      })
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [fetchRequests]);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [consoleFilter, setConsoleFilter] = useState<string>("all");

  const filteredRequests = useMemo(() => {
    let list = [...requests];
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (consoleFilter !== "all") list = list.filter((r) => r.console === consoleFilter);
    return list.sort((a, b) => {
      const uA = a.upvotes ?? 0;
      const uB = b.upvotes ?? 0;
      if (uB !== uA) return uB - uA;
      return b.created_at > a.created_at ? 1 : -1;
    });
  }, [requests, statusFilter, consoleFilter]);

  const hasSupabase = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );

  const handleUnlockClick = useCallback(() => {
    if (!hasEditorKey) return;
    if (editorUnlocked) {
      try {
        sessionStorage.removeItem(EDITOR_STORAGE_KEY);
      } catch {
        // ignore
      }
      setEditorUnlocked(false);
      onToast("Status editing locked.", "info");
      return;
    }
    const key = window.prompt("Enter editor key to change status, rejection reason, and available:");
    if (key === null) return;
    if (key === process.env.NEXT_PUBLIC_EDITOR_KEY) {
      try {
        sessionStorage.setItem(EDITOR_STORAGE_KEY, "1");
      } catch {
        // ignore
      }
      setEditorUnlocked(true);
      onToast("Status editing unlocked.", "success");
    } else {
      onToast("Incorrect key.", "error");
    }
  }, [hasEditorKey, editorUnlocked, onToast]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-xl font-semibold text-white">
            Requests
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review and manage game requests. Updates appear in real time.
          </p>
        </header>

        {!hasSupabase && (
          <div className="mb-6 rounded-xl border border-amber-800/50 bg-amber-900/20 p-4 text-sm text-amber-200">
            Configure <code className="rounded bg-amber-900/40 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-amber-900/40 px-1">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY</code> in{" "}
            <code className="rounded bg-amber-900/40 px-1">.env.local</code> and create the{" "}
            <code className="rounded bg-amber-900/40 px-1">game_requests</code> table.
          </div>
        )}

        {hasEditorKey && (
          <div className="mb-6">
            <button
              type="button"
              onClick={handleUnlockClick}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-attensi focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                editorUnlocked
                  ? "border border-attensi bg-attensi/20 text-attensi"
                  : "border border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {editorUnlocked ? "✓ Status editing unlocked" : "Unlock status editing"}
            </button>
          </div>
        )}

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-zinc-400">Filters</h2>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
            >
              <option value="all">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={consoleFilter}
              onChange={(e) => setConsoleFilter(e.target.value)}
              className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2.5 text-sm text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
            >
              <option value="all">All consoles</option>
              {CONSOLE_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800/50 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-attensi border-t-transparent" />
          </div>
        ) : (
          <div className="game-grid">
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onRefresh={fetchRequests}
                onToast={onToast}
                canEditStatus={canEditStatus}
              />
            ))}
          </div>
        )}
        {!loading && filteredRequests.length === 0 && (
          <p className="rounded-xl border border-zinc-700 bg-zinc-800/50 py-12 text-center text-zinc-500">
            No requests match the current filters.
          </p>
        )}
      </div>

      <Toast
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </main>
  );
}
