import assert from "node:assert/strict";
import { describe, test } from "node:test";

import * as cheerio from "cheerio";
import { isTag } from "domhandler";

import { articleBodyToEditorHtml } from "@/lib/article-body";
import { MAX_BODY_LENGTH, MAX_RAW_BODY_LENGTH } from "@/lib/content-limits";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";
import { addMinutesWithinDay, isEndAfterStart } from "@/lib/time-range";

// The sanitizer's contract, written out independently of its implementation.
const ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  p: [], div: ["class", "role", "aria-label", "tabindex"], br: [], strong: [], b: [], em: [], i: [], u: [], h2: [], h3: [],
  ul: [], ol: [], li: [], blockquote: [], a: ["href", "rel", "target"],
  table: [], thead: [], tbody: [], tfoot: [], tr: [], th: ["colspan", "rowspan", "scope"], td: ["colspan", "rowspan"],
};
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i;

/** Parses the output again, as a browser would, and checks that only allowed tags, attributes and links survive.
 *  Re-parsing catches markup that only turns dangerous after serialisation (mutation XSS). */
function assertSafe(output: string) {
  const $ = cheerio.load(output, null, false);
  $("*").each((_, element) => {
    if (!isTag(element)) return;
    const allowed = ALLOWED_ATTRIBUTES[element.tagName];
    assert.ok(allowed, `unexpected <${element.tagName}> in ${output}`);
    for (const [name, value] of Object.entries(element.attribs)) {
      assert.ok(allowed.includes(name), `unexpected ${name} on <${element.tagName}> in ${output}`);
      if (name === "href") assert.match(value, SAFE_HREF);
    }
  });
  assert.doesNotMatch(output, /<!--/);
  assert.equal(sanitizeRichText(output), output, "sanitising twice must not change the output");
}

function sanitize(input: string) {
  const output = sanitizeRichText(input);
  assertSafe(output);
  return output;
}

describe("sanitizeRichText: links", () => {
  for (const href of [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "java&#x09;script:alert(1)",
    "&#106;avascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "VBSCRIPT:msgbox(1)",
    "//evil.example",
    "/\\evil.example",
    "/ /evil.example",
    "",
  ]) {
    test(`unwraps a link with href ${JSON.stringify(href)}`, () => {
      assert.equal(sanitize(`<a href="${href.replace(/"/g, "&quot;")}">label</a>`), "label");
    });
  }

  test("unwraps a link without href", () => {
    assert.equal(sanitize("<a name=x>label</a>"), "label");
  });

  test("external links open in a new tab without access to the opener", () => {
    assert.equal(
      sanitize('<a href="https://lff.lv/x" target="_self" rel="opener" onclick="x()">LFF</a>'),
      '<a href="https://lff.lv/x" rel="noopener noreferrer" target="_blank">LFF</a>',
    );
  });

  test("local links keep only href", () => {
    assert.equal(sanitize('<a href="/jaunumi/x" target="_blank">a</a>'), '<a href="/jaunumi/x">a</a>');
    assert.equal(sanitize('<a href="#top">b</a>'), '<a href="#top">b</a>');
  });
});

describe("sanitizeRichText: dangerous elements", () => {
  test("drops script, style, iframe, object, embed and form controls with their content", () => {
    assert.equal(
      sanitize(
        '<script>alert(1)</script><style>p{}</style><iframe src="https://x"></iframe><object data="x"></object>' +
          '<embed src="x"><form><input value="v"><button>b</button></form><p>ok</p>',
      ),
      "<p>ok</p>",
    );
  });

  test("unwraps svg and math but still checks the links inside", () => {
    assert.equal(sanitize('<svg onload="alert(1)"><a href="javascript:alert(1)">x</a><script>alert(1)</script></svg>'), "x");
    sanitize("<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>");
  });

  test("raw text inside noscript, textarea and template stays inert", () => {
    sanitize('<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>');
    assert.equal(sanitize("<textarea><img src=x onerror=alert(1)></textarea>"), "&lt;img src=x onerror=alert(1)&gt;");
    assert.equal(sanitize("<template><p>a</p><script>x</script><img src=x onerror=1></template>"), "<p>a</p>");
  });

  test("removes event handlers, styles, classes and ids", () => {
    assert.equal(sanitize('<p onclick="x" onmouseover="y" style="color:red" class="c" id="i">t</p>'), "<p>t</p>");
    assert.equal(sanitize('<img src=x onerror="alert(1)"><p>t</p>'), "<p>t</p>");
  });

  test("malformed and unclosed tags produce well-formed safe markup", () => {
    assert.equal(sanitize("<p>unclosed <strong>bold <em>both"), "<p>unclosed <strong>bold <em>both</em></strong></p>");
    sanitize("<p<img src=x onerror=alert(1)>");
    sanitize('<a href="https://x.lv"<img src=x onerror=1>>t</a>');
    assert.equal(sanitize("<scr<script>ipt>alert(1)</script>"), "ipt&gt;alert(1)");
  });
});

describe("sanitizeRichText: comments", () => {
  for (const input of [
    "<!-- note --><p>x</p>",
    "<p>a<!-- inner -->b</p>",
    "<!-- <!-- nested --> tail -->",
    "<!-- a --!> <img src=x onerror=1> -->",
    "<!--> after",
    "<!---> after",
    "<! bogus> after",
    "<?php echo 1 ?> after",
    "<![CDATA[ x ]]> after",
    "<table><!-- t --><tr><td>a<!-- d --></td></tr></table>",
    "<template><p>a<!-- c --></p><!-- d --></template>",
    "<div><div><!-- deep --><p>x</p></div></div>",
  ]) {
    test(`strips comments from ${JSON.stringify(input)}`, () => {
      assert.doesNotMatch(sanitize(input), /<!|-->|<\?/);
    });
  }
});

describe("sanitizeRichText: formatting the editor produces", () => {
  const editorHtml =
    "<h2>Virsraksts</h2><h3>Apakšvirsraksts</h3>" +
    "<p>Teksts ar <strong>treknu</strong>, <em>slīpu</em> un <u>pasvītrotu</u> daļu.<br>Jauna rinda.</p>" +
    "<ul><li><p>viens</p></li><li><p>divi</p></li></ul><ol><li><p>pirmais</p></li></ol>" +
    "<blockquote><p>Citāts</p></blockquote>" +
    '<p><a href="https://lff.lv" rel="noopener noreferrer" target="_blank">LFF</a> un <a href="/speles">spēles</a></p>' +
    '<div class="tableWrapper" role="region" aria-label="Tabula" tabindex="0"><table><tbody>' +
    '<tr><th colspan="2" scope="col">Komanda</th></tr><tr><td rowspan="2">U9</td><td>U11</td></tr></tbody></table></div>';

  test("keeps editor HTML unchanged", () => {
    assert.equal(sanitize(editorHtml), editorHtml);
  });

  test("keeps colspan and rowspan only between 1 and 50", () => {
    const output = sanitize('<table><tr><td colspan="1" rowspan="50">a</td><td colspan="51" rowspan="0">b</td><td colspan="-1" rowspan="2x">c</td></tr></table>');
    assert.match(output, /<td colspan="1" rowspan="50">a<\/td><td>b<\/td><td>c<\/td>/);
  });

  test("wraps a pasted table and normalises a wrapper's attributes", () => {
    assert.equal(
      sanitize("<table><tr><td>a</td></tr></table>"),
      '<div class="tableWrapper" role="region" aria-label="Tabula" tabindex="0"><table><tbody><tr><td>a</td></tr></tbody></table></div>',
    );
    assert.equal(
      sanitize('<div class="tableWrapper extra" onclick="x" tabindex="5"><table><tr><td>a</td></tr></table></div>'),
      '<div class="tableWrapper" role="region" aria-label="Tabula" tabindex="0"><table><tbody><tr><td>a</td></tr></tbody></table></div>',
    );
  });

  test("deep nesting within the raw length limit is flattened quickly instead of overflowing the stack", () => {
    const depth = 4000;
    const unclosedBoldDepth = Math.floor(MAX_RAW_BODY_LENGTH / "<b>".length) - 10;
    for (const input of [
      `${"<div>".repeat(depth)}<!-- x -->text${"</div>".repeat(depth)}`,
      `${"<b>".repeat(unclosedBoldDepth)}text`,
    ]) {
      assert.ok(input.length <= MAX_RAW_BODY_LENGTH);
      const started = performance.now();
      const output = sanitizeRichText(input);
      assert.ok(performance.now() - started < 1000, "sanitising deep nesting must stay fast");
      assert.match(output, /text/);
      assert.doesNotMatch(output, /<!--/);
    }
  });
});

describe("richTextHasContent", () => {
  test("is false for empty editor output", () => {
    for (const html of ["", "<p></p>", "<p>&nbsp; </p>", "<p><br></p>", "<ul><li><p> </p></li></ul>"]) {
      assert.equal(richTextHasContent(html), false, html);
    }
  });

  test("is true when any text is present", () => {
    assert.equal(richTextHasContent("<p><strong>x</strong></p>"), true);
  });
});

describe("articleBodyToEditorHtml", () => {
  test("turns old one-paragraph-per-line text into escaped paragraphs", () => {
    assert.equal(
      articleBodyToEditorHtml("Pirmā rinda\r\n\r\n  Otrā <b>&</b> \"x\" 'y'  \nTrešā\r"),
      "<p>Pirmā rinda</p><p>Otrā &lt;b&gt;&amp;&lt;/b&gt; &quot;x&quot; &#39;y&#39;</p><p>Trešā</p>",
    );
  });

  test("passes HTML bodies through unchanged", () => {
    assert.equal(articleBodyToEditorHtml("  <p>jau HTML</p>"), "  <p>jau HTML</p>");
  });

  test("an empty body gives an empty editor", () => {
    assert.equal(articleBodyToEditorHtml(" \n "), "");
  });
});

describe("time-range", () => {
  test("isEndAfterStart accepts only a later end on the same day", () => {
    assert.equal(isEndAfterStart("09:00", "10:30"), true);
    assert.equal(isEndAfterStart("9:05", "9:06"), true);
    assert.equal(isEndAfterStart("10:00", "10:00"), false);
    assert.equal(isEndAfterStart("18:00", "08:00"), false);
  });

  test("isEndAfterStart rejects malformed times", () => {
    for (const [start, end] of [["24:00", "23:00"], ["10:00", "24:00"], ["10:60", "11:00"], ["", "10:00"], ["10:00", "abc"], ["10:0", "11:00"]]) {
      assert.equal(isEndAfterStart(start, end), false, `${start}-${end}`);
    }
  });

  test("addMinutesWithinDay adds minutes and stops at 23:59", () => {
    assert.equal(addMinutesWithinDay("09:15", 90), "10:45");
    assert.equal(addMinutesWithinDay("23:30", 60), "23:59");
    assert.equal(addMinutesWithinDay("bad", 30), "00:30");
  });
});

test("the raw editor limit is twice the stored body limit", () => {
  assert.equal(MAX_BODY_LENGTH, 30_000);
  assert.equal(MAX_RAW_BODY_LENGTH, 2 * MAX_BODY_LENGTH);
});
