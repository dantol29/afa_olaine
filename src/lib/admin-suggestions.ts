// Suggestions for admin text fields whose values pile up in the database (opponents, places, leagues, event titles).
// The admin picks a value seen before or types a new one; the field stays free text, so nothing is enforced.
import { compareLatvian } from "@/lib/ordering";

/** How many suggestions a field lists at once. */
export const SUGGESTION_LIMIT = 8;

/** Text as compared when searching: no diacritics, lower case, single spaces ("Bērziņš" -> "berzins"). */
export function foldForSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("lv").replace(/\s+/g, " ").trim();
}

/** Distinct non-empty values, most used first, then alphabetically. `alsoInclude` adds values with no uses yet. */
export function rankByFrequency(
  values: readonly (string | null | undefined)[],
  alsoInclude: readonly string[] = [],
): string[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = raw?.trim();
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  for (const raw of alsoInclude) {
    const value = raw.trim();
    if (value && !counts.has(value)) counts.set(value, 0);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || compareLatvian(a[0], b[0])).map(([value]) => value);
}

/** Distinct non-empty values, the one used on the latest date first, so the last stage of a series comes on top. */
export function rankByRecency(rows: readonly { value: string; date: string }[]): string[] {
  const latest = [...rows].sort((a, b) => b.date.localeCompare(a.date));
  return [...new Set(latest.map((row) => row.value.trim()).filter(Boolean))];
}

/** Moves the values matching `isPinned` to the front, keeping the order within both groups. */
export function pinFirst(values: readonly string[], isPinned: (value: string) => boolean): string[] {
  return [...values.filter(isPinned), ...values.filter((value) => !isPinned(value))];
}

/** Options containing the typed text, ignoring case and diacritics; those starting with it come first. Empty text,
 *  or text equal to an option, lists every option, so a filled field still offers the alternatives. */
export function matchSuggestions<Option>(
  options: readonly Option[],
  text: string,
  labelOf: (option: Option) => string,
  limit = SUGGESTION_LIMIT,
): Option[] {
  const query = foldForSearch(text);
  const isExact = options.some((option) => foldForSearch(labelOf(option)) === query);
  if (!query || isExact) return options.slice(0, limit);

  const starting: Option[] = [];
  const containing: Option[] = [];
  for (const option of options) {
    const label = foldForSearch(labelOf(option));
    if (label.startsWith(query)) starting.push(option);
    else if (label.includes(query)) containing.push(option);
  }
  return [...starting, ...containing].slice(0, limit);
}
