import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  buildSchedule,
  filterScheduleByTeam,
  pickHomeEntries,
  scheduleTeamOptions,
  splitSchedule,
  type ScheduleEvent,
  type ScheduleGameFields,
} from "@/lib/schedule";

const MAIN = { id: 1, name: "2. liga", sort: 2 };
const WU8 = { id: 7, name: "WU8", sort: 0 };
const U10 = { id: 9, name: "U10", sort: 1 };

function game(id: number, rawDate: string, time: string, team: typeof MAIN, isPast = false): ScheduleGameFields {
  return { id, rawDate, time, teamId: team.id, teamName: team.name, teamSort: team.sort, isMainTeam: team === MAIN, isPast };
}

/** `null` is an event of no team; an array gives an event of several teams. */
function event(id: number, rawDate: string, startTime: string, team: typeof MAIN | (typeof MAIN)[] | null, isPast = false): ScheduleEvent {
  const teams = team === null ? [] : Array.isArray(team) ? team : [team];
  return {
    id, title: `Pasākums ${id}`, day: "", month: "", year: "", rawDate, rawEndDate: null, startTime, endTime: "18:00",
    location: "Olaine", teams, href: null, isPast,
  };
}

const keys = (entries: { key: string }[]) => entries.map((entry) => entry.key);

describe("buildSchedule", () => {
  test("merges games and events by date and start time", () => {
    const entries = buildSchedule(
      [game(1, "2026-12-05", "14:00", MAIN), game(2, "2026-11-28", "11:00", MAIN)],
      [event(1, "2026-12-05", "11:00", WU8), event(2, "2026-11-29", "10:00", null)],
    );
    assert.deepEqual(keys(entries), ["game-2", "event-2", "event-1", "game-1"]);
  });

  test("puts a game before an event that starts at the same time", () => {
    const entries = buildSchedule([game(3, "2026-12-05", "11:00", U10)], [event(4, "2026-12-05", "11:00", WU8)]);
    assert.deepEqual(keys(entries), ["game-3", "event-4"]);
  });
});

describe("splitSchedule", () => {
  test("upcoming nearest first, past latest first", () => {
    const entries = buildSchedule(
      [game(1, "2026-10-01", "12:00", MAIN, true), game(2, "2026-12-01", "12:00", MAIN)],
      [event(1, "2026-10-10", "12:00", WU8, true), event(2, "2026-11-30", "12:00", WU8)],
    );
    const { upcoming, past } = splitSchedule(entries);
    assert.deepEqual(keys(upcoming), ["event-2", "game-2"]);
    assert.deepEqual(keys(past), ["event-1", "game-1"]);
  });
});

describe("filterScheduleByTeam", () => {
  const entries = buildSchedule(
    [game(1, "2026-12-01", "12:00", MAIN), game(2, "2026-12-02", "12:00", U10)],
    [event(1, "2026-12-03", "12:00", WU8), event(2, "2026-12-04", "12:00", null)],
  );

  test("keeps everything without a team", () => {
    assert.equal(filterScheduleByTeam(entries, null).length, 4);
  });

  test("keeps the team's games and events, without events that belong to no team", () => {
    assert.deepEqual(keys(filterScheduleByTeam(entries, WU8.id)), ["event-1"]);
    assert.deepEqual(keys(filterScheduleByTeam(entries, U10.id)), ["game-2"]);
  });

  test("shows an event of several teams under each of them", () => {
    const shared = buildSchedule([], [event(3, "2026-12-05", "12:00", [WU8, U10])]);
    assert.deepEqual(keys(filterScheduleByTeam(shared, WU8.id)), ["event-3"]);
    assert.deepEqual(keys(filterScheduleByTeam(shared, U10.id)), ["event-3"]);
    assert.deepEqual(keys(filterScheduleByTeam(shared, MAIN.id)), []);
    assert.deepEqual(scheduleTeamOptions(shared), [{ id: 7, name: "WU8" }, { id: 9, name: "U10" }]);
  });
});

describe("scheduleTeamOptions", () => {
  test("lists teams of games and events once, in the admin team order, without events of no team", () => {
    const entries = buildSchedule(
      [game(1, "2026-12-01", "12:00", MAIN), game(2, "2026-12-02", "12:00", U10), game(3, "2026-12-09", "12:00", MAIN)],
      [event(1, "2026-12-03", "12:00", WU8), event(2, "2026-12-04", "12:00", null)],
    );
    assert.deepEqual(scheduleTeamOptions(entries), [{ id: 7, name: "WU8" }, { id: 9, name: "U10" }, { id: 1, name: "2. liga" }]);
  });
});

describe("pickHomeEntries", () => {
  test("puts the main team's next game first, then the nearest others", () => {
    const { upcoming } = splitSchedule(buildSchedule(
      [game(1, "2026-12-12", "14:00", MAIN), game(2, "2026-12-01", "12:00", U10)],
      [event(1, "2026-11-28", "11:00", WU8), event(2, "2026-11-29", "10:00", null), event(3, "2026-11-30", "10:00", WU8)],
    ));
    assert.deepEqual(keys(pickHomeEntries(upcoming, 3)), ["game-1", "event-1", "event-2"]);
  });

  test("takes the nearest entries when the main team has no upcoming game", () => {
    const { upcoming } = splitSchedule(buildSchedule(
      [game(2, "2026-12-01", "12:00", U10)],
      [event(1, "2026-11-28", "11:00", WU8), event(2, "2026-11-29", "10:00", null)],
    ));
    assert.deepEqual(keys(pickHomeEntries(upcoming, 3)), ["event-1", "event-2", "game-2"]);
  });

  test("shows the main team's game even when it is the only entry", () => {
    const { upcoming } = splitSchedule(buildSchedule([game(1, "2026-12-12", "14:00", MAIN)], []));
    assert.deepEqual(keys(pickHomeEntries(upcoming, 3)), ["game-1"]);
  });
});
