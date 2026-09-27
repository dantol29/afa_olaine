type SponsorTickerPartner = {
  id: number;
  name: string;
  logoUrl: string;
  needsWhite: boolean;
  size?: "lg" | "sm";
  websiteUrl?: string | null;
};

export type SponsorTickerItem = SponsorTickerPartner;

const LEAGUE_MARK: SponsorTickerItem = {
  id: 0,
  name: "Altero.lv 2. līga",
  logoUrl: "/altero-liga.png",
  needsWhite: true,
};

/** Places the league identity ahead of the admin-managed sponsor records. */
export function sponsorTickerItems(partners: SponsorTickerPartner[]): SponsorTickerItem[] {
  return [LEAGUE_MARK, ...partners];
}

/** Keeps the league mark fixed while every database sponsor can loop. */
export function splitSponsorTickerItems(items: SponsorTickerItem[]) {
  const [staticItem, ...movingItems] = items;
  return { staticItem, movingItems };
}

/** Repeats a sponsor sequence enough times to keep a wide marquee filled. */
export function loopSponsorTickerItems(items: SponsorTickerItem[], copies = 6): SponsorTickerItem[] {
  return Array.from({ length: Math.max(copies, 1) }, () => items).flat();
}
