import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/app/kontakti/page.tsx", import.meta.url), "utf8");
const settings = readFileSync(new URL("../src/lib/site-settings.ts", import.meta.url), "utf8");

assert.match(route, /getPublicSiteSettings\(\)/, "the public contact page loads its details from the database-only reader");
assert.match(settings, /export async function getPublicSiteSettings/, "a database-only settings reader exists");
assert.doesNotMatch(route, /LV\d{2}HABA\d+/, "the page does not hard-code a bank account");

console.log("contact page uses only database settings");
