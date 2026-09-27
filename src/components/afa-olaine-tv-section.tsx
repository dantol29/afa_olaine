import { getLogoBorderStripe } from "@/lib/logo-color";
import { getAllGamesFromDb } from "@/lib/games-server";
import { getYouTubeViewCounts } from "@/lib/youtube-view-count-server";

import { AfaOlaineTvRail } from "./afa-olaine-tv-rail";

const VIDEO_TEAMS = {
  kkYioTYu1HI: ["AFA Olaine", "JFK Daugava / FK Union"],
  wIuXMxdpbYc: ["AFA Olaine", "Dienvidkurzemes SS"],
  S15LkeE7UyI: ["AFA Olaine", "FK Karosta"],
  "7LigWBJt-A8": ["AFA Olaine", "FS Jelgava-2"],
  "0p9H25btd6U": ["JFK Daugava / FK Union", "AFA Olaine"],
  UVirdPDo0H8: ["AFA Olaine", "JFC Viola"],
} as const;

/** Server wrapper so the TV cards use the same crest-pixel stripe as match cards. */
export async function AfaOlaineTvSection() {
  const stripe = await getLogoBorderStripe("/hero-logo.png");
  const games = await getAllGamesFromDb();
  const { counts: viewCounts, snapshot: viewsAreSnapshot } = await getYouTubeViewCounts();
  const logoForTeam = (team: string) => {
    if (team === "AFA Olaine") return "/hero-logo.png";
    const game = games.find((item) => item.home.name === team || item.away.name === team);
    return game?.home.name === team ? game.home.logo : game?.away.logo;
  };
  const bottomStripes = Object.fromEntries(await Promise.all(
    Object.entries(VIDEO_TEAMS).map(async ([videoId, [, secondTeam]]) => {
      return [videoId, await getLogoBorderStripe(logoForTeam(secondTeam), stripe)] as const;
    }),
  ));

  return <AfaOlaineTvRail stripe={stripe} bottomStripes={bottomStripes} viewCounts={viewCounts} viewsAreSnapshot={viewsAreSnapshot} />;
}
