// Venue names are typed by hand, so one place can be written several ways. Two names count as the same
// venue only when they match after this normalization: case, punctuation, quotes and spacing are ignored, but every
// other difference (another pitch, another address) keeps them apart. Joining genuinely different spellings is the
// admin's choice on the venues page, not a guess here.

const IGNORED_CHARACTERS = /[.,"'„“”«»]/g;
const SPACES = /\s+/g;

export function normalizeVenue(name: string): string {
  return name.normalize("NFKC").toLocaleLowerCase("lv").replace(IGNORED_CHARACTERS, " ").replace(SPACES, " ").trim();
}

export function isSameVenue(first: string | null | undefined, second: string | null | undefined): boolean {
  if (!first || !second) return false;
  const normalized = normalizeVenue(first);
  return normalized !== "" && normalized === normalizeVenue(second);
}
