import "server-only";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clubLogoNames, clubLogos, events, games, leagueSources, trainings } from "@/db/schema";
import type { ClubHint, LeagueLogoHint } from "@/lib/admin-preview";
import { pinFirst, rankByFrequency, rankByRecency } from "@/lib/admin-suggestions";
import { isOlaine } from "@/lib/games";
import { getLogoBorderStripe } from "@/lib/logo-color";

// What the admin forms suggest and preview with. The lists are small (tens of values), so each form gets them whole.

/** Every club name seen in games or on a club logo, the club's own names first, then the most played. */
export async function getClubHints(): Promise<ClubHint[]> {
  const [gameRows, logoRows] = await Promise.all([
    db.select({ homeTeam: games.homeTeam, awayTeam: games.awayTeam }).from(games),
    db.select({ name: clubLogoNames.name, logoUrl: clubLogos.logoUrl }).from(clubLogoNames).innerJoin(clubLogos, eq(clubLogoNames.clubLogoId, clubLogos.id)),
  ]);
  const logoByName = new Map(logoRows.map((row) => [row.name, row.logoUrl]));
  const names = pinFirst(
    rankByFrequency(gameRows.flatMap((row) => [row.homeTeam, row.awayTeam]), logoRows.map((row) => row.name)),
    isOlaine,
  );
  return Promise.all(
    names.map(async (name) => {
      const logo = logoByName.get(name) ?? null;
      return { name, logo, stripe: await getLogoBorderStripe(logo ?? undefined) };
    }),
  );
}

/** Places of games, trainings and events, the most used first. */
export async function getLocationHints(): Promise<string[]> {
  const rows = await Promise.all([
    db.select({ location: games.location }).from(games),
    db.select({ location: trainings.location }).from(trainings),
    db.select({ location: events.location }).from(events),
  ]);
  return rankByFrequency(rows.flat().map((row) => row.location));
}

/** League names of earlier games and of the league sources, the most used first. */
export async function getLeagueHints(): Promise<string[]> {
  const [gameRows, sourceRows] = await Promise.all([
    db.select({ league: games.league }).from(games),
    db.select({ label: leagueSources.label }).from(leagueSources),
  ]);
  return rankByFrequency(gameRows.map((row) => row.league), sourceRows.map((row) => row.label));
}

/** League logos by team, for the game card preview. */
export async function getLeagueLogoHints(): Promise<LeagueLogoHint[]> {
  return db.select({ teamId: leagueSources.teamId, label: leagueSources.label, logoUrl: leagueSources.logoUrl }).from(leagueSources);
}

/** Earlier event titles, the latest event first: a series usually changes only its stage number. */
export async function getEventTitleHints(): Promise<string[]> {
  const rows = await db.select({ value: events.title, date: events.date }).from(events);
  return rankByRecency(rows);
}
