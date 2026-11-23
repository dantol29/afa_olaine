import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { splitAdminSchedule } from "@/lib/admin-schedule-list";

const TODAY = "2026-11-22";
const rows = [
  { id: 1, date: "2026-09-01", startTime: "12:00" },
  { id: 2, date: "2026-11-25", startTime: "18:00" },
  { id: 3, date: "2026-11-22", startTime: "10:00" },
  { id: 4, date: "2026-11-21", startTime: "09:00" },
  { id: 5, date: "2026-11-21", startTime: "15:00" },
  { id: 6, date: "2026-10-23", startTime: "12:00" },
  { id: 7, date: "2026-10-22", startTime: "12:00" },
];

const ids = (list: { id: number }[]) => list.map((row) => row.id);

describe("splitAdminSchedule", () => {
  test("lists today and later first, nearest on top", () => {
    assert.deepEqual(ids(splitAdminSchedule(rows, TODAY, false).upcoming), [3, 2]);
  });

  test("lists the last 30 days of past rows, latest on top, and counts the hidden ones", () => {
    const { past, hiddenPastCount } = splitAdminSchedule(rows, TODAY, false);
    assert.deepEqual(ids(past), [5, 4, 6]);
    assert.equal(hiddenPastCount, 2);
  });

  test("lists every past row on request", () => {
    const { past, hiddenPastCount } = splitAdminSchedule(rows, TODAY, true);
    assert.deepEqual(ids(past), [5, 4, 6, 7, 1]);
    assert.equal(hiddenPastCount, 0);
  });

  test("a multi-day event stays upcoming until its last day is over, and counts as recent by that day", () => {
    const camp = [
      { id: 8, date: "2026-11-20", endDate: "2026-11-24", startTime: "10:00" },
      { id: 9, date: "2026-10-10", endDate: "2026-10-30", startTime: "10:00" },
      { id: 10, date: "2026-11-19", endDate: "2026-11-21", startTime: "10:00" },
    ];
    const { upcoming, past } = splitAdminSchedule(camp, TODAY, false);
    assert.deepEqual(ids(upcoming), [8]);
    assert.deepEqual(ids(past), [10, 9]);
  });
});
