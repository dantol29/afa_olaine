import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const team = readFileSync(new URL("../src/components/team-page-content.tsx", import.meta.url), "utf8");
const games = readFileSync(new URL("../src/components/games-tabs.tsx", import.meta.url), "utf8");

const gameButtonBase = "min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px]";
const gameButtonActive = "bg-white text-[#050505]";
const gameButtonInactive = "border border-white/40 text-white hover:border-white";
const gameButtonRow = "mb-8 grid grid-cols-2 gap-2 sm:mb-10 sm:flex sm:gap-3";

for (const style of [gameButtonBase, gameButtonActive, gameButtonInactive, gameButtonRow]) {
  assert.ok(games.includes(style), `Spēles still uses the reference style: ${style}`);
  assert.ok(team.includes(style), `Komanda matches the Spēles style: ${style}`);
}

assert.match(team, /<section className="bg-\[#050505\] pb-20 pt-6 sm:pt-8 xl:pb-28"/, "Komanda uses the same top padding as Spēles");
assert.doesNotMatch(team, /border-b border-white\/20 pb-4/, "the old tab underline is removed");

console.log("team tabs match games buttons and spacing");
