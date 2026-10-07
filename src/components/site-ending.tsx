import { StructuredData } from "@/components/structured-data";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { getSiteUrl } from "@/lib/site-url";
import { SiteEndingContent } from "@/components/site-ending-content";
import { getPartners } from "@/lib/partners-server";

export async function SiteEnding() {
  const [partners, settings] = await Promise.all([getPartners(), getPublicSiteSettings()]);
  const siteUrl = getSiteUrl();
  const organization = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": `${siteUrl}/#organization`,
    name: "AFA Olaine",
    legalName: settings.legalName,
    url: siteUrl,
    logo: `${siteUrl}/afaolaine-logo.png`,
    sport: "Football",
    foundingDate: "2013",
    email: settings.email,
    telephone: settings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.legalAddress,
      addressLocality: "Olaine",
      addressCountry: "LV",
    },
    sameAs: [
      "https://www.facebook.com/afaolaine.sievietes/",
      "https://www.instagram.com/afa.olaine/",
      "https://www.youtube.com/@afaolaine",
      "https://www.tiktok.com/@afa.olaine",
    ],
  };

  return <><StructuredData data={organization} /><SiteEndingContent partners={partners} /></>;
}
