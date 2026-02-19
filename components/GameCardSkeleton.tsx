export default function GameCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 animate-pulse">
      <div className="aspect-[3/4] w-full bg-zinc-700" />
      <div className="p-3">
        <div className="h-5 w-3/4 rounded bg-zinc-700" />
        <div className="mt-2 h-4 w-1/2 rounded bg-zinc-700" />
      </div>
    </div>
  );
}
