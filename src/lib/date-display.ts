// How a stored date key ("YYYY-MM-DD", the storage and feed format of both sites) is shown to people: day first, as
// everywhere on the site. Pure and import-free, so server pages and client forms share it.

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "2026-12-05" → "05.12."; anything that is not a date key is returned unchanged. */
export function formatDayMonth(dateKey: string): string {
  const match = DATE_KEY.exec(dateKey);
  return match ? `${match[3]}.${match[2]}.` : dateKey;
}

/** "2026-12-05" → "05.12.2026"; anything that is not a date key is returned unchanged. */
export function formatDate(dateKey: string): string {
  const match = DATE_KEY.exec(dateKey);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : dateKey;
}
