// Shared by the admin form (client) and the server actions, so it must stay free of server-only imports.

export const BIRTHDATE_ERROR = "Nederīgs datums. Formāts: DD.MM.GGGG.";

const MIN_BIRTH_YEAR = 1930;
// Youngest person we accept: the academy has no players under this age.
const MIN_AGE_YEARS = 5;
const SEPARATORS = /[-/\\, ]/g;
const BIRTHDATE_PATTERN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/;

export type BirthdateResult = { ok: true; value: string } | { ok: false; error: string };

/** Swaps one character for one character, so the text length (and the caret position) never changes. */
export function replaceDateSeparators(raw: string): string {
  return raw.replace(SEPARATORS, ".");
}

/** Validates a birthdate and returns it in the stored form "DD.MM.GGGG." */
export function parseBirthdate(raw: string, now: Date = new Date()): BirthdateResult {
  const normalized = replaceDateSeparators(raw.trim()).replace(/\.{2,}/g, ".");
  const match = BIRTHDATE_PATTERN.exec(normalized);
  if (!match) return { ok: false, error: BIRTHDATE_ERROR };

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isRealDate) return { ok: false, error: BIRTHDATE_ERROR };

  if (year < MIN_BIRTH_YEAR || year > now.getUTCFullYear() - MIN_AGE_YEARS || date.getTime() > now.getTime()) {
    return { ok: false, error: BIRTHDATE_ERROR };
  }

  return { ok: true, value: `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}.` };
}
