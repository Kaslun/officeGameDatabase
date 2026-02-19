import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { fetchGame, fetchGameAdditions, ALL_FILTER_CONSOLES } from "@/lib/rawg";
import GameDetailClient from "@/components/GameDetailClient";
import { getEnabledConsoles } from "@/lib/config";

const getCachedEnabledConsoles = unstable_cache(getEnabledConsoles, ["enabled-consoles"], { revalidate: 60 });

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GamePageProps) {
  const { id } = await params;
  try {
    const game = await fetchGame(id);
    return { title: `${game.name} | Attensi Game Hub` };
  } catch {
    return { title: "Attensi Game Hub" };
  }
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params;
  let game: Awaited<ReturnType<typeof fetchGame>> | null = null;
  try {
    game = await fetchGame(id);
  } catch {
    notFound();
  }

  if (!game) notFound();

  const [enabledConsoles, additions] = await Promise.all([
    getCachedEnabledConsoles(),
    fetchGameAdditions(id).catch(() => []),
  ]);
  const nameToId = new Map<string, string>(ALL_FILTER_CONSOLES.map((c) => [c.name, c.id]));
  const enabledPlatforms =
    enabledConsoles.length > 0
      ? (enabledConsoles.map((c) => nameToId.get(c)).filter(Boolean) as string[]).join(",")
      : undefined;

  return (
    <main className="min-h-screen py-8">
      <GameDetailClient
        game={game}
        enabledPlatforms={enabledPlatforms}
        enabledConsoles={enabledConsoles}
        additions={additions}
      />
    </main>
  );
}
