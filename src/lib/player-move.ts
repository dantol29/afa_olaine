// Adding or moving players from one team to another. Goals are kept per team, so moving a player out of a team
// loses their goals for it; the page shows that before saving. Pure, so the page, the server action and the tests
// share it.

export type MoveMode = "add" | "move";

export type MovePlayer = { id: number; name: string; birthdate: string; teams: { teamId: number; goals: number }[] };

/** What saving does to one player:
 *  - "add": joins the target team;
 *  - "move": joins the target team and leaves the source team;
 *  - "leave": already in the target team, so only leaves the source team;
 *  - "none": already in the target team and only adding, so nothing changes. */
export type MoveStatus = "add" | "move" | "leave" | "none";

export type MoveOutcome = { status: MoveStatus; lostGoals: number; otherTeamIds: number[] };

export function moveOutcome(player: MovePlayer, fromTeamId: number, toTeamId: number, mode: MoveMode): MoveOutcome {
  const inTarget = player.teams.some((link) => link.teamId === toTeamId);
  const lostGoals = mode === "move" ? (player.teams.find((link) => link.teamId === fromTeamId)?.goals ?? 0) : 0;
  const otherTeamIds = player.teams.map((link) => link.teamId).filter((teamId) => teamId !== fromTeamId && teamId !== toTeamId);
  const status: MoveStatus = mode === "add" ? (inTarget ? "none" : "add") : inTarget ? "leave" : "move";
  return { status, lostGoals, otherTeamIds };
}
