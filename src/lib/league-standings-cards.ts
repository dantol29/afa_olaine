type RankedTeam = { pos: number };
type OlaineMarkedTeam = { isOlaine: boolean };

/** Sorts live standings into the compact ranking-card order. */
export function leagueCardRows<T extends RankedTeam>(standings: T[], limit = standings.length): T[] {
  return [...standings].sort((first, second) => first.pos - second.pos).slice(0, limit);
}

/** Finds the card where the compact rail should initially be positioned. */
export function initialStandingCardIndex<T extends OlaineMarkedTeam>(standings: T[]): number {
  const olaineIndex = standings.findIndex((team) => team.isOlaine);
  return olaineIndex === -1 ? 0 : olaineIndex;
}
