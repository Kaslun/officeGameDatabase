/**
 * RAWG Video Games Database API
 * https://rawg.io/apidocs
 */

const BASE = "https://api.rawg.io/api";

/** RAWG platform IDs for filter consoles. */
export const RAWG_PLATFORM_IDS = {
  PS5: "18",
  NintendoSwitch: "7",
  PS4: "16",
  XboxOne: "1",
  XboxSeriesX: "186",
  PC: "4",
} as const;

/** All consoles that can be shown in the Games filter. Admin toggles which are enabled. */
export const ALL_FILTER_CONSOLES = [
  { id: RAWG_PLATFORM_IDS.PS5, name: "PS5" },
  { id: RAWG_PLATFORM_IDS.NintendoSwitch, name: "Nintendo Switch" },
  { id: RAWG_PLATFORM_IDS.PS4, name: "PS4" },
  { id: RAWG_PLATFORM_IDS.XboxOne, name: "Xbox One" },
  { id: RAWG_PLATFORM_IDS.XboxSeriesX, name: "Xbox Series X" },
  { id: RAWG_PLATFORM_IDS.PC, name: "PC" },
] as const;

/** Default enabled in filter (only these are on when no config is set). */
export const DEFAULT_FILTER_CONSOLES = ["PS5", "Nintendo Switch"] as const;

const PLATFORMS_PS5_SWITCH = "18,7";

function getKey(): string {
  const key = process.env.NEXT_PUBLIC_RAWG_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_RAWG_API_KEY is not set");
  return key;
}

export interface RawgPlatform {
  platform: { id: number; name: string; slug: string };
}

export interface RawgGenre {
  id: number;
  name: string;
  slug: string;
}

export interface RawgEsrbRating {
  id: number;
  name: string;
  slug: string;
}

/** ESRB slugs we treat as lewd/mature and filter out when filterLewd is true */
export const LEWD_ESRB_SLUGS = ["adults-only", "mature", "ao", "m"] as const;

/** True if the game appears to be DLC, a season pass, or other add-on (excluded from main lists). */
export function isDlcOrSeasonPass(game: { name: string }): boolean {
  const n = game.name.toLowerCase();
  if (/season pass/.test(n)) return true;
  if (/\bdlc\b/.test(n)) return true;
  if (/add-?on/.test(n)) return true;
  if (/expansion pack/.test(n)) return true;
  if (/\bexpansion\s*:\s*/.test(n)) return true;
  if (/\s+-\s+dlc\s*$/i.test(game.name)) return true;
  return false;
}

export interface RawgGameListItem {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  rating: number | null;
  rating_top: number;
  ratings_count: number;
  platforms: RawgPlatform[] | null;
  genres: RawgGenre[] | null;
  esrb_rating?: RawgEsrbRating | null;
  short_screenshots?: { id: number; image: string }[];
  metacritic?: number | null;
}

export interface RawgGamesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGameListItem[];
}

export interface RawgGameDetail extends RawgGameListItem {
  description_raw: string | null;
  description: string | null;
  metacritic: number | null;
  playtime: number;
  developers?: { id: number; name: string; slug: string }[];
  publishers?: { id: number; name: string; slug: string }[];
}

/** Optional on list response. */
export interface RawgTagItem {
  id: number;
  name: string;
  slug: string;
  games_count: number;
}


/** Sort options for games list. */
export const ORDERING_OPTIONS = [
  { value: "-released", label: "Release date (newest)" },
  { value: "-rating", label: "Rating" },
  { value: "-added", label: "Popularity" },
  { value: "-metacritic", label: "Metacritic" },
  { value: "name", label: "Name (A–Z)" },
] as const;

/** Map RAWG platform names to our CONSOLE_OPTIONS. RAWG uses various names (e.g. "Apple Macintosh", "Xbox Series X|S"); unmapped names fall back to "Other". */
export const RAWG_PLATFORM_MAP: Record<string, string> = {
  "PlayStation 5": "PS5",
  "PS5": "PS5",
  "PlayStation 4": "PS4",
  "PS4": "PS4",
  "PlayStation 3": "PS4",
  "PS3": "PS4",
  "Xbox Series S/X": "Xbox Series X",
  "Xbox Series X|S": "Xbox Series X",
  "Xbox Series X": "Xbox Series X",
  "Xbox Series S": "Xbox Series X",
  "Xbox One": "Xbox One",
  "Xbox One S": "Xbox One",
  "Xbox One X": "Xbox One",
  "PC": "PC",
  "Microsoft Windows": "PC",
  "Windows": "PC",
  "Linux": "PC",
  "macOS": "PC",
  "Mac": "PC",
  "Apple Macintosh": "PC",
  "Classic Macintosh": "PC",
  "Macintosh": "PC",
  "SteamOS": "PC",
  "Steam OS": "PC",
  "OS X": "PC",
  "Xbox 360": "Xbox One",
  "Xbox": "Xbox One",
  "Wii U": "Other",
  "Wii": "Other",
  "3DS": "Other",
  "Nintendo 3DS": "Other",
  "PS Vita": "Other",
  "PlayStation Vita": "Other",
  "Nintendo Switch": "Nintendo Switch",
  "Switch": "Nintendo Switch",
  "iOS": "Other",
  "Android": "Other",
  "Web": "Other",
};

export function mapRawgPlatformToConsole(rawgName: string): string {
  return RAWG_PLATFORM_MAP[rawgName] ?? "Other";
}

/** True if game has no release date or the date is in the future. */
export function isNotReleased(released: string | null | undefined): boolean {
  if (!released || !released.trim()) return true;
  const d = new Date(released);
  if (Number.isNaN(d.getTime())) return true;
  return d > new Date();
}

function isLewd(game: RawgGameListItem): boolean {
  const slug = game.esrb_rating?.slug?.toLowerCase();
  if (!slug) return false;
  return LEWD_ESRB_SLUGS.some((s) => slug === s || slug.includes(s));
}

function matchesAnyGenre(game: RawgGameListItem, genreSlugs: string[]): boolean {
  if (!genreSlugs?.length) return true;
  const slugs = game.genres?.map((g) => g.slug) ?? [];
  return genreSlugs.some((s) => slugs.includes(s));
}

/** GET /api/games?search=... with optional filters (same as list). */
export async function fetchSearch(
  query: string,
  pageSize = 20,
  options?: GamesListOptions & { page?: number }
): Promise<RawgGamesResponse> {
  return fetchGamesList("-released", pageSize, {
    ...options,
    search: query.trim() || undefined,
    page: options?.page,
  });
}

/** GET /api/games/{id} */
export async function fetchGame(id: string): Promise<RawgGameDetail> {
  const key = getKey();
  const url = `${BASE}/games/${encodeURIComponent(id)}?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG game failed: ${res.status}`);
  return res.json();
}

/** GET /api/games/{id}/additions — DLC, season passes, expansions (for display only; not requestable). */
export async function fetchGameAdditions(gameId: string | number): Promise<RawgGameListItem[]> {
  const key = getKey();
  const url = `${BASE}/games/${encodeURIComponent(String(gameId))}/additions?key=${encodeURIComponent(key)}&page_size=50`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const results = (data.results ?? []) as RawgGameListItem[];
  return results;
}

export interface RawgGenreItem {
  id: number;
  name: string;
  slug: string;
  games_count: number;
}

export interface GenreWithImage extends RawgGenreItem {
  image: string | null;
}

/** GET /api/genres */
export async function fetchGenres(): Promise<{ results: RawgGenreItem[] }> {
  const key = getKey();
  const url = `${BASE}/genres?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG genres failed: ${res.status}`);
  return res.json();
}

/** Genres with a representative game image: most popular game per genre (by Metacritic), no duplicate games across categories. */
export async function fetchGenresWithImages(
  maxGenres = 12,
  options?: { platforms?: string }
): Promise<GenreWithImage[]> {
  const { results: genres } = await fetchGenres();
  const slice = genres.slice(0, maxGenres);
  const usedGameIds = new Set<number>();
  const withImages: GenreWithImage[] = [];

  for (const g of slice) {
    try {
      const res = await fetchGamesList("-metacritic", 25, {
        genre: g.slug,
        platforms: options?.platforms,
      });
      const results = res.results ?? [];
      const game = results.find((r) => !usedGameIds.has(r.id));
      if (game) {
        usedGameIds.add(game.id);
        withImages.push({ ...g, image: game.background_image ?? null });
      } else {
        withImages.push({ ...g, image: null });
      }
    } catch {
      withImages.push({ ...g, image: null as string | null });
    }
  }
  return withImages;
}

/** GET /api/tags */
export async function fetchTags(): Promise<{ results: RawgTagItem[] }> {
  const key = getKey();
  const url = `${BASE}/tags?key=${encodeURIComponent(key)}&page_size=100`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG tags failed: ${res.status}`);
  return res.json();
}

export type GamesListOptions = {
  filterLewd?: boolean;
  /** Title search (used by fetchSearch only) */
  search?: string;
  /** Date range YYYY-MM-DD,YYYY-MM-DD (used by fetchNewReleases). Use with releasedOnly to exclude unreleased. */
  dates?: string;
  /** If true, only return games with release date <= today (sets dates=1970-01-01,today). */
  releasedOnly?: boolean;
  /** Platform IDs (default 18,7 = PS5 + Switch). Pass subset to filter. */
  platforms?: string;
  /** Single genre slug */
  genre?: string;
  /** Multiple genre slugs (any match, filter client-side when length > 1) */
  genres?: string[];
  /** Tag IDs comma-separated */
  tags?: string;
  /** Ordering: -released, -rating, -added, -metacritic, name */
  ordering?: string;
};

/** GET /api/games with ordering and optional filters */
async function fetchGamesList(
  ordering: string,
  pageSize: number,
  options?: GamesListOptions & { dates?: string; page?: number }
): Promise<RawgGamesResponse> {
  const key = getKey();
  const params = new URLSearchParams();
  params.set("key", key);
  params.set("ordering", options?.ordering ?? ordering);
  const multiGenre = options?.genres && options.genres.length > 1;
  const requestSize = multiGenre ? Math.min(60, pageSize * 4) : Math.min(pageSize * 2, 40);
  params.set("page_size", String(requestSize));
  if (options?.page != null && options.page >= 1) params.set("page", String(options.page));
  params.set("exclude_additions", "true");
  params.set("exclude_parents", "true");
  params.set("platforms", options?.platforms ?? PLATFORMS_PS5_SWITCH);
  if (options?.search?.trim()) params.set("search", options.search.trim());
  if (options?.dates) params.set("dates", options.dates);
  if (options?.releasedOnly && !options?.dates) {
    const today = new Date().toISOString().slice(0, 10);
    params.set("dates", `1970-01-01,${today}`);
  }
  if (options?.genre) params.set("genres", options.genre);
  else if (options?.genres?.length === 1) params.set("genres", options.genres[0]);
  if (options?.tags) params.set("tags", options.tags);
  const url = `${BASE}/games?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG games failed: ${res.status}`);
  const data = await res.json();
  let results = (data.results ?? []).filter((g: RawgGameListItem) => !isDlcOrSeasonPass(g));
  if (options?.filterLewd) results = results.filter((g: RawgGameListItem) => !isLewd(g));
  if (options?.genres?.length && options.genres.length > 1) results = results.filter((g: RawgGameListItem) => matchesAnyGenre(g, options.genres!));
  return { ...data, results: results.slice(0, pageSize) };
}

/** All games, paginated. Excludes unreleased by default for browse page. */
export async function fetchAllGames(
  page = 1,
  pageSize = 24,
  options?: GamesListOptions
): Promise<RawgGamesResponse> {
  return fetchGamesList("-released", pageSize, { ...options, page, releasedOnly: options?.releasedOnly ?? true });
}

/** Popular games by Metacritic score (ordering=-metacritic). */
export async function fetchPopularByMetacritic(
  pageSize = 8,
  options?: GamesListOptions
): Promise<RawgGamesResponse> {
  return fetchGamesList("-metacritic", pageSize, { ...options, ordering: "-metacritic" });
}

/** New releases: ordering=-released, last 12 months */
export async function fetchNewReleases(
  pageSize = 12,
  options?: GamesListOptions
): Promise<RawgGamesResponse> {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  const dates = `${start.toISOString().slice(0, 10)},${end.toISOString().slice(0, 10)}`;
  return fetchGamesList("-released", pageSize, { ...options, dates });
}

/** Same-genre games (fallback when suggested is unavailable). Excludes gameId. */
export async function fetchSameGenre(
  genreSlug: string,
  excludeGameId: number,
  pageSize = 8,
  options?: { filterLewd?: boolean; platforms?: string }
): Promise<RawgGameListItem[]> {
  const key = getKey();
  const params = new URLSearchParams();
  params.set("key", key);
  params.set("genres", genreSlug);
  params.set("ordering", "-rating");
  params.set("page_size", String(pageSize + 4));
  params.set("exclude_additions", "true");
  params.set("exclude_parents", "true");
  params.set("platforms", options?.platforms ?? PLATFORMS_PS5_SWITCH);
  const url = `${BASE}/games?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  let results = (data.results ?? [])
    .filter((g: RawgGameListItem) => g.id !== excludeGameId && !isDlcOrSeasonPass(g));
  if (options?.filterLewd) results = results.filter((g: RawgGameListItem) => !isLewd(g));
  return results.slice(0, pageSize);
}

/** Related games: same-genre only (suggested endpoint is paid-tier on RAWG, so we skip it to avoid an extra failing call). */
export async function fetchRelatedGames(
  gameId: number,
  genreSlug: string | undefined,
  pageSize = 8,
  options?: { platforms?: string }
): Promise<RawgGameListItem[]> {
  if (genreSlug) return fetchSameGenre(genreSlug, gameId, pageSize, { platforms: options?.platforms });
  return [];
}
