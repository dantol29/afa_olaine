import { pageMetadata } from "@/lib/page-metadata";
import { SiteHeader } from "@/components/site-header";
import { SiteEnding } from "@/components/site-ending";
import { GamesTabs } from "@/components/games-tabs";
import { InnerPageHero } from "@/components/inner-page-hero";
import { getAllGamesFromDb } from "@/lib/games-server";
import { getLogoBorderStripe } from "@/lib/logo-color";

export const metadata = pageMetadata({
  title: "AFA Olaine spēles | Kalendārs un rezultāti",
  description: "Apskati AFA Olaine gaidāmās spēles un aizvadīto maču rezultātus. Spēļu datumi, pretinieki un norises vietas vienuviet futbola līdzjutējiem.",
  path: "/speles",
});

export default async function GamesPage() {
  const allGames = await getAllGamesFromDb();
  const upcoming = allGames.filter((game) => !game.isPast);
  const past = allGames.filter((game) => game.isPast).reverse();
  const gamesWithStripes = await Promise.all(
    [...upcoming, ...past].map(async (game) => ({
      game,
      homeBorderStripe: await getLogoBorderStripe(game.home.logo),
      awayBorderStripe: await getLogoBorderStripe(game.away.logo),
    })),
  );
  const upcomingCards = gamesWithStripes.slice(0, upcoming.length);
  const pastCards = gamesWithStripes.slice(upcoming.length);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <InnerPageHero title="Spēles" id="games-page-title" />
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-20 md:w-[calc(100%-10rem)] xl:pb-28">
        <GamesTabs upcoming={upcomingCards} past={pastCards} />
      </div>
      <SiteEnding />
    </main>
  );
}
