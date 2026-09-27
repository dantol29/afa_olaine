import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const standings = readFileSync(new URL("../src/components/league-standings-rail.tsx", import.meta.url), "utf8");
const news = readFileSync(new URL("../src/components/news-grid.tsx", import.meta.url), "utf8");

assert.match(standings, /Anno\s*<span aria-hidden="true"[^>]*>/, "Anno graphic sits between the words");
assert.match(standings, /mb-20 flex items-center justify-center/, "Anno, graphic, and year are vertically centered as a row");
assert.match(standings, /h-\[0\.5em\] w-\[1em\]/, "Anno graphic is enlarged with the heading");
assert.match(standings, /bg-\[#fbb040\]/, "Anno graphic shares the news-card gold corner");
assert.match(standings, /bg-\[#050505\]/, "Anno graphic has the same cutout treatment");
assert.match(news, /absolute bottom-0 left-0 z-10 h-6 w-12 bg-\[#19191b\]/, "news cards keep the corner motif on their dark panels");

console.log("Anno 2013 uses the Jaunumi corner motif between its words");
