import { isEndAfterStart } from "@/lib/time-range";
import { currentRigaYear, formatDate, formatDayMonth, formatFullDate, yearUnlessCurrent } from "@/lib/date-display";

// An event lasts from `date` startTime to `endDate` endTime. `endDate` is null for a one-day event (shared database
// 0.1.4): never stored equal to `date`, so a one-day event has one form.

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** The stored end date: null when empty or the start date. */
export function storedEndDate(date: string, endDate: string | null | undefined): string | null {
  const value = endDate?.trim() ?? "";
  return value === "" || value === date ? null : value;
}

export function lastEventDay(event: { date: string; endDate?: string | null }): string {
  return event.endDate ?? event.date;
}

/** Why the dates and times cannot be saved, or null when they can. */
export function eventDatesProblem(date: string, startTime: string, endDate: string | null, endTime: string): string | null {
  if (endDate === null) return isEndAfterStart(startTime, endTime) ? null : "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā).";
  if (!DATE_KEY.test(endDate) || Number.isNaN(Date.parse(`${endDate}T12:00:00Z`))) return "Beigu datums nav derīgs.";
  if (endDate < date) return "Beigu datums nevar būt pirms sākuma datuma.";
  return null;
}

/** In the current year (2026): "12.12.", "12.–14.12.", "30.11.–02.12."; in another year: "12.12.2025",
 *  "12.–14.12.2027"; across a new year always both years: "30.12.2026–02.01.2027". */
export function formatEventDates(date: string, endDate: string | null, currentYear: string = currentRigaYear()): string {
  if (!endDate) return formatDate(date, currentYear);
  const year = date.slice(0, 4);
  if (endDate.slice(0, 4) !== year) return `${formatFullDate(date)}–${formatFullDate(endDate)}`;
  const suffix = yearUnlessCurrent(year, currentYear);
  if (endDate.slice(5, 7) === date.slice(5, 7)) return `${date.slice(8, 10)}.–${formatDayMonth(endDate)}${suffix}`;
  return `${formatDayMonth(date)}–${formatDayMonth(endDate)}${suffix}`;
}

/** When an event happens, each end with its own time: "12.12. 10:00–16:00" for one day, "12.12. 10:00 – 14.12. 16:00"
 *  for several. Across a new year both dates carry their year: "30.12.2026 10:00 – 02.01.2027 16:00". */
export function formatEventSpan(
  date: string,
  startTime: string,
  endDate: string | null,
  endTime: string,
  currentYear: string = currentRigaYear(),
): string {
  if (!endDate) return `${formatDate(date, currentYear)} ${startTime}–${endTime}`;
  const crossesYear = endDate.slice(0, 4) !== date.slice(0, 4);
  const show = (day: string) => (crossesYear ? formatFullDate(day) : formatDate(day, currentYear));
  return `${show(date)} ${startTime} – ${show(endDate)} ${endTime}`;
}
