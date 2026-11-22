"use client";

import { useEffect, useState } from "react";

import { loadVenueRange } from "@/app/admin/(protected)/venue-actions";
import type { VenueBookings } from "@/lib/venue-bookings";

export type VenueBookingsState = { status: "idle" } | { status: "loading" } | { status: "failed" } | { status: "ready"; data: VenueBookings };

export function shiftDate(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** AFA's and FK's bookings from one day before `from` to one day after `to`, so a booking across midnight is still
 *  compared. Reloads when the range changes; "idle" until both dates are set. */
export function useVenueBookings(from: string, to: string): VenueBookingsState {
  const rangeKey = from && to && from <= to ? `${shiftDate(from, -1)}|${shiftDate(to, 1)}` : "";
  const [loaded, setLoaded] = useState<{ key: string; data: VenueBookings | null } | null>(null);

  useEffect(() => {
    if (!rangeKey) return;
    let current = true;
    const [start, end] = rangeKey.split("|");
    loadVenueRange(start, end)
      .then((data) => {
        if (current) setLoaded({ key: rangeKey, data });
      })
      .catch(() => {
        if (current) setLoaded({ key: rangeKey, data: null });
      });
    return () => {
      current = false;
    };
  }, [rangeKey]);

  if (!rangeKey) return { status: "idle" };
  if (loaded?.key !== rangeKey) return { status: "loading" };
  return loaded.data ? { status: "ready", data: loaded.data } : { status: "failed" };
}
