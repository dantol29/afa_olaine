import assert from "node:assert/strict";
import { test } from "node:test";

import { currentRigaYear, formatDate, formatDayMonth, formatFullDate, yearUnlessCurrent } from "./date-display";

test("dates of the current year are shown without it, others with it", () => {
  assert.equal(formatDate("2026-12-05", "2026"), "05.12.");
  assert.equal(formatDate("2025-12-14", "2026"), "14.12.2025");
  assert.equal(formatDate("2027-01-10", "2026"), "10.01.2027");
  assert.equal(formatDayMonth("2026-12-05"), "05.12.");
  assert.equal(yearUnlessCurrent(2026, "2026"), "");
  assert.equal(yearUnlessCurrent("2025", "2026"), "2025");
});

test("form fields always get the full date", () => {
  assert.equal(formatFullDate("2026-12-05"), "05.12.2026");
});

test("anything else is shown as it is", () => {
  assert.equal(formatDate("", "2026"), "");
  assert.equal(formatFullDate("05.12.2026"), "05.12.2026");
  assert.equal(formatDayMonth("nonsense"), "nonsense");
});

test("the current year follows Riga's calendar", () => {
  assert.equal(currentRigaYear(new Date("2026-12-31T22:30:00Z")), "2027");
  assert.equal(currentRigaYear(new Date("2026-12-31T21:30:00Z")), "2026");
});
