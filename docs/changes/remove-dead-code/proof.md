# Proof: remove dead code

Evidence for [tasks.md](tasks.md). Raw outputs live in the git-ignored `.local/checks/dead-code/`.

## T0 baseline (2026-11-12)

Source: branch `chore/remove-dead-code` created from `main` `dd263cb`; only `docs/changes/remove-dead-code/` untracked.
Environment: `.env.local` with `TURSO_DATABASE_URL=file:./local.db`, no auth token, `SMTP_HOST=127.0.0.1`, no
`SHARED_CALENDAR_SECRET`, `SITE_URL=http://localhost:3000`; no `.env`. Production was not contacted.

- Local data: snapshot `pre-dead-code` saved (`local.db` + `uploads/`). The user's running `local:dev` (since 09:18)
  was stopped with the user's permission for the build.
- `npx tsc --noEmit`: exit 0.
- `npm run lint`: 0 errors, 3 warnings (allowed list for every task):
  `jaunumi/actions.ts:157` unused `baseSlug` (intentional rest-destructuring), `afa-olaine-tv-rail.tsx:28` `<img>`,
  `site-search.tsx:28` ref in effect cleanup.
- Build: `NODE_ENV=production npm run build -- --webpack`, exit 0, log `build-T0-20261112-124936.log`, error grep
  empty. 51 routes saved to `routes-baseline.txt` (includes `/lab`).
- Import graph: `graph-baseline.json`, `analyze-baseline.txt` (scripts `graph.cjs`, `analyze.cjs`); 10 unreachable
  files, as in the research.
- HTTP status (`status-baseline.txt`, dev server): every public page 200; `/meklet` 307; `/lab` 200;
  `/api/shared-calendar` 503 (no local secret); feed, sitemap, robots, search and calendar APIs 200.
- Admin (built-in browser, local test password): every section list and edit form id 1 returned 200; `/admin`
  redirects to `/admin/teams`; `/admin/events/1` 404 (no events locally).
- DOM probe (`dead-css-probe.js`, MutationObserver plus scroll and carousel/tab clicks): 0 hits on every public page at
  desktop width, on `/` at mobile width with the menu and the search drawer open, and on every admin page.
- Screenshots: desktop for every public page and `/lab` (broken images confirmed: `public/design-lab` missing);
  mobile for `/`, `/komanda`, `/akademija`, `/speles`, `/trenini`. Stored by the browser tool in the session
  `tool-results` folder; used for visual comparison in later tasks.

Pre-existing findings (not in scope, not changed):
- `/admin/league-sources/[id]/sync-top-scorers` returns 500 on first load: `revalidatePath` called during render
  (`page.tsx:43`). The page also runs the sync on GET and wrote goals into local `player_teams`. Local data was restored
  to `pre-dead-code` afterwards (dump identical). This page is excluded from later smoke runs.

Limits: local data only; screenshots are viewport captures, not full-page.

Doc reconciliation: tasks.md smoke rule updated (restore `pre-dead-code` before each smoke run, skip
`sync-top-scorers`). No other doc change.

## T1 unreachable files (2026-11-12)

Source: branch `chore/remove-dead-code`, HEAD `dd263cb`, uncommitted: 17 deleted files, `package.json`, docs folder.

- Reference re-check before deletion (`git grep` over src, scripts, docs, configs): no reference outside the deleted
  set; the only hit was the `db:seed` line in `package.json`, removed with the seed.
- Deleted: `birthday-section.tsx`, `birthday-carousel.tsx`, `lib/birthdays-server.ts`, `events-calendar-section.tsx`,
  `events-calendar.tsx`, `latest-news-section.tsx`, `partners-section.tsx`, `public-search-content.tsx`,
  `club-nav.tsx`, `lib/poll-actions.ts`, `src/app/lab/` (4 files), `src/db/seed.ts`, `src/scripts/import-lff-roster.ts`
  (empty `src/scripts/` removed), `lib/lff-roster.ts`; `package.json` script `db:seed`.
- Second-order: re-run graph (`graph-T1.json`, `analyze-T1.txt`) differs from baseline only by the removed entries;
  no new unreachable file or unused export. `tsc --noUnusedLocals` reports only the known `ui/select.tsx` import (T2).
  `lff-fetch` helpers stay used by `fixtures`, `standings`, `top-scorers`.
- `npx tsc --noEmit`: exit 0 (run after the build; see note). `npm run lint`: 0 errors, the 3 baseline warnings.
- Build: exit 0, `build-T1-20261112-131248.log`, error grep empty; route diff vs baseline: only `/lab` removed.
- Smoke (data restored to `pre-dead-code`): status diff vs baseline only `/lab` 200 -> 404 (Next 404 page). DOM probe
  on 11 public and 27 admin pages: every h1 correct, 0 hits. Dev log: no errors. `/uploads/partners|leagues|club-pages`
  404s are identical to the baseline (those files are missing from the local data, not related to this change).
  Database unchanged after the smoke.
- Screenshots: all pages match the baseline except the homepage hero, which renders black in this run while the DOM
  shows the hero image loaded, opacity 1 and its entry animation finished. The browser pane was hidden, which makes
  captures of composited layers unreliable; T1 changed no file used by the homepage. Recorded as a capture limit, not a
  regression. Next smoke runs re-check the hero with the pane visible.

Process notes: helper scripts moved from `.local/checks/` to the session scratchpad because `eslint` lints `.local/`
(5 `require` errors came from them, not from the project). Deleting `.next/` removes the generated `LayoutProps` type,
so `tsc` must run after a build.

Doc reconciliation: tasks.md check order updated (build before `tsc`). No other doc change.

Proposed commit: `chore: delete unreachable components, routes and scripts`. Committed as `11b0ee5`.

## T2 unused functions and calendar bridge (2026-11-12)

Source: branch `chore/remove-dead-code`, HEAD `11b0ee5`, uncommitted: 8 files (7 modified, 1 deleted).

- Reference re-check: each removed symbol was found only at its own declaration; `OPEN_CALENDAR_EVENT_NAME` only in
  `calendar-bridge.ts` and the listener in `week-calendar.tsx`.
- Removed: `selectAcademyTeams` (`academy-content.tsx`), `PlayerRoleRail` (`team-page-content.tsx`), `gameDate`
  (`games.ts`), `middleLogoStripe` (`logo-color-core.ts`), `formatYouTubeViews` (`youtube-view-count.ts`),
  `src/lib/calendar-bridge.ts`, the bridge listener and its comment mention in `week-calendar.tsx`, and
  `import * as React` in `ui/select.tsx`.
- Second-order, removed in the same edited file: `team-page-content.tsx` imports `Image`, `useEmblaCarousel`,
  `ArrowLeft`, `ArrowRight`, `UserRound`, `useCallback`, `useEffect` (used only by `PlayerRoleRail`). `hexColor` and
  `DEFAULT_BORDER_COLOR` stay (used by `smoothLogoStripe`). `embla-carousel-react` now has no importer (T4).
- Graph (`analyze-T2.txt`) differs from T1 only by the removed symbols. `tsc --noEmit` and
  `tsc --noUnusedLocals --noUnusedParameters`: exit 0. Lint: 0 errors, the 3 baseline warnings.
- Build: exit 0, `build-T2-20261112-135307.log`, error grep empty, routes identical to T1.
- Smoke (data restored): statuses identical to T1. DOM probe on 38 pages identical to T1 (same h1, same click counts,
  0 hits). `?event=training-1` on `/admin/trainings/1` opens the "2. liga treniņš" card; without the param no card
  opens. Dev log: no errors; the same 7 missing local `/uploads/` files as before. Database unchanged.
- Screenshots: `/komanda`, `/akademija`, `/speles` desktop match; on mobile `/komanda` the player and crest images do
  not appear in the capture while the DOM shows all four player images loaded with opacity 1. The browser pane was
  hidden (same capture limit as T1). The removed `PlayerRoleRail` was never rendered, so page output cannot differ.

Screenshot diagnosis (same day, T2 tree, data restored): with the pane hidden, `requestAnimationFrame` did not fire
within 3 s, entry animations (`site-panel-enter`, `site-player-info-reveal`) stayed `running`, and only 2 of 5
in-view lazy images had loaded. A capture sometimes forces one frame, so some screenshots showed the images and some
did not (the T1 homepage hero and the T2 mobile `/komanda` cases). Later captures of the same T2 pages showed the
homepage hero team photo and the mobile `/komanda` player photo and crest. Cause: the hidden browser pane pauses
rendering; not a site or code change. Rule added to tasks.md: visual comparison only when `requestAnimationFrame`
fires; otherwise the visual check is recorded as not done and only the DOM evidence counts.

Visual recheck with the pane visible (T2 tree, data restored): `requestAnimationFrame` fires; `/` and `/komanda` at
pane width and at mobile 375 show the hero team photo, the crest and the player photos as in the baseline. Dev log: no
new errors. Database identical to `pre-dead-code` afterwards (dump compare).

Doc reconciliation: tasks.md smoke rule updated (render check before screenshots). No other doc change.

Proposed commit: `chore: remove unused functions and the calendar event bridge`.
