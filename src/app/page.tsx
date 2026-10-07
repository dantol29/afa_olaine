import type { Metadata } from "next";

import { LeagueStandingsSection } from "@/components/league-standings-section";
import { SiteHero } from "@/components/site-hero";
import { SiteEnding } from "@/components/site-ending";
import { SponsorsTicker } from "@/components/sponsors-ticker";
import { TeamSection } from "@/components/team-section";
import { AfaOlaineTvSection } from "@/components/afa-olaine-tv-section";
import { TiktokVideosRail } from "@/components/tiktok-videos-rail";
import { getAllGamesFromDb } from "@/lib/games-server";
import { getArticles } from "@/lib/jaunumi-server";
import { UpcomingGamesSection } from "@/components/upcoming-games-section";
import { StructuredData } from "@/components/structured-data";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
};

export default async function HomePage() {
  const [articles, games] = await Promise.all([getArticles(), getAllGamesFromDb()]);
  const lastGame = games.filter((game) => game.isPast).at(-1);

  return (
    <main className="min-h-screen bg-[#050505]">
      <StructuredData data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${getSiteUrl()}/#website`,
        name: "AFA Olaine",
        url: getSiteUrl(),
        inLanguage: "lv-LV",
        publisher: { "@id": `${getSiteUrl()}/#organization` },
      }} />
      <SiteHero
        articles={articles.slice(0, 3)}
        lastGame={
          lastGame
            ? {
                homeTeam: lastGame.home.name,
                awayTeam: lastGame.away.name,
                homeLogo: lastGame.home.logo,
                awayLogo: lastGame.away.logo,
                score: lastGame.homeScore !== null && lastGame.awayScore !== null ? `${lastGame.homeScore} : ${lastGame.awayScore}` : undefined,
              }
            : undefined
        }
      />
      <SponsorsTicker />
      <div className="relative z-0">
        <UpcomingGamesSection />
      </div>
      <LeagueStandingsSection />
      <TeamSection />
      <AfaOlaineTvSection />
      <TiktokVideosRail />
      <SiteEnding />
    </main>
  );
}
