import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseCoachInput } from "@/lib/admin-input/coaches";
import { formData, withFields } from "../../../test/form";

const VALID = {
  name: " Anna Ozola ",
  position: " Galvenā trenere ",
  license: " B ",
  authority: "UEFA",
  teamIds: ["1", "3"],
};

function parse(changes: Record<string, unknown> = {}) {
  return parseCoachInput(formData(withFields(VALID, changes)));
}

describe("parseCoachInput", () => {
  test("trims fields; teams are optional", () => {
    assert.deepEqual(parse(), { name: "Anna Ozola", position: "Galvenā trenere", license: "B", authority: "UEFA", teamIds: [1, 3] });
    assert.deepEqual(parse({ teamIds: undefined }).teamIds, []);
  });

  test("reports missing required fields", () => {
    assert.deepEqual(parse({ name: "" }), { error: "Vārds, uzvārds ir obligāts." });
    assert.deepEqual(parse({ position: " " }), { error: "Amats ir obligāts." });
    assert.deepEqual(parse({ license: undefined }), { error: "Licence ir obligāta." });
  });

  test("accepts only UEFA or LFF as the licence authority", () => {
    assert.equal(parse({ authority: "LFF" }).authority, "LFF");
    assert.deepEqual(parse({ authority: "uefa" }), { error: "Jāizvēlas licences izdevējs." });
    assert.deepEqual(parse({ authority: undefined }), { error: "Jāizvēlas licences izdevējs." });
  });
});
