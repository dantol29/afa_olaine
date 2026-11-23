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
  teamIds: [] as string[],
};

function parse(changes: Record<string, unknown> = {}) {
  return parseEventInput(formData(withFields(VALID, changes)));
}

describe("parseEventInput", () => {
  test("trims fields; an event without teams is for the whole club", () => {
    assert.deepEqual(parse(), {
      title: "Kluba sapulce",
      date: "2026-10-14",
      startTime: "18:00",
      endDate: null,
      endTime: "19:00",
      location: "Olaines stadions",
      notes: null,
      teamIds: [],
    });
    assert.deepEqual(parse({ teamIds: ["3"] }).teamIds, [3]);
    assert.deepEqual(parse({ teamIds: ["7", "3", "7", "x"] }).teamIds, [3, 7]);
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

  test("keeps the end date of a multi-day event, where the end time may be before the start time", () => {
    const camp = parse({ endDate: "2026-10-16", startTime: "18:00", endTime: "12:00" });
    assert.ok(!("error" in camp));
    assert.equal(camp.endDate, "2026-10-16");
  });

  test("stores no end date for a one-day event, even when it is given as the start date", () => {
    const sameDay = parse({ endDate: "2026-10-14" });
    assert.ok(!("error" in sameDay));
    assert.equal(sameDay.endDate, null);
    assert.deepEqual(parse({ endDate: "2026-10-14", endTime: "17:00" }), {
      error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā).",
    });
  });

  test("rejects an end date before the start date", () => {
    assert.deepEqual(parse({ endDate: "2026-10-13" }), { error: "Beigu datums nevar būt pirms sākuma datuma." });
  });
});
