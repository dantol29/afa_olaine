import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parsePartnerInput } from "@/lib/admin-input/partners";
import { formData, withFields } from "../../../test/form";

const VALID = { name: " Olaines novads ", size: "sm", needsWhite: "on", websiteUrl: " https://olaine.lv " };

function parse(changes: Record<string, unknown> = {}) {
  return parsePartnerInput(formData(withFields(VALID, changes)));
}

describe("parsePartnerInput", () => {
  test("trims fields and normalises the website URL", () => {
    assert.deepEqual(parse(), { name: "Olaines novads", size: "sm", needsWhite: true, websiteUrl: "https://olaine.lv/" });
  });

  test("defaults to the large size, no white logo and no website", () => {
    assert.deepEqual(parse({ size: undefined, needsWhite: undefined, websiteUrl: "" }), {
      name: "Olaines novads", size: "lg", needsWhite: false, websiteUrl: null,
    });
  });

  test("reports a missing name, an unknown size and an invalid URL", () => {
    assert.deepEqual(parse({ name: " " }), { error: "Nosaukums ir obligāts." });
    assert.deepEqual(parse({ size: "xl" }), { error: "Nederīgs izmērs." });
    assert.deepEqual(parse({ websiteUrl: "olaine.lv" }), { error: "Saitei jābūt derīgam URL (piem., https://example.com)." });
  });
});
