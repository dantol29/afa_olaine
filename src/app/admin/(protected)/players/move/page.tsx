import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { sortByName } from "@/lib/ordering";
import type { MovePlayer } from "@/lib/player-move";
import { firstSearchParam, type SearchParamValue } from "@/lib/url-state";

import { PlayerMove } from "./player-move";

export default async function AdminPlayerMovePage({ searchParams }: { searchParams: Promise<Record<string, SearchParamValue>> }) {
  const [query, teamRows, playerRows] = await Promise.all([
    searchParams,
    db.select({ id: teams.id, name: teams.name }).from(teams),
    db.query.players.findMany({ with: { playerTeams: true } }),
  ]);
  const players: MovePlayer[] = sortByName(playerRows, (player) => player.name).map((player) => ({
    id: player.id,
    name: player.name,
    birthdate: player.birthdate,
    teams: player.playerTeams.map((link) => ({ teamId: link.teamId, goals: link.goals })),
  }));
  const teamOptions = sortByName(teamRows, (team) => team.name);
  // `?no=<teamId>` opens the page with that team as the source, as linked from a team on the players list.
  const fromParam = Number(firstSearchParam(query.no));
  const initialFromTeamId = teamOptions.some((team) => team.id === fromParam) ? fromParam : null;

  return <PlayerMove teamOptions={teamOptions} players={players} initialFromTeamId={initialFromTeamId} />;
}
