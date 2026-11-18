import { isEndAfterStart } from "@/lib/time-range";

export function parseGameInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const homeTeam = String(formData.get("homeTeam") ?? "").trim();
  const awayTeam = String(formData.get("awayTeam") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const league = String(formData.get("league") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const parseScore = (name: "homeScore" | "awayScore") => {
    const raw = String(formData.get(name) ?? "").trim();
    if (!raw) return null;
    const score = Number(raw);
    return Number.isInteger(score) && score >= 0 ? score : undefined;
  };
  const homeScore = parseScore("homeScore");
  const awayScore = parseScore("awayScore");

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!homeTeam) return { error: "Mājinieki ir obligāti." } as const;
  if (!awayTeam) return { error: "Viesi ir obligāti." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!startTime) return { error: "Sākuma laiks ir obligāts." } as const;
  if (!endTime) return { error: "Beigu laiks ir obligāts." } as const;
  if (!isEndAfterStart(startTime, endTime)) return { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." } as const;
  if (!location) return { error: "Vieta ir obligāta." } as const;
  if (homeScore === undefined || awayScore === undefined) return { error: "Rezultātam jābūt veselam skaitlim no 0." } as const;

  return {
    teamId,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    date,
    startTime,
    endTime,
    location,
    league: league || null,
    notes: notes || null,
  } as const;
}
