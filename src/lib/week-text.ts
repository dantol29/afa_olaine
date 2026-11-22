// The week's schedule of one team as plain text for a parents' chat (WhatsApp). Pure, so the page and the tests share
// it. Dates are "YYYY-MM-DD" (Riga), times "HH:MM", as stored.
import { addDays } from "@/lib/admin-attention";
import { WEEKDAYS, isoWeekday } from "@/lib/training-schedule";
import { formatDayMonth } from "@/lib/date-display";

export const DAYS_PER_WEEK = 7;

export type WeekItem =
  | { kind: "training"; date: string; startTime: string; endTime: string; location: string }
  | { kind: "game"; date: string; startTime: string; endTime: string; location: string; homeTeam: string; awayTeam: string }
  | { kind: "event"; date: string; endDate?: string | null; startTime: string; endTime: string; location: string; title: string };

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
const shortDate = formatDayMonth;

function describe(item: WeekItem): string {
  if (item.kind === "training") return `${item.startTime}–${item.endTime} Treniņš`;
  if (item.kind === "game") return `${item.startTime} Spēle: ${item.homeTeam || "?"} – ${item.awayTeam || "?"}`;
  return `${item.startTime}–${item.endTime} ${item.title}`;
}

const dayAndDate = (date: string) => `${WEEKDAYS[isoWeekday(date) - 1].short} ${shortDate(date)}`;

/** "S 12.12." for one day, "S 12.12.–Sv 13.12." for a multi-day event. */
function itemDays(item: WeekItem): string {
  const endDate = item.kind === "event" ? item.endDate : null;
  return endDate ? `${dayAndDate(item.date)}–${dayAndDate(endDate)}` : dayAndDate(item.date);
}

const lastDay = (item: WeekItem) => (item.kind === "event" && item.endDate ? item.endDate : item.date);

/** A heading with the team and the dates, then one line per item of the week starting `monday`, in time order. Items
 *  outside that week are left out; a multi-day event that overlaps it is in. */
export function buildWeekText(teamName: string, monday: string, items: readonly WeekItem[]): string {
  const sunday = addDays(monday, DAYS_PER_WEEK - 1);
  const lines = items
    .filter((item) => lastDay(item) >= monday && item.date <= sunday)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .map((item) => {
      const place = item.location.trim() ? `, ${item.location.trim()}` : "";
      return `${itemDays(item)} ${describe(item)}${place}`;
    });
  const heading = `${teamName} — grafiks ${shortDate(monday)}–${shortDate(sunday)}`;
  return [heading, ...(lines.length > 0 ? lines : ["Šajā nedēļā nav ierakstu."])].join("\n");
}
