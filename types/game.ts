import type { ToastItem } from "@/components/Toast";
import type { RawgGameDetail, RawgGameListItem } from "@/lib/rawg";
import type { GameRequest } from "@/lib/supabase";

export interface GameDetailViewProps {
  game: RawgGameDetail;
  description: string;
  platformConsoles: string[];
  hasPlatforms: boolean;
  requests: GameRequest[];
  loading: boolean;
  refetchRequests: () => void;
  supportedConsoles: string[];
  selectedConsole: string;
  onConsoleChange: (console: string) => void;
  onRequestSubmit: () => void;
  submitting: boolean;
  onToast: (message: string, type: "success" | "error" | "info") => void;
  toasts: ToastItem[];
  onDismissToast: (id: string) => void;
  relatedGames: RawgGameListItem[];
  relatedLoading: boolean;
  /** DLC, season passes, expansions (shown for info only; not requestable). */
  additions?: RawgGameListItem[];
  /** Admin-enabled console names; only these shown on related game cards. */
  enabledConsoles?: string[];
}
