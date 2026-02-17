"use client";

import { useState } from "react";
import { getSupabase, CONSOLE_OPTIONS, type GameRequest } from "@/lib/supabase";

interface AddGameFormProps {
  existingRequests: GameRequest[];
  onSuccess: () => void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function AddGameForm({
  existingRequests,
  onSuccess,
  onToast,
}: AddGameFormProps) {
  const [requester, setRequester] = useState("");
  const [game, setGame] = useState("");
  const [consoleOption, setConsoleOption] = useState<string>(CONSOLE_OPTIONS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isDuplicate =
    game.trim().length > 0 &&
    existingRequests.some(
      (r) =>
        r.game.toLowerCase().trim() === game.toLowerCase().trim() &&
        r.console === consoleOption
    );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requester.trim() || !game.trim()) {
      onToast("Please enter your name and game title.", "error");
      return;
    }
    if (isDuplicate) {
      onToast("A request for this game on this console already exists.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const client = getSupabase();
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await client.from("game_requests").insert({
        date: today,
        requester: requester.trim(),
        game: game.trim(),
        console: consoleOption,
        status: "Pending",
        duplicate: false,
        rejection_reason: null,
        purchased: false,
      });
      if (error) throw error;
      onToast("Request added successfully.", "success");
      setRequester("");
      setGame("");
      setConsoleOption(CONSOLE_OPTIONS[0]);
      setIsOpen(false);
      onSuccess();
    } catch (err) {
      onToast(
        err instanceof Error ? err.message : "Failed to add request.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        + New Request
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !submitting && setIsOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              New game request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="requester"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Your name
                </label>
                <input
                  id="requester"
                  type="text"
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Jane Doe"
                  autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="game"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Game title
                </label>
                <input
                  id="game"
                  type="text"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Elden Ring"
                />
                {isDuplicate && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    A request for this game on this console already exists.
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="console"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Console
                </label>
                <select
                  id="console"
                  value={consoleOption}
                  onChange={(e) => setConsoleOption(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-zinc-900 dark:text-zinc-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {CONSOLE_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting || isDuplicate}
                  className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Adding…" : "Add request"}
                </button>
                <button
                  type="button"
                  onClick={() => !submitting && setIsOpen(false)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
