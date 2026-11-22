// The four playing positions. The team page groups its roster by exactly these values, so the admin picks them from a
// list instead of typing them: a typo would drop the player out of every group.
export const POSITION_GROUPS = [
  { position: "Vārtsargs", label: "Vārtsargi" },
  { position: "Aizsargs", label: "Aizsargi" },
  { position: "Pussargs", label: "Pussargi" },
  { position: "Uzbrucējs", label: "Uzbrucēji" },
] as const;

export const PLAYER_POSITIONS: readonly string[] = POSITION_GROUPS.map((group) => group.position);

/** The positions to offer, plus a saved value outside the list so editing never drops it. */
export function positionOptions(current: string | null | undefined): string[] {
  return current && !PLAYER_POSITIONS.includes(current) ? [...PLAYER_POSITIONS, current] : [...PLAYER_POSITIONS];
}
