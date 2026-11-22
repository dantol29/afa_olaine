import { notFound } from "next/navigation";

import { WeekCalendar } from "@/components/week-calendar";
import { db } from "@/db/client";
import { sortByName } from "@/lib/ordering";
import { coaches, teams } from "@/db/schema";
import { getScheduleForWeekBrowsing, type CalendarEvent } from "@/lib/calendar";
import { copySourceId } from "@/lib/admin-copy";
import { getLocationHints } from "@/lib/admin-form-hints";
import { findSimilarTrainings } from "@/lib/training-schedule";
import { loadScheduleTrainings } from "@/lib/training-schedule-server";
import type { SearchParamValue } from "@/lib/url-state";

import { SimilarDelete } from "./similar-delete";

import { TrainingForm } from "./training-form";

// The form edits one team per training (the first, as before); a copy takes the same team.
async function findTrainingFormValues(trainingId: number) {
  const training = await db.query.trainings.findFirst({
    where: (trainings, { eq }) => eq(trainings.id, trainingId),
    with: { trainingCoaches: true, trainingTeams: true },
  });
  return training && { ...training, teamId: training.trainingTeams[0]?.teamId ?? 0 };
}

export default async function AdminTrainingFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [teamRows, coachRows, locations] = await Promise.all([
    db.select().from(teams),
    db.select({ id: coaches.id, name: coaches.name }).from(coaches),
    getLocationHints(),
  ]);
  const teamOptions = sortByName(teamRows, (team) => team.name);
  const coachOptions = sortByName(coachRows, (coach) => coach.name);

  let training = null;
  let copyOf = undefined;
  if (id === "new") {
    // `?kopija=<id>` fills the new-training form from that training, with its team and coaches.
    const sourceId = copySourceId(query);
    copyOf = sourceId === null ? undefined : await findTrainingFormValues(sourceId);
  } else {
    training = await findTrainingFormValues(Number(id));
    if (!training) notFound();
  }

  // The repeats of the training being edited, for "Dzēst līdzīgos"; the page narrows them to an until-date.
  let similar: ReturnType<typeof findSimilarTrainings> = [];
  if (training) {
    const all = await loadScheduleTrainings();
    const source = all.find((item) => item.id === training.id);
    similar = source ? findSimilarTrainings(source, null, all) : [];
  }

  let events: CalendarEvent[] = [];
  try {
    events = await getScheduleForWeekBrowsing();
  } catch {
    events = [];
  }

  return (
    <div>
      {training ? (
        <>
        <TrainingForm
          mode="edit"
          trainingId={training.id}
          training={training}
          teamOptions={teamOptions}
          coachOptions={coachOptions}
          locations={locations}
        />
        <SimilarDelete trainingId={training.id} date={training.date} similar={similar} />
        </>
      ) : (
        <TrainingForm mode="create" teamOptions={teamOptions} coachOptions={coachOptions} locations={locations} copyOf={copyOf} />
      )}

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-club-navy">
          Esošais grafiks (lai zinātu, kas jau ir aizņemts)
        </h2>
        <WeekCalendar events={events} />
      </div>
    </div>
  );
}
