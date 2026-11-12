# Task map: remove dead code

Status: approved by the user 2026-11-12. Branch `chore/remove-dead-code` created from `main` `dd263cb` the same day
on the user's command. Commits, push and PR still need a separate command.
Progress: T0 closed 2026-11-12 (baseline in [proof.md](proof.md)); T1 closed (`11b0ee5`); T2 closed (committed); T3 closed (committed); T4 closed (committed); T5 closed (committed; B1 = `app.db.20261112-124111`); next T6.

## Sources

- Approved plan: [plan.md](plan.md) (2026-11-12, smoke check after every group).
- Evidence: [proof.md](proof.md), created by T0; every task writes its rows there under its ID.
- Baseline: `main` at `dd263cb`. Reference repos (read-only): `../fk_olaine` (reads only `/api/shared-calendar`),
  `../afa_olaine_private_files` (target of the source move in T6).

## Working rules for every task

- One task at a time, in ID order. T5 and T6 wait for blocker B1.
- Before the edit: confirm branch `chore/remove-dead-code`, HEAD and dirty files; re-run the reference search for every
  item the task removes (import graph script, `git grep` over `src scripts docs README.md *.ts *.mjs`); stop if any
  new reference appears.
- Static checks after the edit: `npm run lint` (warnings must match the T0 list, 0 errors); `npx tsc --noEmit` after
  the build (the build regenerates `.next/types`, e.g. `LayoutProps`); production build with the dev server stopped:
  `NODE_ENV=production npm run build -- --webpack 2>&1 | tee .local/checks/build-<task>-$(date +%Y%m%d-%H%M%S).log`,
  then `grep -nE 'no such column|SQLITE|Error'` on that log must print nothing. The build reads `local.db` via
  `.env.local`; confirm no production URL is configured.
- Smoke check after the edit (shared resource: one `local.db`, one dev server on port 3000, one `.next/`):
  with the server stopped, `npm run local:snapshot -- restore pre-dead-code`; then `npm run local:dev`;
  skip `/admin/league-sources/[id]/sync-top-scorers` (it writes to the database on GET, see proof.md T0); in the built-in browser open every page from the T0 page list, desktop and mobile width; run
  the T0 DOM probe; compare screenshots and probe output with the T0 baseline (screenshots only count when
  `requestAnimationFrame` fires in the tab, i.e. the browser pane is visible; then wait until in-view images are
  complete and entry animations finished; a hidden pane is shown with the app's show-pane tool first; record the visual check as not done only if frames still do not render); check the browser console and dev log
  for new errors; stop the server. Admin login with `ADMIN_PASSWORD` from `.env.local` (local test value).
- Visual coverage (user decision 2026-11-12): per-task screenshots are a sample of pages; the full pass (every page
  from the T0 list at desktop and 375 px, mobile menu and search drawer open, compared with T0) is done once in T7.
- Second-order dead code: re-run the import graph and `npx tsc --noEmit --noUnusedLocals --noUnusedParameters`.
  Remove only non-exported locals/imports in files this task already edits; list anything else in proof.md and ask.
- Grants: no `git add/commit/push/switch/checkout/reset/stash`, no PR, no writes to other repos, unless the user gives
  that command in the current message. Production is never read or written by me. Each task ends "ready to commit"
  with its proposed commit message.
- Last closure criterion: documentation reconciled (proof.md rows; plan.md if a statement proved wrong; other docs only
  if behaviour they describe changed). If nothing needed, record "no doc change" and why.

## Blockers

- B1: fresh production database backup taken by the user with `scripts/backup-db.sh`, placed in
  `../afa olaine backups/`. Needed by T5 and T6 only.

## Tasks

| ID | Outcome (and exclusions) | Plan links | Needs / gives | Acceptance |
|---|---|---|---|---|
| T0 | Branch, baseline and evidence file. No source change. | Git, proof table | Needs the user's branch command. Gives branch, `proof.md`, page list, DOM probe, baseline screenshots, lint warning list, local data snapshot `pre-dead-code` | Branch from `main` `dd263cb`; plan/tasks moved with it untracked; tsc/lint/build pass on baseline; baseline recorded |
| T1 | Delete unreachable files: birthday block (3), the 6 old components, `poll-actions.ts`, `src/app/lab/*`, `src/db/seed.ts` + `db:seed` script, `import-lff-roster.ts` + `lff-roster.ts`. Assets stay (T6). | Scope 1 | Needs T0 | Files gone; 0 references; `/lab` 404, every other page identical to baseline; checks pass |
| T2 | Remove unused functions and the calendar bridge; drop `import * as React` in `ui/select.tsx`. `?event=` handling stays. | Scope 2 | Needs T1 | 5 functions and `calendar-bridge.ts` gone, listener removed; `?event=<uid>` still opens the event; checks and smoke pass |
| T3 | Drop `export` from the ~25 file-local symbols (list re-derived on the T2 tree). | Scope 3 | Needs T2 | Re-run graph shows no unused exports except Next route exports and config defaults; checks and smoke pass |
| T4 | Dependencies: uninstall `motion`, `class-variance-authority`, `embla-carousel-react`; declare `domhandler` and `sharp` as in the plan. | Scope 4 | Needs T2 (embla), T3 | `package.json` changes exactly these 5 entries; lock diff limited to them; `npm ls` clean; checks and smoke pass |
| T5 | Remove the dead CSS classes, keyframes and the `.text-slate-800` override. Tiptap classes stay. | Scope 6 | Needs T4, B1 | B1 grep 0 matches; DOM probe 0 hits before and after on every page/state; screenshots identical; checks pass |
| T6 | Assets: copy the 3 sources to `../afa_olaine_private_files/design-sources/{brand,social}` (no commit there without command), verify hashes, then delete them and the other listed assets from `public/`. | Scope 5 | Needs T5, B1 | Hashes match; B1 grep 0 matches; no 404 for `public/` files in dev log/network on any page; checks and smoke pass |
| T7 | Integration and handover: final graph/grep on the whole tree, FK chain diff empty, full smoke vs baseline, final build, plan status, PR description draft. | All | Needs T6 | Every plan row proved in proof.md; `git diff main --stat` lists only planned paths; `/api/shared-calendar` chain untouched; local data restored to `pre-dead-code` if changed |

## Nearest ready tasks

### T0 (waits for the branch command)

1. `git status`, `git rev-parse HEAD` = `dd263cb`, only `docs/changes/remove-dead-code/` untracked; then
   `git switch -c chore/remove-dead-code`.
2. `npm run local:snapshot -- save pre-dead-code` (save only, never restore over current data).
3. Create `proof.md` with sections per task. Record: tsc, lint warning list, baseline build log path and grep result.
4. Page list: `/`, `/jaunumi`, one `/jaunumi/<slug>`, `/komanda`, one `/komanda/speletaji/<id>`, one
   `/komanda/treneri/<id>`, `/akademija`, `/speles`, `/trenini`, `/kontakti`, one `/klubs/<slug>`, `/meklet` (307),
   `/lab` (200 now), `/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/api/shared-calendar` (503 locally: no secret);
   admin: login, dashboard and every section list plus one edit form each (ids from `local.db`).
5. DOM probe script (saved in `.local/checks/dead-css-probe.js`): for every class from plan scope 6, count matches;
   run on each page with menus, search drawer, tabs and carousels opened.
6. Screenshots desktop (1440) and mobile (375) of each public page into `.local/checks/baseline/`.
7. Store the import graph output of the baseline in `.local/checks/graph-baseline.json`.

### T1

1. Reference re-check (rules above) for each file in the T1 list.
2. `git rm` is not allowed; delete with `rm` and remove the `db:seed` line from `package.json`.
3. Second-order check: expected none (all deleted files are leaves or only import each other).
4. Static checks, build, smoke. Expected differences: `/lab` 404; nothing else.
5. proof.md T1; proposed commit: `chore: delete unreachable components, routes and scripts`.

## Coverage

| Plan item | Task |
|---|---|
| Scope 1 files | T1 |
| Scope 2 functions, bridge, React import | T2 |
| Scope 3 exports | T3 |
| Scope 4 dependencies | T4 |
| Scope 5 assets and source move | T6 |
| Scope 6 CSS | T5 |
| Second-order dead code | T1-T4 |
| FK chain untouched | every task (static), T7 (diff) |
| Smoke after every group | T1-T6, baseline T0, final T7 |
| Production content check | T5, T6 (B1) |

## Simplification

- Plan item 1 is one task (T1) instead of separate tasks for components, `/lab` and scripts: all are leaf deletions
  checked the same way, so one build and one smoke cover them.
- T5 (CSS) before T6 (assets) shares the single B1 grep; doing the grep once in T5 and reusing it in T6 is valid
  because both read the same backup.
- Per-task build and smoke are kept (user decision). Cost: about one build and one browser pass per task.

## Self-check

Every plan scope item, constraint and proof row maps to a task. Dependencies follow the plan order. Git, cross-repo
and production actions require explicit commands. Each task is resumable from this file, plan.md and proof.md.
