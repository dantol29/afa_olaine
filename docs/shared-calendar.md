# AFA Olaine → FK Olaine calendar

AFA publishes its own schedule. FK combines it with its local schedule on
`/kalendars` and the admin calendar. AFA's public pages keep their own schedule.

## AFA configuration

Set `SHARED_CALENDAR_SECRET` to a long random value in the server environment.
Set `SITE_URL` to AFA's actual public origin so logo URLs resolve correctly.
The feed is disabled until the secret is configured.

## Feed contract

`GET /api/shared-calendar?from=2026-10-01&to=2026-10-31`

Send `Authorization: Bearer <SHARED_CALENDAR_SECRET>` from FK's server.
Both dates are inclusive, use YYYY-MM-DD, and cover at most 366 days.

Response: `{ version: 1, club, timezone, generatedAt, events }`.
Each event includes a namespaced `uid`, title, team, location, eventType,
dateKey, start/end ISO timestamps, calendar labels, club and readOnly.
Game events also include opponent names and absolute logo URLs.
No private notes, player details or database credentials are exported.

The feed uses Europe/Riga for calendar dates and UTC ISO timestamps for instants.
It includes games, trainings and general events at all locations. FK should
filter by venue when calculating stadium occupancy; an away match does not
automatically occupy Olaines pilsētas stadions.

## FK implementation

Implemented in `/Users/daniilstolmacovs/Desktop/fk_olaine` on 2026-10-11:

- Fetch this endpoint on the server with a timeout. Keep the secret server-only.
- Merge local and AFA events on `/kalendars` and in the admin calendar.
- Mark imported bookings as AFA Olaine and read-only.
- Preserve namespaced IDs to avoid collisions with local records.
- Load fresh bookings beside game, training and event forms when date/venue changes.
- Normalize venue aliases before comparing bookings.
- Detect overlap when A.start < B.end and B.start < A.end at the same venue.
- Show unavailable/stale feed status; a failed request must not imply a free venue.
- Only publish the public scheduling fields on `/kalendars`.

Deployment and configuring both servers are still required. Overlap warnings
are advisory; the separate databases do not provide an atomic reservation lock.
