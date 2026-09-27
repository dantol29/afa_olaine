import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteHeader } from "../src/components/site-header";
import { SiteHero } from "../src/components/site-hero";

async function main() {
  const header = load(renderToStaticMarkup(<SiteHeader />));
  const hero = load(renderToStaticMarkup(<SiteHero articles={[]} />));
  assert.equal(header('a[aria-label="Meklēt"][href="/meklet"]').length, 2, "inner-page search opens on desktop and mobile");
  assert.equal(hero('a[aria-label="Meklēt"][href="/meklet"]').length, 2, "homepage search opens on desktop and mobile");

  const search = await import("../src/components/public-search-content").catch(() => null);
  assert.ok(search, "search results have a public view");
  const html = renderToStaticMarkup(<search.PublicSearchContent query="Olaine" results={{
    articles: [{ slug: "uzvara", title: "U14 uzvara", excerpt: "Svarīga uzvara", image: "/test.jpg" }],
    players: [{ id: 7, name: "Jānis Ozols", photoUrl: null, teamName: "2. liga" }],
    coaches: [{ id: 8, name: "Anna Bērziņa", position: "Trenere", photoUrl: null, license: "B", authority: "LFF" }],
    teams: [{ id: 1, name: "2. liga" }, { id: 3, name: "U14" }],
  }} />);
  const $ = load(html);
  assert.equal($('form[action="/meklet"][method="get"] input[name="q"]').attr("value"), "Olaine", "search query remains editable");
  for (const href of ["/jaunumi/uzvara", "/komanda/speletaji/7", "/komanda?skats=treneri", "/komanda", "/akademija#team-3"]) {
    assert.equal($(`a[href="${href}"]`).length > 0, true, `result links to ${href}`);
  }
  assert.match(renderToStaticMarkup(<search.PublicSearchContent query="zz-no-match" results={{ articles: [], players: [], coaches: [], teams: [] }} />), /Nekas nav atrasts/, "an empty search has a clear message");
  const teamPage = await import("../src/lib/team-page");
  assert.equal(teamPage.teamTabFromSearchParam("treneri"), "staff", "coach search result opens the trainers tab");
  console.log("public search controls lead to an editable, actionable results page");
}

void main();
