# Task map: text formatting in news articles

All tasks closed 2026-11-17 (uncommitted until the user asks). Evidence: [proof.md](proof.md).

| ID | Task | Files | Status |
|---|---|---|---|
| T1 | Editor takes `label`, `placeholder`, `maxLength` (counter), `requiredMessage` (blocks an empty submit) | `src/components/admin/rich-text-editor.tsx`, club page form | closed |
| T2 | Old line format -> escaped `<p>` helper (client safe) | `src/lib/article-body.ts` | closed |
| T3 | Article form uses the editor, wider form, hint for Shift+Enter | `jaunumi/[id]/article-form.tsx` | closed |
| T4 | Server action: raw length, `sanitizeRichText`, `richTextHasContent`, length; no line splitting | `jaunumi/actions.ts` | closed |
| T5 | `Article.body` is a string, rendered through `sanitizeRichText`; shared and `article-body` styles | `jaunumi.ts`, `jaunumi-server.ts`, `article-page-content.tsx`, `globals.css` | closed |
| T6 | Cache prefix v2 and a note in `docs/public-caching.md` | `public-data-cache.ts`, `docs/public-caching.md` | closed |
