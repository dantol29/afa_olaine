"use client";

import { useState } from "react";

import { MatchCard, type MatchCardGame } from "./match-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type GameWithStripes = {
  game: MatchCardGame & { teamName: string };
  homeBorderStripe: string;
  awayBorderStripe: string;
};

export function GamesTabs({ upcoming, past }: { upcoming: GameWithStripes[]; past: GameWithStripes[] }) {
  const [view, setView] = useState<"upcoming" | "past">(upcoming.length > 0 ? "upcoming" : "past");
  const [team, setTeam] = useState("");
  const teams = [...new Set([...upcoming, ...past].map(({ game }) => game.teamName))].sort((a, b) => a.localeCompare(b, "lv"));

  return (
    <section aria-label="Spēļu saraksts" className="pt-6 sm:pt-8">
      <div className="mb-8 grid grid-cols-2 gap-2 sm:mb-10 sm:flex sm:flex-wrap sm:gap-3">
        <button type="button" aria-pressed={view === "upcoming"} onClick={() => setView("upcoming")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${view === "upcoming" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
          Nākamās
        </button>

        <button type="button" aria-pressed={view === "past"} onClick={() => setView("past")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${view === "past" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
          Aizvadītās
        </button>
        <div className="hidden w-fit min-w-0 max-w-full md:block md:ml-auto">
          <Select<string> value={team || "__all__"} onValueChange={(value) => setTeam(value === "__all__" ? "" : value ?? "")}>
            <SelectTrigger aria-label="Komanda" className={`min-h-12 w-auto max-w-full rounded-none px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none sm:w-auto sm:min-w-48 sm:px-7 sm:text-[22px] ${team ? "border border-white bg-white text-[#050505] hover:bg-white" : "border border-white/40 bg-[#050505] text-white hover:border-white hover:bg-[#050505]"} focus-visible:ring-2 focus-visible:ring-[#fbb040]`}>
              <SelectValue>{(value: string) => value === "__all__" ? "Komanda" : value}</SelectValue>
            </SelectTrigger>
            <SelectContent sideOffset={4} className="rounded-none border border-white/40 bg-[#121212] p-1 text-white shadow-xl">
              <SelectItem value="__all__" className="min-h-10 rounded-none font-heading text-[18px] uppercase data-highlighted:bg-white data-highlighted:text-[#050505] data-selected:text-[#fbb040] [&_svg]:text-[#fbb040]">Visas komandas</SelectItem>
              {teams.map((name) => <SelectItem key={name} value={name} className="min-h-10 rounded-none font-heading text-[18px] uppercase data-highlighted:bg-white data-highlighted:text-[#050505] data-selected:text-[#fbb040] [&_svg]:text-[#fbb040]">{name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(["upcoming", "past"] as const).map((panel) => {
        const panelGames = (panel === "upcoming" ? upcoming : past).filter(({ game }) => !team || game.teamName === team);
        return (
          <div key={`${panel}:${team}`} hidden={view !== panel} className="site-panel-enter">
            {panelGames.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
                {panelGames.map(({ game, homeBorderStripe, awayBorderStripe }) => (
                  <MatchCard key={game.id} game={game} homeBorderStripe={homeBorderStripe} awayBorderStripe={awayBorderStripe} compact />
                ))}
              </div>
            ) : (
              <p className="py-14 text-base text-white/70">
                {team ? `${team}: ${panel === "upcoming" ? "nākamās spēles šobrīd nav ieplānotas." : "aizvadītu spēļu vēl nav."}` : panel === "upcoming" ? "Nākamās spēles šobrīd nav ieplānotas." : "Aizvadītu spēļu vēl nav."}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
