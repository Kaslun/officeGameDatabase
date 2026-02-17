"use client";

import { useState, useMemo } from "react";
import {
  getSupabase,
  STATUS_OPTIONS,
  REJECTION_REASON_OPTIONS,
  type GameRequest,
  type StatusOption,
} from "@/lib/supabase";

type SortKey = "date" | "game" | "status" | "requester";
type SortDir = "asc" | "desc";

interface GameTableProps {
  requests: GameRequest[];
  onRefresh: () => void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
}

const STATUS_COLORS: Record<StatusOption, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default function GameTable({
  requests,
  onRefresh,
  onToast,
}: GameTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    let list = [...requests];
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    list.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortKey) {
        case "date":
          aVal = a.date;
          bVal = b.date;
          break;
        case "game":
          aVal = a.game.toLowerCase();
          bVal = b.game.toLowerCase();
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "requester":
          aVal = a.requester.toLowerCase();
          bVal = b.requester.toLowerCase();
          break;
      }
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [requests, statusFilter, sortKey, sortDir]);

  async function updateField(
    id: string,
    field: keyof GameRequest,
    value: unknown
  ) {
    try {
      const client = getSupabase();
      let payload: Record<string, unknown> = { [field]: value };
      if (field === "available") {
        const { error: errAvailable } = await client
          .from("game_requests")
          .update({ available: value })
          .eq("id", id);
        if (errAvailable?.message?.includes("available") && errAvailable?.message?.includes("does not exist")) {
          payload = { purchased: value };
        } else if (errAvailable) {
          throw errAvailable;
        } else {
          onToast("Updated.", "success");
          onRefresh();
          return;
        }
      }
      const { error } = await client
        .from("game_requests")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      onToast("Updated.", "success");
      onRefresh();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : err instanceof Error
            ? err.message
            : "Update failed.";
      onToast(msg, "error");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const client = getSupabase();
      const { error } = await client.from("game_requests").delete().eq("id", id);
      if (error) throw error;
      onToast("Request deleted.", "success");
      setDeleteId(null);
      onRefresh();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Delete failed.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else setSortKey(key);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Filter:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-100"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-2">
          Sort:
        </span>
        {(["date", "game", "status", "requester"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleSort(key)}
            className={`rounded-md px-2 py-1.5 text-sm font-medium capitalize ${
              sortKey === key
                ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {key}
            {sortKey === key && (sortDir === "asc" ? " ↑" : " ↓")}
          </button>
        ))}
      </div>
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700 table-fixed sm:table-auto">
        <thead className="bg-zinc-100 dark:bg-zinc-800">
          <tr>
            <th className="px-2 py-1.5 sm:px-3 sm:py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Date
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Requester
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Game
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Console
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Rejection reason
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
              Available
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider w-10">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
          {filtered.map((row, i) => (
            <tr
              key={row.id}
              className={
                i % 2 === 0
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-800/50"
              }
            >
              <td className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                {row.date}
              </td>
              <td className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">
                {row.requester}
              </td>
              <td className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {row.game}
              </td>
              <td className="px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                {row.console}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <select
                  value={row.status}
                  onChange={(e) =>
                    updateField(row.id, "status", e.target.value as StatusOption)
                  }
                  className={`rounded px-2 py-1 text-sm font-medium border-0 cursor-pointer ${STATUS_COLORS[row.status]}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {row.status === "Rejected" ? (
                  <select
                    value={row.rejection_reason ?? ""}
                    onChange={(e) =>
                      updateField(
                        row.id,
                        "rejection_reason",
                        e.target.value || null
                      )
                    }
                    className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 max-w-[180px]"
                  >
                    <option value="">—</option>
                    {REJECTION_REASON_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">—</span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {row.status === "Approved" ? (
                  <input
                    type="checkbox"
                    checked={row.available}
                    onChange={(e) =>
                      updateField(row.id, "available", e.target.checked)
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => setDeleteId(row.id)}
                  className="p-1.5 rounded text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 1 0 1.5.058l.346-9Z" clipRule="evenodd" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && (
        <div className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
          No requests match the current filter.
        </div>
      )}

      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !deleting && setDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Delete request?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => !deleting && setDeleteId(null)}
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
