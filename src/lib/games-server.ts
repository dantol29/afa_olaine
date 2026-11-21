import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { events as eventsTable, games as gamesTable, teams as teamsTable } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { resolveClubLogos } from "@/lib/club-logos";
import { colorFor, initialsFor, MONTHS, type Team, type UpcomingGame } from "@/lib/games";
import type { ScheduleEvent } from "@/lib/schedule";
import { getLeagueSourceMetadata, leagueLogoForGame } from "@/lib/league-source-metadata";

function teamDisplay(name: string, logo: string | null): Team {
  return logo ? { name, logo } : { name, initials: initialsFor(name), color: colorFor(name) };
}

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
        home: teamDisplay(row.homeTeam, logos.get(row.homeTeam) ?? null),
        away: teamDisplay(row.awayTeam, logos.get(row.awayTeam) ?? null),
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
        endTime: eventsTable.endTime,
        location: eventsTable.location,
        teamId: eventsTable.teamId,
        teamName: teamsTable.name,
        teamSort: teamsTable.sort,
      })
      .from(eventsTable)
      .leftJoin(teamsTable, eq(eventsTable.teamId, teamsTable.id))
      .orderBy(eventsTable.date, eventsTable.startTime, eventsTable.id);

    return rows.map((row) => {
      const [year, month, day] = row.date.split("-").map(Number);
      // A left join gives a team id together with its name and order, or none of them.
      const team = row.teamId !== null && row.teamName !== null && row.teamSort !== null
        ? { id: row.teamId, name: row.teamName, sort: row.teamSort }
        : null;
      return {
        id: row.id,
        title: row.title,
        day: String(day).padStart(2, "0"),
        month: MONTHS[month - 1] ?? "",
        year: String(year),
        rawDate: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        location: row.location,
        team,
        isPast: row.date < todayKey,
      };
    });
  } catch {
    return [];
  }
});
