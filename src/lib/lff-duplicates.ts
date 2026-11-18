type FixtureTeams = { date: string; home: string; away: string };
type SavedGame = { date: string; homeTeam: string; awayTeam: string; source: "manual" | "lff" };

/** For an LFF fixture that is not imported yet (no LFF game of the team on the same date with the same home and away
 *  team), returns a saved game of the same team that it probably copies: one with the same home and away team that was
 *  either entered by hand on the same date, or imported from LFF earlier on another date (LFF moved the match).
 *  Returns undefined for an already imported fixture and when nothing matches. `savedGames` must belong to one team. */
export function findPossibleDuplicate<T extends SavedGame>(fixture: FixtureTeams, savedGames: T[]): T | undefined {
  const sameTeams = savedGames.filter((game) => game.homeTeam === fixture.home && game.awayTeam === fixture.away);
  if (sameTeams.some((game) => game.source === "lff" && game.date === fixture.date)) return undefined;
  return sameTeams.find((game) => (game.source === "lff" ? game.date !== fixture.date : game.date === fixture.date));
}
