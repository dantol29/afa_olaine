// How a stored date key ("YYYY-MM-DD", the storage and feed format of both sites) is shown to people: day first, as
// everywhere on the site, and without the year when it is the current one ("05.12." in 2026, "05.12.2025" for an
// older date). Form fields show the full date, since there the value itself is being set. Pure and import-free, so
// server pages and client components share it.

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const RIGA_YEAR = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric" });

/** The year on Riga's calendar now, e.g. "2026". */
export function currentRigaYear(now: Date = new Date()): string {
  return RIGA_YEAR.format(now);
}

/** "2026" in 2025 or 2027, "" in 2026: the year to write after a day and month. */
export function yearUnlessCurrent(year: string | number, currentYear: string = currentRigaYear()): string {
  return String(year) === currentYear ? "" : String(year);
}

/** "2026-12-05" → "05.12."; anything that is not a date key is returned unchanged. */
export function formatDayMonth(dateKey: string): string {
  const match = DATE_KEY.exec(dateKey);
  return match ? `${match[3]}.${match[2]}.` : dateKey;
}

/** "2026-12-05" → "05.12.2026" always: form fields and search text. Anything else is returned unchanged. */
export function formatFullDate(dateKey: string): string {
  const match = DATE_KEY.exec(dateKey);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : dateKey;
}

/** "2026-12-05" → "05.12." in 2026, "05.12.2026" in any other year. Anything else is returned unchanged. */
export function formatDate(dateKey: string, currentYear: string = currentRigaYear()): string {
  const match = DATE_KEY.exec(dateKey);
  return match ? `${match[3]}.${match[2]}.${yearUnlessCurrent(match[1], currentYear)}` : dateKey;
}
