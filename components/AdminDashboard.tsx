"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import type { GameRequest } from "@/lib/supabase";
import { STATUS_OPTIONS } from "@/lib/supabase";
import { ALL_FILTER_CONSOLES } from "@/lib/rawg";
import FilterCheckbox from "@/components/FilterCheckbox";
import Toast, { type ToastItem } from "@/components/Toast";

interface Analytics {
  requests: GameRequest[];
  total: number;
  byStatus: Record<string, number>;
  byConsole: Record<string, number>;
  requestsOverTime: { date: string; count: number }[];
  topGames: { title: string; upvotes: number; count: number }[];
  available: number;
}

const CHART_COLOR = "#2DDEF8";

function addToast(
  setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>>,
  message: string,
  type: ToastItem["type"]
) {
  const id = Math.random().toString(36).slice(2);
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
}

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [enabledConsoles, setEnabledConsoles] = useState<string[]>([]);
  const [savingConsoles, setSavingConsoles] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editUpvotes, setEditUpvotes] = useState(0);
  const [editAvailable, setEditAvailable] = useState(false);
  const [savingRequest, setSavingRequest] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [analyticsRes, consolesRes] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch("/api/admin/config/enabled-consoles"),
      ]);
      if (analyticsRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (analyticsRes.ok) {
        const json = await analyticsRes.json();
        setData(json);
      }
      if (consolesRes.ok) {
        const list = await consolesRes.json();
        setEnabledConsoles(Array.isArray(list) ? list : []);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleSaveConsoles = async () => {
    setSavingConsoles(true);
    try {
      const res = await fetch("/api/admin/config/enabled-consoles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consoles: enabledConsoles }),
      });
      if (!res.ok) throw new Error("Failed to save");
      addToast(setToasts, "Consoles updated.", "success");
    } catch {
      addToast(setToasts, "Failed to save consoles.", "error");
    } finally {
      setSavingConsoles(false);
    }
  };

  const toggleConsole = (c: string) => {
    setEnabledConsoles((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const startEdit = (r: GameRequest) => {
    setEditingId(r.id);
    setEditStatus(r.status);
    setEditUpvotes(r.upvotes ?? 0);
    setEditAvailable(r.available);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveRequest = async () => {
    if (!editingId) return;
    setSavingRequest(true);
    try {
      const res = await fetch(`/api/admin/requests/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          upvotes: editUpvotes,
          available: editAvailable,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      addToast(setToasts, "Request updated.", "success");
      setEditingId(null);
      fetchAnalytics();
    } catch {
      addToast(setToasts, "Failed to update request.", "error");
    } finally {
      setSavingRequest(false);
    }
  };

  const deleteRequest = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      addToast(setToasts, "Request deleted.", "success");
      if (editingId === id) setEditingId(null);
      fetchAnalytics();
    } catch {
      addToast(setToasts, "Failed to delete request.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-attensi border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <p className="text-zinc-400">Failed to load dashboard.</p>
      </div>
    );
  }

  const {
    total,
    byStatus,
    byConsole,
    requestsOverTime,
    topGames,
    available,
    requests,
  } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-white"
            >
              ← Back to site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats cards */}
        <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total</p>
            <p className="mt-1 text-2xl font-bold text-white">{total}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-amber-400">Pending</p>
            <p className="mt-1 text-2xl font-bold text-white">{byStatus.Pending ?? 0}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Approved</p>
            <p className="mt-1 text-2xl font-bold text-white">{byStatus.Approved ?? 0}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-red-400">Rejected</p>
            <p className="mt-1 text-2xl font-bold text-white">{byStatus.Rejected ?? 0}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-attensi">Available</p>
            <p className="mt-1 text-2xl font-bold text-white">{available}</p>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">By console</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {Object.entries(byConsole)
                .map(([c, n]) => `${c}: ${n}`)
                .join(" · ") || "—"}
            </p>
          </div>
        </section>

        {/* Charts */}
        <section className="mb-10 grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <h2 className="mb-4 text-sm font-bold text-white">Requests over time</h2>
            <div className="h-64">
              {requestsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={requestsOverTime}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                    <YAxis stroke="#71717a" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#27272a", border: "1px solid #52525b" }}
                      labelStyle={{ color: "#a1a1aa" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={CHART_COLOR}
                      fill="url(#colorCount)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-zinc-500">No data yet</p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <h2 className="mb-4 text-sm font-bold text-white">Requests by status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Pending", count: byStatus.Pending ?? 0 },
                    { name: "Approved", count: byStatus.Approved ?? 0 },
                    { name: "Rejected", count: byStatus.Rejected ?? 0 },
                  ]}
                  margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#27272a", border: "1px solid #52525b" }}
                  />
                  <Bar dataKey="count" fill={CHART_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <h2 className="mb-4 text-sm font-bold text-white">Top requested games (by upvotes)</h2>
            <div className="h-72">
              {topGames.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topGames.slice(0, 10)}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#52525b" />
                    <XAxis type="number" stroke="#71717a" fontSize={11} />
                    <YAxis type="category" dataKey="title" stroke="#71717a" fontSize={11} width={140} tick={{ fill: "#a1a1aa" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#27272a", border: "1px solid #52525b" }}
                    />
                    <Bar dataKey="upvotes" fill={CHART_COLOR} radius={[0, 4, 4, 0]} name="Upvotes" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-zinc-500">No data yet</p>
              )}
            </div>
          </div>
        </section>

        {/* Console filter config */}
        <section className="mb-10 rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <h2 className="mb-3 text-sm font-bold text-white">Filter consoles</h2>
          <p className="mb-4 text-xs text-zinc-500">
            Enable or disable consoles shown in the Games filter. Only enabled consoles appear for users.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {ALL_FILTER_CONSOLES.map((c) => (
              <li key={c.name}>
                <FilterCheckbox
                  checked={enabledConsoles.includes(c.name)}
                  onChange={() => toggleConsole(c.name)}
                >
                  {c.name}
                </FilterCheckbox>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleSaveConsoles}
            disabled={savingConsoles}
            className="mt-4 rounded-xl bg-attensi px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-attensi/90 disabled:opacity-50"
          >
            {savingConsoles ? "Saving…" : "Save consoles"}
          </button>
        </section>

        {/* Requests table with edit */}
        <section className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
          <h2 className="mb-4 text-sm font-bold text-white">Recent requests</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-600 text-zinc-500">
                  <th className="pb-2 pr-4 font-medium">Game</th>
                  <th className="pb-2 pr-4 font-medium">Console</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Upvotes</th>
                  <th className="pb-2 pr-4 font-medium">Available</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 50).map((r) => (
                  <tr key={r.id} className="border-b border-zinc-700/50">
                    <td className="py-2 pr-4">
                      {r.rawg_id ? (
                        <Link href={`/game/${r.rawg_id}`} className="text-attensi hover:underline">
                          {r.game_title}
                        </Link>
                      ) : (
                        r.game_title
                      )}
                    </td>
                    <td className="py-2 pr-4 text-zinc-400">{r.console}</td>
                    {editingId === r.id ? (
                      <>
                        <td className="py-2 pr-4">
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="rounded-xl border border-zinc-600 bg-zinc-800 px-2 py-1 text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            min={0}
                            value={editUpvotes}
                            onChange={(e) => setEditUpvotes(parseInt(e.target.value, 10) || 0)}
                            className="w-16 rounded-xl border border-zinc-600 bg-zinc-800 px-2 py-1 text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <FilterCheckbox
                            checked={editAvailable}
                            onChange={() => setEditAvailable(!editAvailable)}
                          >
                            Available
                          </FilterCheckbox>
                        </td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={saveRequest}
                            disabled={savingRequest}
                            className="mr-2 rounded-xl bg-attensi px-2 py-1 text-xs font-medium text-zinc-900 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-xl border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pr-4">
                          <span
                            className={
                              r.status === "Approved"
                                ? "text-emerald-400"
                                : r.status === "Rejected"
                                  ? "text-red-400"
                                  : "text-amber-400"
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4 text-zinc-400">{r.upvotes ?? 0}</td>
                        <td className="py-2 pr-4 text-zinc-400">{r.available ? "Yes" : "No"}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="mr-2 rounded-xl border border-zinc-600 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteRequest(r.id)}
                            disabled={deletingId === r.id}
                            className="rounded-xl border border-red-800/60 px-2 py-1 text-xs text-red-400 hover:bg-red-900/30 disabled:opacity-50"
                          >
                            {deletingId === r.id ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.length === 0 && (
            <p className="py-8 text-center text-zinc-500">No requests yet.</p>
          )}
        </section>
      </main>

      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </div>
  );
}
