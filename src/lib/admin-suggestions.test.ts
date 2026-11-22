import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { foldForSearch, matchSuggestions, pinFirst, rankByFrequency, rankByRecency } from "@/lib/admin-suggestions";

const identity = (value: string) => value;

describe("foldForSearch", () => {
  test("drops diacritics, case and extra spaces", () => {
    assert.equal(foldForSearch("  Bērziņš   ŠĶŪNIS "), "berzins skunis");
  });
});

describe("rankByFrequency", () => {
  test("lists each value once, most used first, ties alphabetically", () => {
    assert.deepEqual(
      rankByFrequency(["Zemgales OC", "Olaines stadions", "Olaines stadions ", null, "", "Ādaži", "Zemgales OC", "Olaines stadions"]),
      ["Olaines stadions", "Zemgales OC", "Ādaži"],
    );
  });

  test("adds values with no uses after the used ones", () => {
    assert.deepEqual(rankByFrequency(["B"], ["A", "B"]), ["B", "A"]);
  });
});

describe("rankByRecency", () => {
  test("puts the latest value first and drops repeats", () => {
    assert.deepEqual(
      rankByRecency([
        { value: "Lidl WU8 posms 1", date: "2026-10-04" },
        { value: "Lidl WU8 posms 3", date: "2026-11-29" },
        { value: "Lidl WU8 posms 1", date: "2026-10-05" },
        { value: "Lidl WU8 posms 2", date: "2026-11-01" },
      ]),
      ["Lidl WU8 posms 3", "Lidl WU8 posms 2", "Lidl WU8 posms 1"],
    );
  });
});

describe("pinFirst", () => {
  test("moves pinned values to the front in their order", () => {
    assert.deepEqual(pinFirst(["FK Ventspils", "AFA Olaine", "Olaine 2"], (value) => /olaine/i.test(value)), ["AFA Olaine", "Olaine 2", "FK Ventspils"]);
  });
});

describe("matchSuggestions", () => {
  const places = ["Olaines pilsētas stadions", "Zemgales OC", 'Stadions "Daugava", rezerves laukums', "Salaspils stadions"];

  test("finds text anywhere, ignoring case and diacritics, with prefix matches first", () => {
    assert.deepEqual(matchSuggestions(places, "dau", identity), ['Stadions "Daugava", rezerves laukums']);
    assert.deepEqual(matchSuggestions(places, "PILSETAS", identity), ["Olaines pilsētas stadions"]);
    assert.deepEqual(matchSuggestions(places, "s", identity), ['Stadions "Daugava", rezerves laukums', "Salaspils stadions", "Olaines pilsētas stadions", "Zemgales OC"]);
  });

  test("lists every option for empty text or an exact value", () => {
    assert.deepEqual(matchSuggestions(places, "", identity), places);
    assert.deepEqual(matchSuggestions(places, "zemgales oc", identity), places);
  });

  test("stops at the limit", () => {
    assert.equal(matchSuggestions(places, "", identity, 2).length, 2);
  });

  test("is empty when nothing matches", () => {
    assert.deepEqual(matchSuggestions(places, "Ogre", identity), []);
  });
});
