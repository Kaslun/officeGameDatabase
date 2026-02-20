"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase, CONSOLE_OPTIONS, type GameRequest } from "@/lib/supabase";
import { type ToastItem } from "@/components/Toast";
import type { RawgGameDetail, RawgGameListItem } from "@/lib/rawg";
import { mapRawgPlatformToConsole, fetchRelatedGames } from "@/lib/rawg";
import GameDetailView from "@/components/GameDetailView";

function getSupportedConsoles(game: RawgGameDetail, enabledConsoles?: string[]): string[] {
  const set = new Set<string>();
  game.platforms?.forEach((p) => {
    const c = mapRawgPlatformToConsole(p.platform.name);
    set.add(c);
  });
  const list = Array.from(set);
  const allowed = enabledConsoles?.length ? enabledConsoles : [...CONSOLE_OPTIONS];
  const supported = allowed.filter((c) => list.includes(c));
  return supported.length > 0 ? supported : allowed.slice(0, 1);
}

function addToast(
  setToasts: (fn: (prev: ToastItem[]) => ToastItem[]) => void,
  message: string,
  type: ToastItem["type"]
) {
  const id = Math.random().toString(36).slice(2);
  setToasts((prev) => [...prev, { id, message, type }]);
  setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
}

function truncateDescription(text: string | null, sentences = 3): string {
  if (!text || !text.trim()) return "";
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.slice(0, sentences).join(" ") || text;
}

interface GameDetailClientProps {
  game: RawgGameDetail;
  /** Comma-separated RAWG platform IDs (enabled consoles) for related games API. */
  enabledPlatforms?: string;
  /** Console names enabled in admin; request dropdown and platform list only show these. */
  enabledConsoles?: string[];
  /** DLC, season passes, expansions (display only; not requestable). */
  additions?: RawgGameListItem[];
}

export default function GameDetailClient({ game, enabledPlatforms, enabledConsoles, additions }: GameDetailClientProps) {
  const supportedConsoles = getSupportedConsoles(game, enabledConsoles);
  const [selectedConsole, setSelectedConsole] = useState<string>(
    () => supportedConsoles[0] ?? (enabledConsoles?.[0] ?? CONSOLE_OPTIONS[0])
  );
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<GameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedGames, setRelatedGames] = useState<Awaited<ReturnType<typeof fetchRelatedGames>>>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const onToast = useCallback((message: string, type: ToastItem["type"]) => {
    addToast(setToasts, message, type);
  }, []);

  const refetchRequests = useCallback(async () => {
    try {
      const client = getSupabase();
      const { data } = await client
        .from("game_requests")
        .select("*")
        .eq("rawg_id", game.id)
        .order("created_at", { ascending: false });
      setRequests((data as GameRequest[]) ?? []);
    } catch {
      setRequests([]);
    }
  }, [game.id]);

  const handleRequestSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const client = getSupabase();
      const { error } = await client.from("game_requests").insert({
        requester: "Anonymous",
        game_title: game.name,
        game_image: game.background_image || null,
        console: selectedConsole as (typeof CONSOLE_OPTIONS)[number],
        rawg_id: game.id,
        status: "Pending",
        rejection_reason: null,
        available: false,
      });
      if (error) throw error;
      onToast("Request submitted.", "success");
      refetchRequests();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : err instanceof Error
            ? err.message
            : "Failed to submit request.";
      onToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }, [game.name, game.background_image, game.id, selectedConsole, onToast, refetchRequests]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const client = getSupabase();
        const { data } = await client
          .from("game_requests")
          .select("*")
          .eq("rawg_id", game.id)
          .order("created_at", { ascending: false });
        if (mounted) setRequests((data as GameRequest[]) ?? []);
      } catch {
        if (mounted) setRequests([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [game.id]);

  const genreSlug = game.genres?.[0]?.slug;
  useEffect(() => {
    let mounted = true;
    (async () => {
      setRelatedLoading(true);
      try {
        const list = await fetchRelatedGames(
          game.id,
          genreSlug,
          8,
          { platforms: enabledPlatforms }
        );
        if (mounted) setRelatedGames(list);
      } catch {
        if (mounted) setRelatedGames([]);
      } finally {
        if (mounted) setRelatedLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [game.id, genreSlug, enabledPlatforms]);

  const description = truncateDescription(game.description_raw ?? game.description);
  const platforms = game.platforms ?? [];
  const allowedForPlatforms = enabledConsoles?.length ? enabledConsoles : (CONSOLE_OPTIONS as readonly string[]);
  const platformConsoles = Array.from(
    new Set(platforms.map((p) => mapRawgPlatformToConsole(p.platform.name)))
  ).filter((c) => allowedForPlatforms.includes(c));
  const hasPlatforms = platformConsoles.length > 0;

  return (
    <GameDetailView
      game={game}
      description={description}
      platformConsoles={platformConsoles}
      hasPlatforms={hasPlatforms}
      requests={requests}
      loading={loading}
      refetchRequests={refetchRequests}
      supportedConsoles={supportedConsoles}
      selectedConsole={selectedConsole}
      onConsoleChange={setSelectedConsole}
      onRequestSubmit={handleRequestSubmit}
      submitting={submitting}
      onToast={onToast}
      toasts={toasts}
      onDismissToast={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      relatedGames={relatedGames}
      relatedLoading={relatedLoading}
      additions={additions}
      enabledConsoles={enabledConsoles}
    />
  );
}
