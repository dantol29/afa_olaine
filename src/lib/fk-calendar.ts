import "server-only";

// FK Olaine's own bookings, read from its /api/shared-calendar (the mirror of AFA's feed, see
// docs/shared-calendar.md). They are only used for warnings in the admin (venue clashes, place suggestions) and are
// never stored: each read asks FK, a successful answer is kept in memory for a minute, and when FK cannot answer the
// last answer is used and marked stale.

export type FkEventType = "game" | "training" | "other";

export type FkBooking = {
  uid: string;
  title: string;
  location: string | null;
  start: Date;
  end: Date;
  /** Riga date of the start, "YYYY-MM-DD". */
  dateKey: string;
  eventType: FkEventType;
  team: string | null;
  teamNames: string[];
};

export type FkScheduleStatus = "ok" | "unconfigured" | "unavailable" | "stale";
export type FkSchedule = { bookings: FkBooking[]; status: FkScheduleStatus; error?: string; updatedAt?: Date };

const FK_UID = /^fk-olaine:(game|training|event)-[0-9]+$/;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const EVENT_TYPES: readonly string[] = ["game", "training", "other"];
const REQUEST_TIMEOUT_MS = 4_000;
const CACHE_MS = 60_000;
const FAILURE_RETRY_MS = 10_000;
const MAX_CACHE_ENTRIES = 16;
/** FK, like AFA, answers at most 366 days per request. */
const MAX_RANGE_DAYS = 365;

class FeedError extends Error {}

const INVALID_FEED = "FK kalendāra atbilde nav derīga.";

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

/** One FK booking, or null when it is not usable; a bad booking is skipped rather than hiding the others. */
function parseBooking(value: unknown, from: string, to: string): FkBooking | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const start = new Date(String(row.start));
  const end = new Date(String(row.end));
  const teamNames = Array.isArray(row.teamNames) ? row.teamNames : [];
  if (
    typeof row.uid !== "string" || !FK_UID.test(row.uid) ||
    typeof row.title !== "string" ||
    typeof row.dateKey !== "string" || !DATE_KEY.test(row.dateKey) || row.dateKey < from || row.dateKey > to ||
    !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start ||
    !EVENT_TYPES.includes(String(row.eventType)) ||
    !isStringOrNull(row.location ?? null) || !isStringOrNull(row.team ?? null) ||
    !teamNames.every((name) => typeof name === "string")
  ) {
    return null;
  }
  return {
    uid: row.uid,
    title: row.title,
    location: (row.location as string | null | undefined) ?? null,
    start,
    end,
    dateKey: row.dateKey,
    eventType: row.eventType as FkEventType,
    team: (row.team as string | null | undefined) ?? null,
    teamNames: teamNames as string[],
  };
}

/** The bookings of one FK answer for from..to. A wrong overall shape fails the answer; single bad bookings are left
 *  out and counted in the log. */
export function parseFkFeed(payload: unknown, from: string, to: string): FkBooking[] {
  if (!payload || typeof payload !== "object") throw new FeedError(INVALID_FEED);
  const feed = payload as Record<string, unknown>;
  if (feed.version !== 1 || feed.club !== "FK Olaine" || !Array.isArray(feed.events)) throw new FeedError(INVALID_FEED);
  const bookings = feed.events.map((event) => parseBooking(event, from, to));
  const skipped = bookings.filter((booking) => booking === null).length;
  if (skipped > 0) console.warn(`FK calendar: skipped ${skipped} invalid booking(s) for ${from}..${to}`);
  return bookings.filter((booking) => booking !== null);
}

function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** from..to split into pieces FK accepts in one request. */
export function splitRange(from: string, to: string): { from: string; to: string }[] {
  const ranges: { from: string; to: string }[] = [];
  for (let start = from; start <= to; ) {
    const end = addDays(start, MAX_RANGE_DAYS) < to ? addDays(start, MAX_RANGE_DAYS) : to;
    ranges.push({ from: start, to: end });
    start = addDays(end, 1);
  }
  return ranges;
}

function failureMessage(status: number): string {
  if (status >= 300 && status < 400) return "FK kalendāra adrese pāradresē uz citu lapu.";
  if (status === 401 || status === 403) return "FK kalendārs neatļāva piekļuvi (jāpārbauda kopīgais atslēgas vārds).";
  if (status === 404) return "FK kalendārs šajā adresē nav atrasts.";
  return "FK kalendārs pašlaik nav pieejams.";
}

async function fetchRange(base: URL, secret: string, range: { from: string; to: string }): Promise<FkBooking[]> {
  const url = new URL(base);
  url.searchParams.set("from", range.from);
  url.searchParams.set("to", range.to);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
    // A redirect could carry the secret to another address.
    redirect: "manual",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new FeedError(failureMessage(response.status));
  if (!response.headers.get("content-type")?.includes("application/json")) throw new FeedError(INVALID_FEED);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new FeedError(INVALID_FEED);
  }
  return parseFkFeed(payload, range.from, range.to);
}

async function loadFkSchedule(from: string, to: string): Promise<FkSchedule> {
  const configured = process.env.FK_CALENDAR_URL;
  const secret = process.env.SHARED_CALENDAR_SECRET;
  if (!configured || !secret) return { bookings: [], status: "unconfigured" };
  try {
    const base = new URL(configured);
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password) throw new FeedError("FK kalendāra adrese nav derīga.");
    const chunks = await Promise.all(splitRange(from, to).map((range) => fetchRange(base, secret, range)));
    const bookings = [...new Map(chunks.flat().map((booking) => [booking.uid, booking])).values()];
    return { bookings: bookings.sort((a, b) => a.start.getTime() - b.start.getTime()), status: "ok", updatedAt: new Date() };
  } catch (error) {
    // Only fixed messages reach the page: never the address or the secret.
    const message =
      error instanceof FeedError
        ? error.message
        : error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)
          ? "FK kalendārs neatbildēja 4 sekunžu laikā."
          : "Neizdevās savienoties ar FK kalendāru.";
    console.error("FK calendar could not be loaded:", message);
    return { bookings: [], status: "unavailable", error: message };
  }
}

type CacheEntry = { result: FkSchedule; lastGood?: FkSchedule; attemptedAt: number };
// Per server process; it starts empty after a restart.
const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<FkSchedule>>();

/** FK bookings that start from `from` to `to` (Riga dates, inclusive). */
export async function getFkSchedule(from: string, to: string): Promise<FkSchedule> {
  const key = `${process.env.FK_CALENDAR_URL ?? ""}|${from}|${to}`;
  const previous = cache.get(key);
  const now = Date.now();
  if (previous) {
    const age = now - previous.attemptedAt;
    if (previous.result.status === "ok" ? age < CACHE_MS : age < FAILURE_RETRY_MS) return previous.result;
  }
  const running = pending.get(key);
  if (running) return running;

  const request = (async () => {
    const fresh = await loadFkSchedule(from, to);
    const lastGood = fresh.status === "ok" ? fresh : previous?.lastGood;
    const result: FkSchedule =
      fresh.status === "unavailable" && lastGood ? { ...lastGood, status: "stale", error: fresh.error } : fresh;
    cache.delete(key);
    cache.set(key, { result, lastGood, attemptedAt: Date.now() });
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
    return result;
  })();
  pending.set(key, request);
  try {
    return await request;
  } finally {
    pending.delete(key);
  }
}
