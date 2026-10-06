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
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [articles, games, settings] = await Promise.all([getArticles(), getAllGamesFromDb(), getPublicSiteSettings()]);
  const lastGame = games.filter((game) => game.isPast).at(-1);
  const siteUrl = getSiteUrl();
  const organization = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": `${siteUrl}/#organization`,
    name: "AFA Olaine",
    legalName: settings.legalName,
    url: siteUrl,
    logo: `${siteUrl}/afaolaine-logo.png`,
    sport: "Football",
    foundingDate: "2013",
    email: settings.email,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.legalAddress,
      addressLocality: "Olaine",
      addressCountry: "LV",
    },
    sameAs: [
      "https://www.facebook.com/afaolaine.sievietes/",
      "https://www.instagram.com/afa.olaine/",
      "https://www.youtube.com/@afaolaine",
      "https://www.tiktok.com/@afa.olaine",
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
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
