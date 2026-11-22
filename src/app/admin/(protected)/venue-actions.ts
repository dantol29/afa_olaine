"use server";

import { requireAdminSession } from "@/lib/auth";
import { loadVenueBookings, type VenueBookings } from "@/lib/venue-bookings";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;
/** FK answers at most 366 days at once, and a longer list helps nobody in a form. */
const MAX_RANGE_DAYS = 365;

function isDateKey(value: string) {
  return DATE_KEY.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));
}

/** AFA's and FK's bookings that start from `from` to `to` (Riga dates), for the clash warnings of the admin forms and
 *  lists. Null for an invalid or too long range. */
export async function loadVenueRange(from: string, to: string): Promise<VenueBookings | null> {
  await requireAdminSession();
  if (!isDateKey(from) || !isDateKey(to) || to < from) return null;
  if (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`) > MAX_RANGE_DAYS * DAY_MS) return null;
  return loadVenueBookings(from, to);
}
