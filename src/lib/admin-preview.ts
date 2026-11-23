// Builds the public card of a game or event from what the admin form holds right now, so the form can show the card
// before anything is saved. Empty fields show as placeholders; everything else follows the public pages' rules.
import { clubDisplay, MONTHS } from "@/lib/games";
import { leagueLogoForGame } from "@/lib/league-logo";
import { DEFAULT_BORDER_COLOR, solidStripe } from "@/lib/logo-color-core";
import type { ScheduleEvent } from "@/lib/schedule";

/** A club known to the admin: its logo (null when none is on file) and the card stripe drawn from it. */
export type ClubHint = { name: string; logo: string | null; stripe: string };
export type LeagueLogoHint = { teamId: number; label: string; logoUrl: string | null };

const FRIENDLY_LEAGUE = "Draudzības spēle";
const EMPTY_TIME = "--:--";
const PLACEHOLDER = { home: "Mājinieki", away: "Viesi", title: "Nosaukums", location: "Vieta" };
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function dateParts(dateKey: string) {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) return { day: "--", month: "---", year: "----" };
  const [, year, month, day] = match;
  return { day, month: MONTHS[Number(month) - 1] ?? "---", year };
}

function parseScore(value: string): number | null {
  return /^\d+$/.test(value.trim()) ? Number(value) : null;
}

const EMPTY_CLUB_BADGE = { initials: "?", color: "bg-white/10" };

function previewClub(name: string, placeholder: string, clubs: ReadonlyMap<string, ClubHint>) {
  const stripe = solidStripe(DEFAULT_BORDER_COLOR);
  if (!name.trim()) return { team: { name: placeholder, ...EMPTY_CLUB_BADGE }, stripe };
  // Logos are matched on the exact name, as on the public pages, so the preview shows whether this spelling has one.
  const club = clubs.get(name.trim());
  return { team: clubDisplay(name.trim(), club?.logo ?? null), stripe: club?.stripe ?? stripe };
}

export type GamePreviewValues = {
  teamId: number | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  date: string;
  startTime: string;
  location: string;
  league: string;
};

export function buildGamePreview(values: GamePreviewValues, clubs: ReadonlyMap<string, ClubHint>, leagueLogos: readonly LeagueLogoHint[]) {
  const home = previewClub(values.homeTeam, PLACEHOLDER.home, clubs);
  const away = previewClub(values.awayTeam, PLACEHOLDER.away, clubs);
  const league = values.league.trim();
  return {
    game: {
      id: -1,
      ...dateParts(values.date),
      weekday: "",
      time: values.startTime || EMPTY_TIME,
      home: home.team,
      away: away.team,
      venue: values.location.trim() || PLACEHOLDER.location,
      league: league || FRIENDLY_LEAGUE,
      leagueLogoUrl: values.teamId === null ? null : leagueLogoForGame(leagueLogos, values.teamId, league || null),
      homeScore: parseScore(values.homeScore),
      awayScore: parseScore(values.awayScore),
    },
    homeBorderStripe: home.stripe,
    awayBorderStripe: away.stripe,
  };
}

export type EventPreviewValues = {
  title: string;
  date: string;
  /** Empty for a one-day event. */
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  /** Ticked teams; none means the event belongs to no team. */
  teamIds: readonly number[];
};

export function buildEventPreview(values: EventPreviewValues, teams: readonly { id: number; name: string }[]): ScheduleEvent {
  // `teams` is already in the club's team order, so the ticked ones keep it.
  return {
    id: -1,
    title: values.title.trim() || PLACEHOLDER.title,
    ...dateParts(values.date),
    rawDate: values.date,
    rawEndDate: values.endDate && values.endDate !== values.date ? values.endDate : null,
    startTime: values.startTime || EMPTY_TIME,
    endTime: values.endTime || EMPTY_TIME,
    location: values.location.trim() || PLACEHOLDER.location,
    teams: teams.filter((team) => values.teamIds.includes(team.id)).map((team, sort) => ({ id: team.id, name: team.name, sort })),
    href: null,
    isPast: false,
  };
}
