import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events as eventsTable, games as gamesTable, teams as teamsTable } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { resolveClubLogos } from "@/lib/club-logos";
import { getTeamsByEvent } from "@/lib/event-teams";
import { clubDisplay, MONTHS, type UpcomingGame } from "@/lib/games";
import type { ScheduleEvent } from "@/lib/schedule";
import { leagueLogoForGame } from "@/lib/league-logo";
import { getLeagueSourceMetadata } from "@/lib/league-source-metadata";

const WEEKDAY_ABBR: Record<string, string> = {
  pirmdiena: "PIRMD.",
  otrdiena: "OTRD.",
  trešdiena: "TREŠD.",
  ceturtdiena: "CETURTD.",
  piektdiena: "PIEKTD.",
  sestdiena: "SESTD.",
  svētdiena: "SVĒTD.",
};

function weekdayAbbrFor(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const weekday = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    weekday: "long",
  })
    .format(noonUtc)
    .toLowerCase();
  return WEEKDAY_ABBR[weekday] ?? "";
}

export type GameListItem = UpcomingGame & {
  /** Which of the club's own teams plays this fixture (e.g. "U14", "Sieviešu 1"). */
  teamName: string;
  teamId: number;
  /** The team's admin display order, for ordering the team filter. */
  teamSort: number;
  /** The main (senior) team's game: the homepage always shows its next one first. */
  isMainTeam: boolean;
  /** "YYYY-MM-DD" — used for calendar-grid placement. */
  rawDate: string;
  isPast: boolean;
  homeScore: number | null;
  awayScore: number | null;
};

/** Every game on file — upcoming and past — for the public /speles listing.
 *  Server-only: never import this from a "use client" component. */
export const getAllGamesFromDb = cache(async function getAllGamesFromDb(): Promise<GameListItem[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select({
        id: gamesTable.id,
        teamId: gamesTable.teamId,
        homeTeam: gamesTable.homeTeam,
      awayTeam: gamesTable.awayTeam,
      homeScore: gamesTable.homeScore,
      awayScore: gamesTable.awayScore,
        date: gamesTable.date,
        startTime: gamesTable.startTime,
        location: gamesTable.location,
        league: gamesTable.league,
        teamName: teamsTable.name,
        teamSort: teamsTable.sort,
        isMainTeam: teamsTable.isMain,
      })
      .from(gamesTable)
      .innerJoin(teamsTable, eq(gamesTable.teamId, teamsTable.id))
      .orderBy(gamesTable.date, gamesTable.startTime, gamesTable.id);

    const [logos, sources] = await Promise.all([resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam])), getLeagueSourceMetadata()]);

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        id: row.id,
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        weekday: weekdayAbbrFor(row.date),
        time: row.startTime,
        league: row.league ?? "Draudzības spēle",
        leagueLogoUrl: leagueLogoForGame(sources, row.teamId, row.league),
        home: clubDisplay(row.homeTeam, logos.get(row.homeTeam) ?? null),
        away: clubDisplay(row.awayTeam, logos.get(row.awayTeam) ?? null),
        venue: row.location,
        teamName: row.teamName,
        teamId: row.teamId,
        teamSort: row.teamSort,
        isMainTeam: row.isMainTeam,
        rawDate: row.date,
        isPast: row.date < todayKey,
        homeScore: row.homeScore,
        awayScore: row.awayScore,
      };
    });
  } catch {
    return [];
  }
});

/** Every event on file — upcoming and past — for the public game lists. The admin's private notes are not read.
 *  Server-only: never import this from a "use client" component. */
export const getAllEventsFromDb = cache(async function getAllEventsFromDb(): Promise<ScheduleEvent[]> {
  try {
    const todayKey = toDateKey(new Date());
    const rows = await db
      .select({
        id: eventsTable.id,
        title: eventsTable.title,
        date: eventsTable.date,
        startTime: eventsTable.startTime,
        endDate: eventsTable.endDate,
        endTime: eventsTable.endTime,
        location: eventsTable.location,
      })
      .from(eventsTable)
      .orderBy(eventsTable.date, eventsTable.startTime, eventsTable.id);
    const teamsByEvent = await getTeamsByEvent();

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      return {
        id: row.id,
        title: row.title,
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        rawDate: row.date,
        rawEndDate: row.endDate,
        startTime: row.startTime,
        endTime: row.endTime,
        location: row.location,
        teams: teamsByEvent.get(row.id) ?? [],
        // A multi-day event is current until its last day is over.
        isPast: (row.endDate ?? row.date) < todayKey,
      };
    });
  } catch {
    return [];
  }
});
