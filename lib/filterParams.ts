import type { GamesListOptions } from "@/lib/rawg";
import { ALL_FILTER_CONSOLES } from "@/lib/rawg";

const VALID_PLATFORM_IDS = new Set<string>(ALL_FILTER_CONSOLES.map((c) => c.id));

export interface FilterSearchParams {
  platform?: string;
  genre?: string;
  genres?: string;
  tags?: string;
  sort?: string;
  page?: string;
}

function parseList(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export interface FilterParamsOptions {
  /** If set, only these platform IDs are allowed (e.g. from admin-enabled consoles). */
  allowedPlatformIds?: string[];
}

/** Build RAWG GamesListOptions from URL search params. */
export function filterParamsToOptions(
  params: FilterSearchParams,
  options?: FilterParamsOptions
): GamesListOptions & { page?: number } {
  const genreList = parseList(params.genre ?? params.genres);
  let platformList = parseList(params.platform).filter((p) => VALID_PLATFORM_IDS.has(p));
  if (options?.allowedPlatformIds?.length) {
    const allowed = new Set(options.allowedPlatformIds);
    platformList = platformList.filter((p) => allowed.has(p));
  }
  const platforms =
    platformList.length > 0
      ? platformList.join(",")
      : options?.allowedPlatformIds?.length
        ? options.allowedPlatformIds.join(",")
        : undefined;
  const page = params.page != null ? Math.max(1, parseInt(params.page, 10) || 1) : undefined;
  return {
    ...(platforms ? { platforms } : {}),
    ...(genreList.length === 1 ? { genre: genreList[0] } : {}),
    ...(genreList.length > 1 ? { genres: genreList } : {}),
    ...(params.tags?.trim() ? { tags: params.tags.trim() } : {}),
    ...(params.sort?.trim() ? { ordering: params.sort } : {}),
    ...(page != null ? { page } : {}),
  };
}
