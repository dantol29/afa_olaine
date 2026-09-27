import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteHeader } from "../src/components/site-header";
import { SiteHero } from "../src/components/site-hero";

for (const [page, html] of [
  ["inner page", renderToStaticMarkup(<SiteHeader />)],
  ["homepage", renderToStaticMarkup(<SiteHero articles={[]} />)],
] as const) {
  const $ = load(html);
  assert.equal($('a[aria-label="Profils"][href="/admin"]').length, 1, `${page} profile control navigates to the protected admin entry`);
  assert.equal($('button[aria-label="Profils"]').length, 0, `${page} has no dead profile button`);
}

console.log("profile controls navigate to the existing admin entry");
