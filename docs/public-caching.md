# Public data caching

Public news lists/details, related articles, player rosters, coaches, academy
teams, partners, published custom pages, league metadata, and footer settings
use Next's data cache with a 60-second revalidation interval. React also dedupes
repeated reads within one render.

Cache keys include the data query, its arguments, and a hashed database scope.
All these reads use `afa-public-content`. Relevant admin save/delete actions
call `updateTag` after a successful mutation so the next read fetches fresh data.
The goal-scorer cron expires the same tag after updating players.

Admin pages render on every request and forms/lists read the database directly.
The admin partner list has a
separate uncached reader because it formerly shared its getter with the footer.
Game/training schedule queries and `/api/shared-calendar` remain fresh.
The shared feed does not use public roster caches.

External LFF HTML and YouTube fetches retain their existing hourly cache.
Public pages that Next can pre-render inherit the data cache's revalidation
interval. Admin pages explicitly opt out of pre-rendering. Cache Components
are not enabled.
No migration or environment configuration is required; build/restart through
the usual deployment process to apply it.

Local verification used a production server and an isolated database copy:
public settings stayed cached after a direct database change, the admin read
showed that change immediately, saving through the actual admin Server Action
immediately refreshed public settings, and the shared calendar feed reflected a
new event on the next request with `Cache-Control: private, no-store`.
