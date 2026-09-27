import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { NewsGrid } from "../src/components/news-grid";
import type { Article } from "../src/lib/jaunumi";

const article: Article = {
  slug: "parbaudes-raksts",
  title: "Parbaudes raksts",
  excerpt: "",
  date: "24. sept. 2026",
  category: "Spēles",
  image: "/match-stadium.jpg",
  body: [],
};

const html = renderToStaticMarkup(<NewsGrid articles={[article]} />);
assert.doesNotMatch(html, /<select\b/, "news filters should not open the browser's native select menu");
for (const label of ["Sekcija", "Kategorija"]) {
  assert.match(html, new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`), `${label} should have a custom, accessible trigger`);
}
assert.doesNotMatch(html, /sm:min-w-\[190px\]/, "news filters should not add extra desktop width around their labels");
assert.match(html, /group block min-w-0 bg-\[#19191b\] text-white/, "news cards should sit on a dark panel rather than a white one");
assert.match(html, /text-white\/60/, "news dates should remain legible on the dark panel");

console.log("news filters match the games tab styling");
