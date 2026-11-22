import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { sortTeams } from "@/lib/ordering";
import type { ExistingPlayer } from "@/lib/player-import";

import { PlayerImport } from "./player-import";

export default async function AdminPlayerImportPage() {
  const [teamRows, playerRows] = await Promise.all([
    db.select({ id: teams.id, name: teams.name, sort: teams.sort }).from(teams),
    db.query.players.findMany({ with: { playerTeams: true } }),
  ]);
  const players: ExistingPlayer[] = playerRows.map((player) => ({
    id: player.id,
    name: player.name,
    birthdate: player.birthdate,
    number: player.number,
    position: player.position,
    teamIds: player.playerTeams.map((playerTeam) => playerTeam.teamId),
  }));

  return <PlayerImport teamOptions={sortTeams(teamRows)} players={players} />;
}
