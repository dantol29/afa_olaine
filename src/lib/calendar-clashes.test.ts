import assert from "node:assert/strict";
import { test } from "node:test";

import type { CalendarEvent } from "@/lib/calendar";
import { venueClashDays } from "./calendar-clashes";

const STADIUM = "Olaines pilsētas stadions";

/** A calendar entry from Riga wall-clock times ("2026-12-05T10:00"); December is UTC+2. */
function entry(uid: string, eventType: CalendarEvent["eventType"], start: string, end: string, location = STADIUM): CalendarEvent {
  return {
    uid,
    title: uid,
    location,
    allDay: false,
    start: new Date(`${start}:00+02:00`),
    end: new Date(`${end}:00+02:00`),
    dateKey: start.slice(0, 10),
    weekdayLabel: "",
    dateLabel: "",
    timeLabel: null,
    dayLabel: "",
    monthLabel: "",
    eventType,
    team: null,
    teams: [],
  };
}

test("a three-day camp is marked only on the day of the game it clashes with, and so is the game", () => {
  const days = venueClashDays([
    entry("event-4", "other", "2026-12-05T10:00", "2026-12-07T16:00"),
    entry("game-21", "game", "2026-12-06T14:00", "2026-12-06T16:00"),
    entry("training-1", "training", "2026-12-06T18:00", "2026-12-06T19:00"),
    entry("game-22", "game", "2026-12-06T14:00", "2026-12-06T16:00", "Olaines sporta nams"),
  ]);
  assert.deepEqual([...days.keys()].sort(), ["event-4", "game-21"]);
  assert.deepEqual([...(days.get("event-4") ?? [])], ["2026-12-06"]);
  assert.deepEqual([...(days.get("game-21") ?? [])], ["2026-12-06"]);
});
