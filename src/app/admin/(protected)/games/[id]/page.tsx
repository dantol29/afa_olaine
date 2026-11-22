import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { sortTeams } from "@/lib/ordering";
import { games, teams } from "@/db/schema";
import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";
import { copySourceId } from "@/lib/admin-copy";
import { getClubHints, getLeagueHints, getLeagueLogoHints, getLocationHints } from "@/lib/admin-form-hints";
import type { SearchParamValue } from "@/lib/url-state";

import { GameForm } from "./game-form";

async function findGame(gameId: number) {
  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  return game;
}

export default async function AdminGameFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [teamRows, clubs, locations, leagues, leagueLogos] = await Promise.all([
    db.select().from(teams),
    getClubHints(),
    getLocationHints(),
    getLeagueHints(),
    getLeagueLogoHints(),
  ]);
  const teamOptions = sortTeams(teamRows);
  const hints = { clubs, locations, leagues, leagueLogos };

  let game = null;
  let copyOf = undefined;
  if (id === "new") {
    // `?kopija=<id>` fills the new-game form from that game, without its score; saving creates a manual game.
    const sourceId = copySourceId(query);
    const source = sourceId === null ? undefined : await findGame(sourceId);
    copyOf = source && { ...source, homeScore: null, awayScore: null };
  } else {
    game = await findGame(Number(id));
    if (!game) notFound();
  }

  let events: CalendarEvent[] = [];
  try {
    events = await getScheduleForWeekBrowsing();
  } catch {
    events = [];
  }

  return (
    <div>
      {game ? (
        <GameForm mode="edit" gameId={game.id} game={game} teamOptions={teamOptions} hints={hints} />
      ) : (
        <GameForm mode="create" teamOptions={teamOptions} copyOf={copyOf} hints={hints} />
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-club-navy">
          Esošais grafiks (lai zinātu, kas jau ir aizņemts)
        </h2>
        <WeekCalendar events={events} />
      </div>
    </div>
  );
}
