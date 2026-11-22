import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, mock, test } from "node:test";

import { getFkSchedule, parseFkFeed, splitRange } from "./fk-calendar";

const URL_ENV = "http://localhost:3001/api/shared-calendar";
const SECRET = "local-test-secret";

function booking(overrides: Record<string, unknown> = {}) {
  return {
    uid: "fk-olaine:game-1",
    club: "FK Olaine",
    readOnly: true,
    title: "FK Olaine – Ogre",
    location: "Olaines pilsētas stadions",
    allDay: false,
    start: "2026-11-28T10:00:00.000Z",
    end: "2026-11-28T11:45:00.000Z",
    dateKey: "2026-11-28",
    eventType: "game",
    team: "Virsliga",
    ...overrides,
  };
}

function feed(events: unknown[]) {
  return { version: 1, club: "FK Olaine", timezone: "Europe/Riga", generatedAt: "2026-11-22T10:00:00.000Z", events };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("parseFkFeed", () => {
  test("reads the bookings and keeps the shared teams", () => {
    const [game, training] = parseFkFeed(
      feed([booking(), booking({ uid: "fk-olaine:training-2", eventType: "training", team: "U14", teamNames: ["U14", "U16"] })]),
      "2026-11-01",
      "2026-11-30",
    );
    assert.equal(game.uid, "fk-olaine:game-1");
    assert.equal(game.start.toISOString(), "2026-11-28T10:00:00.000Z");
    assert.deepEqual(game.teamNames, []);
    assert.deepEqual(training.teamNames, ["U14", "U16"]);
  });

  test("skips bad bookings and keeps the others", () => {
    const warn = mock.method(console, "warn", () => {});
    try {
      const bookings = parseFkFeed(
        feed([
          booking({ uid: "fk-olaine:game-1" }),
          booking({ uid: "afa-olaine:game-2" }),
          booking({ uid: "fk-olaine:game-3", end: "2026-11-28T09:00:00.000Z" }),
          booking({ uid: "fk-olaine:game-4", start: "nonsense" }),
          booking({ uid: "fk-olaine:game-5", dateKey: "2026-12-05" }),
          booking({ uid: "fk-olaine:game-6", eventType: "party" }),
          booking({ uid: "fk-olaine:game-7", teamNames: [1] }),
          null,
        ]),
        "2026-11-01",
        "2026-11-30",
      );
      assert.deepEqual(bookings.map((item) => item.uid), ["fk-olaine:game-1"]);
      assert.equal(warn.mock.callCount(), 1);
    } finally {
      warn.mock.restore();
    }
  });

  test("refuses an answer of the wrong shape", () => {
    assert.throws(() => parseFkFeed({ version: 2, club: "FK Olaine", events: [] }, "2026-11-01", "2026-11-30"));
    assert.throws(() => parseFkFeed({ version: 1, club: "AFA Olaine", events: [] }, "2026-11-01", "2026-11-30"));
    assert.throws(() => parseFkFeed("<html>", "2026-11-01", "2026-11-30"));
  });
});

test("splitRange keeps each request within 366 days", () => {
  assert.deepEqual(splitRange("2026-01-01", "2026-01-31"), [{ from: "2026-01-01", to: "2026-01-31" }]);
  assert.deepEqual(splitRange("2025-11-22", "2027-11-22"), [
    { from: "2025-11-22", to: "2026-11-22" },
    { from: "2026-11-23", to: "2027-11-22" },
  ]);
});

describe("getFkSchedule", () => {
  let fetchMock: ReturnType<typeof mock.method>;
  let responses: (() => Response | Promise<Response>)[];

  beforeEach(() => {
    process.env.FK_CALENDAR_URL = URL_ENV;
    process.env.SHARED_CALENDAR_SECRET = SECRET;
    responses = [];
    fetchMock = mock.method(globalThis, "fetch", async () => {
      const next = responses.shift();
      if (!next) throw new Error("unexpected request");
      return next();
    });
    mock.method(console, "error", () => {});
    mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-22T10:00:00.000Z") });
  });

  afterEach(() => {
    mock.restoreAll();
    mock.timers.reset();
    delete process.env.FK_CALENDAR_URL;
    delete process.env.SHARED_CALENDAR_SECRET;
  });

  test("asks FK with the secret, then answers from memory for a minute", async () => {
    responses.push(() => jsonResponse(feed([booking()])));
    const first = await getFkSchedule("2026-11-01", "2026-11-30");
    assert.equal(first.status, "ok");
    assert.equal(first.bookings.length, 1);
    const [url, init] = fetchMock.mock.calls[0].arguments as [URL, RequestInit];
    assert.equal(url.searchParams.get("from"), "2026-11-01");
    assert.equal(url.searchParams.get("to"), "2026-11-30");
    assert.equal((init.headers as Record<string, string>).Authorization, `Bearer ${SECRET}`);
    assert.equal(init.redirect, "manual");

    mock.timers.tick(59_000);
    assert.equal((await getFkSchedule("2026-11-01", "2026-11-30")).status, "ok");
    assert.equal(fetchMock.mock.callCount(), 1);
  });

  test("uses the last answer, marked stale, when FK stops answering", async () => {
    const december = booking({ start: "2026-12-05T10:00:00.000Z", end: "2026-12-05T11:45:00.000Z", dateKey: "2026-12-05" });
    responses.push(() => jsonResponse(feed([december])));
    await getFkSchedule("2026-12-01", "2026-12-31");
    mock.timers.tick(61_000);
    responses.push(() => jsonResponse({ error: "down" }, 503));
    const stale = await getFkSchedule("2026-12-01", "2026-12-31");
    assert.equal(stale.status, "stale");
    assert.equal(stale.bookings.length, 1);
    assert.equal(stale.error, "FK kalendārs pašlaik nav pieejams.");
  });

  test("reports a refused secret without any bookings", async () => {
    responses.push(() => jsonResponse({ error: "Unauthorized" }, 401));
    const result = await getFkSchedule("2027-01-01", "2027-01-31");
    assert.equal(result.status, "unavailable");
    assert.deepEqual(result.bookings, []);
    assert.match(result.error ?? "", /neatļāva piekļuvi/);
  });

  test("does not ask FK when it is not configured", async () => {
    delete process.env.FK_CALENDAR_URL;
    const result = await getFkSchedule("2027-02-01", "2027-02-28");
    assert.equal(result.status, "unconfigured");
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
