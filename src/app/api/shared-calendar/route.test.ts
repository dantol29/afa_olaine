import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { before, describe, test } from "node:test";

import { NextRequest } from "next/server";

import { GET } from "@/app/api/shared-calendar/route";
import { applySchema, insertClubLogo, insertEvent, insertGame, insertTeam, insertTraining } from "../../../../test/db";

// FK Olaine reads this feed; these tests pin the contract it relies on (see docs/shared-calendar.md).
const GOLDEN_FILE = path.join(process.cwd(), "docs/shared-calendar.v1.example.json");
const GOLDEN_GENERATED_AT = "2026-10-01T00:00:00.000Z";
const FROM = "2026-10-01";
const TO = "2026-10-31";

type FeedEvent = Record<string, unknown>;
type Feed = { version: number; club: string; timezone: string; generatedAt: string; events: FeedEvent[] };

function request(query: string, authorization: string | null = `Bearer ${process.env.SHARED_CALENDAR_SECRET}`) {
  const headers = new Headers();
  if (authorization !== null) headers.set("authorization", authorization);
  return GET(new NextRequest(`http://localhost:3000/api/shared-calendar?${query}`, { headers }));
}

async function feed(from = FROM, to = TO): Promise<Feed> {
  const response = await request(`from=${from}&to=${to}`);
  assert.equal(response.status, 200);
  return response.json();
}

function rigaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Riga", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** The checks FK Olaine applies to every event (parseEvent in its src/lib/shared-calendar.ts), restated here
 *  so a change on either side shows up as a failing test. Since FK's multi-day support (shared database 0.1.4) an
 *  event may start before the range as long as it ends within or after it; FK skips an event that fails. */
function assertPassesFkRules(payload: Feed, from: string, to: string) {
  assert.equal(payload.version, 1);
  assert.equal(payload.club, "AFA Olaine");
  assert.ok(Array.isArray(payload.events));
  for (const event of payload.events) {
    const start = new Date(String(event.start));
    const end = new Date(String(event.end));
    assert.match(String(event.uid), /^afa-olaine:(game|training|event)-[0-9]+$/);
    assert.equal(typeof event.uid, "string");
    assert.equal(typeof event.title, "string");
    assert.equal(typeof event.dateKey, "string");
    assert.ok(String(event.dateKey) <= to && rigaDateKey(new Date(end.getTime() - 1)) >= from, `${event.uid} does not overlap the range`);
    assert.ok(Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()), `${event.uid} has an invalid date`);
    assert.ok(end > start, `${event.uid} must end after it starts`);
    assert.equal(rigaDateKey(start), event.dateKey, `${event.uid} dateKey must be the Riga date of start`);
    assert.ok(["game", "training", "other"].includes(String(event.eventType)));
    assert.ok(event.location === null || typeof event.location === "string");
    assert.ok(event.team === null || typeof event.team === "string");
  }
}

before(async () => {
  await applySchema();
  const u11 = await insertTeam({ name: "U11" });
  const u9 = await insertTeam({ name: "U9" });
  await insertClubLogo("/uploads/clubs/afa.png", ["AFA Olaine"]);
  await insertClubLogo("https://cdn.example.lv/riga.png", ["FK Rīga"]);
  await insertClubLogo("javascript:alert(1)", ["Bad Logo FK"]);
  await insertGame(u11.id, { date: "2026-10-10", startTime: "12:00", endTime: "13:30" });
  await insertGame(u9.id, { homeTeam: "Bad Logo FK", awayTeam: "AFA Olaine", date: "2026-10-31", startTime: "10:00", endTime: "11:00", location: "Rīga" });
  await insertTraining([u11.id, u9.id], { date: "2026-10-01", startTime: "17:00", endTime: "18:30" });
  await insertTraining([], { date: "2026-10-02" });
  // 25 October 2026 is the day Riga moves from UTC+3 to UTC+2.
  await insertEvent({ date: "2026-10-25", startTime: "18:00", endTime: "19:00" });
  await insertEvent({ teamId: u11.id, title: "Vecāku sapulce", date: "2026-10-14" });
  await insertEvent({ title: "Ārpus diapazona", date: "2026-11-01" });
});

describe("shared calendar access", () => {
  test("is disabled with 503 until a secret is configured", async () => {
    const secret = process.env.SHARED_CALENDAR_SECRET;
    delete process.env.SHARED_CALENDAR_SECRET;
    try {
      const response = await request(`from=${FROM}&to=${TO}`, "Bearer anything");
      assert.equal(response.status, 503);
    } finally {
      process.env.SHARED_CALENDAR_SECRET = secret;
    }
  });

  test("rejects a missing, wrong or non-Bearer token with 401", async () => {
    const secret = process.env.SHARED_CALENDAR_SECRET;
    for (const authorization of [null, "", "Bearer ", "Bearer wrong", `Bearer ${secret}x`, `bearer ${secret}`, `Basic ${secret}`]) {
      const response = await request(`from=${FROM}&to=${TO}`, authorization);
      assert.equal(response.status, 401, String(authorization));
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    }
  });
});

describe("shared calendar date range", () => {
  test("rejects missing or malformed dates with 400", async () => {
    for (const query of ["", `from=${FROM}`, `to=${TO}`, "from=2026-10-1&to=2026-10-31", "from=2026-02-30&to=2026-03-01", "from=abc&to=2026-10-31", "from=2026-10-01T00:00&to=2026-10-31"]) {
      const response = await request(query);
      assert.equal(response.status, 400, query);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    }
  });

  test("rejects a range that ends before it starts", async () => {
    assert.equal((await request("from=2026-10-31&to=2026-10-01")).status, 400);
  });

  test("accepts at most 366 days, both ends included", async () => {
    assert.equal((await request("from=2026-01-01&to=2027-01-01")).status, 200);
    assert.equal((await request("from=2026-01-01&to=2027-01-02")).status, 400);
    assert.equal((await request("from=2027-10-10&to=2027-10-10")).status, 200);
  });

  test("a range without items gives an empty list", async () => {
    assert.deepEqual((await feed("2025-01-01", "2025-01-31")).events, []);
  });
});

describe("shared calendar response", () => {
  test("has the version 1 envelope and is never cached", async () => {
    const response = await request(`from=${FROM}&to=${TO}`);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    const payload: Feed = await response.json();
    assert.equal(payload.version, 1);
    assert.equal(payload.club, "AFA Olaine");
    assert.equal(payload.timezone, "Europe/Riga");
    assert.ok(Number.isFinite(Date.parse(payload.generatedAt)));
  });

  test("includes games, trainings with a team and events within the range, in start order", async () => {
    const { events } = await feed();
    assert.deepEqual(
      events.map((event) => [event.uid, event.eventType, event.team]),
      [
        ["afa-olaine:training-1", "training", "U9, U11"],
        ["afa-olaine:game-1", "game", "U11"],
        ["afa-olaine:event-2", "other", "U11"],
        ["afa-olaine:event-1", "other", null],
        ["afa-olaine:game-2", "game", "U9"],
      ],
    );
    assert.ok(events.every((event) => event.club === "AFA Olaine" && event.readOnly === true));
  });

  test("converts Riga wall-clock times to UTC across the daylight saving change", async () => {
    const byUid = new Map((await feed()).events.map((event) => [event.uid, event]));
    assert.equal(byUid.get("afa-olaine:game-1")?.start, "2026-10-10T09:00:00.000Z");
    assert.equal(byUid.get("afa-olaine:event-1")?.start, "2026-10-25T16:00:00.000Z");
  });

  test("game logos are absolute http(s) URLs or null", async () => {
    const games = (await feed()).events.filter((event) => event.eventType === "game");
    assert.deepEqual(
      games.map((event) => [event.homeLogo, event.awayLogo]),
      [
        ["http://localhost:3000/uploads/clubs/afa.png", "https://cdn.example.lv/riga.png"],
        [null, "http://localhost:3000/uploads/clubs/afa.png"],
      ],
    );
  });

  test("every event passes the rules FK Olaine applies", async () => {
    assertPassesFkRules(await feed(), FROM, TO);
  });
});

describe("shared calendar items with impossible times", () => {
  // December, away from the October range of the example file, so the file stays unchanged.
  const RANGE = ["2026-12-01", "2026-12-31"] as const;
  let ids: { goodGame: number; reversedGame: number; zeroLengthEvent: number; reversedTraining: number };

  before(async () => {
    const team = await insertTeam({ name: "U13" });
    // Saved before end-after-start validation existed, or written straight to the database.
    ids = {
      goodGame: (await insertGame(team.id, { date: "2026-12-05", startTime: "12:00", endTime: "13:30" })).id,
      reversedGame: (await insertGame(team.id, { date: "2026-12-06", startTime: "14:00", endTime: "13:00" })).id,
      zeroLengthEvent: (await insertEvent({ date: "2026-12-07", startTime: "18:00", endTime: "18:00" })).id,
      reversedTraining: (await insertTraining([team.id], { date: "2026-12-08", startTime: "19:00", endTime: "17:00" })).id,
    };
  });

  test("are left out and logged once each, while the rest of the feed is served", async (t) => {
    const warn = t.mock.method(console, "warn", () => undefined);
    const payload = await feed(...RANGE);

    assert.deepEqual(payload.events.map((event) => event.uid), [`afa-olaine:game-${ids.goodGame}`]);
    assertPassesFkRules(payload, ...RANGE);
    assert.deepEqual(warn.mock.calls.map((call) => call.arguments[0]).sort(), [
      `Shared calendar: skipped afa-olaine:event-${ids.zeroLengthEvent}: end is not after start`,
      `Shared calendar: skipped afa-olaine:game-${ids.reversedGame}: end is not after start`,
      `Shared calendar: skipped afa-olaine:training-${ids.reversedTraining}: end is not after start`,
    ]);
  });
});

describe("shared calendar example file", () => {
  // Set UPDATE_GOLDEN=1 to rewrite the file after an intended contract change; then update FK's copy too.
  test("matches docs/shared-calendar.v1.example.json", async () => {
    const actual = `${JSON.stringify({ ...(await feed()), generatedAt: GOLDEN_GENERATED_AT }, null, 2)}\n`;
    if (process.env.UPDATE_GOLDEN === "1") writeFileSync(GOLDEN_FILE, actual);
    assert.equal(actual, readFileSync(GOLDEN_FILE, "utf8"));
  });

  test("passes the rules FK Olaine applies", () => {
    assertPassesFkRules(JSON.parse(readFileSync(GOLDEN_FILE, "utf8")), FROM, TO);
  });
});

describe("shared calendar multi-day events", () => {
  // Riga moves to summer time on 28 March 2027, inside this event.
  before(async () => {
    await insertEvent({ title: "Treniņnometne", date: "2027-03-27", endDate: "2027-03-29", startTime: "10:00", endTime: "16:00" });
  });

  test("sends an event that started before the range but still runs in it, whole", async () => {
    const payload = await feed("2027-03-28", "2027-03-31");
    assertPassesFkRules(payload, "2027-03-28", "2027-03-31");
    const [camp] = payload.events;
    assert.equal(payload.events.length, 1);
    assert.equal(camp.title, "Treniņnometne");
    assert.equal(camp.dateKey, "2027-03-27");
    assert.equal(camp.start, "2027-03-27T08:00:00.000Z");
    assert.equal(camp.end, "2027-03-29T13:00:00.000Z");
  });

  test("leaves it out of a range after its last day", async () => {
    assert.deepEqual((await feed("2027-03-30", "2027-04-05")).events, []);
  });
});
