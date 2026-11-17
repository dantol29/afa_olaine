# Plan: text formatting in news articles

Approved by the user 2026-11-17 (interview, one question at a time). Branch `feat/news-formatting`, started from
`fix/rich-text-limits` (PR #14); the PR base moves to `main` after #14 is merged.

## Decisions

- Same editor and sanitizer as club pages, without tables or images: H2/H3, bold, italic, underline, link, bullet and
  ordered lists, quote. Photos stay in the separate gallery.
- No schema change: HTML is stored in `articles.body` (the comment "one paragraph per line" in `@olaine/database` is now
  outdated; the shared package is not touched).
- Public rendering reads `body` as HTML only. There is no fallback for the old one-paragraph-per-line format and no
  migration: production has one article and the user resaves it right after the deploy.
- The admin form converts an old-format body to escaped `<p>` paragraphs when it opens an article
  (`src/lib/article-body.ts`).
- Limits from PR #14 apply (30000 characters after sanitising, 60000 raw). The editor shows a counter and blocks an
  empty submit in the browser (club pages get both too).
- List and heading styles (`font-weight: 600`, tight list items) are shared by club pages and news; paragraph rhythm of
  the article body stays 28px at 20px text.
- Cache prefix `afa-public-v1` -> `v2`: the data cache survives builds and would serve the old `body` array shape.

## Deploy and rollback

1. Merge #14, then this PR (base `main`).
2. README "Updating production": `git pull`, `bash scripts/backup-db.sh` (note `TS`, compare sizes), copy the article
   text from the admin into a note, `npm install` is not needed, build with the log and `grep`, restart.
3. Straight away: `/admin/jaunumi` -> open the article (paragraphs are split), `Saglabāt`. Until then the article shows
   as one run-on block.
4. Rollback is asymmetric: after the resave, reverting only the code shows `<p>` as text. Restore `app.db.<TS>` as well
   (stop the app, `cp -p`, start it).

## Out of scope

Images or tables in news, a read fallback for the old format, a migration script, `articleBody` in JSON-LD, length
limits on other text fields, the form reset behaviour after a server error.
