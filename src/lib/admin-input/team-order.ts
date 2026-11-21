// Validates a new team display order sent from the admin team list. The order is saved only when it lists every
// current team exactly once, so a team added or deleted in another tab is never left without a position.

export const TEAM_ORDER_CHANGED_ERROR = "Komandu saraksts ir mainījies. Atjaunojiet lapu un sakārtojiet vēlreiz.";

export function parseTeamOrder(value: unknown, currentTeamIds: readonly number[]): { teamIds: number[] } | { error: string } {
  if (!Array.isArray(value) || !value.every((id) => Number.isSafeInteger(id))) {
    return { error: "Nederīga komandu secība." };
  }
  const teamIds = value as number[];
  const current = new Set(currentTeamIds);
  const isSameSet = teamIds.length === current.size && new Set(teamIds).size === teamIds.length && teamIds.every((id) => current.has(id));
  return isSameSet ? { teamIds } : { error: TEAM_ORDER_CHANGED_ERROR };
}
