export default function GameLoading() {
  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/50">
          <div className="h-64 bg-zinc-800" />
          <div className="p-6">
            <div className="h-8 w-3/4 rounded bg-zinc-700" />
            <div className="mt-4 h-4 w-full rounded bg-zinc-700" />
            <div className="mt-2 h-4 w-full rounded bg-zinc-700" />
            <div className="mt-8 h-12 w-48 rounded-xl bg-zinc-700" />
          </div>
        </div>
      </div>
    </main>
  );
}
