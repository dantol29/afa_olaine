import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseTrainingInput } from "@/lib/admin-input/trainings";
import { formData, withFields } from "../../../test/form";

const VALID = {
  teamIds: ["2"],
  coachIds: ["5", "6"],
  date: " 2026-10-12 ",
  startTime: "17:00",
  endTime: "18:30",
  location: " Olaines sporta nams ",
  notes: " ",
};

function parse(changes: Record<string, unknown> = {}) {
  return parseTrainingInput(formData(withFields(VALID, changes)));
}

describe("parseTrainingInput", () => {
  test("trims fields, reads the coach list and stores empty notes as null", () => {
    assert.deepEqual(parse(), {
      teamIds: [2],
      coachIds: [5, 6],
      date: "2026-10-12",
      startTime: "17:00",
      endTime: "18:30",
      location: "Olaines sporta nams",
      notes: null,
    });
    assert.deepEqual(parse({ coachIds: undefined }).coachIds, []);
  });

  test("keeps several teams once each, in order, for a shared training", () => {
    assert.deepEqual(parse({ teamIds: ["5", "2", "5", "x"] }).teamIds, [2, 5]);
  });

  test("ignores coach ids that are not numbers", () => {
    assert.deepEqual(parse({ coachIds: ["5", "x"] }).coachIds, [5]);
  });

  test("reports missing required fields", () => {
    assert.deepEqual(parse({ teamIds: undefined }), { error: "Jāizvēlas vismaz viena komanda." });
    assert.deepEqual(parse({ date: "" }), { error: "Datums ir obligāts." });
    assert.deepEqual(parse({ startTime: "" }), { error: "Sākuma laiks ir obligāts." });
    assert.deepEqual(parse({ endTime: "" }), { error: "Beigu laiks ir obligāts." });
    assert.deepEqual(parse({ location: " " }), { error: "Vieta ir obligāta." });
  });

  test("rejects an end that is not after the start", () => {
    assert.deepEqual(parse({ startTime: "18:30", endTime: "17:00" }), {
      error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā).",
    });
  });
});
