import assert from "node:assert/strict";
import { load } from "cheerio";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteHeader } from "../src/components/site-header";
import { SiteHero } from "../src/components/site-hero";

function renderAt(pathname: string, header: "home" | "inner") {
  const element = header === "home"
    ? createElement(SiteHero, { articles: [] })
    : createElement(SiteHeader);
  return load(renderToStaticMarkup(
    createElement(PathnameContext.Provider, { value: pathname }, element),
  ));
}

const home = renderAt("/", "home");
assert.equal(home('nav[aria-label="Galvenā navigācija"] a[href="/"]').attr("aria-current"), "page", "home highlights Sākums");
assert.equal(home('nav[aria-label="Galvenā navigācija"] a[href="/jaunumi"]').attr("aria-current"), undefined, "home does not highlight Jaunumi");

const games = renderAt("/speles", "inner");
assert.equal(games('nav[aria-label="Galvenā navigācija"] a[href="/speles"]').attr("aria-current"), "page", "games highlights Spēles");

const newsArticle = renderAt("/jaunumi/u14-aizvada-parliecinosu-uzvaru", "inner");
assert.equal(newsArticle('nav[aria-label="Galvenā navigācija"] a[href="/jaunumi"]').attr("aria-current"), "page", "article keeps Jaunumi highlighted");

console.log("public header highlights the current navigation section");
