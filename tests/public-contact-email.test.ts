import assert from "node:assert/strict";

async function main() {
  const emailModule = await import("../src/lib/public-contact-email").catch(() => null);
  assert.ok(emailModule, "the public contact email must normalize the legacy address");
  assert.equal(emailModule.normalizePublicContactEmail("info@fkolaine.com"), "info@afaolaine.lv");
  assert.equal(emailModule.normalizePublicContactEmail("office@example.com"), "office@example.com", "custom site-settings email remains editable");
  console.log("public contact email keeps the current club address");
}

void main();
