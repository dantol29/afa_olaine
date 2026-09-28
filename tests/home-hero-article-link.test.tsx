import assert from "node:assert/strict";
import { load } from "cheerio";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteHero } from "../src/components/site-hero";

const html = renderToStaticMarkup(
  createElement(
    PathnameContext.Provider,
    { value: "/" },
    createElement(SiteHero, {
      articles: [
        { slug: "pirmais-raksts", title: "Pirmais raksts", date: "24. sept. 2026", image: "/hero-team.png" },
        { slug: "otrais-raksts", title: "Otrais raksts", date: "23. sept. 2026", image: "/hero-team.png" },
      ],
    }),
  ),
);
const $ = load(html);

assert.equal(
  $('a:contains("Lasīt vairāk")').attr("href"),
  "/jaunumi/pirmais-raksts",
  "the hero's read-more control opens the currently shown article",
);

const previousArrow = $('button[aria-label="Iepriekšējais jaunums"]');
const nextArrow = $('button[aria-label="Nākamais jaunums"]');
assert.equal(previousArrow.length, 1, "the hero has one previous arrow");
assert.equal(nextArrow.length, 1, "the hero has one next arrow");
assert.doesNotMatch(previousArrow.parent().attr("class") ?? "", /(?:^|\s)(?:md:hidden|hidden)(?:\s|$)/, "hero arrows stay visible on desktop");
assert.equal($('button[aria-label^="Rādīt jaunumu"]').length, 0, "desktop hero no longer renders stripe pagination");

console.log("homepage hero links to its displayed article and uses arrows at every screen size");
