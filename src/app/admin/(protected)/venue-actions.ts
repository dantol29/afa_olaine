"use server";

import { requireAdminSession } from "@/lib/auth";
import { loadVenueBookings, type VenueBookings } from "@/lib/venue-bookings";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function shiftDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** AFA's and FK's bookings around one date, for the venue panel of the admin forms. The day before and after are
 *  included so a booking that crosses midnight, or a game early in the morning, is still compared. */
export async function loadVenueDay(date: string): Promise<VenueBookings | null> {
  await requireAdminSession();
  if (!DATE_KEY.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) return null;
  return loadVenueBookings(shiftDate(date, -1), shiftDate(date, 1));
}
