import GameCardSkeleton from "@/components/GameCardSkeleton";

export default function SearchLoading() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-zinc-700" />
        <div className="game-grid">
          {Array.from({ length: 10 }).map((_, i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </main>
  );
}
