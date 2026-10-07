import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-url";

type WebPageOptions = {
  name: string;
  path: string;
  description?: string;
  type?: "WebPage" | "CollectionPage" | "ContactPage" | "ProfilePage";
  mainEntity?: Record<string, unknown>;
  dateModified?: string;
};

export function webPageData({ name, path, description, type = "WebPage", mainEntity, dateModified }: WebPageOptions) {
  const url = absoluteSiteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "lv-LV",
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
    about: { "@id": `${getSiteUrl()}/#organization` },
    mainEntity,
    dateModified,
  };
}
