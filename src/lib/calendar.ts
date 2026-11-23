import { and, eq, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { events, games, teams, trainings } from "@/db/schema";
import { resolveClubLogos } from "@/lib/club-logos";
import { rigaWallClockToUtc } from "@/lib/riga-time";
import { compareByStart } from "@/lib/ordering";
import { eventPath } from "@/lib/event-path";
import { getTeamsByEvent } from "@/lib/event-teams";
import { getTeamNamesByTraining } from "@/lib/training-teams";

export type CalendarEvent = {
  uid: string;
  title: string;
  location: string | null;
  allDay: boolean;
  start: Date;
  end: Date;
  /** Riga-local calendar date, e.g. "2026-09-07" — timezone-safe grouping key. */
  dateKey: string;
  weekdayLabel: string;
  dateLabel: string;
  timeLabel: string | null;
  dayLabel: string;
  monthLabel: string;
  /** What kind of event this is, for at-a-glance color/icon coding. */
  eventType: "game" | "training" | "other";
  /** Which of the club's own teams this belongs to, for the calendar's team
   *  filter. Null for general, not-team-specific events. */
  team: string | null;
  /** Only set for eventType "game" — the two sides' names and resolved
   *  logo images (or null if no logo is on file for that side). */
  homeTeam?: string;
  awayTeam?: string;
  homeLogo?: string | null;
  awayLogo?: string | null;
  /** Only for an event (eventType "other"): its own public page. */
  href?: string;
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatLabels(start: Date, allDay: boolean) {
  const weekdayLabel = capitalize(
    new Intl.DateTimeFormat("lv-LV", {
      timeZone: "Europe/Riga",
      weekday: "long",
    }).format(start),
  );
  const dateLabel = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(start);
  const timeLabel = allDay
    ? null
    : new Intl.DateTimeFormat("lv-LV", {
        timeZone: "Europe/Riga",
        hour: "2-digit",
        minute: "2-digit",
      }).format(start);
  const dayLabel = new Intl.DateTimeFormat("lv-LV", {
    timeZone: "Europe/Riga",
    day: "2-digit",
  }).format(start);
  const monthLabel = capitalize(
    new Intl.DateTimeFormat("lv-LV", {
      timeZone: "Europe/Riga",
      month: "short",
    }).format(start),
  ).replace(".", "");
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(start);

  return {
    weekdayLabel,
    dateLabel,
    timeLabel,
    dayLabel,
    monthLabel,
    dateKey,
  };
}

export function toDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function timeToParts(time: string): [number, number] {
  const [hour, minute] = time.split(":").map(Number);
  return [hour, minute];
}

function dateKeyToParts(dateKey: string): [number, number, number] {
  const [year, month, day] = dateKey.split("-").map(Number);
  return [year, month, day];
}


async function getAdminTrainingEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: trainings.id,
      date: trainings.date,
      startTime: trainings.startTime,
      endTime: trainings.endTime,
      location: trainings.location,
    })
    .from(trainings)
    .where(and(gte(trainings.date, afterKey), lte(trainings.date, beforeKey)));
  const teamNamesByTraining = await getTeamNamesByTraining();

  return rows.flatMap((row) => {
    const teamName = teamNamesByTraining.get(row.id);
    if (!teamName) return [];

    const [year, month, day] = dateKeyToParts(row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime));

    return [{
      uid: `training-${row.id}`,
      title: `${teamName} treniņš`,
      location: row.location,
      allDay: false,
      start,
      end,
      eventType: "training" as const,
      team: teamName,
      ...formatLabels(start, false),
    }];
  });
}

async function getAdminEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      date: events.date,
      startTime: events.startTime,
      endDate: events.endDate,
      endTime: events.endTime,
      location: events.location,
    })
    .from(events)
    // A multi-day event counts on every day it covers, so one that started earlier still shows.
    .where(and(lte(events.date, beforeKey), gte(sql`coalesce(${events.endDate}, ${events.date})`, afterKey)));
  const teamsByEvent = await getTeamsByEvent();

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const [endYear, endMonth, endDay] = dateKeyToParts(row.endDate ?? row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(endYear, endMonth, endDay, ...timeToParts(row.endTime));

    return {
      uid: `event-${row.id}`,
      title: row.title,
      location: row.location,
      allDay: false,
      start,
      end,
      eventType: "other",
      // Several teams read "A, B", as a training of several teams does; none is a club-wide event.
      team: teamsByEvent.get(row.id)?.map((team) => team.name).join(", ") || null,
      href: eventPath(row.id, row.title),
      ...formatLabels(start, false),
    };
  });
}

async function getAdminGameEvents(after: Date, before: Date): Promise<CalendarEvent[]> {
  const afterKey = toDateKey(after);
  const beforeKey = toDateKey(before);

  const rows = await db
    .select({
      id: games.id,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      date: games.date,
      startTime: games.startTime,
      endTime: games.endTime,
      location: games.location,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teams, eq(games.teamId, teams.id))
    .where(and(gte(games.date, afterKey), lte(games.date, beforeKey)));

  const logos = await resolveClubLogos(rows.flatMap((row) => [row.homeTeam, row.awayTeam]));

  return rows.map((row) => {
    const [year, month, day] = dateKeyToParts(row.date);
    const start = rigaWallClockToUtc(year, month, day, ...timeToParts(row.startTime));
    const end = rigaWallClockToUtc(year, month, day, ...timeToParts(row.endTime));

    return {
      uid: `game-${row.id}`,
      title: `${row.homeTeam} – ${row.awayTeam}`,
      location: row.location,
      allDay: false,
      start,
      end,
      eventType: "game",
      team: row.teamName,
      homeTeam: row.homeTeam,
      awayTeam: row.awayTeam,
      homeLogo: logos.get(row.homeTeam) ?? null,
      awayLogo: logos.get(row.awayTeam) ?? null,
      ...formatLabels(start, false),
    };
  });
}

/**
 * Wide enough window for client-side week-by-week navigation without
 * regenerating on every "prev/next week" click.
 */
function weekBrowsingWindow() {
  const now = new Date();
  const after = new Date(now);
  after.setMonth(after.getMonth() - 2);
  const before = new Date(now);
  before.setMonth(before.getMonth() + 6);
  return { after, before };
}

/** Merges AFA Olaine's admin-managed trainings, events, and games for the
 *  week-browsing calendar widget. */
export async function getScheduleForWeekBrowsing(): Promise<CalendarEvent[]> {
  const { after, before } = weekBrowsingWindow();
  return getScheduleForRange(after, before);
}

export async function getScheduleForRange(after: Date, before: Date): Promise<CalendarEvent[]> {
  const [trainingEvents, otherEvents, gameEvents] = await Promise.all([
    getAdminTrainingEvents(after, before),
    getAdminEvents(after, before),
    getAdminGameEvents(after, before),
  ]);

  // Stable sort: items with the same start stay in training, other, game order.
  return [...trainingEvents, ...otherEvents, ...gameEvents].sort(compareByStart);
}
