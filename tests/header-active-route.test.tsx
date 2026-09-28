import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { load } from "cheerio";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteHeader } from "../src/components/site-header";
import { SiteHero } from "../src/components/site-hero";
import { ClubNav } from "../src/components/club-nav";

function renderAt(pathname: string, header: "home" | "inner") {
  const element = header === "home"
    ? createElement(SiteHero, { articles: [] })
    : createElement(SiteHeader);
  return load(renderToStaticMarkup(
    createElement(PathnameContext.Provider, { value: pathname }, element),
  ));
}

const home = renderAt("/", "home");
assert.match(home("header").attr("style") ?? "", /background-color:\s*(?:rgb\(5,\s*5,\s*5\)|#050505)/i, "homepage header is solid black before scrolling");
assert.equal(home('nav[aria-label="Galvenā navigācija"] a[href="/"]').attr("aria-current"), "page", "home highlights Sākums");
assert.equal(home('nav[aria-label="Galvenā navigācija"] a[href="/jaunumi"]').attr("aria-current"), undefined, "home does not highlight Jaunumi");
for (const header of ["home", "inner"] as const) {
  const page = renderAt("/", header);
  const nav = page('nav[aria-label="Galvenā navigācija"]');
  const club = nav.find('[data-club-nav]');
  assert.equal(club.length, 1, `${header} header has one Klubs menu`);
  assert.equal(club.find('button[aria-expanded]').text().trim(), "Klubs", `${header} has an accessible Klubs menu trigger`);
  assert.equal(club.find('details').length, 0, `${header} uses a React navigation menu instead of native details`);
  assert.equal(nav.children('a[href="/akademija"]').length, 0, `${header} no longer lists Akadēmija separately`);
  assert.deepEqual(
    nav.children().map((_, item) => page(item).is('[data-club-nav]') ? "Klubs" : page(item).text().trim()).get().slice(0, 3),
    ["Sākums", "Jaunumi", "Klubs"],
    `${header} places Klubs third`,
  );
}
assert.match(
  readFileSync(new URL("../src/components/club-nav.tsx", import.meta.url), "utf8"),
  /NavigationMenu\.Positioner[^>]*className="[^"]*z-\[40\]/,
  "Klubs panel sits below the z-50 header instead of covering it",
);

const games = renderAt("/speles", "inner");
assert.equal(games('nav[aria-label="Galvenā navigācija"] a[href="/speles"]').attr("aria-current"), "page", "games highlights Spēles");

const newsArticle = renderAt("/jaunumi/u14-aizvada-parliecinosu-uzvaru", "inner");
assert.equal(newsArticle('nav[aria-label="Galvenā navigācija"] a[href="/jaunumi"]').attr("aria-current"), "page", "article keeps Jaunumi highlighted");

const team = renderAt("/komanda", "inner");
assert.equal(team('[data-club-nav] button').attr("data-current"), "true", "Klubs highlights Komanda");

const academy = renderAt("/akademija", "home");
assert.equal(academy('[data-club-nav] button').attr("data-current"), "true", "Klubs highlights Akadēmija");

const mobileClub = load(renderToStaticMarkup(
  createElement(PathnameContext.Provider, { value: "/akademija" }, createElement(ClubNav, { mobile: true })),
));
assert.equal(mobileClub('details[data-club-nav] a[href="/komanda"]').length, 1, "mobile Klubs links to Komanda");
assert.equal(mobileClub('details[data-club-nav] a[href="/akademija"]').attr("aria-current"), "page", "mobile Klubs highlights Akadēmija");

console.log("public headers group club pages and highlight the current navigation section");
