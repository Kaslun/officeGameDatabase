"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { RawgGenreItem, RawgTagItem } from "@/lib/rawg";
import { ORDERING_OPTIONS, ALL_FILTER_CONSOLES } from "@/lib/rawg";
import FilterCheckbox from "@/components/FilterCheckbox";

const PLATFORM_ORDER = ALL_FILTER_CONSOLES.map((c) => c.id);
const PLATFORM_LABELS: Record<string, string> = {
  "18": "PlayStation 5",
  "7": "Nintendo Switch",
  "16": "PlayStation 4",
  "1": "Xbox One",
  "186": "Xbox Series X",
  "4": "PC",
};
const PLATFORM_ID_TO_CONSOLE: Record<string, string> = Object.fromEntries(
  ALL_FILTER_CONSOLES.map((c) => [c.id, c.name])
);

function parseList(value: string | null): string[] {
  if (!value?.trim()) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function setParam(params: URLSearchParams, key: string, value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    if (value.length === 0) params.delete(key);
    else params.set(key, value.join(","));
  } else {
    if (value == null || value === "") params.delete(key);
    else params.set(key, value);
  }
}

interface FilterSidebarProps {
  genres: RawgGenreItem[];
  tags?: RawgTagItem[];
  basePath?: string;
  /** Console names to show in the Platforms filter (e.g. from admin config). If empty/undefined, all are shown. */
  enabledConsoles?: string[];
}

export default function FilterSidebar({
  genres,
  tags = [],
  basePath = "/",
  enabledConsoles = [],
}: FilterSidebarProps) {
  const platformsToShow =
    enabledConsoles.length > 0
      ? PLATFORM_ORDER.filter((id) => enabledConsoles.includes(PLATFORM_ID_TO_CONSOLE[id]))
      : [...PLATFORM_ORDER];
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedPlatforms = parseList(searchParams?.get("platform") ?? "");
  const selectedGenres = parseList(searchParams?.get("genre") ?? "");
  const selectedTagIds = parseList(searchParams?.get("tags") ?? "").map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n));
  const sort = searchParams?.get("sort") ?? "";

  const updateUrl = useCallback(
    (updates: Record<string, string | string[] | undefined>) => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [key, value] of Object.entries(updates)) {
        setParam(params, key, value);
      }
      params.delete("page");
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [searchParams, router, basePath]
  );

  const togglePlatform = useCallback(
    (id: string) => {
      const next = selectedPlatforms.includes(id)
        ? selectedPlatforms.filter((p) => p !== id)
        : [...selectedPlatforms, id];
      updateUrl({ platform: next.length > 0 ? next : undefined });
    },
    [selectedPlatforms, updateUrl]
  );

  const toggleGenre = useCallback(
    (slug: string) => {
      const next = selectedGenres.includes(slug)
        ? selectedGenres.filter((s) => s !== slug)
        : [...selectedGenres, slug];
      updateUrl({ genre: next.length > 0 ? next : undefined });
    },
    [selectedGenres, updateUrl]
  );

  const toggleTag = useCallback(
    (id: number) => {
      const next = selectedTagIds.includes(id)
        ? selectedTagIds.filter((t) => t !== id)
        : [...selectedTagIds, id];
      updateUrl({ tags: next.length > 0 ? next.map(String) : undefined });
    },
    [selectedTagIds, updateUrl]
  );

  const clearFilters = useCallback(() => {
    router.push(basePath);
  }, [router, basePath]);

  const hasFilters = selectedPlatforms.length > 0 || selectedGenres.length > 0 || selectedTagIds.length > 0 || sort;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filterPanel = (
    <div className="space-y-6">
          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Categories</h3>
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {genres.map((g) => (
                <li key={g.id}>
                  <FilterCheckbox
                    checked={selectedGenres.includes(g.slug)}
                    onChange={() => toggleGenre(g.slug)}
                  >
                    {g.name}
                  </FilterCheckbox>
                </li>
              ))}
            </ul>
          </div>

          {/* Platforms */}
          {platformsToShow.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold text-white">Platforms</h3>
            <ul className="space-y-2">
              {platformsToShow.map((id) => (
                <li key={id}>
                  <FilterCheckbox
                    checked={selectedPlatforms.includes(id)}
                    onChange={() => togglePlatform(id)}
                  >
                    {PLATFORM_LABELS[id] ?? id}
                  </FilterCheckbox>
                </li>
              ))}
            </ul>
          </div>
          )}

          {/* Tags (optional) */}
          {tags.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-white">Tags</h3>
              <ul className="max-h-40 space-y-2 overflow-y-auto">
                {tags.slice(0, 40).map((t) => (
                  <li key={t.id}>
                    <FilterCheckbox
                      checked={selectedTagIds.includes(t.id)}
                      onChange={() => toggleTag(t.id)}
                    >
                      {t.name}
                    </FilterCheckbox>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sort */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-white">Sort by</h3>
            <select
              value={sort}
              onChange={(e) => updateUrl({ sort: e.target.value || undefined })}
              className="w-full rounded-xl border border-zinc-600 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-attensi focus:outline-none focus:ring-2 focus:ring-attensi/50"
            >
              <option value="">Release date (newest)</option>
              {ORDERING_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
  );

  return (
    <aside className="w-full shrink-0 lg:w-64">
      {/* Mobile: toggle button + collapsible panel (doesn't take whole screen) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-left text-sm font-medium text-white"
        >
          <span>Filters{hasFilters ? ` (${selectedPlatforms.length + selectedGenres.length + selectedTagIds.length + (sort ? 1 : 0)} active)` : ""}</span>
          <svg
            className={`h-5 w-5 shrink-0 text-zinc-400 transition-transform ${mobileFiltersOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileFiltersOpen && (
          <div className="mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Filters</h2>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-attensi hover:text-attensi/80"
                >
                  Clear all
                </button>
              )}
            </div>
            {filterPanel}
          </div>
        )}
      </div>

      {/* Desktop: always-visible sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-8 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-800/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Filters</h2>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-medium text-attensi hover:text-attensi/80"
              >
                Clear all
              </button>
            )}
          </div>
          {filterPanel}
        </div>
      </div>
    </aside>
  );
}
