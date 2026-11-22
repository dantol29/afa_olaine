import { isEndAfterStart } from "@/lib/time-range";

export const NO_TEAM_ERROR = "Jāizvēlas vismaz viena komanda.";

/** The ticked teams of a training form: a training may belong to several teams at once (a shared session). */
export function parseTeamIds(formData: FormData, name = "teamIds"): number[] {
  return [...new Set(formData.getAll(name).map(Number))].filter((id) => Number.isInteger(id) && id > 0).sort((a, b) => a - b);
}

export function parseTrainingInput(formData: FormData) {
  const teamIds = parseTeamIds(formData);
  const coachIds = formData.getAll("coachIds").map(Number).filter((n) => Number.isFinite(n));
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (teamIds.length === 0) return { error: NO_TEAM_ERROR } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!isEndAfterStart(startTime, endTime)) return { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    teamIds,
    coachIds,
    date,
    startTime,
    endTime,
    location,
    notes: notes || null,
  } as const;
}
