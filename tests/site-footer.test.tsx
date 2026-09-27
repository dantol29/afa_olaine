import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

import { SiteFooter } from "../src/components/site-footer";

const html = renderToStaticMarkup(<SiteFooter />);
const $ = load(html);

assert.match(html, /<footer[^>]*id="contact"/, "contact links remain reachable from the site navigation");
assert.equal($('a[href="mailto:info@afaolaine.lv"]').text().trim(), "info@afaolaine.lv", "visitors can email the club at its current address");
assert.match(html, /href="tel:\+37129332883"/, "visitors can call the club");
for (const href of ["/jaunumi", "/speles", "/trenini", "/akademija"]) {
  assert.ok(html.includes(`href="${href}"`), `footer navigation links to ${href}`);
}
assert.match(html, /href="https:\/\/42days\.eu\/lv"/, "the developer credit links to 42days");
assert.match(html, /42logo-white\.webp/, "the approved developer logo is present");
assert.match(html, /afaolaine-logo-outline\.png/, "the club mark sits subtly behind the footer columns");
assert.match(html, /href="https:\/\/www\.youtube\.com\/@afaolaine"/, "the social row includes the club YouTube channel");
const socialLinks = $('nav[aria-label="AFA Olaine sociālie tīkli"] a');
assert.deepEqual(socialLinks.map((_, link) => $(link).attr("aria-label")).get(), ["Facebook", "Instagram", "YouTube", "E-pasts"], "email is the final icon in the social row");
assert.equal(socialLinks.eq(3).attr("href"), "mailto:info@afaolaine.lv", "the final icon opens a message to the club");
assert.equal(socialLinks.eq(0).find("svg").length, 1, "Facebook uses the new standalone icon");
assert.equal(socialLinks.eq(2).find("svg path").length, 1, "YouTube uses the new icon artwork");
assert.match($('footer').attr('class') ?? '', /bg-\[#050505\]/, "footer matches the page's black background");
assert.match(socialLinks.eq(2).find('svg').attr('class') ?? '', /size-6/, "YouTube artwork is larger than the other icons");
const footerColumns = $('footer > div:first-child > div > div').last();
assert.match(footerColumns.attr('class') ?? '', /grid-cols-1/, "footer details stack in one column on mobile");
assert.match(footerColumns.attr('class') ?? '', /sm:grid-cols-2/, "tablet footer can use two columns");
assert.match(footerColumns.attr('class') ?? '', /lg:grid-cols-\[1\.05fr_1fr_1fr_auto\]/, "desktop footer keeps its four-column layout");

console.log("footer exposes club navigation, contact links, and developer credit");
