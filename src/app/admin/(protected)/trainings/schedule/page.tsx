import { db } from "@/db/client";
import { coaches, teams } from "@/db/schema";
import { getLocationHints } from "@/lib/admin-form-hints";
import { toDateKey } from "@/lib/calendar";
import { sortByName } from "@/lib/ordering";
import { loadScheduleTrainings } from "@/lib/training-schedule-server";

import { ScheduleForm } from "./schedule-form";

export default async function AdminTrainingSchedulePage() {
  const [teamRows, coachRows, locations, trainings] = await Promise.all([
    db.select({ id: teams.id, name: teams.name }).from(teams),
    db.select({ id: coaches.id, name: coaches.name }).from(coaches),
    getLocationHints(),
    loadScheduleTrainings(),
  ]);
  const today = toDateKey(new Date());

  return (
    <ScheduleForm
      today={today}
      teamOptions={sortByName(teamRows, (team) => team.name)}
      coachOptions={sortByName(coachRows, (coach) => coach.name)}
      locations={locations}
      // Only upcoming trainings can clash with a new schedule, which starts today at the earliest.
      existing={trainings.filter((training) => training.date >= today)}
    />
  );
}
