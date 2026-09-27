import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/afa-olaine-tv-rail.tsx", import.meta.url), "utf8");

assert.match(source, /!aspect-\[10\/9\]/, "TV cards match Info card proportions");
assert.match(source, /group flex h-full flex-col overflow-hidden bg-\[#19191b\] text-white/, "TV cards use the Info and Jaunumi dark surface");
assert.doesNotMatch(source, /ArrowUpRight/, "TV cards no longer show an arrow square");
assert.match(source, /bottomStripes\[stream\.id\] \?\? stripe/, "TV cards keep their team-colour stripe");
assert.equal((source.match(/date: "\d{2}\.\d{2}\.2026"/g) ?? []).length, 6, "every linked TV stream has a verified date");
assert.match(source, /<time>\{stream\.date\}<\/time>/, "TV cards show their date below the match title");
assert.match(source, /formatYouTubeViews\(viewCounts\[stream\.id\]\)/, "TV cards show their video view count");
assert.match(source, /min-h-\[78px\].*sm:min-h-\[82px\]/, "TV card text panels leave room for the date");

console.log("AFA Olaine TV cards show dates without arrow squares");
