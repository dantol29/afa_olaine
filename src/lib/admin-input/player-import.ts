import { MIN_SHIRT_NUMBER } from "@/lib/admin-input/players";
import { parseBirthdate } from "@/lib/birthdate";

// The rows the player import sends to the server. The page builds them from the pasted roster and the admin's
// choices, but the server checks every value again before saving.

export type ImportFieldValues = { name: string; birthdate: string; number: string; position: string };
export type ImportRowPayload =
  | { kind: "new"; lineNumber: number; values: ImportFieldValues }
  | { kind: "update"; lineNumber: number; playerId: number; changes: Partial<ImportFieldValues>; addToTeam: boolean };

type PlayerFields = { name: string; birthdate: string; number: number | null; position: string | null };
export type PlayerCreate = PlayerFields;
export type PlayerUpdate = { playerId: number; changes: Partial<PlayerFields>; addToTeam: boolean };

type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

function readName(raw: string): FieldResult<string> {
  const name = raw.replace(/\s+/g, " ").trim();
  return name ? { ok: true, value: name } : { ok: false, error: "Vārds, uzvārds ir obligāts." };
}

function readBirthdate(raw: string, now: Date): FieldResult<string> {
  if (!raw.trim()) return { ok: false, error: "Dzimšanas datums ir obligāts." };
  return parseBirthdate(raw, now);
}

function readNumber(raw: string): FieldResult<number | null> {
  const text = raw.trim();
  if (!text) return { ok: true, value: null };
  const number = Number(text);
  return Number.isInteger(number) && number >= MIN_SHIRT_NUMBER
    ? { ok: true, value: number }
    : { ok: false, error: "Numuram jābūt pozitīvam veselam skaitlim." };
}

// Any position is accepted, as in the player form; the page offers only the list.
function readPosition(raw: string): string | null {
  return raw.trim() || null;
}

const rowError = (lineNumber: number, error: string) => ({ error: `${lineNumber}. rinda: ${error}` }) as const;

/** Checks the import: a team, and every new player and change. One bad value rejects the whole import, naming its
 *  line, so nothing is saved half-way. */
export function parsePlayerImport(teamIdRaw: unknown, rowsRaw: unknown, now: Date = new Date()) {
  const teamId = Number(teamIdRaw);
  if (!Number.isInteger(teamId) || teamId <= 0) return { error: "Jāizvēlas komanda." } as const;

  let rows: ImportRowPayload[];
  try {
    rows = JSON.parse(String(rowsRaw ?? ""));
  } catch {
    return { error: "Neizdevās nolasīt importa datus." } as const;
  }
  if (!Array.isArray(rows)) return { error: "Neizdevās nolasīt importa datus." } as const;

  const creates: PlayerCreate[] = [];
  const updates: PlayerUpdate[] = [];
  for (const row of rows) {
    const lineNumber = Number(row?.lineNumber) || 0;
    if (row?.kind === "new") {
      const values = row.values ?? ({} as ImportFieldValues);
      const name = readName(String(values.name ?? ""));
      if (!name.ok) return rowError(lineNumber, name.error);
      const birthdate = readBirthdate(String(values.birthdate ?? ""), now);
      if (!birthdate.ok) return rowError(lineNumber, birthdate.error);
      const number = readNumber(String(values.number ?? ""));
      if (!number.ok) return rowError(lineNumber, number.error);
      creates.push({ name: name.value, birthdate: birthdate.value, number: number.value, position: readPosition(String(values.position ?? "")) });
    } else if (row?.kind === "update") {
      const playerId = Number(row.playerId);
      if (!Number.isInteger(playerId) || playerId <= 0) return rowError(lineNumber, "Nav izvēlēts spēlētājs.");
      const changes: Partial<PlayerFields> = {};
      const raw = row.changes ?? {};
      if (raw.name !== undefined) {
        const name = readName(String(raw.name));
        if (!name.ok) return rowError(lineNumber, name.error);
        changes.name = name.value;
      }
      if (raw.birthdate !== undefined) {
        const birthdate = readBirthdate(String(raw.birthdate), now);
        if (!birthdate.ok) return rowError(lineNumber, birthdate.error);
        changes.birthdate = birthdate.value;
      }
      if (raw.number !== undefined) {
        const number = readNumber(String(raw.number));
        if (!number.ok) return rowError(lineNumber, number.error);
        changes.number = number.value;
      }
      if (raw.position !== undefined) changes.position = readPosition(String(raw.position));
      const addToTeam = row.addToTeam === true;
      if (Object.keys(changes).length > 0 || addToTeam) updates.push({ playerId, changes, addToTeam });
    } else {
      return { error: "Neizdevās nolasīt importa datus." } as const;
    }
  }

  if (creates.length === 0 && updates.length === 0) return { error: "Nav nekā, ko saglabāt." } as const;
  return { teamId, creates, updates } as const;
}
