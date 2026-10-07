# SEO implementation — 7 October 2026

## Implemented

- Shared metadata helper gives the six public directory pages and published custom pages their own Open Graph and Twitter titles, descriptions, images, and canonical URLs. Article and player pages retain their article/profile types and also receive explicit Twitter previews.
- Sitemap includes public directories, articles, player profiles, and published custom pages. Draft custom pages, admin pages, the design lab, and the old search redirect are excluded.
- Custom page modification dates come from the saved `updatedAt` value. Article publication dates are no longer presented as modification dates: the article table does not track updates.
- Shared public footer now supplies the club's SportsOrganization data, using saved contact details. Article publisher data is self-contained and linked to that organization.
- Article and player breadcrumb structured data follows the breadcrumbs visible on those pages.
- Robots rules allow crawlers to follow the old `/meklet` redirect. Admin and API paths remain blocked. Existing admin, lab, and staging noindex safeguards are preserved.
- Player create, update, and delete actions invalidate the sitemap, profiles, and current team/academy routes.

## Advanced pass

- Added `WebSite` data for the homepage site name, linked to the club organization; `ProfilePage` and `Person` data for player pages; `CollectionPage` and an article list for news; `ContactPage` data and breadcrumbs for contacts; and `WebPage` data with actual saved modification dates for custom pages.
- Sitemap now includes the images displayed on article, player, academy, and custom pages. Team photos use the same team ordering as the academy. No unused article gallery assets are advertised.
- Added `/feed.xml`, an RSS feed containing the latest 50 articles, with metadata autodiscovery. Publication dates retain their actual date precision. News edits refresh the feed and article pages, including deleted or renamed articles.
- Both coaches and players, and both upcoming and past games, are rendered in the initial HTML. Inactive tab panels remain hidden until selected.
- Academy rosters now link directly to player profiles. Custom-page sanitization preserves safe root-relative and fragment links.
- Articles display saved author names and roles, and include three recent articles under “Lasīt arī”. News cards have meaningful image alt text and machine-readable dates.
- Canonical configuration now accepts HTTP(S) origins only, drops configured paths/queries/fragments, and rejects credentials. Numeric player URL aliases permanently redirect to their canonical profile path.
- Public pages permit large image previews. Existing noindex rules continue to apply to the design lab, admin, and staging.

Source review included an independent technical SEO agent. No tests, build, browser checks, Search Console access, or performance measurements were performed for this pass. These changes do not establish ranking or rich-result outcomes.

## Scope and remaining release work

This was a source audit and implementation. No existing `.seo-cache` baseline was available. No tests or production build were run. The browsing tool could not access `https://fkolaine.com`, so production crawling, indexing, rich-result eligibility, and Core Web Vitals remain unmeasured.

After deployment, submit `/sitemap.xml` in the verified Google Search Console property and inspect representative home, news, player, and custom-page URLs. Validate article and breadcrumb data with Google's Rich Results Test. Keep `SITE_URL` set to the actual public origin; its current documented value is `https://fkolaine.com`.

Image optimization is disabled for the existing shared-hosting compatibility requirement. Measure production loading performance before choosing a compatible image compression/delivery change. Rankings and traffic improvements require production measurement.

## References

- [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Next.js metadata reference](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Google image sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps)
- [Google site name guidance](https://developers.google.com/search/docs/appearance/site-names)
- [Google profile page guidance](https://developers.google.com/search/docs/appearance/structured-data/profile-page)
- [Google crawlable link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
