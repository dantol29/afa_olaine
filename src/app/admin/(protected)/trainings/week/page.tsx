import { and, gte, lte, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { events, games, teams, trainings } from "@/db/schema";
import { addDays } from "@/lib/admin-attention";
import { toDateKey } from "@/lib/calendar";
import { sortTeams } from "@/lib/ordering";
import { DAYS_PER_WEEK, defaultWeekStart, weekStart, type WeekItem } from "@/lib/week-text";

import { WeekText } from "./week-text";

/** This week's and next week's schedule of a team as text to paste into a parents' chat. */
export default async function WeekTextPage() {
  const today = toDateKey(new Date());
  const thisMonday = weekStart(today);
  const nextMonday = addDays(thisMonday, DAYS_PER_WEEK);
  const lastDay = addDays(nextMonday, DAYS_PER_WEEK - 1);

  const [teamRows, trainingRows, gameRows, eventRows] = await Promise.all([
    db.select({ id: teams.id, name: teams.name, sort: teams.sort }).from(teams),
    db.query.trainings.findMany({
      where: and(gte(trainings.date, thisMonday), lte(trainings.date, lastDay)),
      with: { trainingTeams: true },
    }),
    db.select().from(games).where(and(gte(games.date, thisMonday), lte(games.date, lastDay))),
    // A multi-day event belongs to every week it overlaps.
    db.query.events.findMany({
      where: and(lte(events.date, lastDay), gte(sql`coalesce(${events.endDate}, ${events.date})`, thisMonday)),
      with: { eventTeams: true },
    }),
  ]);

  const toEventItem = (event: (typeof eventRows)[number]): WeekItem => ({
    kind: "event",
    date: event.date,
    endDate: event.endDate,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    title: event.title,
  });
  const itemsByTeam = Object.fromEntries(
    teamRows.map((team) => [
      team.id,
      [
        ...trainingRows
          .filter((training) => training.trainingTeams.some((link) => link.teamId === team.id))
          .map((training): WeekItem => ({ kind: "training", date: training.date, startTime: training.startTime, endTime: training.endTime, location: training.location })),
        ...gameRows
          .filter((game) => game.teamId === team.id)
          .map((game): WeekItem => ({ kind: "game", date: game.date, startTime: game.startTime, endTime: game.endTime, location: game.location, homeTeam: game.homeTeam, awayTeam: game.awayTeam })),
        // An event without teams is in no team's text.
        ...eventRows.filter((event) => event.eventTeams.some((link) => link.teamId === team.id)).map(toEventItem),
      ],
    ]),
  );

  return (
    <WeekText
      teamOptions={sortTeams(teamRows)}
      itemsByTeam={itemsByTeam}
      initialMonday={defaultWeekStart(today)}
      weeks={[
        { monday: thisMonday, label: "Šī nedēļa" },
        { monday: nextMonday, label: "Nākamā nedēļa" },
      ]}
    />
  );
}
