import { SiteFooter } from "@/components/site-footer";
import { SponsorShowcase, type Sponsor } from "@/components/sponsor-showcase";

export function SiteEndingContent({ partners }: { partners: Sponsor[] }) {
  return (
    <>
      <SponsorShowcase partners={partners} />
      <SiteFooter />
    </>
  );
}
