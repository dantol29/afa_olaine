import assert from "node:assert/strict";
import { test } from "node:test";

import { plannedCalendarEvent, type PlannedEntry } from "./planned-booking";

const entry: PlannedEntry = { eventType: "training", title: "U17 treniņš", location: "Olaines pilsētas stadions", date: "2026-11-28", startTime: "16:30", endTime: "18:00" };

test("a planned training becomes a calendar entry at Riga time", () => {
  const event = plannedCalendarEvent(entry);
  assert.equal(event?.start.toISOString(), "2026-11-28T14:30:00.000Z");
  assert.equal(event?.end.toISOString(), "2026-11-28T16:00:00.000Z");
  assert.equal(event?.dateKey, "2026-11-28");
});

test("nothing is drawn until the date and times make a span", () => {
  assert.equal(plannedCalendarEvent({ ...entry, date: "" }), null);
  assert.equal(plannedCalendarEvent({ ...entry, endTime: "" }), null);
  assert.equal(plannedCalendarEvent({ ...entry, endTime: "16:00" }), null);
});

test("a multi-day event ends on its last day", () => {
  const event = plannedCalendarEvent({ ...entry, eventType: "other", startTime: "10:00", endDate: "2026-11-30", endTime: "09:00" });
  assert.equal(event?.end.toISOString(), "2026-11-30T07:00:00.000Z");
});
