// Order of the admin lists of games, trainings and events: what is coming first (nearest on top), then what is over
// (latest on top). Only the recent past is listed by default so the lists stay short as the seasons pile up.

/** How far back past rows are listed until the admin asks for all of them. */
export const RECENT_PAST_DAYS = 30;
/** URL value of `?aizvaditas=` that lists every past row. */
export const SHOW_ALL_PAST_PARAM = "aizvaditas";
export const SHOW_ALL_PAST_VALUE = "visas";

/** Whether the URL asks for every past row (`?aizvaditas=visas`). */
export function isShowAllPast(value: string | undefined): boolean {
  return value === SHOW_ALL_PAST_VALUE;
}

type DatedRow = { date: string; startTime: string; id: number };

function shiftDateKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compareChronologically(a: DatedRow, b: DatedRow): number {
  return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.id - b.id;
}

/** Splits rows into upcoming (from today, nearest first) and past (latest first, recent ones unless `showAllPast`). */
export function splitAdminSchedule<Row extends DatedRow>(rows: readonly Row[], todayKey: string, showAllPast: boolean) {
  const sorted = [...rows].sort(compareChronologically);
  const upcoming = sorted.filter((row) => row.date >= todayKey);
  const allPast = sorted.filter((row) => row.date < todayKey).reverse();
  const oldestShown = shiftDateKey(todayKey, -RECENT_PAST_DAYS);
  const past = showAllPast ? allPast : allPast.filter((row) => row.date >= oldestShown);
  return { upcoming, past, hiddenPastCount: allPast.length - past.length };
}
