import type { Metadata } from "next";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string;
};

/** Set each preview explicitly: nested metadata is replaced, not merged by Next. */
export function pageMetadata({ title, description, path, image = "/match-stadium.jpg" }: PageMetadataOptions): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path, types: { "application/rss+xml": "/feed.xml" } },
    openGraph: {
      type: "website",
      locale: "lv_LV",
      siteName: "AFA Olaine",
      url: path,
      title,
      description,
      images: [{ url: image, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
