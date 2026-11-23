import assert from "node:assert/strict";
import { test } from "node:test";

import { eventDatesProblem, formatEventDates, formatEventSpan, lastEventDay, storedEndDate } from "./event-dates";

test("storedEndDate keeps one-day events without an end date", () => {
  assert.equal(storedEndDate("2026-12-12", ""), null);
  assert.equal(storedEndDate("2026-12-12", null), null);
  assert.equal(storedEndDate("2026-12-12", "2026-12-12"), null);
  assert.equal(storedEndDate("2026-12-12", "2026-12-14"), "2026-12-14");
  assert.equal(lastEventDay({ date: "2026-12-12", endDate: null }), "2026-12-12");
  assert.equal(lastEventDay({ date: "2026-12-12", endDate: "2026-12-14" }), "2026-12-14");
});

test("eventDatesProblem: one day needs the end after the start, several days any times", () => {
  assert.equal(eventDatesProblem("2026-12-12", "10:00", null, "16:00"), null);
  assert.match(eventDatesProblem("2026-12-12", "16:00", null, "10:00") ?? "", /tajā pašā dienā/);
  assert.equal(eventDatesProblem("2026-12-12", "16:00", "2026-12-13", "10:00"), null);
  assert.match(eventDatesProblem("2026-12-12", "10:00", "2026-12-11", "16:00") ?? "", /pirms sākuma/);
  assert.match(eventDatesProblem("2026-12-12", "10:00", "2026-13-40", "16:00") ?? "", /nav derīgs/);
});

test("formatEventDates leaves out the current year", () => {
  assert.equal(formatEventDates("2026-12-12", null, "2026"), "12.12.");
  assert.equal(formatEventDates("2026-12-12", "2026-12-14", "2026"), "12.–14.12.");
  assert.equal(formatEventDates("2026-11-30", "2026-12-02", "2026"), "30.11.–02.12.");
  assert.equal(formatEventDates("2026-12-30", "2027-01-02", "2026"), "30.12.2026–02.01.2027");
});

test("formatEventDates names another year", () => {
  assert.equal(formatEventDates("2026-12-12", null, "2025"), "12.12.2026");
  assert.equal(formatEventDates("2026-12-12", "2026-12-14", "2027"), "12.–14.12.2026");
  assert.equal(formatEventDates("2026-11-30", "2026-12-02", "2025"), "30.11.–02.12.2026");
  assert.equal(formatEventDates("2026-12-30", "2027-01-02", "2027"), "30.12.2026–02.01.2027");
});

test("formatEventSpan puts the start time with the first day and the end time with the last", () => {
  assert.equal(formatEventSpan("2026-12-12", "10:00", null, "16:00", "2026"), "12.12. 10:00–16:00");
  assert.equal(formatEventSpan("2026-12-05", "10:00", "2026-12-07", "16:00", "2026"), "05.12. 10:00 – 07.12. 16:00");
  assert.equal(formatEventSpan("2026-12-05", "10:00", "2026-12-07", "16:00", "2027"), "05.12.2026 10:00 – 07.12.2026 16:00");
  assert.equal(formatEventSpan("2026-12-30", "18:00", "2027-01-01", "02:00", "2026"), "30.12.2026 18:00 – 01.01.2027 02:00");
});
