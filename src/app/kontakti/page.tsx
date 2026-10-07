import { pageMetadata } from "@/lib/page-metadata";

import { ContactPageContent } from "@/components/contact-page-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { StructuredData } from "@/components/structured-data";
import { BreadcrumbData } from "@/components/breadcrumb-data";
import { webPageData } from "@/lib/web-page-data";
import { getSiteUrl } from "@/lib/site-url";

export const metadata = pageMetadata({
  title: "AFA Olaine kontakti | Sazinies ar futbola klubu",
  description: "Sazinies ar AFA Olaine futbola klubu: atrodi tālruni, e-pasta adresi, Olaines pilsētas stadiona atrašanās vietu un kluba rekvizītus.",
  path: "/kontakti",
});

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <StructuredData data={webPageData({ type: "ContactPage", name: "AFA Olaine kontakti", path: "/kontakti", mainEntity: { "@id": `${getSiteUrl()}/#organization` } })} />
      <BreadcrumbData items={[{ name: "Sākums", path: "/" }, { name: "Kontakti", path: "/kontakti" }]} />
      <SiteHeader />
      <ContactPageContent settings={settings} />
      <SiteEnding />
    </main>
  );
}
