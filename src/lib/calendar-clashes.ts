import type { CalendarEvent } from "@/lib/calendar";
import { clashDates, venueClashPairs, type BookingKind, type VenueBooking } from "@/lib/venue-clash";

// Calendar entries as venue bookings, and which of them have a red venue clash on which day. No server code, so the
// admin week calendar can work it out itself, with the form's planned entry in place of the saved one.

const rigaDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" });
const rigaTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Riga", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const KIND_BY_EVENT_TYPE: Record<CalendarEvent["eventType"], BookingKind> = { game: "game", training: "training", other: "event" };

export function toVenueBooking(event: CalendarEvent): VenueBooking {
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

/** For each entry with a red venue clash (see venueClashPairs), the Riga days ("YYYY-MM-DD") of that clash, so a
 *  multi-day event is marked only on those days. Entries without a clash are not in the map. */
export function venueClashDays(events: readonly CalendarEvent[]): Map<string, Set<string>> {
  const days = new Map<string, Set<string>>();
  for (const pair of venueClashPairs(events.map(toVenueBooking))) {
    const dates = clashDates(pair.first, pair.second);
    for (const key of [pair.first.key, pair.second.key]) {
      const known = days.get(key) ?? new Set<string>();
      for (const date of dates) known.add(date);
      days.set(key, known);
    }
  }
  return days;
}
