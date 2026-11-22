import { normalizeVenue } from "@/lib/venue";

// The "Vietas" page: every way a place is written, on AFA and on FK, with similar spellings side by side so the admin
// can make them one. Grouping only puts names next to each other; nothing is merged without the admin.

export type VenueUsage = {
  name: string;
  /** AFA entries that a rename changes. */
  trainings: number;
  games: number;
  events: number;
  /** AFA games imported from LFF: the LFF sync owns their place, so a rename leaves them as they are. */
  lffGames: number;
  /** FK bookings written exactly this way. */
  fk: number;
};

/** The shortest name that still groups by containment needs this many words, so "stadions" alone groups nothing. */
const MIN_SHARED_WORDS = 2;

function words(name: string): Set<string> {
  return new Set(normalizeVenue(name).split(" ").filter(Boolean));
}

/** Same after normalization, or every word of the shorter name (at least two) appears in the longer one:
 *  "Olaines stadions" and "Olaines pilsētas stadions", "Futbola centrs Rūpnīca" and its version with the address. */
export function areSimilarVenues(first: string, second: string): boolean {
  const a = words(first);
  const b = words(second);
  const [shorter, longer] = a.size <= b.size ? [a, b] : [b, a];
  if (shorter.size === 0) return false;
  if (normalizeVenue(first) === normalizeVenue(second)) return true;
  return shorter.size >= MIN_SHARED_WORDS && [...shorter].every((word) => longer.has(word));
}

export function afaCount(usage: VenueUsage): number {
  return usage.trainings + usage.games + usage.events + usage.lffGames;
}

function total(usage: VenueUsage): number {
  return afaCount(usage) + usage.fk;
}

/** Names joined into groups through similar pairs (so A~B and B~C put A, B, C together). Groups with more than one
 *  name come first, then the most used; inside a group the most used name leads. */
export function groupSimilarVenues(usages: readonly VenueUsage[]): VenueUsage[][] {
  const parent = usages.map((_, index) => index);
  const root = (index: number): number => (parent[index] === index ? index : (parent[index] = root(parent[index])));
  for (let i = 0; i < usages.length; i++) {
    for (let j = i + 1; j < usages.length; j++) {
      if (areSimilarVenues(usages[i].name, usages[j].name)) parent[root(j)] = root(i);
    }
  }
  const groups = new Map<number, VenueUsage[]>();
  usages.forEach((usage, index) => groups.set(root(index), [...(groups.get(root(index)) ?? []), usage]));
  const byUse = (a: VenueUsage, b: VenueUsage) => total(b) - total(a) || a.name.localeCompare(b.name, "lv");
  return [...groups.values()]
    .map((group) => [...group].sort(byUse))
    .sort((a, b) => Number(b.length > 1) - Number(a.length > 1) || byUse(a[0], b[0]));
}
