import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";

import type { Article } from "@/lib/jaunumi";
import { ArticlePageContent } from "./article-page-content";

const article: Article = {
  id: 1,
  slug: "komandas-jaunumi",
  path: "/jaunumi/komandas-jaunumi-1",
  title: "Komandas jaunumi",
  excerpt: "Spēles apskats",
  date: "23. nov. 2026",
  dateKey: "2026-11-23",
  category: "Klubs",
  image: "/hero-team.png",
  body: "<p>Raksta teksts</p>",
};

test("article displays all saved gallery photos below its body", () => {
  const $ = load(renderToStaticMarkup(createElement(ArticlePageContent, {
    article: { ...article, highlights: ["/uploads/articles/first.jpg", "/uploads/articles/second.jpg"] },
  })));
  const gallery = $('section[aria-label="Komandas jaunumi — fotoattēli"]');
  assert.equal(gallery.children("h2").text(), "Foto galerija");
  assert.deepEqual(gallery.find("button img").map((_, image) => {
    const url = new URL($(image).attr("src")!, "http://localhost");
    return url.searchParams.get("url") ?? url.pathname;
  }).get(), [
    "/uploads/articles/first.jpg", "/uploads/articles/second.jpg",
  ]);
  assert.equal(gallery.find('button[aria-haspopup="dialog"]').length, 2);
  assert.ok($(".article-body").parent().nextAll().find(gallery).length > 0);
});

test("article without gallery photos does not display an empty gallery", () => {
  for (const highlights of [undefined, []]) {
    const $ = load(renderToStaticMarkup(createElement(ArticlePageContent, { article: { ...article, highlights } })));
    assert.equal($('section[aria-label="Komandas jaunumi — fotoattēli"]').length, 0);
    assert.equal($(".article-body").text(), "Raksta teksts");
  }
});
