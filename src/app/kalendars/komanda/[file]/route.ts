import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { eventTeams, games, teams, trainingTeams } from "@/db/schema";
import { getScheduleForRange } from "@/lib/calendar";
import { buildIcal } from "@/lib/ical";
import { getSiteUrl } from "@/lib/site-url";
import { TEAM_CALENDAR_FILE } from "@/lib/team-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Past items stay for a month, so a calendar app keeps the recent ones it already shows… */
const PAST_DAYS = 30;
/** …and the feed reaches a year ahead. */
const FUTURE_DAYS = 365;
/** Calendar apps poll on their own schedule; a short shared cache keeps many parents' phones off the database. */
const CACHE_SECONDS = 900;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** `/kalendars/komanda/<team id>.ics`: the team's trainings, games and events as a calendar
 *  feed. Only what the public site already shows: no notes, scores or players. */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = TEAM_CALENDAR_FILE.exec((await params).file);
  const teamId = match ? Number(match[1]) : NaN;
  if (!Number.isSafeInteger(teamId)) return new NextResponse("Not found", { status: 404 });

  try {
    const [team] = await db.select({ name: teams.name }).from(teams).where(eq(teams.id, teamId));
    if (!team) return new NextResponse("Not found", { status: 404 });

    const now = new Date();
    const [schedule, trainingRows, gameRows, eventRows] = await Promise.all([
      getScheduleForRange(new Date(now.getTime() - PAST_DAYS * MS_PER_DAY), new Date(now.getTime() + FUTURE_DAYS * MS_PER_DAY)),
      db.select({ id: trainingTeams.trainingId }).from(trainingTeams).where(eq(trainingTeams.teamId, teamId)),
      db.select({ id: games.id }).from(games).where(eq(games.teamId, teamId)),
      // Only the team's own events: an event without teams (a town event that takes a place, say) is in no team's feed.
      db.select({ id: eventTeams.eventId }).from(eventTeams).where(eq(eventTeams.teamId, teamId)),
    ]);
    // The schedule's uids are "training-<id>", "game-<id>" and "event-<id>".
    const teamUids = new Set([
      ...trainingRows.map((row) => `training-${row.id}`),
      ...gameRows.map((row) => `game-${row.id}`),
      ...eventRows.map((row) => `event-${row.id}`),
    ]);
    const siteUrl = getSiteUrl();

    const body = buildIcal({
      name: `AFA Olaine ${team.name}`,
      domain: new URL(siteUrl).hostname,
      now,
      items: schedule
        .filter((item) => teamUids.has(item.uid))
        .map((item) => ({ uid: item.uid, title: item.title, location: item.location, start: item.start, end: item.end })),
    });
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="afa-olaine-${teamId}.ics"`,
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error("Team calendar failed", error);
    return new NextResponse("Unable to load calendar", { status: 503 });
  }
}
