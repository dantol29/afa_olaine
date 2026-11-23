import "server-only";

import { getScheduleForRange, type CalendarEvent } from "@/lib/calendar";
import type { BookingKind, VenueBooking } from "@/lib/venue-clash";

const rigaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" });
const rigaTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const KIND_BY_EVENT_TYPE: Record<CalendarEvent["eventType"], BookingKind> = { game: "game", training: "training", other: "event" };

function fromCalendar(event: CalendarEvent): VenueBooking {
  const date = rigaDate.format(event.start);
  const endDate = rigaDate.format(event.end);
  return {
    key: event.uid,
    kind: KIND_BY_EVENT_TYPE[event.eventType],
    title: event.title,
    location: event.location,
    date,
    startTime: rigaTime.format(event.start),
    endTime: rigaTime.format(event.end),
    ...(endDate !== date ? { endDate } : {}),
  };
}

function noonUtc(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`);
}

/** The club's games, trainings and events from `from` to `to` (Riga dates, inclusive), for the venue clash checks. */
export async function loadVenueBookings(from: string, to: string): Promise<VenueBooking[]> {
  return (await getScheduleForRange(noonUtc(from), noonUtc(to))).map(fromCalendar);
}
