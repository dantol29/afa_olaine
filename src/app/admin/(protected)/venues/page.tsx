import { count } from "drizzle-orm";

import { db } from "@/db/client";
import { events, games, trainings } from "@/db/schema";
import { toDateKey } from "@/lib/calendar";
import { getFkSchedule } from "@/lib/fk-calendar";
import { groupSimilarVenues, type VenueUsage } from "@/lib/venue-names";

import { VenueGroups } from "./venue-groups";

/** How far back and ahead FK's bookings are read for its spellings, as for the place suggestions. */
const FK_WINDOW_DAYS = 365;
const DAY_MS = 86_400_000;

/** Every place name with where it is used on AFA, and how often FK writes it exactly so. */
async function loadVenueUsages() {
  const now = Date.now();
  const [trainingRows, eventRows, gameRows, fk] = await Promise.all([
    db.select({ location: trainings.location, count: count() }).from(trainings).groupBy(trainings.location),
    db.select({ location: events.location, count: count() }).from(events).groupBy(events.location),
    db.select({ location: games.location, source: games.source, count: count() }).from(games).groupBy(games.location, games.source),
    getFkSchedule(toDateKey(new Date(now - FK_WINDOW_DAYS * DAY_MS)), toDateKey(new Date(now + FK_WINDOW_DAYS * DAY_MS))),
  ]);

  const usages = new Map<string, VenueUsage>();
  const usageOf = (name: string) => {
    if (!usages.has(name)) usages.set(name, { name, trainings: 0, games: 0, events: 0, lffGames: 0, fk: 0 });
    return usages.get(name)!;
  };
  for (const row of trainingRows) usageOf(row.location).trainings += row.count;
  for (const row of eventRows) usageOf(row.location).events += row.count;
  for (const row of gameRows) usageOf(row.location)[row.source === "lff" ? "lffGames" : "games"] += row.count;
  for (const booking of fk.bookings) if (booking.location?.trim()) usageOf(booking.location.trim()).fk += 1;
  return { usages: [...usages.values()], fkStatus: fk.status };
}

export default async function AdminVenuesPage() {
  const { usages, fkStatus } = await loadVenueUsages();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-club-navy">Vietas</h1>
      <p className="mt-2 text-sm text-slate-500">
        Visi vietu nosaukumi AFA un FK ierakstos. Līdzīgi nosaukumi ir sagrupēti. Vienu vietu vajag rakstīt vienādi: tad
        vietas noslodze un pārklāšanās tiek atrastas droši. Pārdēvēšana maina tikai AFA treniņus, notikumus un pašu
        ievadītās spēles; LFF spēles paliek ar LFF nosaukumu, FK ierakstus maina FK.
      </p>
      {fkStatus !== "ok" && (
        <p className="mt-2 text-sm text-amber-600">
          {fkStatus === "unconfigured" ? "FK dati nav pieslēgti — redzami tikai AFA nosaukumi." : "FK dati nav pieejami vai ir novecojuši."}
        </p>
      )}
      <VenueGroups groups={groupSimilarVenues(usages)} />
    </div>
  );
}
