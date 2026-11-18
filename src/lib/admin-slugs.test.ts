import assert from "node:assert/strict";
import { before, describe, test } from "node:test";

import { articles, clubPages } from "@/db/schema";
import { ensureUniqueArticleSlug, isClubPageSlugTaken } from "@/lib/admin-slugs";
import { applySchema, db } from "../../test/db";

const CREATED_AT = Date.UTC(2026, 0, 1);

async function insertArticle(slug: string) {
  const [article] = await db.insert(articles).values({
    slug, title: slug, excerpt: "Ievads", date: "2026-10-10", category: "Klubs", image: "/uploads/articles/a.jpg",
    body: "<p>Teksts</p>", createdAt: CREATED_AT,
  }).returning();
  return article;
}

async function insertClubPage(slug: string) {
  const [page] = await db.insert(clubPages).values({
    slug, title: slug, description: "Apraksts", body: "<p>Teksts</p>", createdAt: CREATED_AT, updatedAt: CREATED_AT,
  }).returning();
  return page;
}

before(() => applySchema());

describe("ensureUniqueArticleSlug", () => {
  test("keeps a free slug as it is", async () => {
    assert.equal(await ensureUniqueArticleSlug("jauna-sezona"), "jauna-sezona");
  });

  test("adds -2, then -3 while the slug is taken", async () => {
    const first = await insertArticle("uzvara");
    assert.equal(await ensureUniqueArticleSlug("uzvara"), "uzvara-2");
    await insertArticle("uzvara-2");
    assert.equal(await ensureUniqueArticleSlug("uzvara"), "uzvara-3");
    // The article that already owns the slug may keep it.
    assert.equal(await ensureUniqueArticleSlug("uzvara", first.id), "uzvara");
  });
});

describe("isClubPageSlugTaken", () => {
  test("reports a slug used by another page, but not the page's own slug", async () => {
    const page = await insertClubPage("vesture");
    assert.equal(await isClubPageSlugTaken("vesture"), true);
    assert.equal(await isClubPageSlugTaken("vesture", page.id), false);
    assert.equal(await isClubPageSlugTaken("vesture", page.id + 1), true);
    assert.equal(await isClubPageSlugTaken("kontakti"), false);
  });
});
