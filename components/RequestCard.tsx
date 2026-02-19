"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getSupabase,
  CONSOLE_OPTIONS,
  STATUS_OPTIONS,
  REJECTION_REASON_OPTIONS,
  type GameRequest,
  type StatusOption,
} from "@/lib/supabase";
import { getVoterId, hasUpvoted, markUpvoted } from "@/lib/upvote";
import FilterCheckbox from "@/components/FilterCheckbox";

const STATUS_COLORS: Record<StatusOption, string> = {
  Pending: "bg-amber-500/90 text-black",
  Approved: "bg-emerald-500/90 text-black",
  Rejected: "bg-red-500/90 text-black",
};

interface RequestCardProps {
  request: GameRequest;
  onRefresh: () => void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
  canEditStatus?: boolean;
}

export default function RequestCard({
  request,
  onRefresh,
  onToast,
  canEditStatus = true,
}: RequestCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<StatusOption>(request.status);
  const [rejectionReason, setRejectionReason] = useState<string | null>(request.rejection_reason);
  const [available, setAvailable] = useState(request.available);
  const [upvotes, setUpvotes] = useState(request.upvotes ?? 0);
  const [upvoting, setUpvoting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(() => hasUpvoted(request.id));

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (upvoting || alreadyVoted) return;
    setUpvoting(true);
    try {
      const voterId = getVoterId();
      const client = getSupabase();
      const { data, error } = await client.rpc("upvote_request", {
        p_request_id: request.id,
        p_voter_id: voterId,
      });
      if (error) throw error;
      const result = data as { success?: boolean; already_voted?: boolean; new_count?: number } | null;
      if (result?.already_voted) {
        setAlreadyVoted(true);
        markUpvoted(request.id);
        if (typeof result.new_count === "number") setUpvotes(result.new_count);
        onToast("You already upvoted this request.", "info");
      } else if (result?.success && typeof result.new_count === "number") {
        setAlreadyVoted(true);
        markUpvoted(request.id);
        setUpvotes(result.new_count);
      } else {
        setUpvotes(request.upvotes ?? 0);
      }
    } catch {
      onToast("Upvote failed. Try again.", "error");
    } finally {
      setUpvoting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status,
          rejection_reason: rejectionReason,
          available,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Update failed");
      onToast("Updated.", "success");
      setEditOpen(false);
      onRefresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed.";
      onToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Delete failed");
      onToast("Request deleted.", "success");
      setDeleteOpen(false);
      onRefresh();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const cardContent = (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 transition duration-200 hover:scale-[1.02] hover:border-zinc-600 hover:shadow-xl hover:shadow-black/20">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        {request.game_image ? (
          <Image
            src={request.game_image}
            alt={request.game_title}
            fill
            className="object-cover transition duration-200 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-600">🎮</div>
        )}
        <div className="absolute left-2 top-2 right-2 flex items-start justify-between gap-1">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[request.status]}`}>
            {request.status}
          </span>
          {canEditStatus && (
            <div className="flex gap-0.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditOpen(true);
                }}
                className="rounded bg-zinc-800/90 p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteOpen(true);
                }}
                className="rounded bg-zinc-800/90 p-1.5 text-red-400 hover:bg-red-900/50"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.499-.058l-.347 9a.75.75 0 1 0 1.5.058l.346-9Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 font-semibold text-white">{request.game_title}</h3>
          <button
            type="button"
            onClick={handleUpvote}
            disabled={upvoting || alreadyVoted}
            className={`shrink-0 flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${
              alreadyVoted
                ? "border-emerald-600/50 bg-emerald-900/30 text-emerald-400 cursor-default"
                : "border-zinc-600 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 hover:text-white"
            }`}
            title={alreadyVoted ? "You upvoted" : "Upvote"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777Z" />
            </svg>
            <span>{upvotes}</span>
            {alreadyVoted && <span className="text-[10px]">· upvoted</span>}
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-400">{request.console}</p>
        {request.status === "Approved" && request.available && (
          <p className="mt-1 text-xs text-emerald-400">✓ Available</p>
        )}
        {request.status === "Rejected" && request.rejection_reason && (
          <p className="mt-1 line-clamp-1 text-xs text-red-400">{request.rejection_reason}</p>
        )}
      </div>
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!saving) setEditOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <h3 className="font-semibold text-white">Edit request</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusOption)}
                  className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {status === "Rejected" && (
                <div>
                  <label className="block text-xs font-medium text-zinc-400">Rejection reason</label>
                  <select
                    value={rejectionReason ?? ""}
                    onChange={(e) => setRejectionReason(e.target.value || null)}
                    className="mt-1 w-full rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
                  >
                    <option value="">—</option>
                    {REJECTION_REASON_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
              {status === "Approved" && (
                <FilterCheckbox
                  checked={available}
                  onChange={() => setAvailable(!available)}
                >
                  Available
                </FilterCheckbox>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }}
                disabled={saving}
                className="flex-1 rounded-xl bg-attensi py-2 text-sm font-medium text-zinc-900 hover:bg-attensi/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!saving) setEditOpen(false);
                }}
                className="rounded-xl border border-zinc-600 py-2 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!deleting) setDeleteOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <h3 className="font-semibold text-white">Delete this request?</h3>
            <p className="mt-2 text-sm text-zinc-400">This cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!deleting) setDeleteOpen(false);
                }}
                className="rounded-xl border border-zinc-600 py-2 px-4 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (request.rawg_id) {
    return (
      <Link href={`/game/${request.rawg_id}`} className="block h-full">
        {cardContent}
      </Link>
    );
  }
  return cardContent;
}
