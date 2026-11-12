// The one place that defines the order of names in lists shown on the site and in the admin.
// Pure and import-free, so server loaders and client components share the same rules.

// SQLite compares text by code point, so Ņ and Ž land after Z and "U11" before "U9"; names are sorted here instead.
// `numeric` compares digit runs by value (U9 before U11). One shared instance: building a collator is costly.
const latvianCollator = new Intl.Collator("lv", { numeric: true });

export function compareLatvian(a: string, b: string): number {
  return latvianCollator.compare(a, b);
}

/** Sorted copy in Latvian name order; the sort is stable, so equal names keep their input order. */
export function sortByName<T>(items: readonly T[], getName: (item: T) => string): T[] {
  return [...items].sort((a, b) => compareLatvian(getName(a), getName(b)));
}

/** Sorted copy for public rosters: people with a photo first, Latvian name order inside each group. */
export function orderRoster<T>(items: readonly T[], getName: (item: T) => string, hasPhoto: (item: T) => boolean): T[] {
  return [...items].sort(
    (a, b) => Number(hasPhoto(b)) - Number(hasPhoto(a)) || compareLatvian(getName(a), getName(b)),
  );
}

/** Non-empty, de-duplicated labels in Latvian order: filter options and comma-joined relation names. */
export function uniqueSortedLabels(values: Iterable<string | null | undefined>): string[] {
  const labels = new Set<string>();
  for (const value of values) {
    if (value) labels.add(value);
  }
  return [...labels].sort(compareLatvian);
}

/** Chronological comparator for calendar items; with a stable sort, equal starts keep their input order. */
export function compareByStart(a: { start: Date }, b: { start: Date }): number {
  return a.start.getTime() - b.start.getTime();
}
