import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { fetchSearch, fetchGenres, fetchTags } from "@/lib/rawg";
import GameCard from "@/components/GameCard";
import FilterSidebar from "@/components/FilterSidebar";
import { filterParamsToOptions } from "@/lib/filterParams";
import { ALL_FILTER_CONSOLES } from "@/lib/rawg";
import { getEnabledConsoles } from "@/lib/config";

const getCachedGenres = unstable_cache(() => fetchGenres(), ["rawg-genres"], { revalidate: 3600 });
const getCachedTags = unstable_cache(() => fetchTags(), ["rawg-tags"], { revalidate: 3600 });
const getCachedEnabledConsoles = unstable_cache(getEnabledConsoles, ["enabled-consoles"], { revalidate: 60 });

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const enabledConsoles = await getCachedEnabledConsoles();
  const nameToId = new Map<string, string>(ALL_FILTER_CONSOLES.map((c) => [c.name, c.id]));
  const allowedPlatformIds =
    enabledConsoles.length > 0
      ? (enabledConsoles
          .map((c) => nameToId.get(c))
          .filter(Boolean) as string[])
      : undefined;
  const options = filterParamsToOptions(params, { allowedPlatformIds });

  if (!query) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-xl font-semibold text-white">Search games</h1>
          <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-8 text-center text-zinc-400">
            Enter a search term in the navbar or home page.
          </div>
        </div>
      </main>
    );
  }

  const { page: _p, ...searchOptions } = options;

  let genres: Awaited<ReturnType<typeof fetchGenres>>["results"] = [];
  let tags: Awaited<ReturnType<typeof fetchTags>>["results"] = [];
  let games: Awaited<ReturnType<typeof fetchSearch>>["results"] = [];
  let error: string | null = null;

  try {
    const [genresRes, tagsRes, data] = await Promise.all([
      getCachedGenres(),
      getCachedTags(),
      fetchSearch(query, 20, searchOptions),
    ]);
    genres = genresRes.results ?? [];
    tags = tagsRes.results ?? [];
    games = data.results ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Search failed";
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
        <div className="order-1 min-w-0 flex-1 pt-6 lg:order-2 lg:pt-0 lg:pl-8">
          <h1 className="mb-2 text-xl font-semibold text-white">
            Results for &quot;{query}&quot;
          </h1>
          <p className="mb-4 text-sm text-zinc-500">Use filters to narrow results.</p>
          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-900/20 px-4 py-3 text-red-200">{error}</p>
          )}
          {!error && games.length === 0 && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-12 text-center">
              <p className="text-zinc-400">No games found.</p>
              <p className="mt-2 text-sm text-zinc-500">Try a different search term or adjust filters.</p>
            </div>
          )}
          {!error && games.length > 0 && (
            <div className="game-grid">
              {games.map((game) => (
                <GameCard key={game.id} game={game} enabledConsoles={enabledConsoles} />
              ))}
            </div>
          )}
        </div>
        <div className="order-2 shrink-0 lg:order-1 lg:w-64">
          <Suspense fallback={<div className="h-14 lg:h-auto lg:min-h-[200px]" />}>
            <FilterSidebar genres={genres} tags={tags} basePath="/search" enabledConsoles={enabledConsoles} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
