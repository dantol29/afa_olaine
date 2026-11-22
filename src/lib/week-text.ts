// The week's schedule of one team as plain text for a parents' chat (WhatsApp). Pure, so the page and the tests share
// it. Dates are "YYYY-MM-DD" (Riga), times "HH:MM", as stored.
import { addDays } from "@/lib/admin-attention";
import { WEEKDAYS, isoWeekday } from "@/lib/training-schedule";

export const DAYS_PER_WEEK = 7;

export type WeekItem =
  | { kind: "training"; date: string; startTime: string; endTime: string; location: string }
  | { kind: "game"; date: string; startTime: string; endTime: string; location: string; homeTeam: string; awayTeam: string }
  | { kind: "event"; date: string; startTime: string; endTime: string; location: string; title: string };

/** The Monday of the week a date falls in. */
export function weekStart(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/** From Saturday on, the week being planned is the next one. */
const FIRST_WEEKEND_DAY = 6;

/** The week the page opens on: this one on weekdays, the next one at the weekend. */
export function defaultWeekStart(today: string): string {
  const monday = weekStart(today);
  return isoWeekday(today) >= FIRST_WEEKEND_DAY ? addDays(monday, DAYS_PER_WEEK) : monday;
}

/** "24.11." */
const shortDate = (date: string) => `${date.slice(8, 10)}.${date.slice(5, 7)}.`;

function describe(item: WeekItem): string {
  if (item.kind === "training") return `${item.startTime}–${item.endTime} Treniņš`;
  if (item.kind === "game") return `${item.startTime} Spēle: ${item.homeTeam || "?"} – ${item.awayTeam || "?"}`;
  return `${item.startTime}–${item.endTime} ${item.title}`;
}

/** A heading with the team and the dates, then one line per item of the week starting `monday`, in time order. Items
 *  outside that week are left out. */
export function buildWeekText(teamName: string, monday: string, items: readonly WeekItem[]): string {
  const sunday = addDays(monday, DAYS_PER_WEEK - 1);
  const lines = items
    .filter((item) => item.date >= monday && item.date <= sunday)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .map((item) => {
      const place = item.location.trim() ? `, ${item.location.trim()}` : "";
      return `${WEEKDAYS[isoWeekday(item.date) - 1].short} ${shortDate(item.date)} ${describe(item)}${place}`;
    });
  const heading = `${teamName} — grafiks ${shortDate(monday)}–${shortDate(sunday)}`;
  return [heading, ...(lines.length > 0 ? lines : ["Šajā nedēļā nav ierakstu."])].join("\n");
}
