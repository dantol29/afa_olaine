// Weekly training schedules: the dates a schedule gives, which of them clash with trainings already on file, and the
// repeats of one training ("similar" ones) for deleting them together. Pure, so the admin pages, the server actions
// and the tests share it. Dates are "YYYY-MM-DD", times "HH:MM", as stored.

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;

/** A schedule may span at most a year, so a mistyped year cannot create thousands of trainings. */
export const MAX_SCHEDULE_DAYS = 366;

/** Monday first, numbered as `isoWeekday` returns them. */
export const WEEKDAYS = [
  { day: 1, short: "P", label: "Pirmdiena" },
  { day: 2, short: "O", label: "Otrdiena" },
  { day: 3, short: "T", label: "Trešdiena" },
  { day: 4, short: "C", label: "Ceturtdiena" },
  { day: 5, short: "Pk", label: "Piektdiena" },
  { day: 6, short: "S", label: "Sestdiena" },
  { day: 7, short: "Sv", label: "Svētdiena" },
] as const;

export type ScheduleTraining = { id: number; date: string; startTime: string; endTime: string; location: string; teamIds: number[] };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** Days since 1970-01-01 for a valid "YYYY-MM-DD", else null. */
function dayNumber(date: string): number | null {
  if (!DATE_KEY.test(date)) return null;
  const time = Date.parse(`${date}T00:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== date) return null;
  return time / MS_PER_DAY;
}

export function isDateKey(value: string): boolean {
  return dayNumber(value) !== null;
}

const fromDayNumber = (day: number) => new Date(day * MS_PER_DAY).toISOString().slice(0, 10);

/** 1 for Monday to 7 for Sunday. */
export function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? DAYS_PER_WEEK : day;
}

export function weekdayLabel(date: string): string {
  return WEEKDAYS[isoWeekday(date) - 1].label;
}

/** The dates from `from` to `to` inclusive that fall on the chosen weekdays; an error when the period is unusable. */
export function scheduleDates(from: string, to: string, weekdays: readonly number[]): { dates: string[] } | { error: string } {
  const first = dayNumber(from);
  const last = dayNumber(to);
  if (first === null || last === null) return { error: "Jānorāda perioda sākums un beigas." };
  if (last < first) return { error: "Perioda beigām jābūt vēlāk par sākumu." };
  if (last - first + 1 > MAX_SCHEDULE_DAYS) return { error: `Periods nevar būt garāks par ${MAX_SCHEDULE_DAYS} dienām.` };
  if (weekdays.length === 0) return { error: "Jāizvēlas vismaz viena nedēļas diena." };

  const dates: string[] = [];
  for (let day = first; day <= last; day++) {
    const date = fromDayNumber(day);
    if (weekdays.includes(isoWeekday(date))) dates.push(date);
  }
  return { dates };
}

/** Whether two time ranges on the same day overlap; touching ends (18:00–19:30 and 19:30–21:00) do not. */
export function timesOverlap(start: string, end: string, otherStart: string, otherEnd: string): boolean {
  return start < otherEnd && otherStart < end;
}

/** A training of the team already on file that the new one on `date` would overlap, if any. */
export function findClash(
  date: string,
  startTime: string,
  endTime: string,
  teamId: number,
  existing: readonly ScheduleTraining[],
): ScheduleTraining | null {
  return (
    existing.find(
      (training) =>
        training.date === date &&
        training.teamIds.includes(teamId) &&
        timesOverlap(startTime, endTime, training.startTime, training.endTime),
    ) ?? null
  );
}

const sameTeams = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

/** The repeats of `source`, itself included: on the same weekday, at the same start and end, for the same teams,
 *  from its date to `until` inclusive (any date when `until` is null). Place and coaches are not compared. */
export function findSimilarTrainings(
  source: ScheduleTraining,
  until: string | null,
  trainings: readonly ScheduleTraining[],
): ScheduleTraining[] {
  const weekday = isoWeekday(source.date);
  return trainings
    .filter(
      (training) =>
        training.date >= source.date &&
        (until === null || training.date <= until) &&
        isoWeekday(training.date) === weekday &&
        training.startTime === source.startTime &&
        training.endTime === source.endTime &&
        sameTeams(training.teamIds, source.teamIds),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
}
