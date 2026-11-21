import "server-only";

import type { ScheduleCardEntry } from "@/components/games-tabs";
import { resolveClubLogos } from "@/lib/club-logos";
import { getAllEventsFromDb, getAllGamesFromDb } from "@/lib/games-server";
import { getLogoBorderStripe } from "@/lib/logo-color";
import { buildSchedule } from "@/lib/schedule";

// The club's name as LFF and the club-logo admin spell it; events take their stripes from this crest.
const CLUB_LOGO_NAME = "AFA Olaine";
// Used when no club logo is saved under that name.
const CLUB_CREST_FALLBACK = "/hero-logo.png";

/** The stripe that game cards draw for AFA Olaine's crest, used on both edges of every event card. */
export async function getEventBorderStripe(): Promise<string> {
  const logos = await resolveClubLogos([CLUB_LOGO_NAME]);
  return getLogoBorderStripe(logos.get(CLUB_LOGO_NAME) ?? CLUB_CREST_FALLBACK);
}

/** Every game (with its card stripes) and event, merged chronologically, for /speles and the homepage block. */
export async function getScheduleCardEntries(): Promise<ScheduleCardEntry[]> {
  const [games, events] = await Promise.all([getAllGamesFromDb(), getAllEventsFromDb()]);
  const gamesWithStripes = await Promise.all(
    games.map(async (game) => ({
      ...game,
      homeBorderStripe: await getLogoBorderStripe(game.home.logo),
      awayBorderStripe: await getLogoBorderStripe(game.away.logo),
    })),
  );
  return buildSchedule(gamesWithStripes, events);
}
