import { ClubLinksRail } from "@/components/club-links-rail";
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

export default async function HomePage() {
  const [articles, games] = await Promise.all([getArticles(), getAllGamesFromDb()]);
  const lastGame = games.filter((game) => game.isPast).at(-1);

  return (
    <main className="min-h-screen bg-[#f5f5f4]">
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
      <ClubLinksRail />
      <AfaOlaineTvSection />
      <TiktokVideosRail />
      <SiteEnding />
    </main>
  );
}
