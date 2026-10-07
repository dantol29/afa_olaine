type SponsorTickerPartner = {
  id: number;
  name: string;
  logoUrl: string;
  needsWhite: boolean;
  size?: "lg" | "sm";
  websiteUrl?: string | null;
};

export type SponsorTickerItem = SponsorTickerPartner;

/** Places the league identity ahead of the admin-managed sponsor records. */
export function sponsorTickerItems(partners: SponsorTickerPartner[], leagueMark?: SponsorTickerItem | null): SponsorTickerItem[] {
  return leagueMark ? [leagueMark, ...partners] : partners;
}

/** Keeps the league mark fixed while every database sponsor can loop. */
export function splitSponsorTickerItems(items: SponsorTickerItem[], hasLeagueMark = false) {
  if (!hasLeagueMark) return { staticItem: undefined, movingItems: items };
  const [staticItem, ...movingItems] = items;
  return { staticItem, movingItems };
}

/** Repeats a sponsor sequence enough times to keep a wide marquee filled. */
export function loopSponsorTickerItems(items: SponsorTickerItem[], copies = 6): SponsorTickerItem[] {
  return Array.from({ length: Math.max(copies, 1) }, () => items).flat();
}
