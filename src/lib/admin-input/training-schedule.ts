import { isEndAfterStart } from "@/lib/time-range";
import { MAX_SCHEDULE_DAYS, isDateKey } from "@/lib/training-schedule";
import { NO_TEAM_ERROR, parseTeamIds } from "@/lib/admin-input/trainings";

/** Checks the schedule form: the shared fields of the trainings and the dates the admin left ticked. */
export function parseTrainingScheduleInput(formData: FormData) {
  const teamIds = parseTeamIds(formData);
  const coachIds = formData.getAll("coachIds").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const dates = [...new Set(formData.getAll("dates").map((value) => String(value).trim()))].sort();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (teamIds.length === 0) return { error: NO_TEAM_ERROR } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!isEndAfterStart(startTime, endTime)) return { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  if (dates.length === 0) return { error: "Nav atzīmēts neviens datums." } as const;
  if (dates.length > MAX_SCHEDULE_DAYS || !dates.every(isDateKey)) return { error: "Nederīgi datumi." } as const;

  return { teamIds, coachIds, dates, startTime, endTime, location, notes: notes || null } as const;
}

/** Checks the "similar trainings" selection: the until-date and the ids of the trainings left ticked. */
export function parseSimilarSelectionInput(formData: FormData) {
  const until = String(formData.get("until") ?? "").trim();
  const ids = [...new Set(formData.getAll("trainingIds").map(Number))].filter((n) => Number.isInteger(n) && n > 0);
  if (!isDateKey(until)) return { error: "Jānorāda datums «Līdz»." } as const;
  if (ids.length === 0) return { error: "Nav atzīmēts neviens treniņš." } as const;
  return { until, ids } as const;
}

/** Checks the "change similar" form: the same until-date and ticked trainings as deleting, plus the new times, place
 *  and teams. An empty time or place means "keep as is"; the teams are always sent (the current ones by default), so
 *  whether they change, and so whether anything changes at all, is decided against the source training. */
export function parseSimilarChangeInput(formData: FormData) {
  const selection = parseSimilarSelectionInput(formData);
  if ("error" in selection) return { error: selection.error } as const;

  const startTime = String(formData.get("newStartTime") ?? "").trim();
  const endTime = String(formData.get("newEndTime") ?? "").trim();
  const location = String(formData.get("newLocation") ?? "").trim();
  if ((startTime === "") !== (endTime === "")) return { error: "Jānorāda gan jaunais sākuma, gan beigu laiks." } as const;
  if (startTime && !isEndAfterStart(startTime, endTime)) return { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." } as const;
  const teamIds = parseTeamIds(formData, "newTeamIds");
  if (teamIds.length === 0) return { error: NO_TEAM_ERROR } as const;

  return {
    until: selection.until,
    ids: selection.ids,
    teamIds,
    changes: { ...(startTime ? { startTime, endTime } : {}), ...(location ? { location } : {}) },
  } as const;
}
