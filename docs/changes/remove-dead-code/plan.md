# Plan: remove dead code

Status: approved by the user 2026-11-12, with one change: the browser smoke check runs after every group, not only
before and after all of them. Mode: Execution plan (scope decided in the grill-me interview, questions 1-18, same day).
Tasks: [tasks.md](tasks.md). Evidence: [proof.md](proof.md) (created by T0).
Baseline: `main` at `dd263cb`, clean tree except this untracked folder.

## Goal, scope, exclusions

Goal: remove proven dead code, assets and dependencies so that the public site, the admin and the FK integration keep
behaving exactly as before.

In scope (user decisions):

1. Unreachable files: birthday block (`birthday-section.tsx`, `birthday-carousel.tsx`, `lib/birthdays-server.ts`);
   `events-calendar-section.tsx`, `events-calendar.tsx`, `latest-news-section.tsx`, `partners-section.tsx`,
   `public-search-content.tsx`, `club-nav.tsx`; `lib/poll-actions.ts`; the `/lab` route (`src/app/lab/*`);
   `src/db/seed.ts` with the `db:seed` script; `src/scripts/import-lff-roster.ts` with `src/lib/lff-roster.ts`.
2. Unused functions: `selectAcademyTeams`, `PlayerRoleRail`, `gameDate`, `middleLogoStripe`, `formatYouTubeViews`;
   the calendar bridge as a whole (`lib/calendar-bridge.ts` and its listener in `week-calendar.tsx`; the `?event=`
   URL handling stays); the unused `import * as React` in `components/ui/select.tsx`.
3. Exports: drop `export` from the ~25 symbols used only inside their own file.
4. Dependencies: remove `motion`, `class-variance-authority`, `embla-carousel-react`; declare `domhandler` (`^5.0.3`)
   in `dependencies` and `sharp` (`^0.35.4`) in `optionalDependencies` (same semantics as today through `next`).
5. Assets in `public/`: `partner-*.png` (6), `birthday-bg-logo.png`, `birthday-player.png`, the 10 old TikTok images
   in `social/tiktok/` without the `-20261006` suffix (including `back-to-school.png` and `matchday.png`), `footer-{facebook,phone,x}.svg`, `upcoming-*` (4), `altero-liga.png`. Move the work
   sources (`hero-wordmark-source.png`, `social/tiktok-reels-reference.png`, `social/tiktok/captures-20261006.json`)
   to `afa_olaine_private_files/design-sources/{brand,social}` before deleting them here.
6. CSS in `globals.css`: classes `site-header-scroll`, `league-row-enter`, `news-text-fade-in`, `poll-result-enter`,
   `partners-marquee-track`, `partners-marquee-mask`, `league-scroll`, `no-scrollbar`, `article-gallery-frame` with
   their `@keyframes`, and the override `.admin-theme .text-slate-800`.

Out of scope: `/meklet` (keeps its 307 redirect); `/api/shared-calendar` and its whole import chain (`lib/calendar.ts`,
`site-url.ts`, `training-teams.ts`, `ordering.ts`, `club-logos.ts`, `db/*`), because FK reads it; dated reports
(`SEO_NOTES.md`, `docs/changes/*`); the `@olaine/database` schema (poll tables stay); tiptap runtime classes
(`is-editor-empty`, `selectedCell`). Recorded only, not done: `/meklet` 307 -> 308; FK `db:update-shared` defaults to
the missing `../afaolaine_website` path.

## Behavior and constraints

- No visible change on live pages, routes, API responses or styles. The one intended change: `/lab` returns 404.
- The FK feed format is untouched: no file of the `/api/shared-calendar` chain changes.
- Second-order dead code: after deletions the import graph and `tsc --noUnusedLocals` run again. Non-exported locals
  and imports in files already being edited, made dead by the agreed removals, are removed in the same task. Anything
  else that turns up is shown to the user first.
- Order keeps the build green at every step: files -> functions -> exports -> dependencies (`embla` only after
  `PlayerRoleRail`) -> CSS -> assets (private copy before deletion).
- Git: branch `chore/remove-dead-code` from `main` on the user's command; one PR with one commit per group; commits,
  push, PR and the private-repo commit only on explicit command.

## Critical unknowns

| Unknown | Check | Status |
|---|---|---|
| `lff-fetch` helpers and `hexColor` left dead | grep | Closed: still used (`fixtures`, `standings`, `top-scorers`, `smoothLogoStripe`) |
| Production content references removed assets or classes after 2026-11-10 | grep on a fresh production backup taken by the user | Open; blocks only the CSS and asset groups |
| Registry access for `npm uninstall`/`install` | `docs/local-development.md`: `NODE_AUTH_TOKEN=$(gh auth token)` | Use the documented procedure; lock-file diff must touch only the changed packages |

## Requirement -> result -> proof

| Requirement | Expected result | Minimum proof |
|---|---|---|
| Only unused things are removed | No import or string reference to anything removed | Import graph and grep before/after; `tsc` |
| Build stays green | No errors | `npx tsc --noEmit`, `npm run lint`, production build after every group |
| Site behaves the same | Same pages and states | Built-in browser on `npm run local:dev` with the current `local.db`: public routes, `feed.xml`, `sitemap.xml`, `robots.txt`, admin sections; desktop and mobile screenshots compared with the baseline after every group |
| Dead CSS is really dead | Classes absent from the DOM in every state | `querySelector` probe per page with menus, search, tabs and carousels open, before and after |
| FK unaffected | `/api/shared-calendar` chain unchanged | Empty `git diff` for the chain files, plus build |
| Production content does not reference removed items | 0 matches | grep on the fresh backup before the CSS and asset groups |
| Sources are not lost | Files present in the private repo | Hash comparison before deletion from `public/` |

Limits: local data is not production data. Installation behaviour on the cPanel host (e.g. `sharp` in
`optionalDependencies`) cannot be checked locally.

## Simplification

One commit without browser checks was rejected: dead CSS and assets would rest on grep only, while the user included
CSS on condition of a browser check. Keeping the exports was rejected: it contradicts the user's decision. Running the
smoke check only before and after all groups was proposed; the user chose a check after every group instead.

## Self-check

All 18 interview decisions are covered; exclusions are explicit; Git and cross-repo actions are separated from plan
approval. No independent review proposed: changes are reversible, behaviour does not change and the proofs are
mechanical.
