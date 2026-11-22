import { isEndAfterStart } from "@/lib/time-range";
import { formatDayMonth } from "@/lib/date-display";

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

/** "12.12.2026", "12.–14.12.2026", "30.11.–02.12.2026" or "30.12.2026–02.01.2027". */
export function formatEventDates(date: string, endDate: string | null): string {
  const year = date.slice(0, 4);
  if (!endDate) return `${formatDayMonth(date)}${year}`;
  const endYear = endDate.slice(0, 4);
  if (endYear !== year) return `${formatDayMonth(date)}${year}–${formatDayMonth(endDate)}${endYear}`;
  if (endDate.slice(5, 7) === date.slice(5, 7)) return `${date.slice(8, 10)}.–${formatDayMonth(endDate)}${year}`;
  return `${formatDayMonth(date)}–${formatDayMonth(endDate)}${year}`;
}
