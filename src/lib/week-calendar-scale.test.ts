import assert from "node:assert/strict";
import { test } from "node:test";

import { MAX_ROW_HEIGHT, MIN_ROW_HEIGHT, fitHourRange, rowHeightFor } from "./week-calendar-scale";

test("the range runs from an hour before the earliest start to an hour after the latest end", () => {
  assert.deepEqual(fitHourRange([{ start: 17, end: 18.5 }, { start: 19.5, end: 21.5 }]), { startHour: 16, endHour: 23 });
  assert.deepEqual(fitHourRange([{ start: 10.25, end: 12 }]), { startHour: 9, endHour: 13 });
});

test("the range stays within the day", () => {
  assert.deepEqual(fitHourRange([{ start: 0.5, end: 2 }]), { startHour: 0, endHour: 3 });
  assert.deepEqual(fitHourRange([{ start: 22, end: 23.75 }]), { startHour: 21, endHour: 24 });
  // Past midnight (or a day piece of a multi-day event ending at 00:00): cut at 24.
  assert.deepEqual(fitHourRange([{ start: 22, end: 1 }]), { startHour: 21, endHour: 24 });
});

test("no events, no grid", () => {
  assert.equal(fitHourRange([]), null);
});

test("hours fill the box, but are never stretched or squeezed past readable", () => {
  assert.equal(rowHeightFor(7), MAX_ROW_HEIGHT);
  assert.equal(rowHeightFor(11), 48);
  assert.equal(rowHeightFor(16), MIN_ROW_HEIGHT);
});
