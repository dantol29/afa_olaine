import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseNames } from "@/lib/admin-input/club-logos";
import { formData } from "../../../test/form";

describe("parseNames (club logos)", () => {
  test("reads one trimmed name per line, without blanks or duplicates", () => {
    assert.deepEqual(parseNames(formData({ names: " FK Rīga \n\nRīgas FS\r\nFK Rīga\n  " })), ["FK Rīga", "Rīgas FS"]);
  });

  test("returns no names for a missing field", () => {
    assert.deepEqual(parseNames(formData({})), []);
  });
});
