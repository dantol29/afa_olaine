import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseSimilarChangeInput, parseSimilarSelectionInput, parseTrainingScheduleInput } from "@/lib/admin-input/training-schedule";

function form(entries: [string, string][]) {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const base: [string, string][] = [
  ["teamIds", "4"],
  ["teamIds", "1"],
  ["coachIds", "2"],
  ["startTime", "18:00"],
  ["endTime", "19:30"],
  ["location", " Stadions "],
  ["notes", ""],
];

describe("parseTrainingScheduleInput", () => {
  test("keeps the ticked dates once each, in order", () => {
    assert.deepEqual(parseTrainingScheduleInput(form([...base, ["dates", "2026-11-30"], ["dates", "2026-11-23"], ["dates", "2026-11-30"]])), {
      teamIds: [1, 4],
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

describe("parseSimilarSelectionInput", () => {
  test("needs an until-date and at least one training", () => {
    assert.deepEqual(parseSimilarSelectionInput(form([["until", "2026-12-31"], ["trainingIds", "5"], ["trainingIds", "5"]])), { until: "2026-12-31", ids: [5] });
    assert.deepEqual(parseSimilarSelectionInput(form([["trainingIds", "5"]])), { error: "Jānorāda datums «Līdz»." });
    assert.deepEqual(parseSimilarSelectionInput(form([["until", "2026-12-31"]])), { error: "Nav atzīmēts neviens treniņš." });
  });
});

describe("parseSimilarChangeInput", () => {
  const selection: [string, string][] = [["until", "2026-12-31"], ["trainingIds", "5"], ["trainingIds", "6"]];
  const parse = (extra: [string, string][], teams: [string, string][] = [["newTeamIds", "3"]]) =>
    parseSimilarChangeInput(form([...selection, ...teams, ...extra]));

  test("changes only what is given", () => {
    assert.deepEqual(parse([["newStartTime", "18:30"], ["newEndTime", "20:00"], ["newLocation", ""]]), {
      until: "2026-12-31",
      ids: [5, 6],
      teamIds: [3],
      changes: { startTime: "18:30", endTime: "20:00" },
    });
    assert.deepEqual(parse([["newStartTime", ""], ["newEndTime", ""], ["newLocation", " Zāle "]]), {
      until: "2026-12-31",
      ids: [5, 6],
      teamIds: [3],
      changes: { location: "Zāle" },
    });
  });

  test("reads the teams, which alone may be the change (decided against the source training by the action)", () => {
    assert.deepEqual(parse([], [["newTeamIds", "3"], ["newTeamIds", "1"]]), { until: "2026-12-31", ids: [5, 6], teamIds: [1, 3], changes: {} });
    assert.deepEqual(parse([], []), { error: "Jāizvēlas vismaz viena komanda." });
  });

  test("needs both times and an end after the start", () => {
    assert.deepEqual(parse([["newStartTime", "18:30"]]), { error: "Jānorāda gan jaunais sākuma, gan beigu laiks." });
    assert.deepEqual(parse([["newStartTime", "18:30"], ["newEndTime", "18:00"]]), {
      error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā).",
    });
    assert.deepEqual(parseSimilarChangeInput(form([["newLocation", "Zāle"]])), { error: "Jānorāda datums «Līdz»." });
  });
});
