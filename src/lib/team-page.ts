type PositionedPlayer = { position: string | null };

type RoleGroup<T> = {
  label: string;
  players: T[];
};

const ROLE_GROUPS = [
  { position: "Vārtsargs", label: "Vārtsargi" },
  { position: "Aizsargs", label: "Aizsargi" },
  { position: "Pussargs", label: "Pussargi" },
  { position: "Uzbrucējs", label: "Uzbrucēji" },
] as const;

export function teamTabFromSearchParam(value: string | string[] | undefined): "players" | "staff" {
  return value === "treneri" ? "staff" : "players";
}

/** Groups the public roster in the same position order used by LFF. */
export function groupTeamPagePlayers<T extends PositionedPlayer>(players: T[]): RoleGroup<T>[] {
  const knownPositions = new Set<string>(ROLE_GROUPS.map((group) => group.position));
  const groups = ROLE_GROUPS.map((group) => ({
    label: group.label,
    players: players.filter((player) => player.position === group.position),
  })).filter((group) => group.players.length > 0);
  const unclassified = players.filter((player) => player.position === null || !knownPositions.has(player.position));

  return unclassified.length > 0 ? [...groups, { label: "Spēlētāji", players: unclassified }] : groups;
}
