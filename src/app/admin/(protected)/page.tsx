import Link from "next/link";
import type { ReactNode } from "react";

import { db } from "@/db/client";
import { cronJobStatuses, events, games, teams } from "@/db/schema";
import {
  CLASH_DAYS,
  LOGO_LOOKAHEAD_DAYS,
  TRAINING_LOOKAHEAD_DAYS,
  addDays,
  clubsWithoutLogo,
  entriesWithBadTimes,
  gamesWithoutScore,
  playersTooOld,
  playersWithoutTeam,
  possibleDuplicates,
  syncProblems,
  teamsRunningOutOfTrainings,
  upcomingClashes,
  type AttentionPlayer,
} from "@/lib/admin-attention";
import { toDateKey } from "@/lib/calendar";
import { resolveClubLogos } from "@/lib/club-logos";
import { sortByName } from "@/lib/ordering";
import { loadScheduleTrainings } from "@/lib/training-schedule-server";
import { loadVenueBookings } from "@/lib/venue-bookings";
import { venueClashPairs, type VenueBooking } from "@/lib/venue-clash";

import { ScoreForm } from "./score-form";
import { formatDate, formatDayMonth } from "@/lib/date-display";

const EDIT_PATH = { game: "games", training: "trainings", event: "events" } as const;
const BOOKING_KEY = /^(game|training|event)-(\d+)$/;

/** "Uzmanību": what needs someone to act, computed on every visit from the current data. Writes nothing. */
export default async function AdminHomePage() {
  const now = new Date();
  const today = toDateKey(now);
  const [teamRows, gameRows, trainingRows, eventRows, playerRows, statusRows, venueBookings] = await Promise.all([
    db.select({ id: teams.id, name: teams.name }).from(teams),
    db.select().from(games),
    loadScheduleTrainings(),
    db.select().from(events),
    db.query.players.findMany({ with: { playerTeams: true } }),
    db.select().from(cronJobStatuses),
    loadVenueBookings(today, addDays(today, CLASH_DAYS)),
  ]);
  const teamList = sortByName(teamRows, (team) => team.name);
  const players: AttentionPlayer[] = sortByName(playerRows, (player) => player.name).map((player) => ({
    id: player.id,
    name: player.name,
    birthdate: player.birthdate,
    teamIds: player.playerTeams.map((link) => link.teamId),
  }));
  const logoWindowEnd = addDays(today, LOGO_LOOKAHEAD_DAYS);
  const logoByName = await resolveClubLogos(
    gameRows.filter((game) => game.date >= today && game.date < logoWindowEnd).flatMap((game) => [game.homeTeam, game.awayTeam]),
  );

  const noScore = gamesWithoutScore(gameRows, today);
  const sync = syncProblems(statusRows, now.getTime());
  const runningOut = teamsRunningOutOfTrainings(teamList, trainingRows, today);
  const clashes = upcomingClashes(teamList, trainingRows, gameRows, today);
  const venueClashes = venueClashPairs(venueBookings);
  const noTeam = playersWithoutTeam(players);
  const noLogo = clubsWithoutLogo(gameRows, logoByName, today);
  const badTimes = entriesWithBadTimes(gameRows, trainingRows, eventRows);
  const tooOld = playersTooOld(teamList, players, today);
  const duplicates = possibleDuplicates(players);
  const teamName = (id: number) => teamList.find((team) => team.id === id)?.name ?? "";

  const blocks = [
    noScore.length > 0 && (
      <Block key="score" title="Spēles bez rezultāta">
        {noScore.map((game) => (
          <Row key={game.id} side={<ScoreForm gameId={game.id} />}>
            {formatDate(game.date)} · {game.homeTeam || "?"} – {game.awayTeam || "?"} <Muted>({teamName(game.teamId)})</Muted>{" "}
            <Link href={`/admin/games/${game.id}`} className="text-xs font-semibold text-club-red hover:underline">
              atvērt →
            </Link>
          </Row>
        ))}
      </Block>
    ),
    sync.length > 0 && (
      <Block key="sync" title="Sinhronizācija ar LFF">
        {sync.map((item) => (
          <Row key={item.job} href="/admin/league-sources" action="atvērt">
            <span className="font-semibold">{item.job}</span>
            <ul className="mt-1 list-disc pl-5 text-slate-500">
              {item.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </Row>
        ))}
      </Block>
    ),
    runningOut.length > 0 && (
      <Block key="trainings" title={`Beidzas treniņi (nākamajās ${TRAINING_LOOKAHEAD_DAYS} dienās nav neviena)`}>
        {runningOut.map(({ team, lastDate }) => (
          <Row key={team.id} href="/admin/trainings/schedule" action="pēc grafika">
            {team.name} <Muted>· pēdējais {formatDate(lastDate)}</Muted>
          </Row>
        ))}
      </Block>
    ),
    clashes.length > 0 && (
      <Block key="clashes" title={`Pārklāšanās (nākamās ${CLASH_DAYS} dienas)`}>
        {clashes.map((clash) => (
          <Row key={`${clash.first.kind}-${clash.first.id}-${clash.second.kind}-${clash.second.id}`}>
            {formatDate(clash.date)} · {clash.teamName}:{" "}
            {[clash.first, clash.second].map((item, index) => (
              <span key={`${item.kind}-${item.id}`}>
                {index > 0 && " un "}
                <Link href={`/admin/${EDIT_PATH[item.kind]}/${item.id}`} className="font-semibold text-club-red hover:underline">
                  {item.label} {item.startTime}–{item.endTime}
                </Link>
              </span>
            ))}
          </Row>
        ))}
      </Block>
    ),
    venueClashes.length > 0 && (
      <Block key="venue-clashes" title={`Vietas pārklāšanās (nākamās ${CLASH_DAYS} dienas)`}>
        {venueClashes.map((pair) => (
          <Row key={`${pair.first.key}|${pair.second.key}`}>
            {/* The later start is the first day both are on. */}
            <span className={pair.level === "red" ? "text-red-600" : "text-amber-600"}>{pair.level === "red" ? "🔴" : "🟠"}</span> {formatDate(pair.second.date)} ·{" "}
            {pair.first.location}: <BookingLink booking={pair.first} /> un <BookingLink booking={pair.second} />
          </Row>
        ))}
      </Block>
    ),
    noTeam.length > 0 && (
      <Block key="no-team" title="Spēlētāji bez komandas (vietnē netiek rādīti)">
        {noTeam.map((player) => (
          <Row key={player.id} href={`/admin/players/${player.id}`} action="atvērt">
            {player.name} <Muted>({player.birthdate.slice(6, 10)})</Muted>
          </Row>
        ))}
      </Block>
    ),
    noLogo.length > 0 && (
      <Block key="logos" title={`Klubi bez logo (spēlēs nākamajās ${LOGO_LOOKAHEAD_DAYS} dienās)`}>
        {noLogo.map(({ name, game }) => (
          <Row key={name} href="/admin/club-logos/new" action="pievienot logo">
            {name} <Muted>· {formatDate(game.date)}, {game.homeTeam || "?"} – {game.awayTeam || "?"}</Muted>
          </Row>
        ))}
      </Block>
    ),
    badTimes.length > 0 && (
      <Block key="bad-times" title="Nepareizs laiks (beigas nav pēc sākuma) — netiek rādīti kalendāros">
        {badTimes.map((entry) => (
          <Row key={`${entry.kind}-${entry.id}`} href={`/admin/${EDIT_PATH[entry.kind]}/${entry.id}`} action="labot">
            {formatDate(entry.date)} · {entry.label} <Muted>{entry.startTime}–{entry.endTime}</Muted>
          </Row>
        ))}
      </Block>
    ),
    tooOld.length > 0 && (
      <Block key="age" title="Spēlētājs vecāks par komandas vecumu">
        {tooOld.map(({ player, team, minYear }) => (
          <Row key={`${player.id}-${team.id}`} href={`/admin/players/move?no=${team.id}`} action="pārvietot">
            {player.name} ({player.birthdate.slice(6, 10)}) <Muted>· {team.name}: no {minYear}</Muted>
          </Row>
        ))}
      </Block>
    ),
    duplicates.length > 0 && (
      <Block key="duplicates" title="Iespējamie dublikāti (vienāds vārds un dzimšanas datums)">
        {duplicates.map((group) => (
          <Row key={group.map((player) => player.id).join("-")}>
            {group.map((player, index) => (
              <span key={player.id}>
                {index > 0 && " · "}
                <Link href={`/admin/players/${player.id}`} className="font-semibold text-club-red hover:underline">
                  {player.name}
                </Link>
              </span>
            ))}{" "}
            <Muted>({group[0].birthdate})</Muted>
          </Row>
        ))}
      </Block>
    ),
  ].filter(Boolean);

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">Uzmanību</h1>
      {blocks.length === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm font-semibold text-emerald-700 shadow-sm">Viss kārtībā.</p>
      ) : (
        <div className="flex flex-col gap-6">{blocks}</div>
      )}
    </div>
  );
}

/** A booking links to its edit page. */
function BookingLink({ booking }: { booking: VenueBooking }) {
  const text = booking.endDate
    ? `${booking.title} ${formatDayMonth(booking.date)} ${booking.startTime}–${formatDayMonth(booking.endDate)} ${booking.endTime}`
    : `${booking.title} ${booking.startTime}–${booking.endTime}`;
  const match = BOOKING_KEY.exec(booking.key);
  if (!match) return <span className="font-semibold">{text}</span>;
  const [, kind, id] = match;
  return (
    <Link href={`/admin/${EDIT_PATH[kind as keyof typeof EDIT_PATH]}/${id}`} className="font-semibold text-club-red hover:underline">
      {text}
    </Link>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-4 py-3 text-base font-bold text-club-navy">{title}</h2>
      <ul className="divide-y divide-slate-100 text-sm">{children}</ul>
    </section>
  );
}

function Row({ href, action, side, children }: { href?: string; action?: string; side?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-4 py-2 text-club-navy">
      <div className="min-w-0">{children}</div>
      {side}
      {href && action && (
        <Link href={href} className="shrink-0 font-semibold text-club-red hover:underline">
          {action} →
        </Link>
      )}
    </li>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-slate-500">{children}</span>;
}
