"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabase, type GameRequest, type StatusOption } from "@/lib/supabase";
import { getVoterId, hasUpvoted, markUpvoted, unmarkUpvoted } from "@/lib/upvote";

const STATUS_COLORS: Record<StatusOption, string> = {
  Pending: "bg-amber-500/90 text-black",
  Approved: "bg-emerald-500/90 text-black",
  Rejected: "bg-red-500/90 text-black",
};

interface RequestCardProps {
  request: GameRequest;
  onRefresh: () => void;
  onToast: (message: string, type: "success" | "error" | "info") => void;
}

export default function RequestCard({ request, onToast }: RequestCardProps) {
  const [upvotes, setUpvotes] = useState(request.upvotes ?? 0);
  const [upvoting, setUpvoting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(() => hasUpvoted(request.id));

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (upvoting) return;
    setUpvoting(true);
    const voterId = getVoterId();
    const client = getSupabase();
    try {
      if (alreadyVoted) {
        const { data, error } = await client.rpc("remove_upvote", {
          p_request_id: request.id,
          p_voter_id: voterId,
        });
        if (error) throw error;
        const result = data as { success?: boolean; new_count?: number } | null;
        if (result?.success) {
          unmarkUpvoted(request.id);
          setAlreadyVoted(false);
          if (typeof result.new_count === "number") setUpvotes(result.new_count);
        } else if (typeof result?.new_count === "number") {
          setUpvotes(result.new_count);
        }
      } else {
        const { data, error } = await client.rpc("upvote_request", {
          p_request_id: request.id,
          p_voter_id: voterId,
        });
        if (error) throw error;
        const result = data as { success?: boolean; already_voted?: boolean; new_count?: number } | null;
        if (result?.already_voted) {
          setAlreadyVoted(true);
          markUpvoted(request.id);
          if (typeof result.new_count === "number") setUpvotes(result.new_count);
          onToast("You already upvoted this request.", "info");
        } else if (result?.success && typeof result.new_count === "number") {
          setAlreadyVoted(true);
          markUpvoted(request.id);
          setUpvotes(result.new_count);
        } else {
          setUpvotes(request.upvotes ?? 0);
        }
      }
    } catch {
      onToast(alreadyVoted ? "Could not remove upvote. Try again." : "Upvote failed. Try again.", "error");
    } finally {
      setUpvoting(false);
    }
  }

  const cardContent = (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800/50 transition duration-200 hover:scale-[1.02] hover:border-zinc-600 hover:shadow-xl hover:shadow-black/20">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900">
        {request.game_image ? (
          <Image
            src={request.game_image}
            alt={request.game_title}
            fill
            className="object-cover transition duration-200 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-zinc-600">🎮</div>
        )}
        <div className="absolute left-2 top-2 right-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[request.status]}`}>
            {request.status}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 font-semibold text-white">{request.game_title}</h3>
          <button
            type="button"
            onClick={handleUpvote}
            disabled={upvoting}
            className={`shrink-0 flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-medium transition disabled:opacity-50 ${
              alreadyVoted
                ? "border-emerald-600/50 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 hover:border-emerald-500"
                : "border-zinc-600 bg-zinc-800/80 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 hover:text-white"
            }`}
            title={alreadyVoted ? "Remove upvote" : "Upvote"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.125c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777Z" />
            </svg>
            <span>{upvotes}</span>
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-400">{request.console}</p>
        {request.status === "Approved" && request.available && (
          <p className="mt-1 text-xs text-emerald-400">✓ Available</p>
        )}
        {request.status === "Rejected" && request.rejection_reason && (
          <p className="mt-1 line-clamp-1 text-xs text-red-400">{request.rejection_reason}</p>
        )}
      </div>
    </div>
  );

  if (request.rawg_id) {
    return (
      <Link href={`/game/${request.rawg_id}`} prefetch={false} className="block h-full">
        {cardContent}
      </Link>
    );
  }
  return cardContent;
}
