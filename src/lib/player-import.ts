// Reads a roster pasted from WhatsApp (or typed) into people, then matches them with the players on file. Coaches send
// rosters in many shapes: "Name — 2015", "Name — 04.04.2015", WhatsApp exports with "VĀRTSARGI" headings and
// "Nr 7", and follow-ups with only a surname and the missing details. The same person may appear on several lines,
// each with part of the data; those lines are merged. Nothing here touches the database.
import { foldForSearch } from "@/lib/admin-suggestions";
import { parseBirthdate } from "@/lib/birthdate";

// "[08/11/2026, 13:52:38] Sender name: " at the start of a line copied from WhatsApp.
const WHATSAPP_PREFIX = /^\s*\[[^\]]*\]\s*[^:]{1,80}:\s*/;
const LIST_NUMBERING = /^\s*\d{1,3}[.)]\s+/;
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;
const FULL_DATE = /(?<!\d)(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?!\d)\.?/;
const ISO_DATE = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/;
const SHIRT_NUMBER = /(?:\bnr\.?|#)\s*(\d{1,3})(?!\d)/i;
const BIRTH_YEAR = /(?<!\d)((?:19|20)\d{2})(?!\d)/;
// Academy team names such as "U12", "WU8" or "U10-2".
const TEAM_HEADING = /^w?u\d{1,2}(?:-\d)?$/i;

// Position words in any form ("vārtsargs", "VĀRTSARGI", "uzbrucēji"), matched without diacritics.
const POSITION_STEMS: [stem: string, position: string][] = [
  ["vartsarg", "Vārtsargs"],
  ["aizsarg", "Aizsargs"],
  ["pussarg", "Pussargs"],
  ["uzbruc", "Uzbrucējs"],
];

export type ImportLine = {
  lineNumber: number;
  text: string;
  name: string;
  /** Stored form "DD.MM.GGGG.", only for a valid full date. */
  birthdate: string | null;
  /** A year alone ("2015"), which the database cannot store as a birthdate. */
  birthYear: string | null;
  /** A date-like text that is not a real birthdate, so the admin sees why it was dropped. */
  invalidDate: string | null;
  number: number | null;
  position: string | null;
};

export type ParsedRoster = {
  lines: ImportLine[];
  /** A team heading such as "U12" found in the text. */
  teamHint: string | null;
};

function positionOf(word: string): string | null {
  const folded = foldForSearch(word);
  return POSITION_STEMS.find(([stem]) => folded.startsWith(stem))?.[1] ?? null;
}

/** Name words without punctuation, for comparing names regardless of word order, case and diacritics. */
export function nameWords(name: string): string[] {
  return foldForSearch(name).split(" ").filter(Boolean);
}

/** One key per name whatever the word order: "Černovs Kristians" and "kristians cernovs" share it. */
export function nameKey(name: string): string {
  return [...nameWords(name)].sort().join(" ");
}

function cleanName(text: string): string {
  return text
    .replace(/[^\p{L}\s'’-]/gu, " ")
    .replace(/\s-+\s|^\s*-+|-+\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function takeDate(text: string): { rest: string; birthdate: string | null; invalidDate: string | null } {
  const iso = ISO_DATE.exec(text);
  const dotted = iso ? null : FULL_DATE.exec(text);
  const match = iso ?? dotted;
  if (!match) return { rest: text, birthdate: null, invalidDate: null };
  const value = iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : `${match[1]}.${match[2]}.${match[3]}`;
  const parsed = parseBirthdate(value);
  return {
    rest: text.replace(match[0], " "),
    birthdate: parsed.ok ? parsed.value : null,
    invalidDate: parsed.ok ? null : match[0],
  };
}

/** Reads every line of the pasted text. Headings set the position of the lines under them. */
export function parseRoster(text: string): ParsedRoster {
  const lines: ImportLine[] = [];
  let sectionPosition: string | null = null;
  let teamHint: string | null = null;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    let rest = rawLine.replace(WHATSAPP_PREFIX, "").replace(LIST_NUMBERING, "").replace(EMOJI, " ").trim();
    if (!rest) return;

    if (TEAM_HEADING.test(rest)) {
      teamHint ??= rest.toUpperCase();
      return;
    }

    const date = takeDate(rest);
    rest = date.rest;
    const numberMatch = SHIRT_NUMBER.exec(rest);
    if (numberMatch) rest = rest.replace(numberMatch[0], " ");
    const yearMatch = date.birthdate || date.invalidDate ? null : BIRTH_YEAR.exec(rest);
    if (yearMatch) rest = rest.replace(yearMatch[0], " ");

    let position: string | null = null;
    const words = cleanName(rest).split(" ").filter(Boolean);
    const nameParts = words.filter((word) => {
      const found = positionOf(word);
      if (found) position = found;
      return !found;
    });
    const name = nameParts.join(" ");
    const hasDetails = date.birthdate || date.invalidDate || numberMatch || yearMatch;

    // A line that is only a position word is a heading: "VĀRTSARGI".
    if (!name && position && !hasDetails) {
      sectionPosition = position;
      return;
    }
    if (!name) return;

    lines.push({
      lineNumber: index + 1,
      text: rawLine.trim(),
      name,
      birthdate: date.birthdate,
      birthYear: yearMatch?.[1] ?? null,
      invalidDate: date.invalidDate,
      number: numberMatch ? Number(numberMatch[1]) : null,
      position: position ?? sectionPosition,
    });
  });

  return { lines, teamHint };
}

/** One person gathered from all the lines about them. A field seen with different values keeps every value. */
export type ImportPerson = {
  key: string;
  name: string;
  lines: ImportLine[];
  birthdates: string[];
  birthYears: string[];
  numbers: number[];
  positions: string[];
};

function distinct<T>(values: readonly (T | null)[]): T[] {
  return [...new Set(values.filter((value): value is T => value !== null))];
}

function personFrom(key: string, lines: ImportLine[]): ImportPerson {
  // The fullest spelling names the person: a later "Černovs" must not replace "Kristians Sergejs Černovs".
  const name = lines.map((line) => line.name).reduce((longest, name) => (name.length > longest.length ? name : longest));
  return {
    key,
    name,
    lines,
    birthdates: distinct(lines.map((line) => line.birthdate)),
    birthYears: distinct(lines.map((line) => line.birthYear)),
    numbers: distinct(lines.map((line) => line.number)),
    positions: distinct(lines.map((line) => line.position)),
  };
}

/** Merges lines about the same person: the same name words in any order, or a single surname that only one full
 *  name in the text contains. A surname matching several people, or none, stays a person of its own. */
export function groupPeople(lines: readonly ImportLine[]): ImportPerson[] {
  const groups = new Map<string, ImportLine[]>();
  const add = (key: string, line: ImportLine) => groups.set(key, [...(groups.get(key) ?? []), line]);

  const fullNames = lines.filter((line) => nameWords(line.name).length > 1);
  for (const line of fullNames) add(nameKey(line.name), line);

  for (const line of lines.filter((line) => nameWords(line.name).length === 1)) {
    const [word] = nameWords(line.name);
    const owners = [...groups.keys()].filter((key) => key.split(" ").includes(word));
    add(owners.length === 1 ? owners[0] : nameKey(line.name), line);
  }

  // Keeps the order of the text: by each person's first line.
  return [...groups]
    .map(([key, personLines]) => personFrom(key, [...personLines].sort((a, b) => a.lineNumber - b.lineNumber)))
    .sort((a, b) => a.lines[0].lineNumber - b.lines[0].lineNumber);
}

export type ExistingPlayer = {
  id: number;
  name: string;
  birthdate: string;
  number: number | null;
  position: string | null;
  teamIds: number[];
};

/** Who on file this person may be. `match` is set when exactly one player fits; `candidates` lists everyone that
 *  could be meant, for the admin to choose when there is no single answer. */
export type PlayerMatch = { match: number | null; candidates: number[] };

export function matchPerson(person: ImportPerson, players: readonly ExistingPlayer[], teamId: number | null): PlayerMatch {
  const words = person.key.split(" ");
  if (words.length === 1) {
    // A surname alone is only looked for in the chosen team, where it is likely to be unique.
    const inTeam = players.filter((player) => teamId !== null && player.teamIds.includes(teamId) && nameWords(player.name).includes(words[0]));
    return { match: inTeam.length === 1 ? inTeam[0].id : null, candidates: inTeam.map((player) => player.id) };
  }

  const sameName = players.filter((player) => nameKey(player.name) === person.key);
  if (person.birthdates.length === 1) {
    const sameDate = sameName.filter((player) => player.birthdate === person.birthdates[0]);
    if (sameDate.length === 1) return { match: sameDate[0].id, candidates: [sameDate[0].id] };
    // The same name with another birthdate is likely someone else: the admin decides.
    return { match: null, candidates: sameName.map((player) => player.id) };
  }
  // A birth year alone still tells namesakes apart.
  const sameYear = person.birthYears.length === 1 ? sameName.filter((player) => player.birthdate.endsWith(`.${person.birthYears[0]}.`)) : [];
  if (sameName.length > 1 && sameYear.length === 1) return { match: sameYear[0].id, candidates: sameName.map((player) => player.id) };
  return { match: sameName.length === 1 ? sameName[0].id : null, candidates: sameName.map((player) => player.id) };
}
