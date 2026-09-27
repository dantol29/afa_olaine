import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

import type { Article } from "../src/lib/jaunumi";

const article: Article = {
  slug: "parbaudes-raksts",
  title: "Svarīga uzvara mājās",
  excerpt: "Komanda izcīnīja uzvaru.",
  date: "24. sept. 2026",
  category: "Spēles",
  image: "/match-stadium.jpg",
  body: ["Pirmais raksta teikums.", "Otrais raksta teikums."],
};

async function main() {
  const { ArticlePageContent } = await import("../src/components/article-page-content");
  const html = renderToStaticMarkup(<ArticlePageContent article={article} />);
  const $ = load(html);

  assert.ok($('h1').parent().attr('class')?.split(' ').includes('w-[calc(100%-3rem)]'), "article hero title panel keeps mobile side margins");

  assert.match(html, /<h1[^>]*>Svarīga uzvara mājās<\/h1>/, "the article title must appear in the hero panel");
  assert.match(html, /Spēles/, "the article category must appear in the hero panel");
  assert.match(html, /24\. sept\. 2026/, "the article date must appear in the hero panel");
  assert.match(html, /Kopīgot Facebook/, "article readers must have a Facebook share action");
  assert.match(html, /Kopīgot Telegram/, "article readers must have a Telegram share action");
  assert.doesNotMatch(html, /Kopīgot WhatsApp/, "the WhatsApp share action must be removed");
  assert.match(html, /Kopīgot Instagram/, "article readers must have an Instagram share action");
  assert.doesNotMatch(html, /Kopīgot X/, "the X share action must be removed");
  assert.match(html, /Kopēt raksta saiti/, "article readers must be able to copy the URL");
  assert.match(html, /class="mt-7 flex justify-start"><div[^>]*aria-label="Dalīties ar rakstu"/, "share actions must align with the left edge of the title");
  assert.ok(
    html.indexOf(">Spēles</span>") < html.indexOf("<h1")
      && html.indexOf("24. sept. 2026</time>") < html.indexOf("<h1")
      && html.indexOf("<h1") < html.indexOf('aria-label="Dalīties ar rakstu"'),
    "category and date must appear above the title, with share actions below it",
  );
  assert.match(html, /Pirmais raksta teikums\./, "the article body must be rendered");
  assert.match(html, /Otrais raksta teikums\./, "all article paragraphs must be rendered");

  const legacyArticle = { ...article, quote: { text: "Vecais citāts", author: "Autors", role: "Treneris" } };
  const legacyHtml = renderToStaticMarkup(<ArticlePageContent article={legacyArticle} />);
  assert.doesNotMatch(legacyHtml, /Vecais citāts/, "legacy quote data must not be shown on article pages");

  console.log("article page content renders the story and hero metadata");
}

void main();
