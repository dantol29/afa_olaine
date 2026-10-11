import { getPublicPlayers } from "@/lib/public-team-data";
import { orderTeamShowcasePlayers } from "@/lib/team-showcase";

import { TeamRosterRail } from "./team-roster-rail";

const PLAYER_CUTOUTS: Record<number, string> = {
  67: "/player-cutouts/nikoloz-gujabidze.png",
};

export async function TeamSection() {
  const rows = await getPublicPlayers();
  const players = orderTeamShowcasePlayers(
    rows.filter((player) => player.playerTeams.some(({ team }) => team?.isMain)),
  );

  if (players.length === 0) return null;

  return <TeamRosterRail players={players.map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position ?? "Spēlētājs",
    number: player.number,
    imageUrl: PLAYER_CUTOUTS[player.id] ?? player.photoUrl,
  }))} />;
}
