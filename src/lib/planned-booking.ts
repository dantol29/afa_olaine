import type { CalendarEvent } from "@/lib/calendar";
import { rigaWallClockToUtc } from "@/lib/riga-time";

// What an admin form is planning right now, drawn in the week calendar below it as a dashed card. Pure, so it is
// tested without a browser.

export const PLANNED_UID = "planned";

export type PlannedEntry = {
  eventType: CalendarEvent["eventType"];
  title: string;
  location: string;
  /** "YYYY-MM-DD"; empty while not picked. */
  date: string;
  /** The last day of a multi-day event, when it is not `date`. */
  endDate?: string;
  /** "HH:MM"; empty while not picked. */
  startTime: string;
  endTime: string;
  /** The calendar uid of the entry being edited ("training-12"), hidden so it is not drawn twice. */
  editedUid?: string;
};

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

function instant(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return rigaWallClockToUtc(year, month, day, hour, minute);
}

/** The planned entry as a calendar entry, or null until its date and times make a real span. */
export function plannedCalendarEvent(entry: PlannedEntry): CalendarEvent | null {
  if (!DATE_KEY.test(entry.date) || !TIME.test(entry.startTime) || !TIME.test(entry.endTime)) return null;
  const start = instant(entry.date, entry.startTime);
  const end = instant(entry.endDate && DATE_KEY.test(entry.endDate) ? entry.endDate : entry.date, entry.endTime);
  if (!(end > start)) return null;
  return {
    uid: PLANNED_UID,
    title: entry.title || "Jaunais ieraksts",
    location: entry.location || null,
    allDay: false,
    start,
    end,
    dateKey: entry.date,
    weekdayLabel: "",
    dateLabel: "",
    timeLabel: entry.startTime,
    dayLabel: "",
    monthLabel: "",
    eventType: entry.eventType,
    team: null,
    teams: [],
  };
}
