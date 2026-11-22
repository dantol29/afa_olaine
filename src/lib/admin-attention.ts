// The admin home "Uzmanību" summary: only what needs someone to act. Each check takes data already loaded from the
// database and returns the items to show; an empty result hides its block. Pure, so the page and the tests share it.
// Dates are "YYYY-MM-DD" (Riga), times "HH:MM", birthdates "DD.MM.GGGG.", as stored.
import { eventDatesProblem } from "@/lib/event-dates";
import { nameKey } from "@/lib/player-import";
import { isEndAfterStart } from "@/lib/time-range";
import { timesOverlap } from "@/lib/training-schedule";

/** No fully successful LFF sync for this long is worth a look. */
export const SYNC_STALE_HOURS = 48;
/** A team "usually trains" when it had a training within this many past days… */
export const TRAINING_LOOKBACK_DAYS = 28;
/** …and runs out when it has none within this many coming days. */
export const TRAINING_LOOKAHEAD_DAYS = 14;
/** Clashes are looked for this many days ahead. */
export const CLASH_DAYS = 28;
/** Opponents without a logo are looked for in games this many days ahead. */
export const LOGO_LOOKAHEAD_DAYS = 30;

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export type AttentionTeam = { id: number; name: string };
export type AttentionGame = {
  id: number;
  teamId: number;
  date: string;
  startTime: string;
  endTime: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
};
export type AttentionTraining = { id: number; date: string; startTime: string; endTime: string; teamIds: number[] };
export type AttentionEvent = { id: number; title: string; date: string; endDate?: string | null; startTime: string; endTime: string };
export type AttentionPlayer = { id: number; name: string; birthdate: string; teamIds: number[] };
export type AttentionSyncStatus = {
  job: string;
  status: string;
  lastSuccessAt: number | null;
  needsReviewCount: number;
  message: string | null;
  lastEmailError: string | null;
};

/** The date `days` after (or before, when negative) a date key. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

const gameLabel = (game: AttentionGame) => `${game.homeTeam || "?"} – ${game.awayTeam || "?"}`;

/** 1. Games already played (an earlier date) with no score. Latest first. */
export function gamesWithoutScore(games: readonly AttentionGame[], today: string): AttentionGame[] {
  return games
    .filter((game) => game.date < today && (game.homeScore === null || game.awayScore === null))
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
}

/** 2. What is wrong with the LFF sync jobs: a failed or partial run, games waiting for review, a failed notice email,
 *  or no fully successful run for too long. A job still running is judged by its last success only. */
export function syncProblems(statuses: readonly AttentionSyncStatus[], now: number): { job: string; problems: string[] }[] {
  return statuses.flatMap((status) => {
    const problems: string[] = [];
    if (status.status === "error") problems.push(`Kļūda: ${status.message ?? "bez apraksta"}`);
    if (status.status === "partial") problems.push(`Daļēji neizdevās: ${status.message ?? "bez apraksta"}`);
    if (status.needsReviewCount > 0) problems.push(`${status.needsReviewCount} spēles jāpārskata`);
    if (status.lastEmailError) problems.push(`Paziņojuma e-pasts netika nosūtīts: ${status.lastEmailError}`);
    if (status.lastSuccessAt === null) problems.push("Vēl nav bijis pilnībā veiksmīgas reizes");
    else if (now - status.lastSuccessAt > SYNC_STALE_HOURS * MS_PER_HOUR) problems.push(`Nav bijis veiksmīgas reizes vairāk nekā ${SYNC_STALE_HOURS} stundas`);
    return problems.length > 0 ? [{ job: status.job, problems }] : [];
  });
}

/** 3. Teams that trained in the last weeks but have nothing planned for the coming ones, with their last training. */
export function teamsRunningOutOfTrainings(
  teams: readonly AttentionTeam[],
  trainings: readonly AttentionTraining[],
  today: string,
): { team: AttentionTeam; lastDate: string }[] {
  const since = addDays(today, -TRAINING_LOOKBACK_DAYS);
  const until = addDays(today, TRAINING_LOOKAHEAD_DAYS);
  return teams.flatMap((team) => {
    const own = trainings.filter((training) => training.teamIds.includes(team.id));
    const recent = own.filter((training) => training.date >= since && training.date < today);
    const coming = own.some((training) => training.date >= today && training.date < until);
    if (recent.length === 0 || coming) return [];
    return [{ team, lastDate: recent.map((training) => training.date).sort().at(-1)! }];
  });
}

export type ClashItem = { kind: "training" | "game"; id: number; label: string; startTime: string; endTime: string };
export type Clash = { date: string; teamName: string; first: ClashItem; second: ClashItem };

/** 4. Trainings and games of the same team that overlap in the coming weeks, each pair once. */
export function upcomingClashes(
  teams: readonly AttentionTeam[],
  trainings: readonly AttentionTraining[],
  games: readonly AttentionGame[],
  today: string,
): Clash[] {
  const until = addDays(today, CLASH_DAYS);
  const inRange = (date: string) => date >= today && date < until;
  const seen = new Set<string>();
  const clashes: Clash[] = [];

  for (const team of teams) {
    const items = [
      ...trainings
        .filter((training) => inRange(training.date) && training.teamIds.includes(team.id))
        .map((training) => ({ date: training.date, item: { kind: "training", id: training.id, label: "Treniņš", startTime: training.startTime, endTime: training.endTime } as ClashItem })),
      ...games
        .filter((game) => inRange(game.date) && game.teamId === team.id)
        .map((game) => ({ date: game.date, item: { kind: "game", id: game.id, label: gameLabel(game), startTime: game.startTime, endTime: game.endTime } as ClashItem })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.item.startTime.localeCompare(b.item.startTime));

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length && items[j].date === items[i].date; j++) {
        const first = items[i].item;
        const second = items[j].item;
        if (!timesOverlap(first.startTime, first.endTime, second.startTime, second.endTime)) continue;
        const key = [`${first.kind}-${first.id}`, `${second.kind}-${second.id}`].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        clashes.push({ date: items[i].date, teamName: team.name, first, second });
      }
    }
  }
  return clashes.sort((a, b) => a.date.localeCompare(b.date));
}

/** 5. Players in no team; the public site shows them nowhere. */
export function playersWithoutTeam(players: readonly AttentionPlayer[]): AttentionPlayer[] {
  return players.filter((player) => player.teamIds.length === 0);
}

/** 6. Club names in the coming games that have no logo on file, with their first such game. Empty names (a fixture
 *  without a known opponent yet) are not clubs. */
export function clubsWithoutLogo(
  games: readonly AttentionGame[],
  logoByName: ReadonlyMap<string, string | null>,
  today: string,
): { name: string; game: AttentionGame }[] {
  const until = addDays(today, LOGO_LOOKAHEAD_DAYS);
  const found = new Map<string, AttentionGame>();
  const upcoming = games.filter((game) => game.date >= today && game.date < until).sort((a, b) => a.date.localeCompare(b.date));
  for (const game of upcoming) {
    for (const name of [game.homeTeam, game.awayTeam]) {
      if (name.trim() && !logoByName.get(name) && !found.has(name)) found.set(name, game);
    }
  }
  return [...found].map(([name, game]) => ({ name, game }));
}

export type BrokenEntry = { kind: "game" | "training" | "event"; id: number; label: string; date: string; startTime: string; endTime: string };

/** 7. Entries whose end is not after their start. The calendar shared with the FK site leaves them out. */
export function entriesWithBadTimes(
  games: readonly AttentionGame[],
  trainings: readonly AttentionTraining[],
  events: readonly AttentionEvent[],
): BrokenEntry[] {
  const bad = (item: { startTime: string; endTime: string }) => !isEndAfterStart(item.startTime, item.endTime);
  return [
    ...games.filter(bad).map((game) => ({ kind: "game" as const, id: game.id, label: gameLabel(game), date: game.date, startTime: game.startTime, endTime: game.endTime })),
    ...trainings.filter(bad).map((training) => ({ kind: "training" as const, id: training.id, label: "Treniņš", date: training.date, startTime: training.startTime, endTime: training.endTime })),
    ...events.filter((event) => eventDatesProblem(event.date, event.startTime, event.endDate ?? null, event.endTime) !== null).map((event) => ({ kind: "event" as const, id: event.id, label: event.title, date: event.date, startTime: event.startTime, endTime: event.endTime })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}

const AGE_TEAM = /^W?U(\d{1,2})(?:-\d+)?$/i;

/** The earliest birth year a youth team allows this year: U12 in 2026 is 2015 and younger. Null for a team without
 *  an age in its name, such as "2. liga". */
export function minBirthYear(teamName: string, year: number): number | null {
  const match = AGE_TEAM.exec(teamName.trim());
  return match ? year - Number(match[1]) + 1 : null;
}

const birthYear = (birthdate: string) => Number(birthdate.slice(6, 10));

/** 8. Players older than a youth team they are in allows. Younger ones may play up, so they are not listed. */
export function playersTooOld(
  teams: readonly AttentionTeam[],
  players: readonly AttentionPlayer[],
  today: string,
): { player: AttentionPlayer; team: AttentionTeam; minYear: number }[] {
  const year = Number(today.slice(0, 4));
  return teams.flatMap((team) => {
    const minYear = minBirthYear(team.name, year);
    if (minYear === null) return [];
    return players
      .filter((player) => player.teamIds.includes(team.id) && birthYear(player.birthdate) < minYear)
      .map((player) => ({ player, team, minYear }));
  });
}

/** 9. Players sharing a name (whatever the word order or case) and a birthdate. */
export function possibleDuplicates(players: readonly AttentionPlayer[]): AttentionPlayer[][] {
  const groups = new Map<string, AttentionPlayer[]>();
  for (const player of players) {
    const key = `${nameKey(player.name)}|${player.birthdate}`;
    groups.set(key, [...(groups.get(key) ?? []), player]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}
