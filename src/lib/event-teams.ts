import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { eventTeams, teams } from "@/db/schema";
import { compareTeamOrder } from "@/lib/ordering";

export type EventTeam = { id: number; name: string; sort: number };

/** Teams per event (an event can have several), in the club's team order. Events with no team are absent from the
 *  map: they concern the whole club. */
export async function getTeamsByEvent(): Promise<Map<number, EventTeam[]>> {
  const rows = await db
    .select({ eventId: eventTeams.eventId, id: teams.id, name: teams.name, sort: teams.sort })
    .from(eventTeams)
    .innerJoin(teams, eq(eventTeams.teamId, teams.id));

  const teamsByEvent = new Map<number, EventTeam[]>();
  for (const { eventId, ...team } of rows) teamsByEvent.set(eventId, [...(teamsByEvent.get(eventId) ?? []), team]);
  for (const list of teamsByEvent.values()) list.sort(compareTeamOrder);
  return teamsByEvent;
}
