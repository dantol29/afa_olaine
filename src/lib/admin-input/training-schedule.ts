import { isEndAfterStart } from "@/lib/time-range";
import { MAX_SCHEDULE_DAYS, isDateKey } from "@/lib/training-schedule";

/** Checks the schedule form: the shared fields of the trainings and the dates the admin left ticked. */
export function parseTrainingScheduleInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const coachIds = formData.getAll("coachIds").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const dates = [...new Set(formData.getAll("dates").map((value) => String(value).trim()))].sort();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isInteger(teamId) || teamId <= 0) return { error: "Jāizvēlas komanda." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!isEndAfterStart(startTime, endTime)) return { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  if (dates.length === 0) return { error: "Nav atzīmēts neviens datums." } as const;
  if (dates.length > MAX_SCHEDULE_DAYS || !dates.every(isDateKey)) return { error: "Nederīgi datumi." } as const;

  return { teamId, coachIds, dates, startTime, endTime, location, notes: notes || null } as const;
}

/** Checks the "delete similar" form: the until-date and the ids of the trainings left ticked. */
export function parseSimilarDeleteInput(formData: FormData) {
  const until = String(formData.get("until") ?? "").trim();
  const ids = [...new Set(formData.getAll("trainingIds").map(Number))].filter((n) => Number.isInteger(n) && n > 0);
  if (!isDateKey(until)) return { error: "Jānorāda datums, līdz kuram dzēst." } as const;
  if (ids.length === 0) return { error: "Nav atzīmēts neviens treniņš." } as const;
  return { until, ids } as const;
}
