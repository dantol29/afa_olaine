import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseBirthdate, replaceDateSeparators } from "@/lib/birthdate";

const NOW = new Date(Date.UTC(2026, 9, 15, 12));

function parsed(raw: string, now = NOW) {
  const result = parseBirthdate(raw, now);
  return result.ok ? result.value : null;
}

describe("parseBirthdate", () => {
  test("stores dates as DD.MM.GGGG. with leading zeros", () => {
    assert.equal(parsed("05.03.2015"), "05.03.2015.");
    assert.equal(parsed("5.3.2015"), "05.03.2015.");
    assert.equal(parsed("05.03.2015."), "05.03.2015.");
    assert.equal(parsed("  05.03.2015  "), "05.03.2015.");
  });

  test("accepts dash, slash, backslash, comma and space separators", () => {
    for (const raw of ["05-03-2015", "05/03/2015", "05\\03\\2015", "05,03,2015", "05 03 2015", "05. 03. 2015"]) {
      assert.equal(parsed(raw), "05.03.2015.", raw);
    }
  });

  test("rejects other formats", () => {
    for (const raw of ["", "2015-03-05", "05.03.15", "05032015", "05.03.2015.1", "a5.03.2015", "05..03..2015x"]) {
      assert.equal(parsed(raw), null, raw);
    }
  });

  test("rejects dates that do not exist", () => {
    for (const raw of ["31.04.2015", "00.03.2015", "05.13.2015", "05.00.2015", "32.01.2015", "29.02.2015"]) {
      assert.equal(parsed(raw), null, raw);
    }
  });

  test("accepts 29 February only in leap years", () => {
    assert.equal(parsed("29.02.2016"), "29.02.2016.");
    assert.equal(parsed("29.02.2000"), "29.02.2000.");
    assert.equal(parsed("29.02.1900"), null);
  });

  test("accepts birth years from 1930", () => {
    assert.equal(parsed("01.01.1930"), "01.01.1930.");
    assert.equal(parsed("31.12.1929"), null);
  });

  test("rejects anyone born after the year that makes them five this year", () => {
    assert.equal(parsed("31.12.2021"), "31.12.2021.");
    assert.equal(parsed("01.01.2022"), null);
    assert.equal(parsed("01.01.2022", new Date(Date.UTC(2027, 0, 1))), "01.01.2022.");
  });

  test("rejects future dates", () => {
    assert.equal(parsed("16.10.2026"), null);
  });

  test("uses the current date by default", () => {
    assert.equal(parseBirthdate("01.01.1930").ok, true);
    assert.equal(parseBirthdate(`01.01.${new Date().getUTCFullYear()}`).ok, false);
  });

  test("returns the same Latvian error for every invalid input", () => {
    const result = parseBirthdate("31.02.2015", NOW);
    assert.deepEqual(result, { ok: false, error: "Nederīgs datums. Formāts: DD.MM.GGGG." });
  });
});

describe("replaceDateSeparators", () => {
  test("swaps separators one for one so the caret does not move", () => {
    const raw = "05-03/2015\\x, y";
    const replaced = replaceDateSeparators(raw);
    assert.equal(replaced, "05.03.2015.x..y");
    assert.equal(replaced.length, raw.length);
  });
});
