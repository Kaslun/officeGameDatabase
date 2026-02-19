"use client";

import React from "react";
import type { GameRequest } from "@/lib/supabase";

function formatRequestDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface GameRequestModuleProps {
  loading: boolean;
  requests: GameRequest[];
  supportedConsoles: string[];
  selectedConsole: string;
  onConsoleChange: (console: string) => void;
  onRequestSubmit: () => void;
  submitting: boolean;
  developerNames: string | null;
  publisherNames: string | null;
  releaseDateStr: string | null;
}

export default function GameRequestModule({
  loading,
  requests,
  supportedConsoles,
  selectedConsole,
  onConsoleChange,
  onRequestSubmit,
  submitting,
  developerNames,
  publisherNames,
  releaseDateStr,
}: GameRequestModuleProps) {
  const mostRecentRequest = requests.length > 0 ? requests[0] : null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-700 bg-zinc-800/50 p-5 shrink-0 w-full sm:w-72">
      {/* Request CTA */}
      {loading && (
        <p className="text-sm text-zinc-500">Loading request status…</p>
      )}
      {!loading && mostRecentRequest && (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-attensi">Requested</span>
            <span className="text-sm text-zinc-400">
              on {formatRequestDate(mostRecentRequest.created_at)}
            </span>
          </div>
        </div>
      )}
      {!loading && requests.length === 0 && (
        <div className="flex flex-col gap-3">
          <select
            value={selectedConsole}
            onChange={(e) => onConsoleChange(e.target.value)}
            className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-3 text-sm text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50 w-full"
          >
            {supportedConsoles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onRequestSubmit()}
            disabled={submitting}
            className="w-full rounded-xl bg-attensi px-6 py-3 font-medium text-zinc-900 hover:bg-attensi/90 focus:outline-none focus:ring-2 focus:ring-attensi focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Request"}
          </button>
        </div>
      )}
      {!loading && requests.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-zinc-500">Request status</p>
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm"
            >
              {r.status === "Approved" && r.available && (
                <span className="text-emerald-400">✅ Approved — Available!</span>
              )}
              {r.status === "Approved" && !r.available && (
                <span className="text-emerald-400">✅ Approved</span>
              )}
              {r.status === "Pending" && (
                <span className="text-amber-400">⏳ Pending review</span>
              )}
              {r.status === "Rejected" && (
                <span className="text-red-400">
                  ❌ Rejected — {r.rejection_reason ?? "No reason"}
                </span>
              )}
              <span className="text-zinc-500">· {r.console}</span>
            </div>
          ))}
        </div>
      )}

      {/* Developer, Publisher, Release date */}
      {(developerNames || publisherNames || releaseDateStr) && (
        <div className="mt-2 border-t border-zinc-700 pt-4 space-y-1.5 text-sm">
          {developerNames && (
            <p className="text-zinc-300">
              Developed by <span className="text-white">{developerNames}</span>
            </p>
          )}
          {publisherNames && (
            <p className="text-zinc-300">
              Published by <span className="text-white">{publisherNames}</span>
            </p>
          )}
          {releaseDateStr && (
            <p className="text-zinc-300">
              Release date <span className="text-white">{releaseDateStr}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
