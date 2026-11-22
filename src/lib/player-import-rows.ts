// The editable rows of the player import table: one per person, either a new player or changes to one on file.
// Pure, so the page and the tests share it.
import type { ImportFieldValues, ImportRowPayload } from "@/lib/admin-input/player-import";
import { parseBirthdate } from "@/lib/birthdate";
import { groupPeople, matchPerson, nameKey, parseRoster, type ExistingPlayer, type ImportPerson } from "@/lib/player-import";

export type ImportField = keyof ImportFieldValues;
export const IMPORT_FIELDS: readonly ImportField[] = ["name", "birthdate", "number", "position"];

/** "new", a player id, or null while the admin has not chosen between namesakes. */
export type ImportTarget = "new" | number | null;

export type ImportRow = {
  key: string;
  lineNumber: number;
  sourceLines: string[];
  include: boolean;
  target: ImportTarget;
  candidates: number[];
  /** Values the roster gave for each field, when it gave more than one, to pick from. */
  variants: Record<ImportField, string[]>;
  values: ImportFieldValues;
  /** Which fields of a player on file to overwrite; for a new player every field is saved. */
  apply: Record<ImportField, boolean>;
  addToTeam: boolean;
  /** What the roster said that could not be used, such as a year without the day. */
  note: string | null;
};

const NO_APPLY: Record<ImportField, boolean> = { name: false, birthdate: false, number: false, position: false };

function storedValues(player: ExistingPlayer): ImportFieldValues {
  return { name: player.name, birthdate: player.birthdate, number: player.number === null ? "" : String(player.number), position: player.position ?? "" };
}

/** Whether a field's value differs from what is on file. A name differs only in its words, not their order or case. */
export function differsFromStored(field: ImportField, value: string, player: ExistingPlayer): boolean {
  const stored = storedValues(player)[field];
  if (field === "name") return nameKey(value) !== nameKey(stored);
  if (field === "birthdate") {
    const parsed = parseBirthdate(value);
    return parsed.ok ? parsed.value !== stored : value.trim() !== "";
  }
  return value.trim() !== stored;
}

/** The fields to overwrite by default: those the roster gives and that differ, except the name, whose spelling on
 *  file is usually the one to keep. */
function defaultApply(values: ImportFieldValues, player: ExistingPlayer): Record<ImportField, boolean> {
  return {
    name: false,
    birthdate: values.birthdate !== "" && differsFromStored("birthdate", values.birthdate, player),
    number: values.number !== "" && differsFromStored("number", values.number, player),
    position: values.position !== "" && differsFromStored("position", values.position, player),
  };
}

function noteFor(person: ImportPerson): string | null {
  if (person.birthdates.length > 0) return null;
  const invalid = person.lines.find((line) => line.invalidDate)?.invalidDate;
  if (invalid) return `Nederīgs datums: ${invalid}`;
  if (person.birthYears.length > 0) return `Tikai gads: ${person.birthYears.join(", ")}`;
  return null;
}

/** Points a row at a player on file (or at a new one) and resets which fields change to fit that choice. */
export function retarget(row: ImportRow, target: ImportTarget, players: readonly ExistingPlayer[], teamId: number | null): ImportRow {
  const player = typeof target === "number" ? players.find((item) => item.id === target) : undefined;
  if (!player) return { ...row, target, apply: NO_APPLY, addToTeam: false, include: target === "new" && isNewRowValid(row.values) };
  const apply = defaultApply(row.values, player);
  const addToTeam = teamId !== null && !player.teamIds.includes(teamId);
  return { ...row, target, apply, addToTeam, include: addToTeam || Object.values(apply).some(Boolean) };
}

export function isNewRowValid(values: ImportFieldValues): boolean {
  return values.name.trim() !== "" && parseBirthdate(values.birthdate).ok;
}

/** Turns the pasted text into rows, matched against the players on file within the chosen team. */
export function buildImportRows(text: string, players: readonly ExistingPlayer[], teamId: number | null): ImportRow[] {
  return groupPeople(parseRoster(text).lines).map((person) => {
    const { match, candidates } = matchPerson(person, players, teamId);
    const row: ImportRow = {
      key: person.key,
      lineNumber: person.lines[0].lineNumber,
      sourceLines: person.lines.map((line) => line.text),
      include: false,
      target: null,
      candidates,
      variants: {
        name: [],
        birthdate: person.birthdates.length > 1 ? person.birthdates : [],
        number: person.numbers.length > 1 ? person.numbers.map(String) : [],
        position: person.positions.length > 1 ? person.positions : [],
      },
      values: {
        name: person.name,
        birthdate: person.birthdates[0] ?? "",
        number: person.numbers[0] === undefined ? "" : String(person.numbers[0]),
        position: person.positions[0] ?? "",
      },
      apply: NO_APPLY,
      addToTeam: false,
      note: noteFor(person),
    };
    const target: ImportTarget = match ?? (candidates.length === 0 ? "new" : null);
    return retarget(row, target, players, teamId);
  });
}

/** The rows to send: included ones with a target, as new players or as the chosen changes. */
export function importPayload(rows: readonly ImportRow[], players: readonly ExistingPlayer[]): ImportRowPayload[] {
  return rows.flatMap((row): ImportRowPayload[] => {
    if (!row.include || row.target === null) return [];
    if (row.target === "new") return [{ kind: "new", lineNumber: row.lineNumber, values: row.values }];
    const player = players.find((item) => item.id === row.target);
    if (!player) return [];
    const changes: Partial<ImportFieldValues> = {};
    for (const field of IMPORT_FIELDS) {
      if (row.apply[field] && differsFromStored(field, row.values[field], player)) changes[field] = row.values[field];
    }
    return [{ kind: "update", lineNumber: row.lineNumber, playerId: player.id, changes, addToTeam: row.addToTeam }];
  });
}

/** Whether an included row cannot be saved as it stands: a new player without a valid name and birthdate, or a
 *  namesake not yet chosen. */
export function rowProblem(row: ImportRow): string | null {
  if (!row.include) return null;
  if (row.target === null) return "Izvēlies spēlētāju";
  if (row.target === "new" && !isNewRowValid(row.values)) return row.values.name.trim() ? "Vajag pilnu dzimšanas datumu" : "Vajag vārdu";
  return null;
}

/** The team the roster names in a heading such as "U12", among the team options. */
export function teamFromHint(text: string, teams: readonly { id: number; name: string }[]): number | null {
  const hint = parseRoster(text).teamHint;
  return hint ? teams.find((team) => team.name.toUpperCase() === hint)?.id ?? null : null;
}
