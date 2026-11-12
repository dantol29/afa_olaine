# Task map: list ordering

Status: task map for user approval. Approval of this map does not authorize implementation, reverting the draft,
commits or any Git operation that changes state.

## Sources and decisions

- Approved plan: [plan.md](plan.md) (variant B, Phases 0-4, R1-R15). The plan header still says "for user approval";
  approval of variant B and of the plan is taken from the caller's brief (2026-11-12). T0 records it in the plan status.
- Observation record: [proof.md](proof.md). Phase 0 BEFORE (R1-R9) was observed on unchanged `main` `a16b33f`. Its
  AFTER section and R16-R20 were observed on the **draft** and are not accepted as proof of the final code.
- Decisions kept from the plan: one pure module `src/lib/ordering.ts`; the data layer returns the final order;
  components do not sort, except (1) filter option labels built in client components and (2) one calendar sort after
  the client merge in `week-calendar.tsx`, both through `ordering.ts`; `/akademija` teams by `id`; partners by `id`;
  club-logo rows by `id`; dead-code cleanup is a separate branch.
- New facts since the plan (from the caller, 2026-11-12): production Node 24.22.3, ICU 78.3, `Intl.Collator('lv')`
  sorts `A C Č N Ņ Z`. This closes the plan's "Production ICU data" unknown. Still open: production player id 67 photo.
- Repo state at decomposition: branch `feat/list-ordering`, HEAD `a16b33f` (= `main` baseline), 30 dirty source paths
  (the draft, see below), untracked `docs/changes/` and `src/lib/ordering.ts`. Snapshots present in `.local/snapshots/`:
  `full-demo`, `pre-list-ordering`, `list-ordering`, `pre-prod-copy`, `roster-2026-11`.

## Working rules for every task

- Ownership: Opus reviews and writes every line. The draft is reference material only. Each task opens the saved draft
  hunks for its files, decides per element (keep after review / fix / rewrite, see the disposition table), then writes
  the code into a tree that is at baseline for its files.
- Every task ends with its own local BEFORE/AFTER proof on the fixture snapshot: BEFORE is observed on the current tree
  **before** the task's edit (defect visible, or for refactors the behavior that must stay identical), AFTER after the
  edit, plus the task's must-not-change rows. Values go into `proof.md` under the task ID.
- Standard proof procedure (shared resource: one `local.db`, one dev server on port 3000, one `.next/`): stop the dev
  server; `npm run local:snapshot -- restore <fixture snapshot from T0>` (clears `.next/`); `npm run local:dev`;
  observe in the built-in browser (page text, item order) or with curl; stop the server. Admin pages: log in at
  `http://localhost:3000/admin` with `ADMIN_PASSWORD` from `.env.local` (local test value, `docs/local-development.md:25`).
- Standard static checks per task: `npx tsc --noEmit`; `npm run lint` (0 errors; the 3 warnings that exist on `main`
  are allowed and must be listed); `npx tsx .local/checks/ordering-check.mts` once T1 exists. Production build only in
  T8 (see the build note there).
- Grants: none of these tasks may run `git add/commit/push/branch/switch/checkout/reset/stash`. Per-task commits need a
  separate user request (see Open questions). Production is never read or written.
- Last closure criterion of every task: documentation reconciled (`proof.md` rows for the task, `plan.md` status and any
  plan statement the task proved wrong; other docs only if behavior they describe changed). If no edit is needed,
  record "no doc change" with the reason in the task's proof section.

## Draft disposition (input for the tasks)

The draft is saved by T0 before any reset. "Keep after review" still means Opus re-reads and re-types or re-applies it
inside the owning task and proves it; nothing is accepted because it already exists.

| Draft element | Owner | Disposition | Reason / required correction |
|---|---|---|---|
| `src/lib/ordering.ts` (5 exports) | T1 | keep after review | Matches plan table. Review: collator options, copy-not-mutate, stable sort, empty-label handling, no `server-only` or schema import. |
| `.local/checks/ordering-check.mts` (git-ignored) | T1 | fix | Add BEFORE assertions that show the baseline comparators are wrong (`localeCompare(…,"lv")` puts `U11` before `U9`; code-point puts `Ņ` after `Z`), `orderRoster` stability for equal names, `compareByStart` stability for equal starts. |
| `src/lib/public-team-data.ts` | T2 | keep after review | Check the cache key changes with the loader body (plan Boundaries) and that no name `orderBy` is left. |
| `src/app/akademija/page.tsx` | T2 | keep after review | Sort moved to the loader; team order by `id` unchanged. |
| `src/components/team-section.tsx`, delete `src/lib/team-showcase.ts` | T2 | keep after review | Plan Phase 1 deletes it (only importer). `PLAYER_CUTOUTS` stays (plan: override changes image only). |
| `src/app/komanda/treneri/[id]/page.tsx` | T2 | keep after review | |
| `src/lib/trainings-server.ts` | T3 | keep after review | `sortByName` over all coach rows before grouping is valid (stable); confirm no change to coach photo mapping. |
| `src/lib/training-teams.ts` | T3 | keep after review | `uniqueSortedLabels` also de-duplicates; harmless (training_teams pairs are unique), record it. |
| `src/lib/games-server.ts` | T3 | keep after review | Tie-breaker `id` only (R11, not visible). |
| `src/components/games-tabs.tsx`, `news-grid.tsx` | T3 | keep after review | Client-side label exception (1). |
| `src/components/training-schedule.tsx` | T3 | keep after review | Client re-sort removal depends on the server `date, startTime, id` order in the same task. |
| `src/lib/search-server.ts`, `src/components/site-search.tsx` | T4 | fix | Logic matches the plan. Fix: local `topByName` helper is acceptable but must stay private and documented; confirm the empty team label stays `null`; keep `public-search-content.tsx` untouched (type change additive). |
| `src/app/sitemap.ts` | T4 | keep after review | |
| Admin tables: `coaches/page.tsx`, `teams/page.tsx`, `players/page.tsx`, `trainings/page.tsx`, `games/page.tsx`, `events/page.tsx`, `club-logos/page.tsx` | T5 | keep after review | Check `data-admin-search-item` strings still contain all names (search filter must not lose matches). |
| Admin form selects: `{players,coaches,games,events,league-sources,jaunumi,trainings}/[id]/page.tsx` | T6 | keep after review | Pure `orderBy(name)` -> `sortByName` swaps. |
| `src/lib/calendar.ts` | T7 | keep after review | Comparator swap only; merge order of types for equal starts must stay training, other, game. |
| `src/components/week-calendar.tsx` | T7 | fix | Draft was proven only partly (no mobile/+N/07:00 in the draft record; R17-R19 later used temporary events). Re-derive each removed sort's equality argument, keep the "expects start order" contract comment, add the fixture rows needed for overflow and same-start, run the full behavior matrix. Rewrite if any matrix row differs. |
| `docs/changes/list-ordering/proof.md` AFTER and R16-R20 sections | T0 | replace | Mark as "draft observations, superseded"; the final record is per task. |

## Tasks

### T0 - Baseline, saved draft and fixture readiness (ready)

Outcome: the draft is preserved outside the source tree; the source tree is back at `a16b33f` content; the fixture
covers every requirement including calendar overflow and same-start ties; a full BEFORE record (R1-R20 and the
must-not-change list) exists for the baseline.
Exclusions: no source code is written; no snapshot is deleted.
Requirements: plan Phase 0, "Local proof setup", must-not-change list; proof.md R16-R20.
Prerequisites: user approval of this map **and** explicit approval to overwrite the 30 dirty source paths with baseline
content after saving them (Open question 1).
Outputs: `.local/list-ordering/draft/` (patch + copied untracked files + sha256 list); clean source tree; snapshot
`list-ordering-v2`; baseline captures in `.local/list-ordering/baseline/`; BEFORE table in `proof.md`.

Steps:
1. Record `git rev-parse HEAD`, `git branch --show-current`, `git status --short` (expect HEAD `a16b33f`).
2. Save the draft (all git-ignored, `.local/` is in `.gitignore:52-53`):
   `mkdir -p .local/list-ordering/draft`;
   `git diff a16b33f > .local/list-ordering/draft/tracked.patch`;
   `cp src/lib/ordering.ts .local/list-ordering/draft/ordering.ts`;
   `cp .local/checks/ordering-check.mts .local/list-ordering/draft/ordering-check.mts`;
   `shasum -a 256 .local/list-ordering/draft/* > .local/list-ordering/draft/SHA256SUMS`.
   Check: `git apply --check -R .local/list-ordering/draft/tracked.patch` succeeds (patch matches the tree).
3. After explicit approval only: restore baseline content without Git state commands, e.g. for each path in
   `git diff --name-only a16b33f`: `git show a16b33f:"<path>" > "<path>"`; `rm src/lib/ordering.ts`.
   Check: `git status --short` shows only `?? docs/changes/`; `git diff --stat` is empty.
4. Fixture: copy `.local/fixtures/list-ordering.sql` and extend it (git-ignored, local only):
   - F10 overflow: on one day in the admin calendar window, 5 items that overlap in one hour (at least 4 simultaneous
     columns, `MAX_VISIBLE_COLS = 3` in `week-calendar.tsx:147`), inserted latest-start first, with distinct titles.
   - F11 same-start: a training, an event and a game with the same start on one day (server merge order must stay
     training, other, game; `calendar.ts:280-286`).
   - F12 merge case as a separate file `.local/fixtures/list-ordering-merge.sql`: one 07:00 event on a day that is
     loaded by fetch, applied while the page is open (R15).
   - Check that all fixture dates are still in the future and inside the calendar windows on the day of the proof
     (dates 2026-11-19/20/22/25 and 2026-12-02/03 will turn into past games after 2026-11-20; move them if needed).
5. `npm run local:snapshot -- restore full-demo`; `node scripts/local/run.mjs node node_modules/@olaine/database/migrate.mjs`;
   `sqlite3 local.db < .local/fixtures/list-ordering.sql` (server stopped);
   `npm run local:snapshot -- save list-ordering-v2` (new name; snapshots cannot be overwritten without deleting).
6. BEFORE on the baseline tree with `list-ordering-v2`: record R1-R10, R14, R16-R19 and capture page text for the
   must-not-change pages (`/`, `/jaunumi`, footer partners, `/akademija` team order, `/rss` or the RSS route, ICS from
   `/api/shared-calendar` uids, `/admin/league-sources`, `/admin/club-logos`, `/admin/club-pages`, `/speles` past order)
   into `.local/list-ordering/baseline/*.txt`. If a BEFORE does not show the defect, adjust the fixture first.
7. `npm run local:snapshot -- restore pre-list-ordering` is **not** done here; the proof snapshot stays active for T1-T8.
Acceptance: draft saved and its checksum recorded; tree equals baseline; every R row has an observed BEFORE value;
F10/F11/F12 present; baseline captures exist.
Docs (last): `proof.md` gets a "T0 baseline" section and the old AFTER/R16-R20 sections are marked superseded;
`plan.md` Status updated (plan approved, branch `feat/list-ordering`, production ICU closed by the caller's facts).

### T1 - Ordering module and module check (ready after T0)

Outcome: `src/lib/ordering.ts` with exactly the five plan exports; `.local/checks/ordering-check.mts` proves the rules.
Exclusions: no caller changes.
Requirements: plan "`src/lib/ordering.ts`" table, R13.
Inputs: T0 clean tree; draft `ordering.ts` and check script (disposition table).
Outputs: module API used by T2-T7: `compareLatvian`, `sortByName`, `orderRoster`, `uniqueSortedLabels`, `compareByStart`.
Steps:
1. Read the draft module; write `src/lib/ordering.ts` (pure, no imports, one module-level
   `new Intl.Collator("lv", { numeric: true })`, copies before sorting).
2. Extend the check script: BEFORE block asserts the baseline defects (`["U11","U9"].sort((a,b)=>a.localeCompare(b,"lv"))`
   keeps `U11` first; default code-point sort puts `Ņikita` after `Zane`); AFTER block asserts lv letters
   (`Āris Čaks Ķirsis Levs Ļevs Nikolajs Ņikita Zane Žanis`), numeric (`2. liga, U7, U9, U11, U19`), photo-first,
   stability for equal names and equal starts, no input mutation, empty/duplicate labels dropped.
3. `npx tsx .local/checks/ordering-check.mts`; `npx tsc --noEmit`; `npm run lint`; `node -p process.versions.icu`.
Acceptance: check prints ok; the BEFORE assertions demonstrate the defect on the baseline comparators; no visible site
change (module unused yet, so no browser proof needed; record that as the reason).
Docs (last): `proof.md` T1 row (R13) with local ICU version; note the production ICU fact.

### T2 - Public people lists P1-P6 (after T1)

Outcome: home carousel, `/komanda` player rails and coaches photo-first then lv; `/akademija` players lv inside
teams ordered by `id`; coach profile team names lv.
Files: `src/lib/public-team-data.ts`, `src/app/akademija/page.tsx`, `src/components/team-section.tsx`,
`src/lib/team-showcase.ts` (delete), `src/app/komanda/treneri/[id]/page.tsx`.
Requirements: P1-P6, R1, R2, R3, R4 (profile part).
Acceptance: BEFORE equals T0 values; AFTER R1 `Čaks, Levs, Nikolajs, Ņikita, Žanis` then `Ļevs`, same relative order
on `/`; R2 `Āris, Ķirsis, Zane` then `Čaks`; R3 team order identical to T0 capture; coach Zane profile `2. liga, U19`.
Must not change: which players appear on `/komanda` (main team only), position group order, `/akademija` team order.
No name `orderBy` left in `public-team-data.ts`. Static checks pass.
Docs (last): `proof.md` T2 rows; note the plan's open item about player id 67 is still open (or closed by the user).

### T3 - Public schedule and filter labels P7-P9, P15, P16 + `/trenini` client sort removal (after T1)

Outcome: per-training coach and team names lv; filter options numeric lv on `/speles`, `/jaunumi`, `/trenini`;
`date, startTime, id` order for games and trainings; `/trenini` uses the server order without its own sort.
Files: `src/lib/trainings-server.ts`, `src/lib/training-teams.ts`, `src/lib/games-server.ts`,
`src/components/games-tabs.tsx`, `src/components/news-grid.tsx`, `src/components/training-schedule.tsx`.
Requirements: P7-P9 (public), P15, P16, R4 (`/trenini` part), R5 (public labels), R11, R14, R16 (public part).
Acceptance: `/trenini` F7 coaches `Āris Secība, Zane Secība`; filter labels `…, U9, U11, …` (U9 before U11) on all three
pages; R14 `/trenini` F9 sequence, selected month and per-team filters identical to T0 for all teams and after a month
switch; R11 recorded as code diff only. Must not change: `/speles` past games newest first, home games, article order.
Docs (last): `proof.md` T3 rows; plan Side finding (combined multi-team option) stays as report only.

### T4 - Search and sitemap P10-P14 (after T1)

Files: `src/lib/search-server.ts`, `src/components/site-search.tsx`, `src/app/sitemap.ts`.
Requirements: P10-P14, R6, R7, R8.
Acceptance: search `Sagatave` -> `Artūrs, Dāvis, Edgars, Emīls, Ernests`; `Žanis Secība` label `2. liga, U19`;
`2. liga` links `/komanda`, `U9` links `/akademija#team-1`; sitemap `/akademija` images = all non-main teams in `id`
order. Articles in search keep `date desc` (now plus `createdAt desc`). `public-search-content.tsx` untouched and
still type-checks.
Docs (last): `proof.md` T4 rows.

### T5 - Admin tables A1-A3, A6-A9 (after T1)

Files: `src/app/admin/(protected)/{coaches,teams,players,trainings,games,events,club-logos}/page.tsx`.
Requirements: A1-A3, A6-A9, R4 (admin part), R5 (`/admin/teams`), R9, R10 (`/admin/coaches`).
Acceptance: `/admin/coaches` `Āris, Čaks, Ķirsis, Zane` and team label `2. liga, U19`; `/admin/teams` numeric lv;
`/admin/players` team headers numeric lv and players lv; `/admin/trainings` coaches `Āris Secība, Zane Secība`;
`/admin/games` and `/admin/events` 10:00 before 18:00 on the F5/F6 day; club-logo rows in `id` order with names lv.
The admin search box still finds a coach by any team name and a training by any coach name (one check each).
Must not change: admin articles, league sources, club pages, partners, club-logo row order (compare with T0 capture).
Docs (last): `proof.md` T5 rows.

### T6 - Admin form selects A4, A5 (after T1)

Files: `src/app/admin/(protected)/{players,coaches,games,events,league-sources,jaunumi,trainings}/[id]/page.tsx`.
Requirements: A4, A5, R5 (selects), R10 (selects).
Acceptance: team select on each of the 7 `new` forms `2. liga, U7, U9, U11, …`; coach selects on `jaunumi/new` and
`trainings/new` `Āris, Čaks, Ķirsis, Zane`; editing one existing record per form shows its saved selection unchanged
(view only, no submit). The `WeekCalendar` on games/trainings forms still renders (its code is T7's).
Docs (last): `proof.md` T6 rows.

### T7 - Calendar: one sort after the merge, behavior preserved (after T1; not in parallel with the dead-code branch)

Outcome: `calendar.ts` uses `compareByStart`; `week-calendar.tsx` has no sort in `layoutDayEvents`, the mobile day list
or the overflow popup, one `sort(compareByStart)` after the `availableEvents` merge, and team filter labels through
`uniqueSortedLabels`. The calendar looks and behaves exactly as on baseline.
Files: `src/lib/calendar.ts`, `src/components/week-calendar.tsx` (admin-only; used by
`admin/(protected)/{games,trainings}/[id]/page.tsx`; data from `getScheduleForWeekBrowsing` and `/api/calendar`).
Requirements: plan Phase 4 calendar row, P9 (calendar labels), R15-R19.
Equality argument to re-verify in code before editing: `eventsByDay` pushes in `filteredEvents` order, which is
`availableEvents` order; `layoutDayEvents` pushes results per cluster in input order; overflow items are a subset of
one cluster in that order; so one sort at the merge point gives every consumer the start order. For equal starts the
baseline also used `availableEvents` (Map insertion) order via a stable sort, so the tie-break is unchanged.
Behavior matrix (BEFORE on the T6 tree = baseline calendar code, AFTER on the edited code; both with
`list-ordering-v2`, desktop and 375 px):

| # | Check | Expected AFTER |
|---|---|---|
| C1 | Overlap columns on the F8 day: card order and column of each card (DOM order plus left offset) | identical to BEFORE |
| C2 | `+N` overflow on the F10 day: visible cards, `+N` count, popup list order by start | identical |
| C3 | Mobile day list (375 px) for F8, F10, F11 days | identical, by start |
| C4 | Same-start tie (F11): order of training, event, game | identical to BEFORE (training, other, game) |
| C5 | Initial window vs fetched week: navigate by arrows to a fetched week and back | identical layouts |
| C6 | Merge case: page open, apply `list-ordering-merge.sql` (07:00), open a week that refetches that day | 07:00 event first; grid starts at 07:00 |
| C7 | Negative control (local, not kept): the three sorts removed without the merge sort | C6 shows the 07:00 event last; proves the merge sort is required |
| C8 | Team filter labels and type filter chips; filtering a team keeps the order | labels numeric lv; order kept |
| C9 | Event popup opens from a card and from `?event=<uid>`; Esc closes | identical |
| C10 | `/api/calendar?date=<F8 week>` JSON order and ICS uids from `/api/shared-calendar` | identical to T0 capture |

Acceptance: C1-C10 hold; static checks pass; the negative control code is reverted before AFTER is recorded.
Docs (last): `proof.md` T7 matrix; `plan.md` Phase 4 row updated with the proof reference; the `week-calendar.tsx:997`
side finding marked resolved.

### T8 - Integration, regression and closure (after T0-T7)

Outcome: the whole change verified on one tree and one snapshot; documents final.
Steps and acceptance:
- Greps: no `localeCompare` in `src`; no `orderBy` on a name column for a displayed name list (the `displayOrder,
  label/title` tie-breakers stay); every importer of `ordering.ts` is in the plan list; `team-showcase.ts` has no importer.
- Full pass R1-R20 on `list-ordering-v2`, and a text diff of every must-not-change capture against T0 (R12): identical.
- Smoke (R20): `/ /komanda /komanda?skats=treneri /akademija /jaunumi /speles /trenini /kontakti /sitemap.xml`, the
  admin lists and the two calendar forms return 200 with no errors in the dev log or browser console (hydration
  warnings included).
- `npx tsc --noEmit`, `npm run lint`, `npx tsx .local/checks/ordering-check.mts`, and a production build with the dev
  server stopped: `NODE_ENV=production npm run build -- --webpack` (`docs/local-development.md:104-106`; the plan's
  `scripts/local/run.mjs` variant refuses `NODE_ENV=production`, as the draft record found). Note: the build reads
  `local.db`; confirm which env/DB it used and that it touched no production service.
- Compare final diff with the saved draft patch; list every intentional difference (from the disposition table).
- Restore the user's local state: `npm run local:snapshot -- restore pre-list-ordering`, restart the dev server if it
  was running at T0.
- Report `git status`, `git diff --stat`, check results; no commit unless the user asks.
Docs (last): `plan.md` status = implemented, verified locally, not committed; plan corrections (build command, ICU
closed); `proof.md` final; decide with the user whether `.local/list-ordering/draft/` is kept or deleted (local only).

## Dependencies and parallelism

```
T0 -> T1 -> {T2, T3, T4, T5, T6, T7} -> T8
```

- Strictly sequential: T0 before everything (clean tree and BEFORE record); T1 before all callers (API); T8 last.
- File-disjoint after T1: T2, T3, T4, T5, T6, T7 never edit the same file (checked against the file lists above), so
  their code edits cannot conflict. They are **not** fully parallel: all proofs share `local.db`, the dev server on port
  3000 and `.next/`, and each BEFORE must be taken before that task's own edit but may include edits from other tasks.
  Default per the workflow protocol: one implementation task at a time, in the order T2, T3, T4, T5, T6, T7 (T7 last
  among them because its BEFORE must run on baseline calendar code and it is the highest-risk edit). Parallel edits
  need an explicit user grant and then still serialize every proof run.
- External: the dead-code branch also edits `week-calendar.tsx` and expects `team-showcase.ts` to be gone; do not work
  on both in parallel (plan "Dependencies and overlaps").

## Coverage: requirement -> task -> proof

| Requirement / constraint | Task | Proof |
|---|---|---|
| Module, rules, R13 | T1 | check script with BEFORE/AFTER assertions |
| P1-P3, R1, R2 | T2 | `/`, `/komanda`, coaches rail |
| P4, P5, R3 | T2 | `/akademija` vs T0 capture |
| P6, R4 (profile) | T2 | coach profile |
| P7, P8, R4 (`/trenini`) | T3 | `/trenini` F7 |
| P9 public, R5 public, R16 public | T3 | three filter dropdowns |
| P9 calendar, R16 calendar | T7 | C8 |
| P10-P14, R6-R8 | T4 | search, `/sitemap.xml` |
| P15, P16, R11 | T3 | code diff + must-not-change |
| R14, Phase 4 `/trenini` row | T3 | F9 sequence, filters, month |
| A1-A3, A6-A9, R9, R10 tables | T5 | admin tables |
| A4, A5, R5/R10 selects | T6 | seven forms |
| Phase 4 calendar row, R15, R17-R19 | T7 | C1-C10 |
| Phase 4 DB name `orderBy` row | T2, T5, T6; confirmed in T8 | grep |
| R12 must-not-change | each task for its pages; full in T8 | text diff vs T0 captures |
| R20 smoke, build, lint, tsc | T8 | commands |
| Draft disposition (prototype replacement) | T0 save, T1-T7 decide, T8 compare | disposition table + final diff |
| Restore local state (plan step 7) | T8 | snapshot restore |
| Docs reconciliation | last criterion of every task | proof.md / plan.md |

Not covered by design (plan Out of scope): `/akademija` team order change, partners, league sources/club pages
tie-breakers, dead code, schema changes, multi-team filter behaviour.

## Simplification conclusion

- Merged plan Phase 2's `training-schedule.tsx` label change with plan Phase 4's `/trenini` client sort removal into T3,
  and the calendar label change with the calendar sort removal into T7: same files, one BEFORE/AFTER each, no second
  writer. Benefit: no task edits a file another task edits. Cost: none found.
- Split admin work into tables (T5) and form selects (T6): disjoint files and different proof pages; each stays small.
  Alternative (one admin task, 14 files) is acceptable but makes one proof long; kept split, low cost either way.
- One fixture snapshot (`list-ordering-v2`) and one baseline capture in T0 serve all tasks, so setup is not repeated.
- Production build only once (T8): each task's `tsc` and lint already catch type and lint errors; the build adds the
  route/prerender check that only matters for the final tree. Risk: a build-only error is found late; acceptable because
  the edits are local sort changes.
- Considered and rejected: keeping the draft in the tree and proving only AFTER (cheaper, but gives no per-task BEFORE
  on the same code and the caller requires Opus to own the code); a separate baseline worktree (needs `git worktree`,
  a second DB path and server port; more machinery than saving a patch).

## Self-check

- Coverage: every plan row P1-P16, A1-A9, R1-R15 and proof rows R16-R20 map to a task; must-not-change and restore are
  assigned. Gap found and raised as a question, not added: the player profile team list
  (`src/app/komanda/speletaji/[id]/page.tsx:36`, relation order) is not in the plan.
- Size: each task is 1-14 files of the same kind with one proof page set; T7 is one file pair with a 10-row matrix.
- Dependencies: concrete inputs (clean tree, snapshot, module API) and outputs are named; no two tasks share a file.
- Integration: T8, with greps, full regression, build and draft comparison.
- Permissions: overwriting the draft (T0 step 3) and any commit need explicit user approval; nothing else changes Git
  state; production untouched.
- Resumability: each task is resumable from this file, `plan.md`, `proof.md`, the saved draft and the named snapshot.
- Publication: none in scope; branch already exists; commits/PR only on request.
- Review: none requested; not proposed (no unresolved high-risk choice beyond the calendar, which has its own matrix).

## Open questions for the user

1. T0 step 3: may the 30 dirty source files be reset to `a16b33f` content after the draft is saved to
   `.local/list-ordering/draft/` (with checksum)? Recommended: yes, it gives every task a true BEFORE on the same code.
   Alternative: keep the draft in the tree and use the Phase 0 BEFORE record from `main`; weaker, no per-task BEFORE.
2. Commits: one local commit per closed task (easy rollback and source identity per proof) or none until the end?
   Recommended: per task, but only if you ask for it.
3. Player profile team list (`/komanda/speletaji/<id>`, relation order) is not in the plan. Add it to T2 (one line,
   lv order) or leave it out?
4. Production player id 67 photo is still unverified; if he has no photo he moves behind photo players on `/`. OK as is?
5. Side finding outside the plan: `birthdays-server.ts:82` sorts by days only, so equal days keep DB order. Leave out
   (recommended) or add a tie-breaker?
