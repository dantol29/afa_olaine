import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseSimilarDeleteInput, parseTrainingScheduleInput } from "@/lib/admin-input/training-schedule";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const base: [string, string][] = [
  ["teamId", "4"],
  ["coachIds", "2"],
  ["startTime", "18:00"],
  ["endTime", "19:30"],
  ["location", " Stadions "],
  ["notes", ""],
];

describe("parseTrainingScheduleInput", () => {
  test("keeps the ticked dates once each, in order", () => {
    assert.deepEqual(parseTrainingScheduleInput(form([...base, ["dates", "2026-11-30"], ["dates", "2026-11-23"], ["dates", "2026-11-30"]])), {
      teamId: 4,
      coachIds: [2],
      dates: ["2026-11-23", "2026-11-30"],
      startTime: "18:00",
      endTime: "19:30",
      location: "Stadions",
      notes: null,
    });
  });

  test("refuses missing dates, bad dates and bad times", () => {
    assert.deepEqual(parseTrainingScheduleInput(form(base)), { error: "Nav atzīmēts neviens datums." });
    assert.deepEqual(parseTrainingScheduleInput(form([...base, ["dates", "2026-02-30"]])), { error: "Nederīgi datumi." });
    assert.deepEqual(
      parseTrainingScheduleInput(form([...base.filter(([key]) => key !== "endTime"), ["endTime", "17:00"], ["dates", "2026-11-23"]])),
      { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." },
    );
  });
});

describe("parseSimilarDeleteInput", () => {
  test("needs an until-date and at least one training", () => {
    assert.deepEqual(parseSimilarDeleteInput(form([["until", "2026-12-31"], ["trainingIds", "5"], ["trainingIds", "5"]])), { until: "2026-12-31", ids: [5] });
    assert.deepEqual(parseSimilarDeleteInput(form([["trainingIds", "5"]])), { error: "Jānorāda datums, līdz kuram dzēst." });
    assert.deepEqual(parseSimilarDeleteInput(form([["until", "2026-12-31"]])), { error: "Nav atzīmēts neviens treniņš." });
  });
});
