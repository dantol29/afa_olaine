"use server";

import { requireAdminSession } from "@/lib/auth";
import { loadVenueBookings } from "@/lib/venue-bookings";
import type { VenueBooking } from "@/lib/venue-clash";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
/** A longer list helps nobody in a form. */
const MAX_RANGE_DAYS = 365;

function isDateKey(value: string) {
  return DATE_KEY.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

/** The club's bookings from `from` to `to` (Riga dates), for the clash warnings of the admin forms and lists. Null for
 *  an invalid or too long range. */
export async function loadVenueRange(from: string, to: string): Promise<VenueBooking[] | null> {
  await requireAdminSession();
  if (!isDateKey(from) || !isDateKey(to) || to < from) return null;
  if (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`) > MAX_RANGE_DAYS * DAY_MS) return null;
  return loadVenueBookings(from, to);
}
