import assert from "node:assert/strict";
import { load } from "cheerio";
import { renderToStaticMarkup } from "react-dom/server";

import type { SiteSettings } from "../src/lib/site-settings";

const settings: SiteSettings = {
  legalName: 'Biedrība "Futbola klubs Olaine"',
  legalAddress: "Parka 11 - 16, Olaine",
  regNr: "50008130491",
  bankName: "Swedbank",
  bankAccount: "LV99TEST0000000000000",
  bankCode: "HABALV22",
  stadiumAddress: "Zeiferta 4, Olaine",
  phone: "+371 29332883",
  email: "info@afaolaine.lv",
};

async function main() {
  const contentModule = await import("../src/components/contact-page-content").catch(() => null);
  assert.ok(contentModule, "the contact page needs article-style content");

  const $ = load(renderToStaticMarkup(<contentModule.ContactPageContent settings={settings} />));
  assert.ok($('h1').parent().attr('class')?.split(' ').includes('w-[calc(100%-3rem)]'), "contact hero title panel keeps mobile side margins");
  assert.equal($('h1').text(), "Kontakti", "the overlapping hero panel is titled Kontakti");
  assert.equal($('section[aria-label="Kontakti"] img').attr("alt"), "Olaines pilsētas stadions", "the existing stadium photo is used in the hero");
  assert.equal($('nav[aria-label="Atpakaļceļš"] [aria-current="page"]').text(), "Kontakti", "the hero shows a contact breadcrumb");
  assert.equal($('a[href="tel:+37129332883"]').text(), settings.phone, "the phone comes from site settings");
  assert.equal($('a[href="mailto:info@afaolaine.lv"]').text(), settings.email, "the email comes from site settings");
  assert.match($.text(), /Zeiferta 4, Olaine/, "the stadium address comes from site settings");
  assert.equal($('h2').text(), "Kluba rekvizīti", "the old contact subheading is replaced with club details");
  assert.doesNotMatch($.text(), /Sazinies ar mums/, "the old contact subheading is removed");
  assert.match($.text(), /Biedrība "Futbola klubs Olaine"/, "the legal name comes from site settings");
  assert.match($.text(), /50008130491/, "the registration number comes from site settings");
  assert.match($.text(), /Swedbank/, "the bank name comes from site settings");
  assert.match($.text(), /LV99TEST0000000000000/, "the bank account comes from site settings, not page code");
  assert.match($.text(), /HABALV22/, "the bank code comes from site settings");
  console.log("contact page renders article-style hero and site settings");
}

void main();
