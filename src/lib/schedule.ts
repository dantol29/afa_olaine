// Pure rules for the public lists that show games and events together (the homepage block and /speles), shared by
// server pages and client components. Events are what is neither a game nor a training: tournament days, trips,
// club gatherings. An event without a team concerns the whole club.
import { teamOptionsInOrder } from "@/lib/ordering";

type ScheduleTeam = { id: number; name: string; sort: number };

export type ScheduleEvent = {
  id: number;
  title: string;
  day: string;
  month: string;
  year: string;
  /** "YYYY-MM-DD" */
  rawDate: string;
  /** Last day of a multi-day event; null for one day. */
  rawEndDate: string | null;
  startTime: string;
  endTime: string;
  location: string;
  /** null for a club-wide event. */
  team: ScheduleTeam | null;
  isPast: boolean;
};

/** The game fields these rules read; the rest of the game is carried through for its card. */
export type ScheduleGameFields = {
  id: number;
  rawDate: string;
  time: string;
  teamId: number;
  teamName: string;
  teamSort: number;
  isMainTeam: boolean;
  isPast: boolean;
};

export type ScheduleEntry<Game extends ScheduleGameFields> =
  | { kind: "game"; key: string; game: Game }
  | { kind: "event"; key: string; event: ScheduleEvent };

function entryDate(entry: ScheduleEntry<ScheduleGameFields>): string {
  return entry.kind === "game" ? entry.game.rawDate : entry.event.rawDate;
}

function entryTime(entry: ScheduleEntry<ScheduleGameFields>): string {
  return entry.kind === "game" ? entry.game.time : entry.event.startTime;
}

function entryIsPast(entry: ScheduleEntry<ScheduleGameFields>): boolean {
  return entry.kind === "game" ? entry.game.isPast : entry.event.isPast;
}

/** Games and events in one chronological list: by date and start time; at the same start a game comes first. */
export function buildSchedule<Game extends ScheduleGameFields>(games: readonly Game[], events: readonly ScheduleEvent[]): ScheduleEntry<Game>[] {
  const entries: ScheduleEntry<Game>[] = [
    ...games.map((game) => ({ kind: "game" as const, key: `game-${game.id}`, game })),
    ...events.map((event) => ({ kind: "event" as const, key: `event-${event.id}`, event })),
  ];
  // Dates are YYYY-MM-DD and times HH:MM, so text order is chronological. The sort is stable, so equal entries
  // keep the input order (games first, each list already ordered by id).
  return entries.sort((a, b) =>
    entryDate(a).localeCompare(entryDate(b)) ||
    entryTime(a).localeCompare(entryTime(b)) ||
    Number(a.kind === "event") - Number(b.kind === "event"),
  );
}

/** Upcoming entries nearest first, past entries latest first. */
export function splitSchedule<Game extends ScheduleGameFields>(entries: readonly ScheduleEntry<Game>[]) {
  return {
    upcoming: entries.filter((entry) => !entryIsPast(entry)),
    past: entries.filter(entryIsPast).reverse(),
  };
}

/** A team's games and events; club-wide events stay visible under every team. No team (null) keeps everything. */
export function filterScheduleByTeam<Game extends ScheduleGameFields>(entries: readonly ScheduleEntry<Game>[], teamId: number | null): ScheduleEntry<Game>[] {
  if (teamId === null) return [...entries];
  return entries.filter((entry) =>
    entry.kind === "game" ? entry.game.teamId === teamId : entry.event.team === null || entry.event.team.id === teamId,
  );
}

/** Every team that has a game or an event, in the admin team order. */
export function scheduleTeamOptions(entries: readonly ScheduleEntry<ScheduleGameFields>[]): { id: number; name: string }[] {
  return teamOptionsInOrder(entries.flatMap((entry) => {
    if (entry.kind === "game") return [{ id: entry.game.teamId, name: entry.game.teamName, sort: entry.game.teamSort }];
    return entry.event.team ? [entry.event.team] : [];
  }));
}

/** The homepage block: the main team's next game always comes first, then the nearest other games and events. */
export function pickHomeEntries<Game extends ScheduleGameFields>(upcoming: readonly ScheduleEntry<Game>[], count: number): ScheduleEntry<Game>[] {
  const mainGame = upcoming.find((entry) => entry.kind === "game" && entry.game.isMainTeam);
  if (!mainGame) return upcoming.slice(0, count);
  return [mainGame, ...upcoming.filter((entry) => entry !== mainGame).slice(0, count - 1)];
}
