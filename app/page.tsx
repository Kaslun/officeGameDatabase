import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import {
  fetchNewReleases,
  fetchPopularByMetacritic,
  fetchGenresWithImages,
  ALL_FILTER_CONSOLES,
} from "@/lib/rawg";
import GameCard from "@/components/GameCard";
import { getEnabledConsoles } from "@/lib/config";

async function getCachedGenresWithImages(platforms?: string) {
  return unstable_cache(
    () => fetchGenresWithImages(12, { platforms }),
    ["rawg-genres-with-images", platforms ?? "default"],
    { revalidate: 3600 }
  )();
}
const getCachedEnabledConsoles = unstable_cache(getEnabledConsoles, ["enabled-consoles"], { revalidate: 60 });

export const dynamic = "force-dynamic";
export const revalidate = 60;

export const metadata = {
  title: "Discover | Attensi Game Hub",
};

export default async function DiscoverPage() {
  const enabledConsoles = await getCachedEnabledConsoles();
  const nameToId = new Map<string, string>(ALL_FILTER_CONSOLES.map((c) => [c.name, c.id]));
  const platforms =
    enabledConsoles.length > 0
      ? (enabledConsoles.map((c) => nameToId.get(c)).filter(Boolean) as string[]).join(",")
      : undefined;

  let popular: Awaited<ReturnType<typeof fetchPopularByMetacritic>>["results"] = [];
  let categories: Awaited<ReturnType<typeof fetchGenresWithImages>> = [];
  let newReleases: Awaited<ReturnType<typeof fetchNewReleases>>["results"] = [];
  let error: string | null = null;

  try {
    const [popularRes, categoriesRes, newRes] = await Promise.all([
      fetchPopularByMetacritic(5, { platforms }),
      getCachedGenresWithImages(platforms),
      fetchNewReleases(5, { platforms }),
    ]);
    popular = popularRes.results ?? [];
    categories = categoriesRes ?? [];
    newReleases = newRes.results ?? [];
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load";
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Discover</h1>
        <form action="/search" method="get" className="mb-8">
          <div className="flex gap-2">
            <input
              type="search"
              name="q"
              placeholder="Find games, add-ons, and more"
              className="flex-1 rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-3 text-white placeholder-zinc-500 focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
              aria-label="Search games"
            />
            <button
              type="submit"
              className="shrink-0 rounded-xl bg-attensi px-6 py-3 font-medium text-zinc-900 hover:bg-attensi/90 focus:outline-none focus:ring-2 focus:ring-attensi focus:ring-offset-2 focus:ring-offset-zinc-900"
            >
              Search
            </button>
          </div>
        </form>

        {error && (
          <p className="mb-6 rounded-lg border border-amber-900/50 bg-amber-900/20 px-4 py-3 text-amber-200">
            {error}
          </p>
        )}

        {!error && (
          <>
            {/* Popular games (Metacritic) - 5 entries */}
            <section className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Popular games</h2>
                <Link
                  href="/games?sort=-metacritic"
                  className="text-sm font-medium text-attensi hover:underline"
                >
                  Explore All &gt;
                </Link>
              </div>
              {popular.length === 0 ? (
                <p className="text-zinc-500">No popular games to show.</p>
              ) : (
                <div className="game-grid">
                  {popular.map((game) => (
                    <GameCard key={game.id} game={game} enabledConsoles={enabledConsoles} />
                  ))}
                </div>
              )}
            </section>

            {/* New releases */}
            <section className="mb-12">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">New releases</h2>
                <Link
                  href="/games"
                  className="text-sm font-medium text-attensi hover:underline"
                >
                  Explore All &gt;
                </Link>
              </div>
              {newReleases.length === 0 ? (
                <p className="text-zinc-500">No new releases to show.</p>
              ) : (
                <div className="game-grid">
                  {newReleases.map((game) => (
                    <GameCard key={game.id} game={game} enabledConsoles={enabledConsoles} />
                  ))}
                </div>
              )}
            </section>

            {/* Browse by Categories - at bottom */}
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Browse by Categories</h2>
              </div>
              <div className="game-grid">
                {categories.map((genre) => (
                  <Link
                    key={genre.id}
                    href={`/games?genre=${encodeURIComponent(genre.slug)}`}
                    className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 transition duration-200 hover:scale-[1.02] hover:border-zinc-600 hover:shadow-xl hover:shadow-black/20"
                  >
                    {genre.image ? (
                      <Image
                        src={genre.image}
                        alt=""
                        fill
                        className="object-cover transition duration-200 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-zinc-700" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/95 via-zinc-900/40 to-transparent" />
                    <span className="absolute bottom-3 left-3 right-3 text-left font-semibold text-white drop-shadow">
                      {genre.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
