import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { teams, trainingTeams } from "@/db/schema";
import { uniqueSortedLabels } from "@/lib/ordering";

/** Team names per training (a training can have several teams), joined in Latvian order.
 *  Trainings with no team are absent from the map, which callers treat as "do not show". */
export async function getTeamNamesByTraining(): Promise<Map<number, string>> {
  const rows = await db
    .select({ trainingId: trainingTeams.trainingId, teamName: teams.name })
    .from(trainingTeams)
    .innerJoin(teams, eq(trainingTeams.teamId, teams.id));

  const namesByTraining = new Map<number, string[]>();
  for (const { trainingId, teamName } of rows) {
    namesByTraining.set(trainingId, [...(namesByTraining.get(trainingId) ?? []), teamName]);
  }

  return new Map(
    [...namesByTraining].map(([trainingId, names]) => [
      trainingId,
      uniqueSortedLabels(names).join(", "),
    ]),
  );
}
