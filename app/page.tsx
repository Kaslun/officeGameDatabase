"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, type GameRequest } from "@/lib/supabase";
import GameTable from "@/components/GameTable";
import AddGameForm from "@/components/AddGameForm";
import Toast, { type ToastItem } from "@/components/Toast";

function addToast(
  setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>>,
  message: string,
  type: ToastItem["type"]
) {
  const id = Math.random().toString(36).slice(2);
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, 4000);
}

export default function Home() {
  const [requests, setRequests] = useState<GameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const onToast = useCallback(
    (message: string, type: ToastItem["type"]) => {
      addToast(setToasts, message, type);
    },
    []
  );

  const fetchRequests = useCallback(async () => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setLoading(false);
      return;
    }
    try {
      const client = getSupabase();
      const { data, error } = await client
        .from("game_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRequests((data as GameRequest[]) ?? []);
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Failed to load requests.",
        "error"
      );
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
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
      return;
    const client = getSupabase();
    const channel = client
      .channel("game_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_requests" },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [fetchRequests]);

  const total = requests.length;
  const pending = requests.filter((r) => r.status === "Pending").length;
  const approved = requests.filter((r) => r.status === "Approved").length;
  const available = requests.filter(
    (r) => r.status === "Approved" && r.purchased
  ).length;

  const hasSupabase =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            Office Game Request Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Add and manage game requests. Updates appear in real time.
          </p>
        </header>

        {!hasSupabase && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Configure <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">.env.local</code> and create the{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">game_requests</code> table in Supabase.
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <AddGameForm
            existingRequests={requests}
            onSuccess={fetchRequests}
            onToast={onToast}
          />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Total
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {total}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {pending}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Approved
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {approved}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Available
            </p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              {available}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            Loading…
          </div>
        ) : (
          <GameTable
            requests={requests}
            onRefresh={fetchRequests}
            onToast={onToast}
          />
        )}
      </div>

      <Toast
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }
      />
    </main>
  );
}
