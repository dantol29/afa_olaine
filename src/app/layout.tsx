import type { Metadata } from "next";
import { Oswald, Titillium_Web } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700", "900"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "AFA Olaine | Futbola klubs un akadēmija Olainē",
  description: "AFA Olaine ir futbola klubs un akadēmija Olainē. Apskati komandas, spēļu kalendāru, treniņu grafiku, kluba jaunumus un kontaktinformāciju.",
  applicationName: "AFA Olaine",
  openGraph: {
    type: "website",
    locale: "lv_LV",
    siteName: "AFA Olaine",
    title: "AFA Olaine | Futbola klubs un akadēmija Olainē",
    description: "AFA Olaine futbola klubs un akadēmija Olainē — komandas, spēles, treniņi un jaunumi.",
    images: [{ url: "/match-stadium.jpg", alt: "Olaines pilsētas stadions" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="lv"
      className={`${titillium.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
