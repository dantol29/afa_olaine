type ShowcasePlayer = { id: number; photoUrl: string | null };

/** Places the strongest available visual profile first without changing the roster itself. */
export function orderTeamShowcasePlayers<T extends ShowcasePlayer>(players: T[]): T[] {
  return [...players].sort((first, second) => Number(Boolean(second.photoUrl)) - Number(Boolean(first.photoUrl)));
}
