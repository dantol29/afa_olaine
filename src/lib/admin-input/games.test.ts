import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseGameInput } from "@/lib/admin-input/games";
import { formData, withFields } from "../../../test/form";

const VALID = {
  teamId: "4",
  homeTeam: " AFA Olaine ",
  awayTeam: " FK Rīga ",
  date: "2026-10-10",
  startTime: "12:00",
  endTime: "13:30",
  location: " Olaines stadions ",
  league: "",
  notes: "",
  homeScore: "",
  awayScore: "",
};

function parse(changes: Record<string, unknown> = {}) {
  return parseGameInput(formData(withFields(VALID, changes)));
}

const SCORE_ERROR = { error: "Rezultātam jābūt veselam skaitlim no 0." };

describe("parseGameInput", () => {
  test("trims fields and stores empty optional fields as null", () => {
    assert.deepEqual(parse(), {
      teamId: 4,
      homeTeam: "AFA Olaine",
      awayTeam: "FK Rīga",
      homeScore: null,
      awayScore: null,
      date: "2026-10-10",
      startTime: "12:00",
      endTime: "13:30",
      location: "Olaines stadions",
      league: null,
      notes: null,
    });
    const filled = parse({ league: " Jaunatnes līga ", notes: " Laukums 2 " });
    assert.equal(filled.league, "Jaunatnes līga");
    assert.equal(filled.notes, "Laukums 2");
  });

  test("reports missing required fields in form order", () => {
    assert.deepEqual(parse({ teamId: "" }), { error: "Jāizvēlas komanda." });
    assert.deepEqual(parse({ teamId: "abc" }), { error: "Jāizvēlas komanda." });
    assert.deepEqual(parse({ homeTeam: " " }), { error: "Mājinieki ir obligāti." });
    assert.deepEqual(parse({ awayTeam: undefined }), { error: "Viesi ir obligāti." });
    assert.deepEqual(parse({ date: "" }), { error: "Datums ir obligāts." });
    assert.deepEqual(parse({ startTime: "" }), { error: "Sākuma laiks ir obligāts." });
    assert.deepEqual(parse({ endTime: "" }), { error: "Beigu laiks ir obligāts." });
    assert.deepEqual(parse({ location: "" }), { error: "Vieta ir obligāta." });
  });

  test("requires the end to be later than the start on the same day", () => {
    const error = { error: "Beigu laikam jābūt vēlāk par sākuma laiku (tajā pašā dienā)." };
    assert.deepEqual(parse({ endTime: "12:00" }), error);
    assert.deepEqual(parse({ startTime: "23:00", endTime: "00:30" }), error);
    assert.deepEqual(parse({ endTime: "25:00" }), error);
    assert.equal(parse({ endTime: "12:01" }).endTime, "12:01");
  });

  test("accepts scores that are non-negative integers, including 0", () => {
    const parsed = parse({ homeScore: " 0 ", awayScore: "12" });
    assert.equal(parsed.homeScore, 0);
    assert.equal(parsed.awayScore, 12);
  });

  test("rejects negative, fractional and non-numeric scores", () => {
    assert.deepEqual(parse({ homeScore: "-1" }), SCORE_ERROR);
    assert.deepEqual(parse({ awayScore: "1.5" }), SCORE_ERROR);
    assert.deepEqual(parse({ awayScore: "divi" }), SCORE_ERROR);
  });
});
