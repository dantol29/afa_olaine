import assert from "node:assert/strict";
import { test } from "node:test";

import { isSameVenue, normalizeVenue } from "./venue";

test("ignores case, punctuation, quotes and spacing", () => {
  assert.equal(normalizeVenue("  Olaines  Pilsētas stadions. "), "olaines pilsētas stadions");
  assert.ok(isSameVenue('Stadions "Daugava"', "stadions daugava"));
  assert.ok(isSameVenue("Olaines pamatskola, Skolas 1", "Olaines pamatskola Skolas 1"));
});

test("keeps other differences apart", () => {
  assert.ok(!isSameVenue('Stadions "Daugava", rezerves laukums', 'Stadions "Daugava"'));
  assert.ok(!isSameVenue("Olaines stadions", "Olaines pilsētas stadions"));
  assert.ok(!isSameVenue("", ""));
  assert.ok(!isSameVenue(null, "Olaines pilsētas stadions"));
});
