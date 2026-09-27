import { getAllGamesFromDb, getUpcomingGamesFromDb } from "@/lib/games-server";
import { getLogoBorderStripe } from "@/lib/logo-color";

import { MatchCard } from "./match-card";

export async function UpcomingGamesSection() {
  const upcomingGames = await getUpcomingGamesFromDb(2);
  const previousGames = upcomingGames.length === 0
    ? (await getAllGamesFromDb()).filter((game) => game.isPast).slice(-2).reverse()
    : [];
  const games = upcomingGames.length > 0 ? upcomingGames : previousGames;
  const gamesWithBorderStripes = await Promise.all(
    games.map(async (game) => ({
      game,
      homeBorderStripe: await getLogoBorderStripe(game.home.logo),
      awayBorderStripe: await getLogoBorderStripe(game.away.logo),
    })),
  );

  return (
    <section aria-label="Tuvākās spēles" className="bg-[#050505]">
      <div id="upcoming-games-heading" className="mx-auto grid w-[calc(100%-3rem)] max-w-[1500px] grid-cols-1 gap-5 pb-20 pt-40 md:w-[calc(100%-10rem)] md:grid-cols-2 xl:gap-7 xl:pb-28 xl:pt-44">
        {gamesWithBorderStripes.map(({ game, homeBorderStripe, awayBorderStripe }) => (
          <MatchCard key={game.id} game={game} homeBorderStripe={homeBorderStripe} awayBorderStripe={awayBorderStripe} />
        ))}
      </div>
    </section>
  );
}
