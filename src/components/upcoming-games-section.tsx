import { getAllGamesFromDb, getUpcomingGamesFromDb } from "@/lib/games-server";
import { getLogoBorderStripe } from "@/lib/logo-color";

import { MatchCard } from "./match-card";

export async function UpcomingGamesSection() {
  const upcomingGames = await getUpcomingGamesFromDb(3);
  const previousGames = upcomingGames.length === 0
    ? (await getAllGamesFromDb()).filter((game) => game.isPast).slice(-3).reverse()
    : [];
  const games = upcomingGames.length > 0 ? upcomingGames : previousGames;
  const gamesWithBorderStripes = await Promise.all(
    games.map(async (game) => {
      const [homeBorderStripe, awayBorderStripe] = await Promise.all([
        getLogoBorderStripe(game.home.logo),
        getLogoBorderStripe(game.away.logo),
      ]);
      return { game, homeBorderStripe, awayBorderStripe };
    }),
  );

  return (
    <section aria-label="Tuvākās spēles" className="bg-[#050505]">
      <div id="upcoming-games-heading" className="mx-auto grid w-[calc(100%-3rem)] max-w-[1500px] grid-cols-1 gap-5 pb-20 pt-40 md:w-[calc(100%-10rem)] md:grid-cols-2 xl:grid-cols-3 xl:gap-7 xl:pb-28 xl:pt-44">
        {gamesWithBorderStripes.map(({ game, homeBorderStripe, awayBorderStripe }) => (
          <MatchCard key={game.id} game={game} homeBorderStripe={homeBorderStripe} awayBorderStripe={awayBorderStripe} compact />
        ))}
        {Array.from({ length: Math.max(0, 3 - gamesWithBorderStripes.length) }, (_, index) => (
          <div key={`empty-game-${index}`} className="flex min-h-[360px] items-center justify-center border border-dotted border-white/15 px-6 py-12 text-center sm:min-h-[390px]">
            <p className="text-sm text-white/40">Spēle vēl nav ieplānota</p>
          </div>
        ))}
      </div>
    </section>
  );
}
