import { slugify } from "@/lib/admin-input/articles";

// An event's public page is /notikumi/<title in Latin letters>-<id>. The id at the end finds the event, so two events
// with the same title never share an address, and an address from before a title change still opens the event (the
// page then moves to the current address).

/** Used when a title has no Latin letters or digits at all. */
const FALLBACK_SLUG = "notikums";

export function eventSlug(id: number, title: string): string {
  return `${slugify(title) || FALLBACK_SLUG}-${id}`;
}

export function eventPath(id: number, title: string): string {
  return `/notikumi/${eventSlug(id, title)}`;
}

/** The event id at the end of an address slug, or null when there is none. */
export function eventIdFromSlug(slug: string): number | null {
  const match = /(?:^|-)(\d+)$/.exec(slug);
  const id = match ? Number(match[1]) : NaN;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
