import { parseTeamIds } from "@/lib/admin-input/trainings";
import { MAX_BODY_LENGTH, MAX_RAW_BODY_LENGTH } from "@/lib/content-limits";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";
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
  const rawDescription = String(formData.get("description") ?? "");
  // No ticked team means the event concerns the whole club.
  const teamIds = parseTeamIds(formData);

  if (!title) return { error: "Nosaukums ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  const datesProblem = eventDatesProblem(date, startTime, endDate, endTime);
  if (datesProblem) return { error: datesProblem } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  // The description is optional; an editor left with only empty paragraphs counts as none.
  if (rawDescription.length > MAX_RAW_BODY_LENGTH) return { error: "Apraksts ir pārāk garš." } as const;
  const description = sanitizeRichText(rawDescription);
  if (description.length > MAX_BODY_LENGTH) return { error: "Apraksts ir pārāk garš." } as const;

  return {
    title,
    date,
    startTime,
    endDate,
    endTime,
    location,
    notes: notes || null,
    description: richTextHasContent(description) ? description : null,
    teamIds,
  } as const;
}
