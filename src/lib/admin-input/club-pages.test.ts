import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { MAX_IMAGES, parseMediaInput, parsePageInput, slugify } from "@/lib/admin-input/club-pages";
import { parseClubPageMedia, type ClubPageMedia } from "@/lib/club-page-media";
import { MAX_BODY_LENGTH, MAX_RAW_BODY_LENGTH } from "@/lib/content-limits";
import { formData, withFields } from "../../../test/form";

const VALID = {
  title: "  Par klubu  ",
  slug: "",
  description: "  Īsumā par AFA Olaine  ",
  body: "<p>Teksts</p>",
  displayOrder: "2",
  isPublished: "on",
};

function parse(changes: Record<string, unknown> = {}) {
  return parsePageInput(formData(withFields(VALID, changes)));
}

const NO_MEDIA: ClubPageMedia = { layout: "gallery", photos: [], actions: [] };

function image(name: string, size = 10) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}

function media(fields: Record<string, string | File | (string | File)[]>, current = NO_MEDIA, files: File[] = []) {
  return parseMediaInput(formData(fields), current, files);
}

describe("slugify (club pages)", () => {
  test("drops Latvian diacritics and joins words with dashes", () => {
    assert.equal(slugify("Ģimeņu Ūdens Šķēršļi — Žūrija"), "gimenu-udens-skersli-zurija");
  });
});

describe("parsePageInput", () => {
  test("trims fields, derives the slug from the title and reads the checkbox", () => {
    assert.deepEqual(parse(), {
      title: "Par klubu",
      slug: "par-klubu",
      description: "Īsumā par AFA Olaine",
      body: "<p>Teksts</p>",
      displayOrder: 2,
      isPublished: true,
    });
    assert.equal(parse({ isPublished: undefined }).isPublished, false);
  });

  test("uses an explicit slug instead of the title", () => {
    assert.equal(parse({ slug: "Vēsture un Tradīcijas" }).slug, "vesture-un-tradicijas");
  });

  test("reports missing or empty required fields", () => {
    assert.deepEqual(parse({ title: " " }), { error: "Virsraksts ir obligāts." });
    assert.deepEqual(parse({ title: "!!!" }), { error: "Neizdevās izveidot derīgu lapas saiti." });
    assert.deepEqual(parse({ description: "" }), { error: "Īsais apraksts ir obligāts." });
    assert.deepEqual(parse({ body: "<p></p>" }), { error: "Lapas teksts ir obligāts." });
  });

  test("limits the title to 120, the slug to 100 and the description to 240 characters", () => {
    assert.equal(parse({ title: "a".repeat(120), slug: "a" }).title?.length, 120);
    assert.deepEqual(parse({ title: "a".repeat(121) }), { error: "Virsraksts nedrīkst pārsniegt 120 rakstzīmes." });
    assert.equal(parse({ slug: "b".repeat(100) }).slug?.length, 100);
    assert.deepEqual(parse({ slug: "b".repeat(101) }), { error: "Lapas saite nedrīkst pārsniegt 100 rakstzīmes." });
    assert.equal(parse({ description: "c".repeat(240) }).description?.length, 240);
    assert.deepEqual(parse({ description: "c".repeat(241) }), { error: "Īsais apraksts nedrīkst pārsniegt 240 rakstzīmes." });
  });

  test("limits the sanitised body to MAX_BODY_LENGTH and the raw body to MAX_RAW_BODY_LENGTH", () => {
    const paragraph = (length: number) => `<p>${"a".repeat(length - 7)}</p>`;
    assert.equal(parse({ body: paragraph(MAX_BODY_LENGTH) }).body?.length, MAX_BODY_LENGTH);
    assert.deepEqual(parse({ body: paragraph(MAX_BODY_LENGTH + 1) }), { error: "Lapas teksts ir pārāk garš." });
    const comment = (length: number) => `<p>a</p><!--${"x".repeat(length - 15)}-->`;
    assert.equal(parse({ body: comment(MAX_RAW_BODY_LENGTH) }).body, "<p>a</p>");
    assert.deepEqual(parse({ body: comment(MAX_RAW_BODY_LENGTH + 1) }), { error: "Lapas teksts ir pārāk garš." });
  });

  test("checks the raw body length before any other field", () => {
    assert.deepEqual(parse({ title: "", body: "x".repeat(MAX_RAW_BODY_LENGTH + 1) }), { error: "Lapas teksts ir pārāk garš." });
  });

  test("reads the display order as an integer, defaulting to 0", () => {
    assert.equal(parse({ displayOrder: undefined }).displayOrder, 0);
    assert.equal(parse({ displayOrder: "-3" }).displayOrder, -3);
    assert.deepEqual(parse({ displayOrder: "abc" }), { error: "Secībai jābūt veselam skaitlim." });
  });
});

describe("parseMediaInput", () => {
  test("defaults to the gallery layout with no buttons", () => {
    assert.deepEqual(media({}), { layout: "gallery", actions: [], retained: [], newDetails: [] });
    assert.equal((media({ imageLayout: "sidebar" }) as { layout: string }).layout, "sidebar");
  });

  test("parses action buttons and allows up to 6", () => {
    const button = { label: " Pieteikties ", href: "/klubs/pieteikties", style: "outline", newTab: true };
    const parsed = media({ actionButtons: JSON.stringify([button]) });
    assert.deepEqual("actions" in parsed && parsed.actions, [{ label: "Pieteikties", href: "/klubs/pieteikties", style: "outline", newTab: true }]);
    assert.equal("actions" in media({ actionButtons: JSON.stringify(Array(6).fill(button)) }), true);
    assert.deepEqual(media({ actionButtons: JSON.stringify(Array(7).fill(button)) }), { error: "Lapā var būt līdz 6 pogām." });
  });

  test("rejects unreadable, oversized or unsafe button data", () => {
    assert.deepEqual(media({ actionButtons: "[" }), { error: "Neizdevās nolasīt pogas." });
    assert.deepEqual(media({ actionButtons: "{}" }), { error: "Lapā var būt līdz 6 pogām." });
    assert.deepEqual(media({ actionButtons: " ".repeat(12001) }), { error: "Pogu dati ir pārāk gari." });
    assert.deepEqual(media({ actionButtons: JSON.stringify([{ label: "X", href: "javascript:alert(1)" }]) }), {
      error: "Pogai norādi derīgu saiti: https://…, /klubs/…, mailto:… vai tel:…",
    });
  });

  test("keeps current photos unless removed and updates their texts", () => {
    const current: ClubPageMedia = { ...NO_MEDIA, photos: [
      { src: "/uploads/club-pages/a.jpg", alt: "A", caption: "Pirmā" },
      { src: "/uploads/club-pages/b.jpg", alt: "B", caption: "Otrā" },
    ] };
    const parsed = media({
      removeImages: "/uploads/club-pages/a.jpg",
      "imageAlt:/uploads/club-pages/b.jpg": "  Jauns B  ",
    }, current);
    assert.deepEqual("retained" in parsed && parsed.retained, [{ src: "/uploads/club-pages/b.jpg", alt: "Jauns B", caption: "Otrā" }]);
  });

  test("pairs new files with their alt texts and captions and limits text length", () => {
    const parsed = media({ newImageAlt: ["Pirmais", " Otrais "], newImageCaption: ["Paraksts"] }, NO_MEDIA, [image("1.png"), image("2.png")]);
    assert.deepEqual("newDetails" in parsed && parsed.newDetails, [
      { alt: "Pirmais", caption: "Paraksts" },
      { alt: "Otrais", caption: "" },
    ]);
    assert.deepEqual(media({ newImageAlt: "a".repeat(201) }, NO_MEDIA, [image("1.png")]), {
      error: "Attēla apraksts ir pārāk garš (līdz 200 rakstzīmēm).",
    });
    assert.deepEqual(media({ newImageCaption: "a".repeat(241) }, NO_MEDIA, [image("1.png")]), {
      error: "Attēla apraksts ir pārāk garš (līdz 240 rakstzīmēm).",
    });
  });

  test(`allows at most ${MAX_IMAGES} images in total and 5 MB per upload`, () => {
    const current: ClubPageMedia = { ...NO_MEDIA, photos: [{ src: "/uploads/club-pages/a.jpg", alt: "", caption: "" }] };
    const files = (count: number) => Array.from({ length: count }, (_, index) => image(`${index}.png`));
    assert.equal("retained" in media({}, current, files(MAX_IMAGES - 1)), true);
    assert.deepEqual(media({}, current, files(MAX_IMAGES)), { error: `Vienai lapai var pievienot ne vairāk kā ${MAX_IMAGES} attēlus.` });
    assert.equal("retained" in media({}, NO_MEDIA, [image("big.png", 5 * 1024 * 1024)]), true);
    assert.deepEqual(media({}, NO_MEDIA, [image("big.png", 5 * 1024 * 1024 + 1)]), { error: "Vienā reizē augšupielādē līdz 5 MB attēlu." });
  });
});

describe("parseClubPageMedia", () => {
  test("reads the old newline-separated image list as a sidebar layout", () => {
    assert.deepEqual(parseClubPageMedia(" /uploads/a.jpg \n\n/uploads/b.jpg"), {
      layout: "sidebar",
      actions: [],
      photos: [{ src: "/uploads/a.jpg", alt: "", caption: "" }, { src: "/uploads/b.jpg", alt: "", caption: "" }],
    });
    assert.deepEqual(parseClubPageMedia(null), NO_MEDIA);
  });

  test("drops unsafe photos and buttons from stored JSON and falls back on invalid data", () => {
    const stored = JSON.stringify({
      version: 1,
      layout: "sidebar",
      photos: [{ src: "/uploads/a.jpg", alt: "A" }, { src: "javascript:alert(1)" }, { src: "//evil.example/x.jpg" }],
      actions: [{ label: "Lasīt", href: "https://afaolaine.lv" }, { label: "", href: "/klubs" }],
    });
    assert.deepEqual(parseClubPageMedia(stored), {
      layout: "sidebar",
      photos: [{ src: "/uploads/a.jpg", alt: "A", caption: "" }],
      actions: [{ label: "Lasīt", href: "https://afaolaine.lv", style: "primary", newTab: false }],
    });
    assert.deepEqual(parseClubPageMedia('{"version":2,"photos":[],"actions":[]}'), NO_MEDIA);
    assert.deepEqual(parseClubPageMedia("{broken"), NO_MEDIA);
  });
});
