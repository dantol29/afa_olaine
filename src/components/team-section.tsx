import { db } from "@/db/client";
import { orderTeamShowcasePlayers } from "@/lib/team-showcase";

import { TeamRosterRail } from "./team-roster-rail";

const PLAYER_CUTOUTS: Record<number, string> = {
  67: "/player-cutouts/nikoloz-gujabidze.png",
};

export async function TeamSection() {
  const rows = await db.query.players.findMany({
    with: { playerTeams: { with: { team: true } } },
  });
  const players = orderTeamShowcasePlayers(rows);

  if (players.length === 0) return null;

  return <TeamRosterRail players={players.map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position ?? "Spēlētājs",
    number: player.number,
    imageUrl: PLAYER_CUTOUTS[player.id] ?? player.photoUrl,
  }))} />;
}
