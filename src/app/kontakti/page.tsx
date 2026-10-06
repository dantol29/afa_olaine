import type { Metadata } from "next";

import { ContactPageContent } from "@/components/contact-page-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { getPublicSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "AFA Olaine kontakti | Sazinies ar futbola klubu",
  description: "Sazinies ar AFA Olaine futbola klubu: atrodi tālruni, e-pasta adresi, Olaines pilsētas stadiona atrašanās vietu un kluba rekvizītus.",
  alternates: { canonical: "/kontakti" },
};

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <ContactPageContent settings={settings} />
      <SiteEnding />
    </main>
  );
}
