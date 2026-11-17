# Proof: text formatting in news articles

Local checks on the isolated environment (`npm run local:dev`, snapshot `pre-news-formatting`, restored afterwards).

| Check | Result |
|---|---|
| `articleBodyToEditorHtml` (7 cases: `<`, `&`, quotes, CRLF, empty, HTML passthrough) | 0 failures |
| `sanitizeRichText` XSS corpus (56 inputs) | 0 failures |
| `tsc --noEmit`, `npm run lint` | 0 errors, the 3 warnings that exist on `main` |
| Old article before the resave (new code) | shown as one block, no `<p>` (expected until resaved) |
| Old article opened in the admin | 6 paragraphs in the editor, counter 665 / 30 000, no table buttons |
| H2, bold paragraph and a bullet list added, saved | body is HTML (701 chars); public page: h2 30px/600 white, paragraphs 28px apart, list item margin 0, no stray top/bottom margin |
| Empty editor, `Saglabāt` | blocked in the browser, "Raksta teksts ir obligāts.", chosen cover file and title kept, nothing saved |
| New article with a very long link | saved; link is yellow, `target=_blank rel="noopener noreferrer"` (Tiptap's `nofollow` removed), no horizontal scroll at 375 px |
| Editor in the dark admin | H2/H3 white 600, links `#fbb040`, quote bar yellow, text weight 400, list items tight: same look as the public page (before: navy headings and red links on a dark background, text inherited semibold) |
| Other pages | `/`, `/jaunumi`, `/feed.xml` (4 items) return 200; club page `futsal` (table + paragraph) unchanged |

## Not verified

- Paste from Word / Google Docs (relies on Tiptap's schema; the markdown `- ` input rule did not trigger from scripted typing).
- Safari and Firefox; tablet widths; a real `next start` after a previous build with the old cache (the cache prefix is
  the protection).
- 31000-character paste and the red counter state.
- The production article's first line starting with `<` (it would be taken as HTML): look at it before the deploy.
