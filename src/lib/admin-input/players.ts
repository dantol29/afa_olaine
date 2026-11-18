import { parseBirthdate } from "@/lib/birthdate";

/** Shirt numbers start at 1; the player form uses the same minimum. */
export const MIN_SHIRT_NUMBER = 1;

export function parsePlayerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const birthdateRaw = String(formData.get("birthdate") ?? "").trim();
  const teamIds = formData.getAll("teamIds").map(Number).filter((n) => Number.isFinite(n));
  const numberRaw = String(formData.get("number") ?? "").trim();
  const number = numberRaw === "" ? null : Number(numberRaw);
  const position = String(formData.get("position") ?? "").trim() || null;

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!birthdateRaw) return { error: "Dzimšanas datums ir obligāts." } as const;
  const parsedBirthdate = parseBirthdate(birthdateRaw);
  if (!parsedBirthdate.ok) return { error: parsedBirthdate.error } as const;
  const birthdate = parsedBirthdate.value;
  if (teamIds.length === 0) return { error: "Jāizvēlas vismaz viena komanda." } as const;
  if (number !== null && (!Number.isInteger(number) || number < MIN_SHIRT_NUMBER)) {
    return { error: "Numuram jābūt pozitīvam veselam skaitlim." } as const;
  }

  // Goals are tracked per team (a player can score a different tally in
  // each league they play in) — one "goals-<teamId>" field per checked team.
  const teamGoals = new Map<number, number>();
  for (const teamId of teamIds) {
    const raw = Number(formData.get(`goals-${teamId}`));
    teamGoals.set(teamId, Number.isFinite(raw) && raw >= 0 ? Math.trunc(raw) : 0);
  }

  return { name, birthdate, teamGoals, number, position } as const;
}
