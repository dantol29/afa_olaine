# LFF page fixtures

Trimmed copies of public lff.lv pages, used by the LFF import tests (`src/lib/*.test.ts`) instead of the live
site. Only test code reads them; the app never imports anything from `test/`.

| File | Source (path on https://lff.lv) | Captured |
| --- | --- | --- |
| `otra-liga-2026.html` | `/sacensibas/viriesi/otra-liga/` (one page holds every tab; the league source uses `?tab=content_1_2` for fixtures, `content_1_4` for standings and `content_1_5` for top scorers) | 2026-11-17 |
| `telpu-futbols-virsliga-2026.html` | `/sacensibas/telpu-futbols/virsliga/` (tab `content_1_1`, "Nākamās spēles") | 2026-11-17 |

## What was trimmed

The markup of every kept element is unchanged; only whole elements were removed:

- `<head>` reduced to the title and charset; navigation, footer, scripts and styles removed.
- `otra-liga-2026.html`: tab `content_1_1` keeps 2 matches (no AFA Olaine), tab `content_1_2` keeps 6 matches
  (AFA Olaine home and away, `FK Ķekava / Auda`, a July date) with the round heading above each, tab `content_1_3`
  removed, tab `content_1_4` keeps the final-tournament table (2 rows, no AFA Olaine) and the A group table (4 rows
  including AFA Olaine and `FK Ķekava / Auda`), the B group table removed, tab `content_1_5` keeps 5 scorers
  (3 AFA Olaine players).
- `telpu-futbols-virsliga-2026.html`: only tab `content_1_1`, with 2 played and 2 not yet played matches (score
  shown as `-`). This layout has no `.date` block; the date comes from the heading row above the match.

The 2026 outdoor season was over when captured, so cases the live pages did not show at the time (a missing logo, a
relative logo path, a late kick-off, an AFA Olaine match not yet played) are built inside the tests by editing this
markup, and each such test says so.

## Refreshing

1. Download the page once, for example
   `curl -sSL -o page.html "https://lff.lv/sacensibas/viriesi/otra-liga/?tab=content_1_2"`.
2. Keep the same tab containers and a few rows of each kind listed above; delete everything else as whole elements.
3. Update the capture date here and in the comment at the top of the file, run `npm test`, and adjust the expected
   values in the tests to the new rows.
