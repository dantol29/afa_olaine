# Proof record: list ordering

Local DB: snapshot `list-ordering` (full-demo + `.local/fixtures/list-ordering.sql`). Values below are observed (curl on the local dev server, admin via a locally signed session cookie).

## Phase 0: BEFORE (unchanged `main` a16b33f)

| # | Check | Observed BEFORE |
|---|---|---|
| R1 | `/komanda` Pussargi rail | Levs, Nikolajs, Čaks, Ļevs, Ņikita, Žanis (code-point; no photo-first) |
| R1 | `/` carousel | Levs, Nikolajs, Čaks, Ņikita, Žanis, then Ļevs (photo first, code-point inside) |
| R2 | `/komanda?skats=treneri` coaches | Zane, Āris, Čaks, Ķirsis (code-point; Čaks no photo not last) |
| R3 | `/akademija` teams | U9, U11, U13, U15, U17, U19, U7 (id order) |
| R4 | `/trenini` coaches of F7 training | Zane Secība, Āris Secība (join order). Teams label already `2. liga, U19` (sorted, not a defect) |
| R4 | `/admin/coaches` | Zane, Āris, Čaks, Ķirsis |
| R5 | `/admin/teams` | 2. liga, U11, U15, U19, U9 (U11 before U9) |
| R6 | search `Sagatave` | Artūrs, Jānis, Kārlis, Roberts, Emīls (id order, no sort) |
| R7 | search `Žanis Secība` | team label `U19` only |
| R8 | search `liga` / `U9` | `2. liga` -> id 7 (client links `id===1` to `/komanda`, so 2. liga goes to /akademija); `U9` id 1 |
| R8 | `/sitemap.xml` `/akademija` images | u11, u13, u15, u17, u19, 2-liga, u7 (U9 missing, 2. liga included) |
| R9 | `/admin/games` day 2026-11-20 | 18:00 game before 10:00 game |
| R9 | `/admin/events` | Kalendāra (11-19) 17:00, then 11-20: Vakara 18:00 before Rīta 10:00 |

## Draft observations (superseded)

The two sections below were observed on the uncommitted draft (saved in `.local/list-ordering/draft/`, see T0). They are
kept for reference only and are not proof of the final code; the per-task record follows at the end.

### Draft AFTER (branch feat/list-ordering, uncommitted)

| # | Check | Observed AFTER |
|---|---|---|
| R1 | `/komanda` Pussargi | Čaks, Levs, Nikolajs, Ņikita, Žanis, then Ļevs (no photo last) |
| R1 | `/` carousel | same order |
| R2 | coaches | Āris, Ķirsis, Zane, then Čaks (no photo) |
| R3 | `/akademija` teams | U9…U19, U7 (unchanged) |
| R4 | coach profile Zane | `2. liga, U19`; `/trenini` and `/admin/trainings` coaches `Āris Secība, Zane Secība`; `/admin/coaches` team label `2. liga, U19` |
| R5 | `/admin/teams`, selects (`players/new`, `jaunumi/new`, `trainings/new`) | 2. liga, U7, U9, U11, U13, U15, U17, U19 (public filter labels are built client-side through the same function; covered by R13) |
| R6 | search `Sagatave` | Artūrs, Dāvis, Edgars, Emīls, Ernests |
| R7 | search `Žanis Secība` | `2. liga, U19` |
| R8 | search `liga` / `U9`; sitemap | `2. liga` isMain=true (client links `/komanda`), `U9` isMain=false; images u9, u11, u13, u15, u17, u19, u7 (U9 now included, 2. liga excluded) |
| R9 | `/admin/games`, `/admin/events` | 10:00 before 18:00 on 2026-11-20; 16:00 before 19:00 on 2026-11-19; events 10:00 before 18:00 |
| R10 | `/admin/coaches`, author select | Āris, Čaks, Ķirsis, Zane |
| R11 | tie-breakers by id | code diff only (no visible change) |
| R13 | `.local/checks/ordering-check.mts` | ok |
| R14 | `/trenini` without client sort | sequence equals DB order `date, start_time, id` |
| R15 | admin week calendar 19.11 (day loaded by fetch, merge case) | DOM order: U9 treniņš 15:00, U9–Kalendārs 2 16:00, 2. liga treniņš 16:30, Kalendāra pasākums 17:00, 2. liga–Kalendārs 1 19:00; overlap columns kept. Not tested: mobile width, `+N` overflow popup, the 07:00 insert-after-load case |

Checks: `npx tsc --noEmit` ok, `npm run lint` 0 errors (3 warnings that exist on `main`), `NODE_ENV=production npm run build -- --webpack` ok (the `scripts/local/run.mjs` wrapper refuses NODE_ENV=production, so the build ran without it). Local DB restored to snapshot `pre-list-ordering`; dev server restarted.
### Draft browser checks (built-in browser, snapshot `list-ordering`)

| # | Check | Observed |
|---|---|---|
| R16 | `/trenini` filter buttons | Visas komandas, 2. liga, 2. liga U19, U9, U11, U13, U15, U17, U19 |
| R16 | `/speles` filter (open dropdown) | Visas komandas, 2. liga, U9, U11 (only teams with games) |
| R16 | `/jaunumi` filter | U17, U19 (only teams with news) |
| R16 | admin calendar team filter | same list as `/trenini` |
| R17 | admin calendar desktop, temp events added after load, week 26–29.11 fetched by arrow | Hours expand to 07:00; DOM order Agrs 07 (07:00), Rits 09, Vakars 20; same-hour overlap shows 2 cards + `+3` |
| R18 | `+3` popup | Ov C, Ov D, Ov E in order |
| R19 | mobile 375 px day view, 19.11 and 20.11 | 15:00, 16:00, 16:30, 17:00, 19:00; 10:00, 10:00, 18:00, 18:00 |
| R20 | smoke: `/ /komanda /komanda?skats=treneri /akademija /jaunumi /speles /trenini /kontakti /sitemap.xml` | all 200, no errors in dev log |

Temporary events were deleted afterwards.
Not verified: R12 must-not-change pages (no side-by-side diff against `main`, only the smoke in R20), production ICU/Node data.

# Per-task record ([tasks.md](tasks.md))

Environment for every task: local dev server (`npm run local:dev`, Next 16.3.4, Node local), snapshot `list-ordering-v2`
(= `full-demo` + migrate + `.local/fixtures/list-ordering-v2.sql`), restored before each proof. Server-rendered rows are
read with curl-style fetches (`obs.mjs`: visible text, scripts stripped, admin via a locally signed session cookie made
from the local `SESSION_SECRET`; no password entered); client-rendered rows in the built-in browser.

## T0 baseline (2026-11-12)

- Repo: `feat/list-ordering`, HEAD `a16b33f`. Draft saved to `.local/list-ordering/draft/` (`tracked.patch` with 30 files,
  `ordering.ts`, `ordering-check.mts`, original fixture; `SHA256SUMS`, `tracked.patch` sha256 `f99fff43…dfab`);
  `git apply --check -R` passed before the reset. The 30 files were rewritten from `git show a16b33f:<path>` and the draft
  `src/lib/ordering.ts` removed (user approval 2026-11-12). After: `git status --short` = `?? docs/changes/` only.
- Fixture `.local/fixtures/list-ordering-v2.sql` = original + F10 (2026-11-21, five items overlapping 12:00-14:00,
  inserted latest first) + F11 (2026-11-24 18:00 game, event, training inserted in that order).
  `.local/fixtures/list-ordering-merge.sql` = F12 (07:00 event on 2026-11-19, applied while the calendar is open).
  All fixture dates are after 2026-11-12 and inside the admin calendar window (−2 / +6 months).
- Snapshot `list-ordering-v2` saved. The local DB that was active before T0 was not saved separately (the earlier record
  says it had been restored to `pre-list-ordering`); T8 restores `pre-list-ordering`.
- Captures of every page used by the proof (55 files: public pages, sitemap, feed, `/api/calendar` for the weeks of
  11-16 and 11-23, search JSON, admin lists and the 7 `new` forms) in `.local/list-ordering/baseline/`; ordered rows in
  `.local/list-ordering/baseline/rows.txt`.
- Client-rendered rows (R14, R16 filter dropdowns, calendar C1-C10) are recorded as BEFORE in their owning task (T3, T7)
  on code that is still at baseline for those files.

BEFORE (baseline code, `list-ordering-v2`):

| # | Check | BEFORE |
|---|---|---|
| R1 | `/komanda` Pussargi | Levs, Nikolajs, Čaks, Ļevs, Ņikita, Žanis (code point, no photo-first) |
| R1 | `/` carousel | Levs, Nikolajs, Čaks, Ņikita, Žanis, (Emīls, Valters Sagatave: no photo), Ļevs |
| R2 | `/komanda` coaches | Zane, Āris, Čaks, Ķirsis |
| R3 | `/akademija` teams | U9, U11, U13, U15, U17, U19, U7 (id order) |
| R4 | coach profile Zane | U19, 2. liga |
| R4 | `/trenini` F7 coaches | Zane Secība, Āris Secība |
| R4 | `/admin/trainings` F7 | teams `U19, 2. liga`; coaches Zane, Āris |
| R4/R10 | `/admin/coaches` | Zane, Āris, Čaks, Ķirsis |
| R5 | `/admin/teams`; all 7 `new` form team selects | 2. liga, U11, U13, U15, U17, U19, U7, U9 |
| R5 | `/admin/players` team headers | 2. liga, U11, U13, U15, U17, U19, U9 (U7 has no players) |
| R6 | search `Sagatave` | Artūrs, Jānis, Kārlis, Roberts, Emīls (id order) |
| R7 | search `Žanis Secība` label | `U19` |
| R8 | search `liga` / `U9` | `{id 7, 2. liga}` (client links id 1 to `/komanda`) / `{id 1, U9}`; no `isMain` |
| R8 | sitemap `/akademija` images | u11, u13, u15, u17, u19, 2-liga, u7 (U9 missing, main team included) |
| R9 | `/admin/games` | 2026-11-19: Kalendārs 1 (19:00) before Kalendārs 2 (16:00); 2026-11-20: Pretinieks A (18:00) before B (10:00) |
| R9 | `/admin/events` | 2026-11-20: Vakara (18:00) before Rīta (10:00) |
| R10 | `jaunumi/new`, `trainings/new` coach selects | Zane, Āris, Čaks, Ķirsis |

Finding (changes T2 scope, see T2): the player profile team list (`komanda/speletaji/[id]/page.tsx:36`) is not displayed;
`player-profile-content.tsx:30` only sums its goals, so it has no visible order.

Docs: plan status updated; tasks.md unchanged (mechanics only).

## T1 module (R13)

- Draft disposition: `ordering.ts` rewritten from review (same five exports and rules; comments tightened); check script
  fixed (BEFORE block, roster stability, no-mutation and equal-start cases added).
- BEFORE: `src/lib/ordering.ts` absent at `a16b33f`; the check's BEFORE block confirms the baseline comparators are
  wrong (`localeCompare(…,"lv")` gives `U11, U9`; code-point order puts `Ā`, `Ņ` after `Z`).
- AFTER: `npx tsx .local/checks/ordering-check.mts` → `ordering-check ok (ICU 76.1, collator locale lv)` on local Node
  v22.13.0 (production: Node 24.22.3, ICU 78.3, per the user). No caller uses the module yet, so no page changes (no browser proof needed).
- `npx tsc --noEmit` ok; `npm run lint` 0 errors, 3 warnings, all pre-existing on `main` (`site-search.tsx:28` and two others).
- Docs: no further change needed.

## T2 public people lists (P1-P6; R1-R4 public)

- Draft disposition: all kept after review and re-applied (loaders order via `orderRoster`/`sortByName`, `/akademija`
  page sort removed, `team-showcase.ts` deleted, coach profile teams via `uniqueSortedLabels`). `PLAYER_CUTOUTS` untouched.
- Scope note: the player profile team list (approved addition) was not changed: `komanda/speletaji/[id]/page.tsx:36`
  feeds only a goal sum (`player-profile-content.tsx:30`), nothing is listed, so there is no visible order to fix.
- BEFORE = T0 rows (these files were untouched until T2).

| # | AFTER |
|---|---|
| R1 `/komanda` Pussargi | Čaks, Levs, Nikolajs, Ņikita, Žanis, then Ļevs (no photo) |
| R1 `/` carousel | Čaks, Levs, Nikolajs, Ņikita, Žanis, then no-photo players Emīls Sagatave, Ļevs, Valters Sagatave |
| R2 coaches | Āris, Ķirsis, Zane, then Čaks (no photo) |
| R3 `/akademija` | page text identical to T0 capture (team order U9…U19, U7; players already lv, no numeric case) |
| R4 coach profile Zane | `2. liga, U19` |

- Must-not-change: text captures of all other public and admin pages identical to T0; `/` differs only in order (same
  word multiset); `/komanda` differs only in order plus the rail loop clone of each rail's first card (the first card
  changed); same players, main team only.
- `npx tsc --noEmit` ok; lint 0 errors (3 pre-existing warnings); no `orderBy` left in `public-team-data.ts`.
- Not verified: production player id 67 photo (accepted by the user as not verified); if he has no stored photo he moves
  behind the photo players on `/`, keeping his cutout image.
- Docs: no other doc describes roster order.

## T3 public schedule and filter labels (P7-P9 public, P15, P16; R4 `/trenini`, R5/R16 public, R11, R14)

- Draft disposition: all kept after review and re-applied; added a contract comment on `TrainingSchedule` (input order).
  `uniqueSortedLabels` in `training-teams.ts` also de-duplicates; `training_teams` pairs are unique, so no visible effect.
- Equality argument for removing the `/trenini` client sort: it compared ISO `rawDate` then `HH:MM` `startTime`; the
  server now orders by the same text columns plus `id`, and the client sort was stable, so the sequence is identical.

| # | BEFORE (browser, baseline files) | AFTER |
|---|---|---|
| R16 `/trenini` filter buttons | Visas komandas, 2. liga, 2. liga, U19, U11, U13, U15, U17, U19, U9 | Visas komandas, 2. liga, 2. liga, U19, U9, U11, U13, U15, U17, U19 |
| R16 `/speles` team dropdown | Visas komandas, 2. liga, U11, U9 | Visas komandas, 2. liga, U9, U11 |
| R16 `/jaunumi` team / category | Komanda, U17, U19 / Kategorija, Komandas, Spēles | identical (no numeric or diacritic case in the data) |
| R4 `/trenini` F7 coaches | Zane Secība, Āris Secība | Āris Secība, Zane Secība |
| R14 `/trenini` sequence for all teams and each of the 8 team filters, plus the month shown per filter | recorded in `.local/list-ordering/baseline/trenini-r14.json` | identical sequence and month for every filter; month switch Novembris → Decembris works |
| R11 tie-breakers `id` (games, trainings) | n/a | code diff only; `/speles` and home games text identical to T0 |

- Must-not-change: text captures identical to T0 except `/trenini` (coach names inside each training now in Latvian
  order, e.g. `Ivars Paraugs, Mārtiņš Mentors`; filter buttons) and the T2 pages.
- `npx tsc --noEmit` ok; lint 0 errors (3 pre-existing warnings).
- Docs: no other doc describes these orders.

## T4 search and sitemap (P10-P14; R6-R8)

- Draft disposition: search logic fixed in review form (private `firstByName` helper, `isMain` added to the team
  result, empty team label stays `null`); `site-search.tsx` and `sitemap.ts` kept after review.
  `public-search-content.tsx` untouched and still type-checks (the type change is additive).

| # | BEFORE (T0) | AFTER |
|---|---|---|
| R6 search `Sagatave` | Artūrs, Jānis, Kārlis, Roberts, Emīls (id order) | Artūrs, Dāvis, Edgars, Emīls, Ernests |
| R6 search `Secība` players | Žanis, Ņikita, Nikolajs, Ļevs, Levs (insertion order) | Čaks, Levs, Ļevs, Nikolajs, Ņikita |
| R7 search `Žanis Secība` label | `U19` | `2. liga, U19` |
| R8 search `liga` / `U9` | no `isMain`; client linked `id === 1` to `/komanda` | `2. liga` `isMain: true`, browser link → `/komanda`; `U9` `isMain: false` (→ `/akademija#team-1`) |
| R8 `/sitemap.xml` `/akademija` images | u11…u19, 2-liga, u7 | u9, u11, u13, u15, u17, u19, u7 (all non-main, id order); all `<loc>` URLs identical |
| P11 articles | `date desc` | `date desc, createdAt desc` (no article matches in the fixture; code diff) |

- Must-not-change: all other captures identical to T3.
- `npx tsc --noEmit` ok; lint 0 errors (3 pre-existing warnings).
- Docs: no doc describes search or sitemap order.

## T5 admin tables (A1-A3, A6-A9; R4 admin, R5 `/admin/teams`, R9, R10 `/admin/coaches`)

- Draft disposition: kept after review and re-applied, one change: training coach names are sorted with
  `compareLatvian` without de-duplication (two coaches may share a name), instead of the draft's `sortByName` wrapper.

| # | BEFORE (T0) | AFTER |
|---|---|---|
| R4 `/admin/trainings` F7 | teams `U19, 2. liga`; coaches Zane, Āris | teams `2. liga, U19`; coaches Āris, Zane |
| R10 `/admin/coaches` | Zane, Āris, Čaks, Ķirsis; Zane's teams `U19, 2. liga` | Āris, Čaks, Ķirsis, Zane; Zane's teams `2. liga, U19` |
| R5 `/admin/teams` | 2. liga, U11, U13, U15, U17, U19, U7, U9 | 2. liga, U7, U9, U11, U13, U15, U17, U19 |
| A3 `/admin/players` headers | 2. liga, U11 … U19, U9 | 2. liga, U9, U11 … U19 (U7 has no players); page words identical, order only |
| R9 `/admin/games` | 11-19: 19:00 before 16:00; 11-20: 18:00 before 10:00 | 16:00 before 19:00; 10:00 before 18:00 |
| R9 `/admin/events` 11-20 | Vakara 18:00 before Rīta 10:00 | Rīta 10:00 before Vakara 18:00 |

- Admin search: `admin-search.tsx:25` matches a substring of `data-admin-search-item`; the attributes still hold every
  name (`Zane Secība Treneris 2. liga, U19`; `2026-11-25 17:00 2. liga, U19 Āris Secība Zane Secība Laukums`), so a
  search for any one team or coach name still matches. Coach team names in that attribute are now comma-joined.
- Must-not-change: admin articles, league sources, club pages, partners and club logos text identical to T0.
- `npx tsc --noEmit` ok; lint 0 errors (3 pre-existing warnings).
- Docs: no doc describes admin list order.

## T6 admin form selects (A4, A5; R5/R10 selects)

- Draft disposition: kept after review and re-applied (`orderBy(name)` → `sortByName` after the query, 7 files).

| # | BEFORE (T0) | AFTER |
|---|---|---|
| R5 team options on `players`, `coaches`, `games`, `events`, `league-sources`, `jaunumi`, `trainings` `/new` | 2. liga, U11, U13, U15, U17, U19, U7, U9 | 2. liga, U7, U9, U11, U13, U15, U17, U19 (all 7) |
| R10 coach options on `jaunumi/new`, `trainings/new` | Zane, Āris, Čaks, Ķirsis | Āris, Čaks, Ķirsis, Zane |
| Saved selection (view only, no submit) | n/a (selection is by id) | `/admin/players/106` checks team ids 7, 6 (= DB `U19, 2. liga`); `/admin/trainings/13` checks coach ids 15, 12 (= DB) |

- `npx tsc --noEmit` ok; lint 0 errors (3 pre-existing warnings). The `WeekCalendar` on the games/trainings forms is
  unchanged in this task (T7).
- Docs: no doc describes select order.

## T7 admin week calendar (Phase 4 calendar row; P9 calendar; R15, R17-R19)

- Draft disposition: `calendar.ts` kept after review (comparator swap + tie comment); `week-calendar.tsx` re-derived
  and re-applied: three sorts removed (`layoutDayEvents`, mobile day list, overflow popup, which also sorted in place
  during render), one stable `sort(compareByStart)` after the `availableEvents` merge, team options via
  `uniqueSortedLabels`, contract comment on `layoutDayEvents`.
- Equality argument (checked in code): `filteredEvents` filters `availableEvents` in order; `eventsByDay` pushes in that
  order; `layoutDayEvents` emits per cluster in input order; overflow items are a subset of one cluster in that order.
  Baseline sorted each of these copies stably from the same Map order, so equal starts keep the same tie order.
- Method: built-in browser on `/admin/games/new` (desktop 1024 px and 375 px mobile), admin session cookie set from
  the local token; DOM card order, text, `top`, `left`, `width` per day column captured by a script. Raw records:
  `.local/list-ordering/calendar/` (`before-*.json`, `after-*.json`).

| # | Check | BEFORE (baseline calendar code) | AFTER |
|---|---|---|---|
| C1 | Overlap columns, F8 day 19.11 (5 items) | 15:00 L0, 16:00 L33, 16:30 L0, 17:00 L67 (W33), 19:00 L0 W100 | identical (whole 5-range desktop record byte-identical) |
| C2 | `+N` overflow, F10 day 21.11 | 12:00, 12:10 visible, `+3`; popup 12:20, 12:30, 12:40 | identical |
| C3 | Mobile 375 px day lists (F5/F6, F8, F10, F11 days) | by start | identical lists (the run started one day later; overlapping days compared) |
| C4 | Same start, F11 24.11 18:00 | training L0, event L33, game L67; 20.11: event before game at 10:00 and 18:00 | identical |
| C5 | Initial window vs fetched weeks (arrows through 16.11-2.12) | recorded | identical |
| C6 | Merge case: page open, `list-ordering-merge.sql` applied, then week 19.11 fetched | 07:00 card first, L0 W100, grid starts 07:00; mobile list first | identical |
| C7 | Negative control (merge sort removed temporarily, then restored) | n/a | 07:00 card last in DOM and placed at L50 W50 beside the 19:00 game; mobile list last: the merge sort is required |
| C8 | Team filter options; filter U9 | 2. liga, 2. liga, U19, U11 … U19, U9; U9 layout recorded | U9 now after `2. liga, U19` and before U11; U9-filtered layout identical |
| C9 | `?event=event-5` opens Pārpilde B (21.11) and jumps to 19.-22.11; Escape closes; card click opens | yes | identical |
| C10 | `/api/calendar?date=2026-11-16` and `2026-11-23` JSON (order, uids) | T0 capture | byte-identical |

- Temporary merge-case rows were deleted after each run; T8 restores snapshots anyway.
- `npx tsc --noEmit` ok; lint 0 errors (3 pre-existing warnings).
- Docs: plan Phase 4 calendar row confirmed by this record; the `week-calendar.tsx:997` in-place sort side finding is resolved.
