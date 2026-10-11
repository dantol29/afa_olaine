import "server-only";

import { db } from "@/db/client";
import { cachePublicData } from "@/lib/public-data-cache";

export const getPublicPlayers = cachePublicData("players", async () =>
  db.query.players.findMany({
    orderBy: (players, { asc }) => [asc(players.name)],
    with: { playerTeams: { with: { team: true } } },
  }),
);

export const getPublicCoaches = cachePublicData("coaches", async () =>
  db.query.coaches.findMany({ orderBy: (coaches, { asc }) => [asc(coaches.name)] }),
);

export const getPublicAcademyTeams = cachePublicData("academy-teams", async () =>
  db.query.teams.findMany({
    where: (teams, { eq }) => eq(teams.isMain, false),
    orderBy: (teams, { asc }) => [asc(teams.id)],
    with: { playerTeams: { with: { player: true } } },
  }),
);
