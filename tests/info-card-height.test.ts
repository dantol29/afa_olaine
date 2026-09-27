import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/club-links-rail.tsx", import.meta.url), "utf8");

assert.match(source, /min-h-\[64px\]/, "Info card text area stays compact on mobile");
assert.match(source, /sm:min-h-\[68px\]/, "Info card text area stays compact on desktop");
assert.match(source, /className="flex min-h-\[64px\] shrink-0 items-center justify-between/, "Info card titles and arrows are vertically centered");
assert.match(source, /group flex h-full flex-col overflow-hidden bg-\[#19191b\] text-white/, "Info cards use the Jaunumi dark surface and white text");
assert.match(source, /grid size-10 shrink-0 place-items-center bg-white text-\[#050505\]/, "Info card arrows remain prominent on dark panels");

console.log("Info card text area uses compact heights");
