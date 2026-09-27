import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/team-roster-rail.tsx", import.meta.url), "utf8");

assert.match(source, /const selectedPlayer = players\[selectedIndex\]/, "mobile details follow the selected player");
assert.match(source, /className="mt-5 flex items-center gap-2 sm:mt-0"/, "player arrows appear under the heading on mobile");
assert.match(source, /className="relative z-30 mx-auto -mt-\[\d+px\][^"]* sm:hidden"/, "selected player details overlay the portrait bottom only on mobile");
assert.match(source, /\{selectedPlayer\.name\}/, "mobile panel shows the selected player name");
assert.match(source, /\{selectedPlayer\.position\}/, "mobile panel shows the selected player position");
assert.match(source, /border border-white[^\n]*>Profils<\/span>/, "mobile panel includes the full-width profile treatment");
assert.match(source, /showViewAll && <a href="\/komanda" className="absolute right-0 top-0/, "homepage keeps a mobile route to the full team page");

console.log("mobile player gallery follows the selected portrait and shows the reference-style details");
