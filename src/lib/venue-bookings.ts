import "server-only";

import { getScheduleForRange } from "@/lib/calendar";
import { toVenueBooking } from "@/lib/calendar-clashes";
import type { VenueBooking } from "@/lib/venue-clash";

function noonUtc(dateKey: string) {
  return new Date(`${dateKey}T12:00:00Z`);
}

/** The club's games, trainings and events from `from` to `to` (Riga dates, inclusive), for the venue clash checks. */
export async function loadVenueBookings(from: string, to: string): Promise<VenueBooking[]> {
  return (await getScheduleForRange(noonUtc(from), noonUtc(to))).map(toVenueBooking);
}
