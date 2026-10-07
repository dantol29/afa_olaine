import { StructuredData } from "@/components/structured-data";
import { getSiteUrl } from "@/lib/site-url";

export function BreadcrumbData({ items }: { items: { name: string; path: string }[] }) {
  return <StructuredData data={{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: new URL(path, getSiteUrl()).href,
    })),
  }} />;
}
