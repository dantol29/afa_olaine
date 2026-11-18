import { isEndAfterStart } from "@/lib/time-range";

export function parseEventInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const teamIdRaw = String(formData.get("teamId") ?? "");
  const teamId = teamIdRaw ? Number(teamIdRaw) : null;

  if (!title) return { error: "Nosaukums ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!isEndAfterStart(startTime, endTime)) return { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    title,
    date,
    startTime,
    endTime,
    location,
    notes: notes || null,
    teamId,
  } as const;
}
