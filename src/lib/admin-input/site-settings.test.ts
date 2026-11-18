import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { parseSettingsInput } from "@/lib/admin-input/site-settings";
import { formData, withFields } from "../../../test/form";

const VALID = {
  legalName: " Biedrība AFA Olaine ",
  legalAddress: "Olaine",
  regNr: "40000000000",
  bankName: "Banka",
  bankAccount: "LV00BANK0000000000000",
  bankCode: "BANKLV2X",
  stadiumAddress: "Stadiona iela 1",
  phone: "+371 20000000",
  email: " info@example.lv ",
};

function parse(changes: Record<string, unknown> = {}) {
  return parseSettingsInput(formData(withFields(VALID, changes)));
}

describe("parseSettingsInput", () => {
  test("trims every field", () => {
    const parsed = parse();
    assert.equal(parsed.legalName, "Biedrība AFA Olaine");
    assert.equal(parsed.email, "info@example.lv");
  });

  test("requires every field, each with its own message", () => {
    const messages: Record<keyof typeof VALID, string> = {
      legalName: "Biedrības nosaukums ir obligāts.",
      legalAddress: "Juridiskā adrese ir obligāta.",
      regNr: "Reģistrācijas numurs ir obligāts.",
      bankName: "Bankas nosaukums ir obligāts.",
      bankAccount: "Konta numurs ir obligāts.",
      bankCode: "Bankas kods ir obligāts.",
      stadiumAddress: "Stadiona adrese ir obligāta.",
      phone: "Tālrunis ir obligāts.",
      email: "E-pasts ir obligāts.",
    };
    for (const [field, error] of Object.entries(messages)) assert.deepEqual(parse({ [field]: "  " }), { error }, field);
  });
});
