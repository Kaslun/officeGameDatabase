"use client";

import React from "react";
import Toast from "@/components/Toast";
import GameCard from "@/components/GameCard";
import GameRequestModule from "@/components/GameRequestModule";
import { isNotReleased } from "@/lib/rawg";
import type { GameDetailViewProps } from "@/types/game";

function formatReleaseDate(released: string | null | undefined): string | null {
  if (!released?.trim()) return null;
  const d = new Date(released);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function GameDetailView(props: GameDetailViewProps) {
  const {
    game,
    description,
    platformConsoles,
    hasPlatforms,
    requests,
    loading,
    supportedConsoles,
    selectedConsole,
    onConsoleChange,
    onRequestSubmit,
    submitting,
    onToast,
    toasts,
    onDismissToast,
    relatedGames,
    relatedLoading,
    additions,
    enabledConsoles,
  } = props;
  const sectionClassName = "mx-auto max-w-4xl px-4 pb-12 sm:px-6 lg:px-8";
  const developerNames = game.developers?.map((d) => d.name).join(", ") || null;
  const publisherNames = game.publishers?.map((p) => p.name).join(", ") || null;
  const releaseDateStr = formatReleaseDate(game.released);

  return React.createElement(
    "section",
    { className: sectionClassName },
    React.createElement(
      "div",
      { className: "overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/50" },
      React.createElement(
        "div",
        { className: "relative h-48 w-full bg-zinc-800 sm:h-64 md:h-80" },
        game.background_image &&
          React.createElement("img", {
            src: game.background_image,
            alt: "",
            className: "h-full w-full object-cover object-top",
          }),
        React.createElement("div", {
          className: "absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent",
        }),
        React.createElement(
          "div",
          { className: "absolute bottom-4 left-4 right-4" },
          React.createElement("h1", {
            className: "text-2xl font-bold text-white drop-shadow sm:text-3xl",
          }, game.name),
          developerNames &&
            React.createElement("p", { className: "mt-1 text-sm text-zinc-400 drop-shadow" }, developerNames),
          React.createElement(
            "div",
            { className: "mt-2 flex flex-wrap gap-2" },
            isNotReleased(game.released)
              ? React.createElement("span", {
                  className: "rounded bg-zinc-800/90 px-2 py-0.5 text-sm text-zinc-400",
                }, "Not released")
              : game.released &&
                React.createElement("span", {
                  className: "rounded bg-zinc-800/90 px-2 py-0.5 text-sm text-zinc-300",
                }, String(new Date(game.released).getFullYear())),
            game.rating != null &&
              React.createElement("span", {
                className: "rounded bg-attensi/90 px-2 py-0.5 text-sm font-medium text-zinc-900",
              }, "★ ", game.rating.toFixed(1))
          )
        )
      ),
      React.createElement(
        "div",
        { className: "p-6 flex flex-col sm:flex-row gap-6 sm:gap-8" },
        React.createElement(
          "div",
          { className: "min-w-0 flex-1" },
          description &&
            React.createElement("p", { className: "text-zinc-300 leading-relaxed" }, description),
          game.genres?.length
            ? React.createElement(
                "div",
                { className: "mt-4" },
                React.createElement("h3", { className: "text-sm font-medium text-zinc-500" }, "Genres"),
                React.createElement(
                  "div",
                  { className: "mt-1 flex flex-wrap gap-2" },
                  game.genres.map((g) =>
                    React.createElement(
                      "span",
                      { key: g.id, className: "rounded-full bg-zinc-700 px-3 py-1 text-sm text-zinc-300" },
                      g.name
                    )
                  )
                )
              )
            : null,
          hasPlatforms &&
            React.createElement(
              "div",
              { className: "mt-4" },
              React.createElement("h3", { className: "text-sm font-medium text-zinc-500" }, "Platforms"),
              React.createElement("p", { className: "mt-1 text-zinc-300" }, platformConsoles.join(", "))
            ),
          additions && additions.length > 0 &&
            React.createElement(
              "div",
              { className: "mt-4" },
              React.createElement("h3", { className: "text-sm font-medium text-zinc-500" }, "DLC & add-ons"),
              React.createElement("p", { className: "mt-1 text-xs text-zinc-500" }, "Part of this game — not requestable separately."),
              React.createElement(
                "ul",
                { className: "mt-2 space-y-1.5" },
                additions.map((a) =>
                  React.createElement(
                    "li",
                    { key: a.id, className: "flex items-center gap-2 text-sm text-zinc-300" },
                    a.background_image &&
                      React.createElement("img", {
                        src: a.background_image,
                        alt: "",
                        className: "h-8 w-14 shrink-0 rounded object-cover",
                      }),
                    React.createElement("span", null, a.name)
                  )
                )
              )
            )
        ),
        React.createElement(GameRequestModule, {
          loading,
          requests,
          supportedConsoles,
          selectedConsole,
          onConsoleChange,
          onRequestSubmit,
          submitting,
          developerNames,
          publisherNames,
          releaseDateStr,
        })
      )
    ),
    React.createElement(
      "div",
      { className: "mt-12 border-t border-zinc-800 pt-10" },
      React.createElement("h2", { className: "mb-4 text-lg font-semibold text-white" }, "Related games"),
      relatedLoading &&
        React.createElement("p", { className: "text-sm text-zinc-500" }, "Loading…"),
      !relatedLoading && relatedGames.length === 0 &&
        React.createElement("p", { className: "text-sm text-zinc-500" }, "No related games found."),
      !relatedLoading && relatedGames.length > 0 &&
        React.createElement(
          "div",
          { className: "game-grid" },
          relatedGames.map((g) =>
            React.createElement(GameCard, { key: g.id, game: g, enabledConsoles })
          )
        )
    ),
    React.createElement(Toast, { toasts, onDismiss: onDismissToast })
  );
}
