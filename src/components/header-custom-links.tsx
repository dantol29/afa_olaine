"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SiteNavLink } from "./site-nav-link";

type CustomPageLink = { title: string; slug: string };
const CustomPageLinks = createContext<CustomPageLink[]>([]);

export function CustomPageLinksProvider({ pages, children }: { pages: CustomPageLink[]; children: ReactNode }) {
  return <CustomPageLinks.Provider value={pages}>{children}</CustomPageLinks.Provider>;
}

export function HeaderCustomLinks({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pages = useContext(CustomPageLinks);
  return <>{pages.map((page) => <SiteNavLink key={page.slug} href={`/klubs/${page.slug}`} onClick={onNavigate} className={mobile ? "border-b border-white/15 py-4" : "shrink-0"}>{page.title}</SiteNavLink>)}</>;
}
