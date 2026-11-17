import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { CATEGORIES, parseArticleInput, slugify } from "@/lib/admin-input/articles";
import { MAX_BODY_LENGTH, MAX_RAW_BODY_LENGTH } from "@/lib/content-limits";
import { formData, withFields } from "../../../test/form";

const VALID = {
  title: "  Uzvara pret FK Rīga  ",
  excerpt: "  Īss ievads  ",
  date: " 2026-10-10 ",
  category: "Spēles",
  teamId: "",
  authorCoachId: "",
  body: "<p>Teksts</p>",
};

function parse(changes: Record<string, unknown> = {}) {
  return parseArticleInput(formData(withFields(VALID, changes)));
}

/** A paragraph whose sanitised HTML is exactly `length` characters long. */
function paragraphOfLength(length: number) {
  return `<p>${"a".repeat(length - "<p></p>".length)}</p>`;
}

describe("slugify (news)", () => {
  test("replaces every Latvian letter with its base letter", () => {
    assert.equal(slugify("ĀČĒĢĪĶĻŅŠŪŽ āčēģīķļņšūž"), "acegiklnsuz-acegiklnsuz");
  });

  test("joins words with single dashes and trims dashes at the ends", () => {
    assert.equal(slugify("  U-11: Olaines kauss!!  2026 "), "u-11-olaines-kauss-2026");
  });

  test("returns an empty slug when nothing usable is left", () => {
    assert.equal(slugify("!!! — ???"), "");
  });
});

describe("parseArticleInput", () => {
  test("trims the text fields and derives the slug from the title", () => {
    assert.deepEqual(parse(), {
      baseSlug: "uzvara-pret-fk-riga",
      title: "Uzvara pret FK Rīga",
      excerpt: "Īss ievads",
      date: "2026-10-10",
      category: "Spēles",
      teamId: null,
      authorCoachId: null,
      body: "<p>Teksts</p>",
    });
  });

  test("reports the first missing required field", () => {
    assert.deepEqual(parse({ title: "   " }), { error: "Virsraksts ir obligāts." });
    assert.deepEqual(parse({ excerpt: undefined }), { error: "Ievads ir obligāts." });
    assert.deepEqual(parse({ date: "" }), { error: "Datums ir obligāts." });
    assert.deepEqual(parse({ title: "", excerpt: "" }), { error: "Virsraksts ir obligāts." });
  });

  test("accepts only the known categories", () => {
    for (const category of CATEGORIES) assert.equal(parse({ category }).category, category);
    assert.deepEqual(parse({ category: "Cits" }), { error: "Jāizvēlas kategorija." });
    assert.deepEqual(parse({ category: " Spēles" }), { error: "Jāizvēlas kategorija." });
  });

  test("turns the optional team and author ids into numbers or null", () => {
    const parsed = parse({ teamId: "3", authorCoachId: "7" });
    assert.equal(parsed.teamId, 3);
    assert.equal(parsed.authorCoachId, 7);
  });

  test("sanitises the body and requires visible content", () => {
    assert.equal(parse({ body: '<p onclick="x()">Teksts</p><script>alert(1)</script>' }).body, "<p>Teksts</p>");
    assert.deepEqual(parse({ body: "<p> </p><script>alert(1)</script>" }), { error: "Raksta teksts ir obligāts." });
  });

  test("limits the sanitised body to MAX_BODY_LENGTH characters", () => {
    assert.equal(parse({ body: paragraphOfLength(MAX_BODY_LENGTH) }).body?.length, MAX_BODY_LENGTH);
    assert.deepEqual(parse({ body: paragraphOfLength(MAX_BODY_LENGTH + 1) }), { error: "Raksta teksts ir pārāk garš." });
  });

  test("rejects raw editor HTML over MAX_RAW_BODY_LENGTH before sanitising", () => {
    // Mostly markup the sanitiser removes, so only the raw-length check can reject it.
    const filler = (length: number) => `<p>a</p><!--${"x".repeat(length - "<p>a</p><!---->".length)}-->`;
    assert.equal(filler(MAX_RAW_BODY_LENGTH).length, MAX_RAW_BODY_LENGTH);
    assert.equal(parse({ body: filler(MAX_RAW_BODY_LENGTH) }).body, "<p>a</p>");
    assert.deepEqual(parse({ body: filler(MAX_RAW_BODY_LENGTH + 1) }), { error: "Raksta teksts ir pārāk garš." });
  });

  test("rejects a title that gives no slug", () => {
    assert.deepEqual(parse({ title: "!!!" }), { error: "Nederīgs virsraksts saites veidošanai." });
  });
});
