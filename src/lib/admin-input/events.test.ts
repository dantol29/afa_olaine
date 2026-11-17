import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseEventInput } from "@/lib/admin-input/events";
import { formData, withFields } from "../../../test/form";

const VALID = {
  title: " Kluba sapulce ",
  date: "2026-10-14",
  startTime: "18:00",
  endTime: "19:00",
  location: " Olaines stadions ",
  notes: "",
  teamId: "",
};

function parse(changes: Record<string, unknown> = {}) {
  return parseEventInput(formData(withFields(VALID, changes)));
}

describe("parseEventInput", () => {
  test("trims fields; an event without a team is for the whole club", () => {
    assert.deepEqual(parse(), {
      title: "Kluba sapulce",
      date: "2026-10-14",
      startTime: "18:00",
      endTime: "19:00",
      location: "Olaines stadions",
      notes: null,
      teamId: null,
    });
    assert.equal(parse({ teamId: "3" }).teamId, 3);
    assert.equal(parse({ notes: " Ņemt līdzi formu " }).notes, "Ņemt līdzi formu");
  });

  test("reports missing required fields", () => {
    assert.deepEqual(parse({ title: "" }), { error: "Nosaukums ir obligāts." });
    assert.deepEqual(parse({ date: undefined }), { error: "Datums ir obligāts." });
    assert.deepEqual(parse({ startTime: " " }), { error: "Sākuma laiks ir obligāts." });
    assert.deepEqual(parse({ endTime: "" }), { error: "Beigu laiks ir obligāts." });
    assert.deepEqual(parse({ location: "" }), { error: "Vieta ir obligāta." });
  });

  test("rejects an end that is not after the start, before checking the location", () => {
    assert.deepEqual(parse({ endTime: "18:00", location: "" }), {
      error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā).",
    });
  });
});
