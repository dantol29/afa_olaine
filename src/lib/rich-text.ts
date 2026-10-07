import * as cheerio from "cheerio";
import { isTag } from "domhandler";

const ALLOWED_TAGS = new Set([
  "p", "div", "br", "strong", "b", "em", "i", "u", "h2", "h3",
  "ul", "ol", "li", "blockquote", "a",
]);

export function sanitizeRichText(input: string): string {
  const $ = cheerio.load(input, null, false);
  $("script, style, iframe, object, embed, form, input, button").remove();

  $("*").each((_, element) => {
    if (!isTag(element)) return;
    const tag = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      $(element).replaceWith($(element).contents());
      return;
    }

    const href = tag === "a" ? element.attribs.href : undefined;
    for (const attribute of Object.keys(element.attribs)) $(element).removeAttr(attribute);
    if (tag !== "a") return;
    // Preserve local links without allowing protocol-relative or script URLs.
    const localLink = href && /^(\/(?!\/)|#)/.test(href) && !/[\\\s\u0000-\u001f]/.test(href);
    if (!href || (!localLink && !/^(https?:\/\/|mailto:|tel:)/i.test(href))) {
      $(element).replaceWith($(element).contents());
      return;
    }
    $(element).attr("href", href);
    if (!localLink) $(element).attr({ rel: "noopener noreferrer", target: "_blank" });
  });

  return $.html().trim();
}

export function richTextHasContent(html: string): boolean {
  return cheerio.load(html, null, false).text().replace(/\u00a0/g, " ").trim().length > 0;
}
