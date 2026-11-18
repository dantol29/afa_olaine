import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import { getScheduleForRange, toDateKey, type CalendarEvent } from "@/lib/calendar";
import { applySchema, insertEvent, insertGame, insertTeam, insertTraining } from "../../test/db";

// In 2026 Riga moves to summer time (UTC+3) at 03:00 on 29 March and back to UTC+2 at 04:00 on 25 October.
const SPRING_DAY = "2026-03-29";
const AUTUMN_DAY = "2026-10-25";

let schedule: CalendarEvent[];

function find(title: string) {
  const item = schedule.find((event) => event.title === title);
  assert.ok(item, `${title} is in the schedule`);
  return item;
}

function startOf(title: string) {
  return find(title).start.toISOString();
}

before(async () => {
  await applySchema();
  const u11 = await insertTeam({ name: "U11" });
  const u9 = await insertTeam({ name: "U9" });
  for (const [date, time] of [
    ["2026-03-28", "12:00"], [SPRING_DAY, "00:30"], [SPRING_DAY, "02:30"], [SPRING_DAY, "03:30"], [SPRING_DAY, "12:00"],
    ["2026-10-24", "12:00"], [AUTUMN_DAY, "01:30"], [AUTUMN_DAY, "03:30"], [AUTUMN_DAY, "12:00"], [AUTUMN_DAY, "23:30"],
  ]) {
    await insertEvent({ title: `${date} ${time}`, date, startTime: time, endTime: "23:59" });
  }

  // Three items starting at the same moment, inserted in the opposite of the expected order.
  await insertGame(u11.id, { homeTeam: "AFA Olaine", awayTeam: "FK Rīga", date: "2026-05-10", startTime: "10:00", endTime: "11:00" });
  await insertEvent({ title: "Sapulce", date: "2026-05-10", startTime: "10:00", endTime: "11:00", teamId: u9.id });
  await insertTraining([u11.id, u9.id], { date: "2026-05-10", startTime: "10:00", endTime: "11:30" });
  await insertTraining([u9.id], { date: "2026-05-10", startTime: "08:00", endTime: "09:00" });
  await insertTraining([], { date: "2026-05-10", startTime: "09:00", endTime: "10:00" });
  await insertEvent({ title: "Ārpus diapazona", date: "2026-12-01", startTime: "10:00", endTime: "11:00" });

  schedule = await getScheduleForRange(new Date("2026-03-01T12:00:00Z"), new Date("2026-11-01T12:00:00Z"));
});

describe("Riga wall-clock times", () => {
  test("use UTC+2 before and UTC+3 after the spring change", () => {
    assert.equal(startOf("2026-03-28 12:00"), "2026-03-28T10:00:00.000Z");
    assert.equal(startOf(`${SPRING_DAY} 12:00`), "2026-03-29T09:00:00.000Z");
  });

  test("use UTC+3 before and UTC+2 after the autumn change", () => {
    assert.equal(startOf("2026-10-24 12:00"), "2026-10-24T09:00:00.000Z");
    assert.equal(startOf(`${AUTUMN_DAY} 12:00`), "2026-10-25T10:00:00.000Z");
    assert.equal(startOf(`${AUTUMN_DAY} 23:30`), "2026-10-25T21:30:00.000Z");
  });

  test("are exact at night on the change days too", () => {
    assert.equal(startOf(`${SPRING_DAY} 00:30`), "2026-03-28T22:30:00.000Z");
    assert.equal(startOf(`${SPRING_DAY} 02:30`), "2026-03-29T00:30:00.000Z");
    assert.equal(startOf(`${AUTUMN_DAY} 01:30`), "2026-10-24T22:30:00.000Z");
    assert.equal(find(`${AUTUMN_DAY} 01:30`).timeLabel, "01:30");
  });

  test("move a time skipped in spring one hour forward and pick the later of a repeated autumn hour", () => {
    assert.equal(find(`${SPRING_DAY} 03:30`).timeLabel, "04:30");
    assert.equal(startOf(`${AUTUMN_DAY} 03:30`), "2026-10-25T01:30:00.000Z");
  });

  test("keep dateKey equal to the stored date and to the Riga date of the start", () => {
    for (const event of schedule) {
      assert.equal(event.dateKey, toDateKey(event.start), event.uid);
      if (event.eventType === "other" && /^\d{4}-\d{2}-\d{2} /.test(event.title)) {
        assert.equal(event.dateKey, event.title.slice(0, 10), event.uid);
      }
    }
  });
});

describe("getScheduleForRange", () => {
  test("sorts by start and keeps training, event, game order for equal starts", () => {
    const sameDay = schedule.filter((event) => event.dateKey === "2026-05-10");
    assert.deepEqual(sameDay.map((event) => [event.eventType, event.team, event.timeLabel]), [
      ["training", "U9", "08:00"],
      ["training", "U9, U11", "10:00"],
      ["other", "U9", "10:00"],
      ["game", "U11", "10:00"],
    ]);
    const starts = schedule.map((event) => event.start.getTime());
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  });

  test("leaves out trainings without a team", () => {
    assert.equal(schedule.some((event) => event.eventType === "training" && event.timeLabel === "09:00"), false);
  });

  test("leaves out items outside the date range", () => {
    assert.equal(schedule.some((event) => event.title === "Ārpus diapazona"), false);
  });
});
