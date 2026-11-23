import { count } from "drizzle-orm";

import { db } from "@/db/client";
import { events, games, trainings } from "@/db/schema";
import { groupSimilarVenues, type VenueUsage } from "@/lib/venue-names";

import { VenueGroups } from "./venue-groups";

/** Every place name with where it is used. */
async function loadVenueUsages(): Promise<VenueUsage[]> {
  const [trainingRows, eventRows, gameRows] = await Promise.all([
    db.select({ location: trainings.location, count: count() }).from(trainings).groupBy(trainings.location),
    db.select({ location: events.location, count: count() }).from(events).groupBy(events.location),
    db.select({ location: games.location, source: games.source, count: count() }).from(games).groupBy(games.location, games.source),
  ]);

  const usages = new Map<string, VenueUsage>();
  const usageOf = (name: string) => {
    if (!usages.has(name)) usages.set(name, { name, trainings: 0, games: 0, events: 0, lffGames: 0 });
    return usages.get(name)!;
  };
  for (const row of trainingRows) usageOf(row.location).trainings += row.count;
  for (const row of eventRows) usageOf(row.location).events += row.count;
  for (const row of gameRows) usageOf(row.location)[row.source === "lff" ? "lffGames" : "games"] += row.count;
  return [...usages.values()];
}

export default async function AdminVenuesPage() {
  const usages = await loadVenueUsages();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-club-navy">Vietas</h1>
      <p className="mt-2 text-sm text-slate-500">
        Visi vietu nosaukumi treniņos, spēlēs un notikumos. Līdzīgi nosaukumi ir sagrupēti. Vienu vietu vajag rakstīt
        vienādi: tad vietas noslodze un pārklāšanās tiek atrastas droši. Pārdēvēšana maina treniņus, notikumus un pašu
        ievadītās spēles; LFF spēles paliek ar LFF nosaukumu.
      </p>
      <VenueGroups groups={groupSimilarVenues(usages)} />
    </div>
  );
}
