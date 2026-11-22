import { isSameVenue } from "@/lib/venue";

// Whether two bookings of one venue get in each other's way. Used by the admin forms and lists for AFA's own
// bookings and FK Olaine's. Times are Riga wall-clock ("YYYY-MM-DD" + "HH:MM"), compared as minutes on one line, so no
// time zone is involved and a booking that runs past midnight still compares correctly.
//
// - red ("cannot"): a game shares the venue with anything at an overlapping time, or anything ends less than
//   GAME_BUFFER_MINUTES before a game starts or starts less than that after it ends (warm-up, pitch preparation);
// - orange ("check"): two bookings without a game overlap: trainings of different teams usually share a pitch, an
//   event may or may not need all of it;
// - anything else, a different venue or a free gap, is no clash.
// Neither level blocks saving: the admin decides, and FK's data can be a minute old.

export const GAME_BUFFER_MINUTES = 30;
const MINUTES_PER_DAY = 1440;
const DAY_MS = 86_400_000;

export type BookingKind = "game" | "training" | "event";
export type BookingClub = "afa" | "fk";
export type ClashLevel = "red" | "orange";

export type VenueBooking = {
  /** "afa:training-3", "fk:game-12": unique across both clubs. */
  key: string;
  club: BookingClub;
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

/** Clashing pairs worth an admin's attention, red first, then by date. A pair needs at least one AFA booking (FK's
 *  own clashes are FK's to sort out). Orange pairs within AFA are left out: two AFA teams sharing a pitch is the
 *  usual arrangement and is planned in AFA's own forms; orange pairs with FK are listed, because AFA cannot see them
 *  being planned. */
export function venueClashPairs(bookings: readonly VenueBooking[]): VenueClashPair[] {
  const pairs: VenueClashPair[] = [];
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const [first, second] = [bookings[i], bookings[j]];
      if (first.club !== "afa" && second.club !== "afa") continue;
      const level = clashLevel(first, second);
      if (!level || (level === "orange" && first.club === second.club)) continue;
      const [earlier, later] = wallClockMinutes(first.date, first.startTime) <= wallClockMinutes(second.date, second.startTime) ? [first, second] : [second, first];
      pairs.push({ level, first: earlier, second: later });
    }
  }
  return pairs.sort(
    (a, b) =>
      Number(a.level === "orange") - Number(b.level === "orange") ||
      wallClockMinutes(a.first.date, a.first.startTime) - wallClockMinutes(b.first.date, b.first.startTime),
  );
}
