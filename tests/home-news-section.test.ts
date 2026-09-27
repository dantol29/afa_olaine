import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const home = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

assert.doesNotMatch(home, /<LatestNewsSection\b/, "the standalone Jaunumi cards are removed from the homepage");
assert.match(home, /<SiteHero\b/, "the news-driven hero remains");
assert.match(home, /<ClubLinksRail\s*\/>\s*<AfaOlaineTvSection\s*\/>\s*<TiktokVideosRail\s*\/>/, "Info appears before AFA Olaine TV and TikTok");

console.log("homepage omits standalone Jaunumi cards but keeps the hero and surrounding sections");
