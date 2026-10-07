import { pageMetadata } from "@/lib/page-metadata";

import { TeamPageContent } from "@/components/team-page-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { InnerPageHero } from "@/components/inner-page-hero";
import { db } from "@/db/client";
import { groupTeamPagePlayers, teamTabFromSearchParam } from "@/lib/team-page";

export const metadata = pageMetadata({
  title: "AFA Olaine komanda | Spēlētāji un treneri",
  description: "Iepazīsti AFA Olaine futbola komandas spēlētājus un trenerus. Apskati sastāvu, pozīcijas, spēlētāju profilus un komandas personālu.",
  path: "/komanda",
});

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ skats?: string | string[] }> }) {
  const { skats } = await searchParams;
  const [playerRows, coachRows] = await Promise.all([
    db.query.players.findMany({ orderBy: (players, { asc }) => [asc(players.name)] }),
    db.query.coaches.findMany({ orderBy: (coaches, { asc }) => [asc(coaches.name)] }),
  ]);
  const playerGroups = groupTeamPagePlayers(playerRows.map((player) => ({
    id: player.id,
    name: player.name,
    number: player.number,
    position: player.position,
    photoUrl: player.photoUrl,
  })));
  const coaches = coachRows.map((coach) => ({
    id: coach.id,
    name: coach.name,
    position: coach.position,
    license: coach.license,
    authority: coach.authority,
    photoUrl: coach.photoUrl,
  }));

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Komanda" id="team-page-title" />
      <TeamPageContent initialTab={teamTabFromSearchParam(skats)} playerGroups={playerGroups} coaches={coaches} />
      <SiteEnding />
    </main>
  );
}
