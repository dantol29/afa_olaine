import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { teams, trainingTeams } from "@/db/schema";
import { sortByName } from "@/lib/ordering";

export type TrainingTeam = { id: number; name: string; sort: number };

/** Teams per training (a training can have several), in Latvian name order.
 *  Trainings with no team are absent from the map, which callers treat as "do not show". */
export async function getTeamsByTraining(): Promise<Map<number, TrainingTeam[]>> {
  const rows = await db
    .select({ trainingId: trainingTeams.trainingId, teamId: teams.id, teamName: teams.name, teamSort: teams.sort })
    .from(trainingTeams)
    .innerJoin(teams, eq(trainingTeams.teamId, teams.id));

  const teamsByTraining = new Map<number, TrainingTeam[]>();
  for (const { trainingId, teamId, teamName, teamSort } of rows) {
    teamsByTraining.set(trainingId, [...(teamsByTraining.get(trainingId) ?? []), { id: teamId, name: teamName, sort: teamSort }]);
  }

  return new Map([...teamsByTraining].map(([trainingId, list]) => [trainingId, sortByName(list, (team) => team.name)]));
}
