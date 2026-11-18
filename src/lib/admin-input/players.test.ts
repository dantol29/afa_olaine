import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parsePlayerInput } from "@/lib/admin-input/players";
import { formData, withFields } from "../../../test/form";

const VALID = {
  name: " Jānis Bērziņš ",
  birthdate: " 5.3.2015 ",
  teamIds: ["1", "2"],
  number: "",
  position: " ",
  "goals-1": "3",
  "goals-2": "",
};

function parse(changes: Record<string, unknown> = {}) {
  return parsePlayerInput(formData(withFields(VALID, changes)));
}

describe("parsePlayerInput", () => {
  test("trims fields, normalises the birthdate and reads goals per checked team", () => {
    assert.deepEqual(parse(), {
      name: "Jānis Bērziņš",
      birthdate: "05.03.2015.",
      teamGoals: new Map([[1, 3], [2, 0]]),
      number: null,
      position: null,
    });
    assert.equal(parse({ position: " Vārtsargs " }).position, "Vārtsargs");
  });

  test("reports missing name, birthdate and teams", () => {
    assert.deepEqual(parse({ name: " " }), { error: "Vārds, uzvārds ir obligāts." });
    assert.deepEqual(parse({ birthdate: "" }), { error: "Dzimšanas datums ir obligāts." });
    assert.deepEqual(parse({ teamIds: undefined }), { error: "Jāizvēlas vismaz viena komanda." });
  });

  test("passes on the birthdate parser's own error", () => {
    const parsed = parse({ birthdate: "2015-03-05" });
    assert.ok("error" in parsed && typeof parsed.error === "string" && parsed.error.length > 0);
  });

  test("accepts whole shirt numbers from 1, rejects 0, negative, fractional and non-numeric ones", () => {
    assert.equal(parse({ number: " 1 " }).number, 1);
    assert.equal(parse({ number: "10" }).number, 10);
    for (const number of ["0", "-1", "1.5", "desmit", "Infinity"]) {
      assert.deepEqual(parse({ number }), { error: "Numuram jābūt pozitīvam veselam skaitlim." }, number);
    }
  });

  test("turns invalid or negative goals into 0 and drops fractions", () => {
    assert.deepEqual(parse({ "goals-1": "-2", "goals-2": "x" }).teamGoals, new Map([[1, 0], [2, 0]]));
    assert.deepEqual(parse({ "goals-1": "4.9" }).teamGoals, new Map([[1, 4], [2, 0]]));
  });

  test("ignores goals for teams that are not checked", () => {
    assert.deepEqual(parse({ teamIds: ["2"], "goals-2": "7" }).teamGoals, new Map([[2, 7]]));
  });
});
