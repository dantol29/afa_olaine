import "server-only";

import { getScheduleForRange, type CalendarEvent } from "@/lib/calendar";
import { getFkSchedule, type FkBooking, type FkScheduleStatus } from "@/lib/fk-calendar";
import type { BookingKind, VenueBooking } from "@/lib/venue-clash";

export type FkFeedState = { status: FkScheduleStatus; error?: string; updatedAt?: string };
export type VenueBookings = { bookings: VenueBooking[]; fk: FkFeedState };

const rigaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" });
const rigaTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const KIND_BY_EVENT_TYPE: Record<CalendarEvent["eventType"], BookingKind> = { game: "game", training: "training", other: "event" };

function wallClock(start: Date, end: Date) {
  const date = rigaDate.format(start);
  const endDate = rigaDate.format(end);
  return { date, startTime: rigaTime.format(start), endTime: rigaTime.format(end), ...(endDate !== date ? { endDate } : {}) };
}

function fromAfa(event: CalendarEvent): VenueBooking {
  return {
    key: `afa:${event.uid}`,
    club: "afa",
    kind: KIND_BY_EVENT_TYPE[event.eventType],
    title: event.title,
    location: event.location,
    ...wallClock(event.start, event.end),
  };
}

function fromFk(booking: FkBooking): VenueBooking {
  return {
    key: `fk:${booking.uid.slice("fk-olaine:".length)}`,
    club: "fk",
    kind: KIND_BY_EVENT_TYPE[booking.eventType],
    title: booking.title,
    location: booking.location,
    ...wallClock(booking.start, booking.end),
  };
}

function noonUtc(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`);
}

/** AFA's and FK's bookings that start from `from` to `to` (Riga dates, inclusive), and how FK's feed answered. */
export async function loadVenueBookings(from: string, to: string): Promise<VenueBookings> {
  const [afa, fk] = await Promise.all([getScheduleForRange(noonUtc(from), noonUtc(to)), getFkSchedule(from, to)]);
  return {
    bookings: [...afa.map(fromAfa), ...fk.bookings.map(fromFk)],
    fk: { status: fk.status, error: fk.error, updatedAt: fk.updatedAt?.toISOString() },
  };
}
