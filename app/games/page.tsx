import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { fetchAllGames, fetchGenres, fetchTags } from "@/lib/rawg";
import GameCard from "@/components/GameCard";
import FilterSidebar from "@/components/FilterSidebar";
import { filterParamsToOptions } from "@/lib/filterParams";
import { ALL_FILTER_CONSOLES } from "@/lib/rawg";
import { getEnabledConsoles } from "@/lib/config";

const getCachedGenres = unstable_cache(() => fetchGenres(), ["rawg-genres"], { revalidate: 3600 });
const getCachedTags = unstable_cache(() => fetchTags(), ["rawg-tags"], { revalidate: 3600 });
const getCachedEnabledConsoles = unstable_cache(getEnabledConsoles, ["enabled-consoles"], { revalidate: 60 });

export const dynamic = "force-dynamic";
export const revalidate = 60;

const PAGE_SIZE = 24;

interface GamesPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AllGamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const enabledConsoles = await getCachedEnabledConsoles();
  const nameToId = new Map<string, string>(ALL_FILTER_CONSOLES.map((c) => [c.name, c.id]));
  const allowedPlatformIds =
    enabledConsoles.length > 0
      ? (enabledConsoles
          .map((c) => nameToId.get(c))
          .filter(Boolean) as string[])
      : undefined;
  const options = filterParamsToOptions(params, { allowedPlatformIds });
  const { page = 1, ...listOptions } = options;

  let genres: Awaited<ReturnType<typeof fetchGenres>>["results"] = [];
  let tags: Awaited<ReturnType<typeof fetchTags>>["results"] = [];
  let data: Awaited<ReturnType<typeof fetchAllGames>> | null = null;
  let error: string | null = null;

  try {
    const [genresRes, tagsRes, gamesRes] = await Promise.all([
      getCachedGenres(),
      getCachedTags(),
      fetchAllGames(page, PAGE_SIZE, { ...listOptions, ordering: listOptions.ordering ?? "-released" }),
    ]);
    genres = genresRes.results ?? [];
    tags = tagsRes.results ?? [];
    data = gamesRes;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  const results = data?.results ?? [];
  const count = data?.count ?? 0;
  const hasNext = data?.next != null;
  const hasPrev = page > 1;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  function buildPageUrl(nextPage: number): string {
    const p = { ...params, page: nextPage === 1 ? undefined : String(nextPage) };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) if (v != null && v !== "") qs.set(k, v);
    const s = qs.toString();
    return s ? `/games?${s}` : "/games";
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <div className="order-1 min-w-0 flex-1 pt-6 lg:order-2 lg:pt-0 lg:pl-8">
          <h1 className="mb-2 text-2xl font-bold text-white">All games</h1>
          <p className="mb-6 text-sm text-zinc-500">
            Browse all available games.
          </p>

          {error && (
            <p className="rounded-lg border border-amber-900/50 bg-amber-900/20 px-4 py-3 text-amber-200">
              {error}
            </p>
          )}

          {!error && (
            <>
              {results.length === 0 ? (
                <p className="text-zinc-500">No games on this page.</p>
              ) : (
                <div className="game-grid">
                  {results.map((game) => (
                    <GameCard key={game.id} game={game} enabledConsoles={enabledConsoles} />
                  ))}
                </div>
              )}

              <nav className="mt-8 flex flex-wrap items-center justify-center gap-4" aria-label="Pagination">
                {hasPrev ? (
                  <Link
                    href={buildPageUrl(page - 1)}
                    className="rounded-xl border border-zinc-600 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white hover:border-zinc-500 hover:bg-zinc-700"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm text-zinc-500">
                    ← Previous
                  </span>
                )}
                <span className="text-sm text-zinc-400">
                  Page {page} of {totalPages}
                </span>
                {hasNext ? (
                  <Link
                    href={buildPageUrl(page + 1)}
                    className="rounded-xl border border-zinc-600 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white hover:border-zinc-500 hover:bg-zinc-700"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-5 py-2.5 text-sm text-zinc-500">
                    Next →
                  </span>
                )}
              </nav>
            </>
          )}
        </div>
        <div className="order-2 shrink-0 lg:order-1 lg:w-64">
          <Suspense fallback={<div className="h-14 lg:h-auto lg:min-h-[200px]" />}>
            <FilterSidebar genres={genres} tags={tags} basePath="/games" enabledConsoles={enabledConsoles} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
