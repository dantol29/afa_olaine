import { POSITION_GROUPS } from "@/lib/player-positions";
import { firstSearchParam, type SearchParamValue } from "@/lib/url-state";

type PositionedPlayer = { position: string | null };

type RoleGroup<T> = {
  label: string;
  players: T[];
};

const ROLE_GROUPS = POSITION_GROUPS;

export type TeamTab = "players" | "staff";

// URL value of each tab. The default tab is not written to the URL.
export const TEAM_TAB_PARAM = "skats";
export const STAFF_TAB_URL_VALUE = "treneri";

export function teamTabFromSearchParam(value: SearchParamValue): TeamTab {
  return firstSearchParam(value) === STAFF_TAB_URL_VALUE ? "staff" : "players";
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
