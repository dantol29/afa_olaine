import { isEndAfterStart } from "@/lib/time-range";

export function parseTrainingInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const coachIds = formData.getAll("coachIds").map(Number).filter((n) => Number.isFinite(n));
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!isEndAfterStart(startTime, endTime)) return { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    teamId,
    coachIds,
    date,
    startTime,
    endTime,
    location,
    notes: notes || null,
  } as const;
}
