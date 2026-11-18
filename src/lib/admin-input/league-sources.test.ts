import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseLeagueSourceInput } from "@/lib/admin-input/league-sources";
import { formData, withFields } from "../../../test/form";

const VALID = {
  teamId: "1",
  label: " U11 līga ",
  url: " https://lff.lv/sacensibas/jaunatne/1/ ",
  standingsUrl: "",
  topScorersUrl: "",
  displayOrder: "",
  isMainLeague: "on",
};

function parse(changes: Record<string, unknown> = {}) {
  return parseLeagueSourceInput(formData(withFields(VALID, changes)));
}

describe("parseLeagueSourceInput", () => {
  test("trims fields, defaults the order to 0 and stores empty optional URLs as null", () => {
    assert.deepEqual(parse(), {
      teamId: 1,
      label: "U11 līga",
      url: "https://lff.lv/sacensibas/jaunatne/1/",
      standingsUrl: null,
      topScorersUrl: null,
      displayOrder: 0,
      isMainLeague: true,
    });
    assert.equal(parse({ isMainLeague: undefined }).isMainLeague, false);
  });

  test("reports missing required fields", () => {
    assert.deepEqual(parse({ teamId: "" }), { error: "Jāizvēlas komanda." });
    assert.deepEqual(parse({ label: " " }), { error: "Nosaukums ir obligāts." });
    assert.deepEqual(parse({ url: "" }), { error: "URL ir obligāts." });
  });

  test("requires an integer display order", () => {
    assert.equal(parse({ displayOrder: " 3 " }).displayOrder, 3);
    assert.deepEqual(parse({ displayOrder: "1.5" }), { error: "Secībai jābūt veselam skaitlim." });
  });

  test("validates each URL with its own message", () => {
    assert.deepEqual(parse({ url: "lff.lv" }), { error: "Nederīgs spēļu saraksta URL." });
    assert.deepEqual(parse({ standingsUrl: "tabula" }), { error: "Nederīgs tabulas URL." });
    assert.deepEqual(parse({ topScorersUrl: "vārti" }), { error: "Nederīgs vārtu guvēju URL." });
    assert.equal(parse({ standingsUrl: " https://lff.lv/t " }).standingsUrl, "https://lff.lv/t");
  });
});
