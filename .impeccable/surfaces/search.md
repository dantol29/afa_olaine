# Header search overlay

Mode: Operate. User requested search should not be a separate page. Both homepage and inner-page header search controls open a shared full-screen native dialog over the current page; legacy /meklet redirects to /. Existing /api/search and content destinations remain in use.

Incumbent colors #050505, white, #fbb040; Oswald headings, Titillium content. Content maximum960px,24px mobile margins,onecolumn groups mobile/twocolumn sm. Close and clear controls44px. Native dialog contains focus and supports Escape; opening focuses query, locks body scroll and closes mobile navigation. Dismissal restores trigger focus. Results links dismiss before navigating. Search fetch debounced250ms with cancellation; minimum2characters,loading/error/empty states and polite result counts. Same trimmed query preserves its displayed results during whitespace changes. Custom searchclear control uses site colors.

Evidence: .impeccable/review/search-desktop.png and search-mobile.png. Detector returned no findings. Rest of page layout retained.
