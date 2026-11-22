"use client";

import { useState } from "react";

import { EventCard } from "./event-card";
import { MatchCard, type MatchCardGame } from "./match-card";
import { TeamFilterSelect } from "./team-filter-select";
import { filterScheduleByTeam, scheduleTeamOptions, type ScheduleEntry, type ScheduleGameFields } from "@/lib/schedule";
import { TEAM_FILTER_PARAM, parseIdParam, replaceSearchParam } from "@/lib/url-state";
import { useUrlParam } from "@/lib/use-url-param";

export type ScheduleCardGame = MatchCardGame & ScheduleGameFields & { homeBorderStripe: string; awayBorderStripe: string };
export type ScheduleCardEntry = ScheduleEntry<ScheduleCardGame>;

export function ScheduleCard({ entry, eventBorderStripe }: { entry: ScheduleCardEntry; eventBorderStripe: string }) {
  if (entry.kind === "event") return <EventCard event={entry.event} borderStripe={eventBorderStripe} />;
  const { homeBorderStripe, awayBorderStripe, ...game } = entry.game;
  return <MatchCard game={game} homeBorderStripe={homeBorderStripe} awayBorderStripe={awayBorderStripe} compact />;
}

/** Games and events of /speles. The selected team lives in the URL (`?komanda=<team id>`); `initialTeam` is the
 *  server-parsed value so a link or refresh renders the same selection without a flash. */
export function GamesTabs({ upcoming, past, initialTeam, eventBorderStripe }: { upcoming: ScheduleCardEntry[]; past: ScheduleCardEntry[]; initialTeam: string | null; eventBorderStripe: string }) {
  const [view, setView] = useState<"upcoming" | "past">(upcoming.length > 0 ? "upcoming" : "past");
  const teamOptions = scheduleTeamOptions([...upcoming, ...past]);
  const teamId = parseIdParam(useUrlParam(TEAM_FILTER_PARAM, initialTeam), teamOptions);
  const teamName = teamOptions.find((team) => team.id === teamId)?.name;

  return (
    <section aria-label="Spēļu saraksts" className="pt-6 sm:pt-8">
      <div className="mb-8 grid grid-cols-2 gap-2 sm:mb-10 sm:flex sm:flex-wrap sm:gap-3">
        <button type="button" aria-pressed={view === "upcoming"} onClick={() => setView("upcoming")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${view === "upcoming" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
          Nākamās
        </button>

        <button type="button" aria-pressed={view === "past"} onClick={() => setView("past")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${view === "past" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
          Aizvadītās
        </button>
        {teamOptions.length > 0 && (
          // On a phone the team filter takes its own row under the tabs; from sm up it sits at the right.
          <div className="col-span-2 min-w-0 sm:ml-auto sm:w-fit sm:max-w-full">
            <TeamFilterSelect teamOptions={teamOptions} teamId={teamId} onChange={(nextTeamId) => replaceSearchParam(TEAM_FILTER_PARAM, nextTeamId === null ? null : String(nextTeamId))} />
          </div>
        )}
      </div>

      {(["upcoming", "past"] as const).map((panel) => {
        const panelEntries = filterScheduleByTeam(panel === "upcoming" ? upcoming : past, teamId);
        return (
          <div key={`${panel}:${teamId}`} hidden={view !== panel} className="site-panel-enter">
            {panelEntries.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-7">
                {panelEntries.map((entry) => <ScheduleCard key={entry.key} entry={entry} eventBorderStripe={eventBorderStripe} />)}
              </div>
            ) : (
              <p className="py-14 text-base text-white/70">
                {teamName ? `${teamName}: ${panel === "upcoming" ? "nākamās spēles šobrīd nav ieplānotas." : "aizvadītu spēļu vēl nav."}` : panel === "upcoming" ? "Nākamās spēles šobrīd nav ieplānotas." : "Aizvadītu spēļu vēl nav."}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
