# Plan: one ordering module for all displayed lists

Status: approved (variant B and this plan, user 2026-11-12). Implementation follows [tasks.md](tasks.md); progress and
proof in [proof.md](proof.md). Mode: Execution plan (approach B approved by the user).
Baseline: `main` at `a16b33f`; the only dirty path is this untracked `docs/changes/` folder.
Inputs: two read-only audits (`ordering-report.md`, `dead-code-report.md`, Claude session scratchpad). Each claim used
below was re-read in the code on `main` (cited as path:line); see "Baseline correction" for claims that no longer hold.

## Goal, scope, exclusions

Goal: every list shown on the site and in the admin has an intentional, deterministic order defined in one module.
Names sort in Latvian alphabetical order (Kārlis before Kristians, Ņikita after Nikolajs, Ž after Z) and numbers inside
names sort by value (U9 before U11).

In scope: public roster, academy, profiles, search, sitemap team logic, schedule tie-breakers, joined relation names,
filter option labels, admin tables and form selects.

Out of scope (with reason):
- Dead code removal: separate plan and branch (user decision 2026-11-11). Overlaps listed under Dependencies.
- `/akademija` team order: stays by creation (`id`) (user decision). Note: `@olaine/database` 0.1.3 already has an unused
  `teams.sort` column (`node_modules/@olaine/database/src/schema.ts:9-10`, all 0 locally); using it is a possible later
  product decision, not part of this change.
- Partners: stay by `id` (user decision).
- League sources, club pages: ordered by admin-set `displayOrder`; the tie-breaker differs (`league-standings-server.ts:69`
  label, `league-source-metadata.ts:13` id), but the real cause is that the admin allows several main leagues. Not changed.
- Admin club-logo rows: stay by `id` (insertion), like partners; only the names inside a row are sorted.
- Schema or package changes (variant A rejected), design changes, the `/trenini` and calendar multi-team filter
  behaviour (see Side findings), cron result order, LFF preview order, fixed enum arrays.

## Mode and approved decisions

| Decision | Source |
|---|---|
| Variant B: one `src/lib/ordering.ts`; the data layer returns the final order; components do not sort. A (DB collation) and C (sort in components) rejected. | user, 2026-11-11 |
| `/akademija` teams ordered by `id` (creation), not alphabetically | user, 2026-11-11 |
| Partners ordered by `id`, out of scope | user, 2026-11-11 |
| Dead code: separate branch and plan | user, 2026-11-11 |
| Duplicate sorting layers (trainings client sort, week-calendar re-sorts, redundant DB name `orderBy`) are removed in this change as a regular phase; a second sort is removed only where the remaining order is proven equal by the before/after check | user, 2026-11-11 |

Interpretation of B that needs the user's confirmation (see "For the user"): filter option labels built inside client
components from data they already hold (`games-tabs.tsx:17`, `news-grid.tsx:64-65`, `training-schedule.tsx:62`,
`week-calendar.tsx:491`) keep being built there but through `ordering.ts`. Moving them to the server would need prop
plumbing in three pages and is impossible for the week calendar without an API change (it builds options from events it
fetches itself, `week-calendar.tsx:414,486-492`). The second exception is the single calendar sort after the client
merge (Phase 4). In both cases the rule still lives in one module.

## Baseline correction (audit vs `main`)

The ordering audit was taken on branch `feat/roster-photo-first-sort` with uncommitted edits. That branch no longer
exists and the edits are not on `main` (`git reflog`, `git branch`); a backup is in the scratchpad
(`roster-sort-backup.patch`). On `main`:
- `TeamRosterRail` does not sort (`src/components/team-roster-rail.tsx:19-22`).
- Home carousel: `orderTeamShowcasePlayers` puts players with `photoUrl` first, keeping DB code-point name order inside
  each group (`src/lib/team-showcase.ts:4-6`, `src/components/team-section.tsx:11-14`).
- `/komanda` rails and coaches: DB code-point order only, no photo-first (`src/lib/public-team-data.ts:8,15`,
  `src/lib/team-page.ts:24,26` keep input order, `src/components/team-page-content.tsx:107-135`).

So audit rows 1-3 ("OK") are defects on `main`. All other audit rows were re-checked on `main` and match (cited below).

## Expected behavior and architecture

### `src/lib/ordering.ts` (pure, no I/O, no DB or `server-only` imports, so client components can import it)

| Export | Rule | Callers |
|---|---|---|
| `compareLatvian(a, b)` | one module-level `Intl.Collator("lv", { numeric: true })` | everything below; replaces all 9 `localeCompare(…, "lv")` sites |
| `sortByName(items, getName)` | copy, stable sort by `compareLatvian(getName(x))` | rosters, academy players, search, admin tables and selects |
| `orderRoster(items, getName, hasPhoto)` | `hasPhoto` first, then `compareLatvian` by name | public players and coaches |
| `uniqueSortedLabels(values)` | drop empty values, de-duplicate, sort by `compareLatvian` | filter options; joined relation names (caller adds `.join(", ")`) |
| `compareByStart(a, b)` | `a.start.getTime() - b.start.getTime()` (stable sort keeps type order for equal starts) | `calendar.ts:285-287`, the one remaining sort in `week-calendar.tsx` (Phase 4) |

Not added (simplification): Drizzle `orderBy` fragments (they would make the module import the schema and are not
reachable from client code; date orders stay inline, only missing tie-breakers are added), `joinSortedNames`
(= `uniqueSortedLabels(...).join(", ")`), a main-team helper (`isMain` is used directly).

### Boundaries
- SQL `orderBy` stays only for non-name order (dates, times, ids, `displayOrder`). Name order is applied in JS right after
  the query, inside the data function (`src/lib/*`) or the admin page's own query block.
- `cachePublicData` (`src/lib/public-data-cache.ts:13-22`) wraps `unstable_cache`; the result is stored as
  `JSON.stringify` and read back with `JSON.parse`, so array order is kept. Sorting inside the loader means the cache
  holds the final order. The cache key includes `cb.toString()` (Next 16.3.4 `unstable_cache` source), so changing a
  loader body creates a new key and no old-order entry is served after deploy.
- Photo-first uses the stored `photoUrl` only. The home-page cutout override (`team-section.tsx:6-8,23`, player id 67)
  changes the displayed image only, not the order. Reason: the override is environment-specific (local id 24 is that
  player, local id 67 is someone else) and putting it into the cached data layer would spread the hack.

### Ordering rule per list (after the change)

| # | List | Data function (file) | Rule | Today on `main` |
|---|---|---|---|---|
| P1 | Home "Komanda" carousel | `getPublicPlayers` (`public-team-data.ts:6-11`) | photo first, then lv name | photo first, code-point |
| P2 | `/komanda` position rails | same loader; `groupTeamPagePlayers` keeps order | groups `ROLE_GROUPS` (unchanged), inside photo first + lv | code-point, no photo-first |
| P3 | `/komanda` coaches rail | `getPublicCoaches` (`:13-18`) | photo first, then lv | code-point |
| P4 | `/akademija` teams | `getPublicAcademyTeams` (`:20-26`) | `id` (unchanged) | `id` |
| P5 | `/akademija` players per team | same loader (moved from `akademija/page.tsx:21-23`) | lv name | lv, non-numeric |
| P6 | Coach profile "Komanda" | `getCoach` (`komanda/treneri/[id]/page.tsx:35`) | lv | relation order |
| P7 | `/trenini` coach names per training | `getAllTrainingsFromDb` (`trainings-server.ts:56-62`) | lv | join order |
| P8 | Team names per training (`/trenini`, calendar, ICS titles) | `getTeamNamesByTraining` (`training-teams.ts:22`) | lv numeric | lv non-numeric |
| P9 | Filter options (`/speles`, `/jaunumi`, `/trenini`, admin calendar) | client components, via `uniqueSortedLabels` | lv numeric | lv non-numeric |
| P10 | Search: players, coaches, teams | `searchSite` (`search-server.ts:41-53`) | all matches, lv name, first 5 | no `orderBy` + `limit 5` |
| P11 | Search: articles | `search-server.ts:38` | `date desc, createdAt desc` | `date desc` only |
| P12 | Search: player team label | `search-server.ts:67` | all teams, lv, joined | `playerTeams[0]` |
| P13 | Search: team link | `search-server.ts:50-53,77`, `site-search.tsx:59` | `/komanda` when `isMain` | `id === 1` |
| P14 | Sitemap `/akademija` images | `sitemap.ts:20,35` | non-main teams by `isMain`, `id` order | `slice(1)` of `id` order |
| P15 | `/speles`, home games | `games-server.ts:51,108` | `date, startTime, id` | `date, startTime` |
| P16 | `/trenini` trainings | `trainings-server.ts:45` | `date, startTime, id` | `date, startTime` |
| A1 | Admin coaches table + teams per row | `coaches/page.tsx:12-15,39,61` | lv; teams lv joined | code-point; relation |
| A2 | Admin teams table | `teams/page.tsx:12` | lv numeric | code-point |
| A3 | Admin players: team headers, players | `players/page.tsx:12-25` | lv numeric; lv | code-point; lv non-numeric |
| A4 | Admin team selects (7 forms) | `{players,coaches,games,events,league-sources}/[id]/page.tsx`, `jaunumi/[id]/page.tsx:15`, `trainings/[id]/page.tsx:17` | lv numeric | code-point |
| A5 | Admin coach selects (2 forms) | `jaunumi/[id]/page.tsx:16-19`, `trainings/[id]/page.tsx:18` | lv | code-point |
| A6 | Admin trainings table: order, teams, coaches | `trainings/page.tsx:10-20,55` | `date, startTime, id`; teams and coaches lv joined | relation order |
| A7 | Admin games table | `games/page.tsx:65` | `date, startTime, id` | `date` only |
| A8 | Admin events table | `events/page.tsx:24` | `date, startTime, id` | `date` only |
| A9 | Admin club-logo names per row | `club-logos/page.tsx:46-49` | lv (comparator swap); rows by `id` unchanged | lv |

Must NOT change (checked in every phase): article order everywhere (`date desc, createdAt desc`), RSS, `/akademija` team
order, position group order, partners, league sources and standings rows, club pages and header links, calendar merge
order (`calendar.ts:285-287`), calendar and ICS `uid`s (id-based, `calendar.ts:164,201,241`), fixed enum arrays.

## Critical unknowns

| Unknown | Result | Evidence |
|---|---|---|
| Does the cache store and keep the final order? | Closed: yes, and a code change gets a new cache key | `public-data-cache.ts:13-22`; `node_modules/next/dist/server/web/spec-extension/unstable-cache.js` (`fixedKey = cb.toString()…`, `JSON.stringify`) |
| Does local dev show DB edits made outside the admin immediately? | Closed: no, the data cache survives in dev for up to 60 s; `snapshot restore` clears `.next/` | `docs/local-development.md:38-40,56-57`, `scripts/local/snapshot.mjs` |
| Do other components sort roster lists? | Closed: no; `TeamRosterRail`, `TeamPageContent`, `AcademyContent` render input order | `team-roster-rail.tsx:19-22`, `team-page-content.tsx:107-135`, `academy-content.tsx:20,27,44` |
| Does `numeric: true` change any existing order? | Closed: names of people and club logos: no. Team names: yes, intended: `full-demo` teams `U9…U19` go from `U11, U13, U15, U17, U19, U9` to `U9, U11, …` (current `local.db`: no change) | node 24.11.1 script over all player, coach, team, club-logo names in `local.db` and `.local/snapshots/full-demo/local.db` |
| `Intl.Collator("lv")` locally | Closed: ICU 77.1, resolves to `lv`; `localeCompare(…,"lv")` gives identical order on local data | `node -p process.versions.icu` |
| Production Node | Major version 24 per the deploy doc (`nodevenv/.../24/`, `README.md:53`); not checked on the server | doc only |
| Production ICU data (full or small) | **Closed (2026-11-12):** production Node 24.22.3, ICU 78.3, `Intl.Collator('lv')` sorts `A C Č N Ņ Z` (checked by the user). Original note: With small ICU, `lv` falls back to root order: still alphabetical with diacritics as variants (`Čaks, Cēsis`, `Ņikita, Nikolajs`), never the current code-point order. Roster order is computed on the server only after this change, so there is no hydration mismatch for rosters; filter labels already depend on both server and browser ICU today | local node: `Intl.Collator("en")` sample |
| Production player id 67 has a `photoUrl`? | **Open, low.** If not, he moves behind photo players on the home page (he keeps his cutout image) | no production access |

Neither open item blocks implementation; both are closed by one read-only check the user can run (see "For the user")
or by the post-deploy visual check (`/komanda`: Nikolajs before Ņikita in the same rail).

## Local proof setup (Phase 0, before any code change)

All work uses the isolated local database; no production data is read or written.

1. Dev server stopped. `npm run local:snapshot -- save pre-list-ordering` (keeps the current local state).
2. `npm run local:snapshot -- restore full-demo`, then `node scripts/local/run.mjs node node_modules/@olaine/database/migrate.mjs`
   (the snapshot predates 0.1.2; `docs/local-development.md:60-67`).
3. Apply the git-ignored fixture `.local/fixtures/list-ordering.sql` with `sqlite3 local.db` (server stopped). Photo
   URLs are copied from an existing player row. Rows are inserted in reverse alphabetical order so neither insertion
   order nor id order matches the expected order.
4. `npm run local:snapshot -- save list-ordering`, then `restore list-ordering` (clears `.next/`), `npm run local:dev`.
5. Record every BEFORE observation below on unchanged `main`, in the built-in browser (page text, order of items).
6. Each later phase: stop server, `restore list-ordering`, start, record AFTER for its rows plus the must-not-change rows.
7. End: `restore pre-list-ordering`.

Fixture `list-ordering.sql` (main team in `full-demo` is `2. liga`, id 7; teams U9…U19 are ids 1-6):

| Key | Data |
|---|---|
| F1 roster | players, position `Pussargs`, main team, inserted in this order: Žanis Secība (photo), Ņikita Secība (photo), Nikolajs Secība (photo), Ļevs Secība (no photo), Levs Secība (photo), Čaks Secība (photo) |
| F2 coaches | inserted in order: Zane Secība (photo), Ķirsis Secība (photo), Čaks Secība (no photo), Āris Secība (photo); all in the main team; Zane Secība also in U19 |
| F3 multi-team player | Žanis Secība also in U19 |
| F4 team | new team `U7` (not main, with a group photo), created last |
| F5 games | date D: `2. liga` 18:00 inserted first, then `U9` 10:00; one `U11` game on another date |
| F6 events | date D: 18:00 event inserted first, then 10:00 event |
| F7 training | future date, teams U19 and `2. liga`, coaches Zane Secība then Āris Secība |
| F8 calendar day | date E in the admin calendar window: 5 items inserted latest first (game 19:00, event 17:00, training 16:30, game 16:00, training 15:00) so columns and the `+N` overflow appear |
| F9 trainings | three trainings inserted out of chronological order (later date first; two on one date, later time first) |
| existing | 17 players "… Sagatave" (ids 86+), teams with id 7 = main |

## Work phases

One change set per phase; each phase ends with its AFTER observations, `npm run lint`, `npx tsc --noEmit`, and
`NODE_ENV=production node scripts/local/run.mjs next build --webpack` with the dev server stopped (the build reads the
database; `docs/local-development.md:104-106`). Plus one git-ignored check script `.local/checks/ordering-check.mts`
(`npx tsx`) that asserts the module's output on fixed samples (lv letters, numeric, photo-first, stability); no test
runner is added.

### Phase 1: module and people lists (P1-P6)
- Add `src/lib/ordering.ts` (five exports above).
- `public-team-data.ts`: `getPublicPlayers`/`getPublicCoaches` return `orderRoster(rows, name, photoUrl)`; drop the
  SQL name `orderBy`. `getPublicAcademyTeams` keeps `asc(teams.id)` and sorts each team's `playerTeams` by player name.
- `akademija/page.tsx`: remove its sort. `team-section.tsx`: remove `orderTeamShowcasePlayers`; delete
  `src/lib/team-showcase.ts` (only importer is `team-section.tsx:2`).
- `komanda/treneri/[id]/page.tsx:35`: `uniqueSortedLabels(team names)`.
- Must not change: `/akademija` team order, position group order, which players appear on `/komanda` (main team only).
- Risk: home carousel's first (enlarged) card may change; intended.

### Phase 2: public schedule, labels, search, sitemap (P7-P16)
- `trainings-server.ts`: `orderBy(date, startTime, id)`; sort each training's coaches with `sortByName`.
- `training-teams.ts:22`: `compareLatvian`. `games-server.ts:51,108`: add `id`.
- `games-tabs.tsx:17`, `news-grid.tsx:64-65`, `training-schedule.tsx:62`, `week-calendar.tsx:491`: `uniqueSortedLabels`.
- `search-server.ts`: players, coaches, teams without `limit` in SQL, then `sortByName(...).slice(0, RESULT_LIMIT)`;
  articles add `desc(createdAt)`; player label = all team names via `uniqueSortedLabels(...).join(", ")`; teams return
  `isMain`. `site-search.tsx:59`: link by `isMain`. `public-search-content.tsx` (dead) is not touched; the type change is
  additive.
- `sitemap.ts:20,35`: select `isMain`, use non-main teams instead of `slice(1)`.
- Must not change: article order, `/speles` past games newest first (`speles/page.tsx:18`), calendar `uid`s.
- Risk: ICS event titles of multi-team trainings may reorder team names (title only, `uid` unchanged).

### Phase 3: admin lists and selects (A1-A9)
- Admin pages listed in A1-A9: replace name `orderBy` by `sortByName` after the query; joined names via
  `uniqueSortedLabels`; `games`/`events` add `startTime, id`; `trainings` add `id`; club-logo names use `compareLatvian`.
- Must not change: admin articles, league sources, club pages, partners, club-logo row order.

### Phase 4: remove duplicate sorting layers (user decision 2026-11-11)
Rule: a second sort is removed only where the remaining order (server query or `ordering.ts`) is proven equal by the
before/after check; if a check shows a difference, keep that sort and record why.

| Layer | Change | Why the remaining order is equal | Proof |
|---|---|---|---|
| `/trenini` client re-sort `training-schedule.tsx:58` | remove; `relevantMonth`, filters and counts use the prop order | server order is `date, startTime, id` on ISO date text and `HH:MM` (`trainings-server.ts:45` after Phase 2), the same key the client compared | R14 |
| Admin week calendar `week-calendar.tsx:251-253` (`layoutDayEvents`), `:624-626` (mobile day), `:997-1001` (overflow, sorts in place during render) | remove all three; add one `sort(compareByStart)` where the component merges its data, in `availableEvents` (`:435-441`) | the server list is sorted (`calendar.ts:285-287`), but `availableEvents` merges the initial `events` with every fetched week through a `Map` by `uid`, which appends new uids after old ones; a day can then hold events out of order, so the server order alone is **not** equal. One sort after the merge restores it; `filteredEvents` (`filter`), `eventsByDay` (`:546-555`, pushes in input order) and the day layout keep that order | R15 |
| DB name `orderBy` (`public-team-data.ts:8,15`, admin pages in A1-A5) | removed in Phases 1 and 3; Phase 4 confirms none is left for a name list shown to users (grep for `orderBy` on `name`/`label`/`title` columns; the `displayOrder, label`/`title` tie-breakers stay, see Out of scope) | JS sort is the only name order | grep result in the phase record |
| `/akademija` page sort `akademija/page.tsx:21-23` | moved into the loader in Phase 1 | one layer | R3 |

Kept on purpose (not duplicates of a rule we own): standings rows by `pos` (`league-standings-cards.ts:6`, protects
against scraped order), `/speles` past `.reverse()` and home `slice(-3).reverse()` (they derive a different order).
Risk: the calendar change is the only layout-sensitive edit; R15 covers overlap columns, overflow and the merge case.
Overlap: the dead-code plan also edits `week-calendar.tsx` (`:451-455`, `:479-483`); do not work on both in parallel.

## Requirement -> expected result -> minimum proof

All BEFORE values are expected on `main` and must be recorded as actually observed in Phase 0; if a BEFORE does not show
the defect, adjust the fixture before writing code.

| # | Requirement | Page / URL | Before (expected) | After |
|---|---|---|---|---|
| R1 | Roster in Latvian order, photo first | `/komanda` Pussargi rail, `/` carousel | see note below the table | photo players `Čaks, Levs, Nikolajs, Ņikita, Žanis` (lv, interleaved with existing), then `Ļevs` with no-photo players; same relative order on `/` |
| R2 | Coaches in Latvian order, photo first | `/komanda?skats=treneri` | F2: `Zane` before `Āris, Čaks, Ķirsis` | `Āris … Ķirsis … Zane` (photo), `Čaks` after them |
| R3 | `/akademija` teams unchanged, players lv | `/akademija` | teams U9…U19, U7 last; players lv | identical team order; players identical except numeric/edge cases |
| R4 | Profile and per-row names sorted | `/komanda/treneri/<Zane id>`, `/trenini`, `/admin/trainings`, `/admin/coaches` | `U19, 2. liga`; `Zane Secība, Āris Secība` | `2. liga, U19`; `Āris Secība, Zane Secība` |
| R5 | Numeric team names | `/speles` team select, `/admin/teams`, any admin team select | `2. liga, U11, U9` (public); `…, U19, U7, U9` (admin) | `2. liga, U7, U9, U11, …` |
| R6 | Search top 5 deterministic and sorted | search "Sagatave" | `Artūrs, Jānis, Kārlis, Roberts, Emīls` (id order) | `Artūrs, Dāvis, Edgars, Emīls, Ernests` |
| R7 | Search player label | search "Žanis Secība" | `U19` | `2. liga, U19` |
| R8 | Main team by `isMain` | search "liga", search "U9"; `/sitemap.xml` | `2. liga` → `/akademija#team-7`; `U9` → `/komanda`; `/akademija` images include `2. liga`, miss `U9` | `2. liga` → `/komanda`; `U9` → `/akademija#team-1`; images = all non-main teams |
| R9 | Same-day admin games/events by time | `/admin/games`, `/admin/events` | F5/F6: 18:00 before 10:00 | 10:00 before 18:00 |
| R10 | Admin coaches/selects lv | `/admin/coaches`, `/admin/jaunumi/new` author select, `/admin/trainings/new` | `Zane` before `Āris, Čaks, Ķirsis` | Latvian order |
| R11 | Tie-breakers by `id` (P15, P16) | `/speles`, `/trenini` | no visible change (SQLite returns ties in rowid order in practice) | no visible change; proof is the code diff plus must-not-change check |
| R12 | Must-not-change list | `/jaunumi`, `/`, footer partners, `/admin/league-sources`, `/admin/club-logos` | recorded | identical |
| R13 | Module rules | `.local/checks/ordering-check.mts` | n/a | passes: lv letters, `U9 < U11`, photo first, stable for equal names, `compareByStart` |
| R14 | `/trenini` order without the client sort | `/trenini` (F9), all teams and each team filter, month switch | chronological | identical sequence and selected month |
| R15 | Calendar order with one sort after the merge | `/admin/games/<id>` week calendar, desktop and mobile width, F8 day | F8 events top to bottom by time, overlap columns, `+N` overflow list by time | identical layout and lists; merge case: with the page open, insert an F8-day event at 07:00 in the DB, open a week that refetches that day: the new event is first (with the removed sorts but no merge sort it would be last) |

(R1 BEFORE detail: on `/komanda` order is pure code-point, so `Levs, Nikolajs, …, Ļevs, Ņikita, Žanis` with `Čaks`
after all ASCII names and no photo grouping; on `/` photo players first in the same code-point order.)

## Simplification conclusion

- Kept: one module with five exports and edits at ~30 call sites. Justified: the Latvian rule is today missing or
  duplicated in ~20 places, and SQLite cannot collate `lv`, so JS sorting is the only correct place.
- Removed vs the draft: Drizzle order fragments (coupling to the schema, not usable from client code; only three missing
  tie-breakers are added inline), `joinSortedNames`, the `PLAYER_CUTOUTS` move, league-source and club-logo row
  changes. Benefit: smaller diff and no new cross-layer import. Cost: date orders stay written inline in ~10 queries
  (already consistent except the three fixed here).
- Phase 4 replaces four client sorts with one (the calendar merge point); removing the calendar sorts without it would
  break order after a refetch, so that one sort is required, not a duplicate.
- Rejected: sorting only in components (C), DB collation (A), adding a test runner (one git-ignored check script is enough).
- Phase 0 fixtures are shared by all phases, so setup is done once.

## Dependencies and overlaps

Dead-code plan overlap: `src/lib/team-showcase.ts` (this plan deletes it; the dead-code report assumed it was already
deleted), `src/components/week-calendar.tsx` (Phase 2 label sort, Phase 4 sorts; the dead-code plan removes the
listener at `:479-483`), `src/lib/search-server.ts` types used by dead
`public-search-content.tsx` (additive change, no conflict). `academy-content.tsx` (`selectAcademyTeams`) and
`team-page-content.tsx` (`PlayerRoleRail`) are not touched by this plan. Either plan can go first; do not run them in
parallel on the same files.

## Side findings (not in scope, report only)

- Multi-team trainings appear as a combined option ("A, B") in the `/trenini` and calendar team filters and are hidden
  from single-team filters (`training-schedule.tsx:62-63`, `week-calendar.tsx:486-492`).
- The id-67 cutout is hard-coded in three places (`team-section.tsx:6-8`, `komanda/speletaji/[id]/page.tsx:35`,
  `sitemap.ts:43`) and points to a different person in local data.
- `week-calendar.tsx:997` sorts a derived array in place during render.

## Authority and limits

Granted: planning, read-only audits, writing this file, local testing with prepared data in the isolated database.
Not granted: implementation, branch creation, commits, push, PR, deploy, production access, `git fetch`. After approval,
implementation starts on a new branch from `main` (`a16b33f`) only when the user asks for it.

## Self-check

- Goal and decisions: B, `/akademija` by id, partners by id, dead code separate and duplicate-layer removal (Phase 4,
  with the "proven equal" rule) are reflected. The calendar check showed the server order alone is not equal after the
  client merge, so one sort stays there. The client-side exceptions to "components do not sort" are surfaced for confirmation.
- Evidence: every changed list cites `main` code; the audit's roster rows were corrected; numeric and ICU behaviour were
  tested locally on both local datasets.
- Proof: each requirement has a fixture, a URL and a visible BEFORE/AFTER, except R11 (tie-breakers, not visibly
  provable with SQLite) which is stated as such.
- Unverified: production ICU data, production player id 67 `photoUrl`, actual BEFORE values (recorded in Phase 0).
- Review: none requested. User approval: pending.

## Status

- Phase: implementation per [tasks.md](tasks.md) on branch `feat/list-ordering` (from `a16b33f`); one local commit per
  closed task, no push. Current task and results: see [proof.md](proof.md) "Per-task record".
- T0 done: draft saved and reset, fixture `list-ordering-v2`, baseline captured.
- Production player id 67 photo: accepted by the user as not verified.

## For the user

1. Approve the plan.
2. Confirm the two places where a client component still sorts, both through `ordering.ts`: filter option labels, and
   the single calendar sort after `week-calendar.tsx` merges fetched weeks (required for correct order, Phase 4).
3. Optional, read-only, in the cPanel Node environment: `node -p "process.versions.icu + ' ' + new Intl.Collator('lv').resolvedOptions().locale"`
   (expected `lv`), and whether player id 67 has a photo in the admin.
