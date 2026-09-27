import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../src/app/komanda/page.tsx", import.meta.url), "utf8");
const content = readFileSync(new URL("../src/components/team-page-content.tsx", import.meta.url), "utf8");

assert.match(page, /<InnerPageHero title="Komanda" id="team-page-title"\s*\/>/, "the team page uses the same hero as games");
assert.doesNotMatch(content, /hero-team\.png/, "the old photo hero is removed from team content");
assert.match(content, /aria-label="Komandas saturs"/, "roster tabs remain in the content");

console.log("team content leaves its hero to the shared page layout");
