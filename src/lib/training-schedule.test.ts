import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { findChangeClash, findClash, findSimilarTrainings, isoWeekday, scheduleDates, timesOverlap, type ScheduleTraining } from "@/lib/training-schedule";

const training = (id: number, date: string, startTime = "18:00", endTime = "19:30", teamIds = [1]): ScheduleTraining => ({
  id,
  date,
  startTime,
  endTime,
  location: "Stadions",
  teamIds,
});

describe("scheduleDates", () => {
  test("gives the chosen weekdays in the period, both ends included", () => {
    // 2026-11-23 is a Monday.
    assert.equal(isoWeekday("2026-11-23"), 1);
    assert.equal(isoWeekday("2026-11-29"), 7);
    assert.deepEqual(scheduleDates("2026-11-23", "2026-12-07", [1, 3]), {
      dates: ["2026-11-23", "2026-11-25", "2026-11-30", "2026-12-02", "2026-12-07"],
    });
  });

  test("crosses a month and a daylight-saving change without skipping days", () => {
    assert.deepEqual(scheduleDates("2027-03-26", "2027-04-02", [5]), { dates: ["2027-03-26", "2027-04-02"] });
  });

  test("refuses an unusable period", () => {
    assert.deepEqual(scheduleDates("2026-12-01", "2026-11-01", [1]), { error: "Perioda beigām jābūt vēlāk par sākumu." });
    assert.deepEqual(scheduleDates("", "2026-11-01", [1]), { error: "Jānorāda perioda sākums un beigas." });
    assert.deepEqual(scheduleDates("2026-02-30", "2026-03-01", [1]), { error: "Jānorāda perioda sākums un beigas." });
    assert.deepEqual(scheduleDates("2026-01-01", "2027-06-01", [1]), { error: "Periods nevar būt garāks par 366 dienām." });
    assert.deepEqual(scheduleDates("2026-01-01", "2026-02-01", []), { error: "Jāizvēlas vismaz viena nedēļas diena." });
  });
});

describe("findClash", () => {
  const existing = [training(1, "2026-11-23", "18:00", "19:30", [1, 2]), training(2, "2026-11-25", "18:00", "19:30", [3])];

  test("finds an overlapping training of any of the given teams on that day", () => {
    assert.equal(findClash("2026-11-23", "19:00", "20:30", [2], existing)?.id, 1);
    assert.equal(findClash("2026-11-23", "19:00", "20:30", [7, 1], existing)?.id, 1);
  });

  test("ignores touching times, other teams and other days", () => {
    assert.equal(timesOverlap("19:30", "21:00", "18:00", "19:30"), false);
    assert.equal(findClash("2026-11-23", "19:30", "21:00", [1], existing), null);
    assert.equal(findClash("2026-11-25", "18:00", "19:30", [1, 2], existing), null);
    assert.equal(findClash("2026-11-24", "18:00", "19:30", [1], existing), null);
  });
});

describe("findSimilarTrainings", () => {
  const source = training(10, "2026-11-23");
  const all = [
    training(9, "2026-11-16"), // before the source
    source,
    training(11, "2026-11-30"),
    { ...training(12, "2026-12-07"), location: "Cits", teamIds: [1] }, // another place still matches
    training(13, "2026-12-01"), // a Tuesday
    training(14, "2026-12-14", "18:00", "20:00"), // another end time
    training(15, "2026-12-21", "18:00", "19:30", [1, 2]), // another set of teams
    training(16, "2026-12-28"),
  ];

  test("matches weekday, times and teams from the source's date, itself included", () => {
    assert.deepEqual(findSimilarTrainings(source, null, all).map((item) => item.id), [10, 11, 12, 16]);
  });

  test("stops at the until-date, inclusive", () => {
    assert.deepEqual(findSimilarTrainings(source, "2026-12-07", all).map((item) => item.id), [10, 11, 12]);
  });
});

describe("findChangeClash", () => {
  const moving = training(1, "2026-11-23", "18:00", "19:30", [1]);
  const alsoMoving = training(2, "2026-11-23", "19:30", "21:00", [1]);
  const other = training(3, "2026-11-23", "20:00", "21:30", [1, 2]);
  const otherTeam = training(4, "2026-11-23", "19:00", "20:30", [5]);
  const all = [moving, alsoMoving, other, otherTeam];

  test("finds another training of the team that the new time would overlap", () => {
    assert.equal(findChangeClash(moving, "19:00", "20:30", [1], all, new Set([1]))?.id, 2);
    assert.equal(findChangeClash(moving, "20:30", "22:00", [1], all, new Set([1]))?.id, 2);
  });

  test("checks the new teams: an added team's training at that time is a clash", () => {
    assert.equal(findChangeClash(moving, "18:00", "19:30", [1, 5], all, new Set([1]))?.id, 4);
    assert.equal(findChangeClash(moving, "17:00", "18:30", [1, 5], all, new Set([1])), null);
  });

  test("ignores the trainings changed together, other teams and the training itself", () => {
    assert.equal(findChangeClash(moving, "18:30", "19:45", [1], all, new Set([1, 2])), null);
    assert.equal(findChangeClash(moving, "20:30", "22:00", [1], all, new Set([1, 2]))?.id, 3);
    assert.equal(findChangeClash(moving, "17:00", "18:30", [1], all, new Set([1])), null);
  });
});
