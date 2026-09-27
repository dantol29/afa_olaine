import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

async function main() {
  const endingModule = await import("../src/components/site-ending-content").catch(() => null);
  assert.ok(endingModule, "public pages need a shared sponsor-and-footer ending");

  const partner = { id: 1, name: "Atbalstītājs", logoUrl: "/partner.png", logoWidth: 200, logoHeight: 80, size: "lg" as const, needsWhite: false, websiteUrl: null };
  const $ = load(renderToStaticMarkup(<endingModule.SiteEndingContent partners={[partner]} />));
  assert.equal($('section[aria-label="Sponsori"]').length, 1, "the sponsor block appears once");
  assert.equal($('footer#contact').length, 1, "the footer appears once");
  assert.deepEqual($('section[aria-label="Sponsori"], footer#contact').map((_, element) => element.tagName).get(), ["section", "footer"], "sponsors come directly before the footer");
  assert.equal($('section[aria-label="Sponsori"] img').attr("alt"), "Atbalstītājs", "the shared ending receives real partner data");

  const empty = load(renderToStaticMarkup(<endingModule.SiteEndingContent partners={[]} />));
  assert.equal(empty('section[aria-label="Sponsori"]').length, 0, "no empty sponsor section is shown");
  assert.equal(empty('footer#contact').length, 1, "the footer remains when no partners exist");
  console.log("public page ending keeps sponsors and footer together");
}

void main();
