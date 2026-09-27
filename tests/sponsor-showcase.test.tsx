import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

async function main() {
  const showcaseModule = await import("../src/components/sponsor-showcase").catch(() => null);
  assert.ok(showcaseModule, "the homepage sponsor showcase must exist");

  const html = renderToStaticMarkup(
    <showcaseModule.SponsorShowcase partners={[
      { id: 1, name: "Partneris A", logoUrl: "/partner-a.png", logoWidth: 200, logoHeight: 80, size: "lg", needsWhite: false, websiteUrl: "https://example.com" },
      { id: 2, name: "Partneris B", logoUrl: "/partner-b.png", logoWidth: 160, logoHeight: 90, size: "sm", needsWhite: true, websiteUrl: null },
    ]} />,
  );
  const $ = load(html);
  assert.equal($('section[aria-label="Sponsori"]').length, 1, "the section has an accessible name");
  assert.equal($('section[aria-label="Sponsori"] img').length, 2, "every database partner appears once in the grid");
  assert.deepEqual($('section[aria-label="Sponsori"] img').map((_, image) => $(image).attr("alt")).get(), ["Partneris A", "Partneris B"]);
  assert.equal($('a[href="https://example.com"] img').length, 1, "a partner logo links to its website when available");
  assert.doesNotMatch(html, /Galvenais sponsors|Stratēģiskais partneris/, "the section does not invent sponsor tiers");

  assert.equal(renderToStaticMarkup(<showcaseModule.SponsorShowcase partners={[]} />), "", "no empty sponsor block appears when the database has no partners");
  console.log("sponsor showcase renders each database partner without invented tiers");
}

void main();
