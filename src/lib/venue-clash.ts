import { isSameVenue } from "@/lib/venue";

// Whether two bookings of one venue get in each other's way. Used by the admin forms and lists. Times are Riga wall-clock ("YYYY-MM-DD" + "HH:MM"), compared as minutes on one line, so no
// time zone is involved and a booking that runs past midnight still compares correctly.
//
// - red ("cannot"): a game shares the venue with anything at an overlapping time, or anything ends less than
//   GAME_BUFFER_MINUTES before a game starts or starts less than that after it ends (warm-up, pitch preparation);
// - orange ("check"): two bookings without a game overlap: trainings of different teams usually share a pitch, an
//   event may or may not need all of it;
// - anything else, a different venue or a free gap, is no clash.
// Neither level blocks saving: the admin decides.

export const GAME_BUFFER_MINUTES = 30;
const MINUTES_PER_DAY = 1440;
const DAY_MS = 86_400_000;

export type BookingKind = "game" | "training" | "event";
export type ClashLevel = "red" | "orange";

export type VenueBooking = {
  /** The calendar uid, e.g. "training-3", "game-12". */
  key: string;
  kind: BookingKind;
  title: string;
  location: string | null;
  date: string;
  startTime: string;
  /** The day it ends, when that is not `date`. */
  endDate?: string;
  endTime: string;
};

/** What is being planned, from a form or a list row. */
export type PlannedBooking = Pick<VenueBooking, "kind" | "location" | "date" | "startTime" | "endDate" | "endTime">;

export type VenueClash = { booking: VenueBooking; level: ClashLevel };

/** Minutes from 1970-01-01 00:00 on Riga's wall clock. */
export function wallClockMinutes(date: string, time: string): number {
  const days = Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);
  const [hours, minutes] = time.split(":").map(Number);
  return days * MINUTES_PER_DAY + hours * 60 + minutes;
}

function span(booking: PlannedBooking): { start: number; end: number } | null {
  const start = wallClockMinutes(booking.date, booking.startTime);
  const end = wallClockMinutes(booking.endDate ?? booking.date, booking.endTime);
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? { start, end } : null;
}

export function clashLevel(first: PlannedBooking, second: PlannedBooking): ClashLevel | null {
  if (!isSameVenue(first.location, second.location)) return null;
  const a = span(first);
  const b = span(second);
  if (!a || !b) return null;
  const hasGame = first.kind === "game" || second.kind === "game";
  const gap = hasGame ? GAME_BUFFER_MINUTES : 0;
  if (!(a.start < b.end + gap && b.start < a.end + gap)) return null;
  return hasGame ? "red" : "orange";
}

/** The bookings that clash with the planned one, red first, then by start. */
export function findVenueClashes(planned: PlannedBooking, bookings: readonly VenueBooking[]): VenueClash[] {
  return bookings
    .flatMap((booking) => {
      const level = clashLevel(planned, booking);
      return level ? [{ booking, level }] : [];
    })
    .sort(
      (a, b) =>
        Number(a.level === "orange") - Number(b.level === "orange") ||
        wallClockMinutes(a.booking.date, a.booking.startTime) - wallClockMinutes(b.booking.date, b.booking.startTime),
    );
}

/** The worst level among clashes, or null when there are none. */
export function worstLevel(clashes: readonly VenueClash[]): ClashLevel | null {
  if (clashes.some((clash) => clash.level === "red")) return "red";
  return clashes.length > 0 ? "orange" : null;
}

export type VenueClashPair = { level: ClashLevel; first: VenueBooking; second: VenueBooking };

/** Red clashes (see clashLevel) for the admin home, by date. Orange ones are left out: two of the club's teams
 *  sharing a pitch is the usual arrangement, and it is shown while planning in the forms and date lists. */
export function venueClashPairs(bookings: readonly VenueBooking[]): VenueClashPair[] {
  const pairs: VenueClashPair[] = [];
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const [first, second] = [bookings[i], bookings[j]];
      if (clashLevel(first, second) !== "red") continue;
      const [earlier, later] = wallClockMinutes(first.date, first.startTime) <= wallClockMinutes(second.date, second.startTime) ? [first, second] : [second, first];
      pairs.push({ level: "red", first: earlier, second: later });
    }
  }
  return pairs.sort((a, b) => wallClockMinutes(a.first.date, a.first.startTime) - wallClockMinutes(b.first.date, b.first.startTime));
}
