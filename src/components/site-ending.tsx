import { SiteEndingContent } from "@/components/site-ending-content";
import { getPartners } from "@/lib/partners-server";

export async function SiteEnding() {
  const partners = await getPartners();
  return <SiteEndingContent partners={partners} />;
}
