"use client";

import Image from "next/image";
import Link from "next/link";
import type { RawgGameListItem } from "@/lib/rawg";
import { mapRawgPlatformToConsole, isNotReleased, ALL_FILTER_CONSOLES } from "@/lib/rawg";

interface GameCardProps {
  game: RawgGameListItem;
  /** When set, only show platform tags that are in this list (admin-enabled consoles). */
  enabledConsoles?: string[];
}

const FILTER_CONSOLE_NAMES = new Set(ALL_FILTER_CONSOLES.map((c) => c.name));

const CONSOLE_ICONS: Record<string, string> = {
  PS5: "🎮",
  PS4: "🎮",
  "Xbox Series X": "🎮",
  "Xbox One": "🎮",
  "Nintendo Switch": "🎮",
  PC: "🖥️",
  Other: "📦",
};

function getPlatformNames(game: RawgGameListItem, enabledConsoles?: string[]): string[] {
  const names = new Set<string>();
  const allowed = enabledConsoles?.length
    ? new Set(enabledConsoles)
    : FILTER_CONSOLE_NAMES;
  game.platforms?.forEach((p) => {
    const c = mapRawgPlatformToConsole(p.platform.name);
    if (allowed.has(c)) names.add(c);
  });
  if (names.size === 0) names.add("Other");
  return Array.from(names);
}

export default function GameCard({ game, enabledConsoles }: GameCardProps) {
  const platforms = getPlatformNames(game, enabledConsoles);
  const imageUrl = game.background_image || null;
  const notReleased = isNotReleased(game.released);

  return (
    <Link
      href={`/game/${game.id}`}
      prefetch={false}
      className="group block overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 transition duration-200 hover:scale-[1.02] hover:border-zinc-600 hover:shadow-xl hover:shadow-black/20"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={game.name}
            fill
            className="object-cover transition duration-200 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-600">
            🎮
          </div>
        )}
        {notReleased && (
          <span className="absolute left-2 top-2 rounded bg-zinc-800/90 px-2 py-0.5 text-xs font-medium text-zinc-400">
            Not released
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 font-semibold text-white transition group-hover:text-attensi">
          {game.name}
        </h3>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {platforms.slice(0, 3).map((p) => (
            <span
              key={p}
              className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-zinc-300"
            >
              {CONSOLE_ICONS[p] ?? "📦"} {p}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
