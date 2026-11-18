import "server-only";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { games } from "@/db/schema";
import { backfillClubLogos } from "@/lib/club-logos";
import { scrapeFixtures, type UnrecognizedRows } from "@/lib/fixtures";
import { isOlaine } from "@/lib/games";
import { findPossibleDuplicate } from "@/lib/lff-duplicates";
import { addMinutesWithinDay } from "@/lib/time-range";

export type ReviewNeededGame = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  oldStartTime: string;
  newStartTime: string;
  oldLocation: string;
  newLocation: string;
};

/** Fetches one league source's fixtures, backfills any club logos LFF has
 *  on file, and inserts every not-yet-imported AFA Olaine fixture straight
 *  into `games` — no admin review step. This is what the scheduled cron
 *  sync calls for every league source; the manual "Ielādēt spēles" review
 *  screen has its own confirm-based flow and doesn't use this.
 *
 *  Also *detects* (never applies) drift on games that already exist: if
 *  LFF now shows a different time/venue for one than what's saved locally,
 *  it's reported back in `reviewNeeded` — same diff the "Ielādēt spēles"
 *  screen already surfaces, applied there via its own explicit button.
 *
 *  A fixture that matches a game the admin entered by hand (same teams, same
 *  date) is not inserted again. A match LFF moved to another date is still
 *  inserted: skipping it would hide the new date, so only the manual review
 *  screen warns about it. Match rows the parser could not read come back in
 *  `unrecognized`, so the cron job can flag them instead of reporting success. */
export async function syncLeagueSource(source: {
  teamId: number;
  label: string;
  url: string;
}): Promise<{ imported: number; reviewNeeded: ReviewNeededGame[]; unrecognized?: UnrecognizedRows; error?: string }> {
  let fixtures;
  let unrecognized: UnrecognizedRows;
  try {
    ({ fixtures, unrecognized } = await scrapeFixtures(source.url));
  } catch (error) {
    return { imported: 0, reviewNeeded: [], error: (error as Error).message };
  }

  const candidates = fixtures.filter(
    (fixture) => fixture.time !== null && (isOlaine(fixture.home) || isOlaine(fixture.away)),
  );
  // Only present when something was skipped, so a clean run's result stays as before.
  const unrecognizedField = unrecognized.count > 0 ? { unrecognized } : {};
  if (candidates.length === 0) {
    return {
      imported: 0,
      reviewNeeded: [],
      ...unrecognizedField,
      error: `LFF returned ${fixtures.length} fixtures, but none with a valid time matched AFA Olaine`,
    };
  }

  const scrapedLogos = new Map<string, string>();
  for (const fixture of candidates) {
    if (fixture.homeLogo) scrapedLogos.set(fixture.home, fixture.homeLogo);
    if (fixture.awayLogo) scrapedLogos.set(fixture.away, fixture.awayLogo);
  }
  await backfillClubLogos(scrapedLogos);

  const existingGames = await db
    .select({
      date: games.date,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      startTime: games.startTime,
      location: games.location,
      homeScore: games.homeScore,
      awayScore: games.awayScore,
      source: games.source,
    })
    .from(games)
    .where(eq(games.teamId, source.teamId));
  const existingByKey = new Map(
    existingGames
      .filter((g) => g.source === "lff")
      .map((g) => [`${g.date}|${g.homeTeam}|${g.awayTeam}`, g]),
  );

  const manualGames = existingGames.filter((g) => g.source === "manual");
  const newFixtures = candidates.filter(
    (fixture) =>
      !existingByKey.has(`${fixture.date}|${fixture.home}|${fixture.away}`) &&
      findPossibleDuplicate(fixture, manualGames) === undefined,
  );

  if (newFixtures.length > 0) {
    await db.insert(games).values(
      newFixtures.map((fixture) => {
        const startTime = fixture.time as string; // guaranteed by the candidates filter above
        return {
          teamId: source.teamId,
          homeTeam: fixture.home,
          awayTeam: fixture.away,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          date: fixture.date,
          startTime,
          endTime: addMinutesWithinDay(startTime, 90),
          location: fixture.stadium || "Nav norādīts",
          source: "lff" as const,
          league: source.label,
          createdAt: Date.now(),
        };
      }),
    );
  }

  const reviewNeeded: ReviewNeededGame[] = [];
  for (const fixture of candidates) {
    const existing = existingByKey.get(`${fixture.date}|${fixture.home}|${fixture.away}`);
    if (!existing) continue;
    const scoreChanged =
      fixture.played &&
      (existing.homeScore !== fixture.homeScore || existing.awayScore !== fixture.awayScore);
    if (scoreChanged) {
      await db
        .update(games)
        .set({ homeScore: fixture.homeScore, awayScore: fixture.awayScore })
        .where(
          and(
            eq(games.teamId, source.teamId),
            eq(games.source, "lff"),
            eq(games.date, fixture.date),
            eq(games.homeTeam, fixture.home),
            eq(games.awayTeam, fixture.away),
          ),
        );
    }
    const newLocation = fixture.stadium || "Nav norādīts";
    if (existing.startTime === fixture.time && existing.location === newLocation) continue;
    reviewNeeded.push({
      date: fixture.date,
      homeTeam: fixture.home,
      awayTeam: fixture.away,
      oldStartTime: existing.startTime,
      newStartTime: fixture.time as string,
      oldLocation: existing.location,
      newLocation,
    });
  }

  return { imported: newFixtures.length, reviewNeeded, ...unrecognizedField };
}
