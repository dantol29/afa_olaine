import { pageMetadata } from "@/lib/page-metadata";

import { AcademyContent } from "@/components/academy-content";
import { InnerPageHero } from "@/components/inner-page-hero";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";

export const metadata = pageMetadata({
  title: "AFA Olaine akadēmija | Jauniešu futbola komandas",
  description: "Iepazīsti AFA Olaine futbola akadēmijas jauniešu komandas Olainē. Apskati komandu fotoattēlus, spēlētāju sarakstus un atrodi savu vecuma grupu.",
  path: "/akademija",
});

export default async function AcademyPage() {
  const rows = await db.query.teams.findMany({
    orderBy: (teams, { asc }) => [asc(teams.id)],
    with: { playerTeams: { with: { player: true } } },
  });
  const academyTeams = rows.slice(1).map((team) => ({
    id: team.id,
    name: team.name,
    groupPhotoUrl: team.groupPhotoUrl,
    players: team.playerTeams
      .map(({ player }) => ({ id: player.id, name: player.name, number: player.number, position: player.position }))
      .sort((a, b) => a.name.localeCompare(b.name, "lv")),
  }));

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Akadēmija" id="academy-page-title" />
      <AcademyContent teams={academyTeams} />
      <SiteEnding />
    </main>
  );
}
