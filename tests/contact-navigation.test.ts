import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

for (const path of [
  "../src/components/site-header.tsx",
  "../src/components/site-hero.tsx",
  "../src/components/site-footer.tsx",
  "../src/components/club-links-rail.tsx",
]) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  assert.match(source, /\/kontakti/, `${path} links to the new contact page`);
  assert.doesNotMatch(source, /["'](?:\/#contact|#contact)["']/, `${path} no longer links to the footer anchor`);
}

console.log("public contact navigation opens the contact page");
