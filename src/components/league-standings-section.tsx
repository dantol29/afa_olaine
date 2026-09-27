import { LeagueStandingsRail } from "@/components/league-standings-rail";
import { leagueCardRows } from "@/lib/league-standings-cards";
import { getLeagueStandingsForDisplay } from "@/lib/league-standings-server";

export async function LeagueStandingsSection() {
  const leagues = await getLeagueStandingsForDisplay();
  const league = leagues.find((item) => item.standings.length > 0);
  if (!league) return null;

  return <LeagueStandingsRail url={league.url} standings={leagueCardRows(league.standings)} />;
}
