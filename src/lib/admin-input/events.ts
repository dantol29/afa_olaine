import { parseTeamIds } from "@/lib/admin-input/trainings";
import { eventDatesProblem, storedEndDate } from "@/lib/event-dates";

export function parseEventInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  // Sent only while "Vairākas dienas" is ticked.
  const endDate = storedEndDate(date, String(formData.get("endDate") ?? ""));
  const location = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  // No ticked team means the event concerns the whole club.
  const teamIds = parseTeamIds(formData);

  if (!title) return { error: "Nosaukums ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  const datesProblem = eventDatesProblem(date, startTime, endDate, endTime);
  if (datesProblem) return { error: datesProblem } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;

  return {
    title,
    date,
    startTime,
    endDate,
    endTime,
    location,
    notes: notes || null,
    teamIds,
  } as const;
}
