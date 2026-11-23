import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { clashLevel, findVenueClashes, venueClashPairs, worstLevel, type PlannedBooking, type VenueBooking } from "./venue-clash";

const STADIUM = "Olaines pilsētas stadions";

function plan(kind: PlannedBooking["kind"], startTime: string, endTime: string, overrides: Partial<PlannedBooking> = {}): PlannedBooking {
  return { kind, location: STADIUM, date: "2026-11-28", startTime, endTime, ...overrides };
}

function booked(key: string, kind: VenueBooking["kind"], startTime: string, endTime: string, overrides: Partial<VenueBooking> = {}): VenueBooking {
  return { key, title: key, ...plan(kind, startTime, endTime), ...overrides };
}

describe("clashLevel", () => {
  // Every pair is checked both ways round: the rule must not depend on which booking is the planned one.
  const cases: [string, PlannedBooking, PlannedBooking, "red" | "orange" | null][] = [
    ["game overlaps a training", plan("game", "12:00", "13:45"), plan("training", "13:00", "14:30"), "red"],
    ["game overlaps a game", plan("game", "12:00", "13:45"), plan("game", "13:00", "14:45"), "red"],
    ["game overlaps an event", plan("game", "12:00", "13:45"), plan("event", "10:00", "18:00"), "red"],
    ["training ends 20 min before a game", plan("training", "10:00", "11:40"), plan("game", "12:00", "13:45"), "red"],
    ["training ends 30 min before a game", plan("training", "10:00", "11:30"), plan("game", "12:00", "13:45"), null],
    ["training starts 29 min after a game", plan("game", "12:00", "13:45"), plan("training", "14:14", "15:30"), "red"],
    ["training starts 30 min after a game", plan("game", "12:00", "13:45"), plan("training", "14:15", "15:30"), null],
    ["two trainings overlap", plan("training", "17:00", "18:30"), plan("training", "18:00", "19:30"), "orange"],
    ["training and event overlap", plan("training", "17:00", "18:30"), plan("event", "18:00", "20:00"), "orange"],
    ["two events overlap", plan("event", "10:00", "12:00"), plan("event", "11:00", "13:00"), "orange"],
    ["trainings back to back", plan("training", "17:00", "18:30"), plan("training", "18:30", "20:00"), null],
    ["same time, another venue", plan("game", "12:00", "13:45"), plan("training", "12:00", "13:30", { location: "Olaines sporta nams" }), null],
    ["same time, another day", plan("game", "12:00", "13:45"), plan("training", "12:00", "13:30", { date: "2026-11-29" }), null],
    ["venue written differently", plan("game", "12:00", "13:45"), plan("training", "12:00", "13:30", { location: "olaines pilsētas stadions." }), "red"],
    ["no venue", plan("game", "12:00", "13:45", { location: null }), plan("training", "12:00", "13:30"), null],
    ["end not after start", plan("training", "12:00", "12:00"), plan("game", "12:00", "13:45"), null],
    ["game just after midnight, training late the day before", plan("training", "22:00", "23:50", { date: "2026-11-27" }), plan("game", "00:10", "01:00"), "red"],
    ["multi-day event over a game", plan("event", "10:00", "18:00", { date: "2026-11-27", endDate: "2026-11-29" }), plan("game", "12:00", "13:45"), "red"],
  ];
  for (const [name, first, second, expected] of cases) {
    test(name, () => {
      assert.equal(clashLevel(first, second), expected);
      assert.equal(clashLevel(second, first), expected);
    });
  }
});

test("findVenueClashes lists red first, then by start, and worstLevel sums them up", () => {
  const bookings = [
    booked("training-1", "training", "16:00", "17:30"),
    booked("game-2", "game", "18:00", "19:45"),
    booked("training-3", "training", "17:00", "18:00"),
    booked("training-4", "training", "17:00", "18:00", { location: "Olaines sporta nams" }),
  ];
  const clashes = findVenueClashes(plan("training", "17:00", "18:30"), bookings);
  assert.deepEqual(
    clashes.map((clash) => [clash.booking.key, clash.level]),
    [["game-2", "red"], ["training-1", "orange"], ["training-3", "orange"]],
  );
  assert.equal(worstLevel(clashes), "red");
  assert.equal(worstLevel(clashes.filter((clash) => clash.level === "orange")), "orange");
  assert.equal(worstLevel([]), null);
});

test("venueClashPairs lists only red pairs, earlier booking first", () => {
  const pairs = venueClashPairs([
    booked("training-1", "training", "17:00", "18:30"),
    booked("training-2", "training", "18:00", "19:30"),
    booked("game-3", "game", "12:00", "13:45"),
    booked("training-4", "training", "10:00", "11:40"),
    booked("game-5", "game", "20:00", "21:45", { date: "2026-11-29" }),
    booked("training-6", "training", "20:30", "21:30", { date: "2026-11-29" }),
  ]);
  assert.deepEqual(
    pairs.map((pair) => [pair.level, pair.first.key, pair.second.key]),
    [
      ["red", "training-4", "game-3"],
      ["red", "game-5", "training-6"],
    ],
  );
});
