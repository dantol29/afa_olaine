// Shared by the public game cards (server) and the admin card preview (client).

type LeagueLogoSource = { teamId: number; label: string; logoUrl: string | null };

/** The logo of the team's league source whose label matches the game's league, ignoring case and spacing. */
export function leagueLogoForGame(sources: readonly LeagueLogoSource[], teamId: number, label: string | null) {
  const normalize = (value: string) => value.trim().toLocaleLowerCase("lv").replace(/\s+/g, " ");
  return sources.find((source) => source.teamId === teamId && label && normalize(source.label) === normalize(label))?.logoUrl ?? null;
}
