import "server-only";

import { db } from "@/db/client";
import type { ScheduleTraining } from "@/lib/training-schedule";

/** Every training with its teams, in the shape the schedule and "delete similar" checks use. */
export async function loadScheduleTrainings(): Promise<ScheduleTraining[]> {
  const rows = await db.query.trainings.findMany({ with: { trainingTeams: true } });
  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    location: row.location,
    teamIds: row.trainingTeams.map((link) => link.teamId),
  }));
}
