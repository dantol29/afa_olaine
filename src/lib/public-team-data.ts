import "server-only";

import { db } from "@/db/client";
import { orderRoster, sortByName } from "@/lib/ordering";
import { cachePublicData } from "@/lib/public-data-cache";

// Loaders return the final display order, so the cache holds it and components render lists as given.
// SQL has no Latvian collation, so names are ordered in JS after the query.

export const getPublicPlayers = cachePublicData("players", async () =>
  orderRoster(
    await db.query.players.findMany({ with: { playerTeams: { with: { team: true } } } }),
    (player) => player.name,
    (player) => Boolean(player.photoUrl),
  ),
);

export const getPublicCoaches = cachePublicData("coaches", async () =>
  orderRoster(
    await db.query.coaches.findMany({ with: { coachTeams: { with: { team: true } } } }),
    (coach) => coach.name,
    (coach) => Boolean(coach.photoUrl),
  ),
);

/** Academy teams keep creation (id) order; the players of each team are in Latvian name order. */
export const getPublicAcademyTeams = cachePublicData("academy-teams", async () => {
  const academyTeams = await db.query.teams.findMany({
    where: (teams, { eq }) => eq(teams.isMain, false),
    orderBy: (teams, { asc }) => [asc(teams.id)],
    with: { playerTeams: { with: { player: true } } },
  });
  return academyTeams.map((team) => ({
    ...team,
    playerTeams: sortByName(team.playerTeams, ({ player }) => player.name),
  }));
});
