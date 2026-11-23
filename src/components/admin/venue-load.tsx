"use client";

import { clashLevel, wallClockMinutes, worstLevel, type ClashLevel, type PlannedBooking, type VenueBooking, type VenueClash } from "@/lib/venue-clash";
import { isSameVenue } from "@/lib/venue";

import { useVenueBookings } from "./use-venue-bookings";

const ROW_STYLE: Record<ClashLevel | "none", string> = {
  red: "border-l-4 border-red-600 bg-red-600/10",
  orange: "border-l-4 border-amber-500 bg-amber-500/10",
  none: "border-l-4 border-transparent text-slate-500",
};

const SUMMARY: Record<ClashLevel, { text: string; style: string }> = {
  red: { text: "🔴 Nevar: šajā laikā vietā ir spēle vai līdz tai paliek mazāk par 30 min.", style: "text-red-600" },
  orange: { text: "🟠 Pārbaudi: vietā tajā pašā laikā ir cits treniņš vai notikums.", style: "text-amber-600" },
};

function timeText(booking: VenueBooking) {
  return `${booking.startTime}–${booking.endDate ? `${booking.endDate.slice(8, 10)}.${booking.endDate.slice(5, 7)}. ` : ""}${booking.endTime}`;
}

/** "Vietas noslodze": every booking of the club at the form's place on its date, the ones that clash with the form's
 *  time marked red or orange (see src/lib/venue-clash.ts). Advisory only: it never blocks saving. */
export function VenueLoad({ planned, excludeKey }: { planned: PlannedBooking; excludeKey?: string }) {
  const { date } = planned;
  const venue = useVenueBookings(date, date);

  if (!date || !planned.location?.trim()) {
    return <p className="mt-2 text-xs text-slate-500">Vietas noslodze: izvēlies datumu un vietu.</p>;
  }
  if (venue.status === "loading" || venue.status === "idle") return <p className="mt-2 text-xs text-slate-500">Vietas noslodze: ielādē…</p>;
  if (venue.status === "failed") return <p className="mt-2 text-xs text-club-red">Vietas noslodzi neizdevās ielādēt.</p>;
  const plannedStart = planned.startTime ? wallClockMinutes(date, planned.startTime) : null;
  const rows = venue.bookings
    .filter((booking) => booking.key !== excludeKey && isSameVenue(booking.location, planned.location))
    .map((booking) => ({ booking, level: planned.startTime && planned.endTime ? clashLevel(planned, booking) : null }))
    // The neighbouring days only matter when they clash.
    .filter((row) => row.booking.date === date || row.booking.endDate === date || row.level !== null)
    .sort((a, b) => wallClockMinutes(a.booking.date, a.booking.startTime) - wallClockMinutes(b.booking.date, b.booking.startTime));
  const worst = worstLevel(rows.flatMap((row) => (row.level ? [{ booking: row.booking, level: row.level }] : [])));

  return (
    <section aria-label="Vietas noslodze" className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vietas noslodze</h3>
      {worst ? (
        <p className={`mt-1 font-semibold ${SUMMARY[worst].style}`}>{SUMMARY[worst].text}</p>
      ) : (
        plannedStart !== null && planned.endTime && <p className="mt-1 text-emerald-600">Šajā laikā vieta ir brīva.</p>
      )}
      {rows.length === 0 ? (
        <p className="mt-1 text-slate-500">Šajā dienā šajā vietā citu ierakstu nav.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {rows.map(({ booking, level }) => (
            <li key={booking.key} className={`flex items-center gap-2 rounded px-2 py-1 ${ROW_STYLE[level ?? "none"]}`}>
              <span className="w-28 shrink-0 tabular-nums">
                {booking.date !== date && `${booking.date.slice(8, 10)}.${booking.date.slice(5, 7)}. `}
                {timeText(booking)}
              </span>
              <span className="min-w-0 truncate">{booking.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** The clash of one row in a list of dates: the worst level and the first clash, with how many more there are. */
export function VenueClashNote({ clashes }: { clashes: readonly VenueClash[] }) {
  const level = worstLevel(clashes);
  if (!level) return null;
  const [first, ...rest] = clashes;
  return (
    <span className={`block text-xs font-semibold ${level === "red" ? "text-red-600" : "text-amber-600"}`}>
      {level === "red" ? "🔴" : "🟠"} {first.booking.title} {timeText(first.booking)}, {first.booking.location}
      {rest.length > 0 && ` (+${rest.length})`}
    </span>
  );
}
