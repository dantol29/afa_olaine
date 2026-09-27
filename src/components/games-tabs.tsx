"use client";

import { useState } from "react";

import { MatchCard, type MatchCardGame } from "./match-card";

type GameWithStripes = {
  game: MatchCardGame;
  homeBorderStripe: string;
  awayBorderStripe: string;
};

export function GamesTabs({ upcoming, past }: { upcoming: GameWithStripes[]; past: GameWithStripes[] }) {
  const [view, setView] = useState<"upcoming" | "past">(upcoming.length > 0 ? "upcoming" : "past");
  const visibleGames = view === "upcoming" ? upcoming : past;

  return (
    <section aria-label="Spēļu saraksts" className="pt-6 sm:pt-8">
      <div className="mb-8 grid grid-cols-2 gap-2 sm:mb-10 sm:flex sm:gap-3">
        <button type="button" aria-pressed={view === "upcoming"} onClick={() => setView("upcoming")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${view === "upcoming" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
          Nākamās
        </button>
        <button type="button" aria-pressed={view === "past"} onClick={() => setView("past")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${view === "past" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
          Aizvadītās
        </button>
      </div>

      {visibleGames.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
          {visibleGames.map(({ game, homeBorderStripe, awayBorderStripe }) => (
            <MatchCard key={game.id} game={game} homeBorderStripe={homeBorderStripe} awayBorderStripe={awayBorderStripe} compact completed={view === "past"} />
          ))}
        </div>
      ) : (
        <p className="py-14 text-base text-white/70">
          {view === "upcoming" ? "Nākamās spēles šobrīd nav ieplānotas." : "Aizvadītu spēļu vēl nav."}
        </p>
      )}
    </section>
  );
}
