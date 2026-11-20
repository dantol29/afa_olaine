import { pageMetadata } from "@/lib/page-metadata";

import { AcademyContent } from "@/components/academy-content";
import { InnerPageHero } from "@/components/inner-page-hero";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getPublicAcademyTeams } from "@/lib/public-team-data";
import { TEAM_FILTER_PARAM, firstSearchParam, type SearchParamValue } from "@/lib/url-state";

export const metadata = pageMetadata({
  title: "AFA Olaine akadēmija | Jauniešu futbola komandas",
  description: "Iepazīsti AFA Olaine futbola akadēmijas jauniešu komandas Olainē. Apskati komandu fotoattēlus, spēlētāju sarakstus un atrodi savu vecuma grupu.",
  path: "/akademija",
});

export default async function AcademyPage({ searchParams }: { searchParams: Promise<Record<string, SearchParamValue>> }) {
  const params = await searchParams;
  const rows = await getPublicAcademyTeams();
  const academyTeams = rows.map((team) => ({
    id: team.id,
    name: team.name,
    groupPhotoUrl: team.groupPhotoUrl,
    players: team.playerTeams.map(({ player }) => ({ id: player.id, name: player.name, number: player.number, position: player.position })),
  }));

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Akadēmija" id="academy-page-title" />
      <AcademyContent teams={academyTeams} initialTeam={firstSearchParam(params[TEAM_FILTER_PARAM]) ?? null} />
      <SiteEnding />
    </main>
  );
}
