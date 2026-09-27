import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const require = createRequire(import.meta.url);
require.extensions[".css"] = () => undefined;
const { TiktokVideosRail } = require("../src/components/tiktok-videos-rail");

const html = renderToStaticMarkup(createElement(TiktokVideosRail));

assert.equal((html.match(/href="https:\/\/www\.tiktok\.com\/@afa\.olaine"/g) ?? []).length, 6, "each photo is its own linked card");
for (const photo of ["back-to-school", "training", "family-day", "celebration", "teammates", "matchday"]) {
  assert.match(html, new RegExp(`tiktok%2F${photo}\\.png`), `${photo} photo is restored`);
}
assert.match(html, /Iepriekšējie video/, "the gallery has a previous button");
assert.match(html, /Nākamie video/, "the gallery has a next button");
assert.doesNotMatch(html, /data-embed-type="creator"/, "the single profile embed is removed");

console.log("TikTok photo gallery shows six separate cards");
