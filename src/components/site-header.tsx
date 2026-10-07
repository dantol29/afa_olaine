"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SiteNavLink } from "./site-nav-link";
import { SiteSearch } from "./site-search";
import { HeaderCustomLinks } from "./header-custom-links";

export function SiteHeader() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const hero = document.querySelector<HTMLElement>("[data-site-hero]");
      setHasScrolled(hero
        ? hero.getBoundingClientRect().bottom <= (window.innerWidth >= 1024 ? 80 : 76)
        : window.scrollY > 24 || window.location.hash.length > 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);

  return (
    <header
      className="fixed left-0 top-0 z-50 w-full overflow-visible text-white transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out motion-reduce:transition-none"
      style={{ backgroundColor: hasScrolled || menuOpen ? "#050505" : "transparent", boxShadow: hasScrolled ? "0 8px 28px rgba(0,0,0,0.32)" : "none", backdropFilter: hasScrolled ? "blur(12px)" : "none" }}
    >
      <div className="hidden lg:block">
        <div className="mx-auto flex h-20 w-[calc(100%-3rem)] max-w-[1500px] items-center justify-between pt-4 md:w-[calc(100%-10rem)]">
          <div className="flex min-w-0 flex-1 items-center"><Link href="/" aria-label="AFA Olaine sākumlapa" className="relative z-10 flex size-[104px] shrink-0 translate-y-3 items-center justify-center"><Image src="/hero-logo.png" alt="" width={94} height={94} priority className="size-[94px] object-contain" /></Link><nav aria-label="Galvenā navigācija" className="ml-5 flex min-w-0 items-center gap-4 overflow-x-auto whitespace-nowrap [scrollbar-width:thin] [&>a]:shrink-0 font-heading text-[16px] font-semibold uppercase tracking-wide xl:gap-8 xl:text-[18px]"><SiteNavLink href="/">Sākums</SiteNavLink><SiteNavLink href="/jaunumi">Jaunumi</SiteNavLink><SiteNavLink href="/komanda">Komanda</SiteNavLink><SiteNavLink href="/akademija">Akadēmija</SiteNavLink><SiteNavLink href="/speles">Spēles</SiteNavLink><SiteNavLink href="/trenini">Treniņi</SiteNavLink><HeaderCustomLinks /><SiteNavLink href="/kontakti">Kontakti</SiteNavLink></nav></div>
          <div className="ml-4 flex shrink-0 items-center gap-4"><SiteSearch className="grid size-10 place-items-center" onOpen={() => setMenuOpen(false)} /><Link href="/admin" prefetch={false} aria-label="Profils" className="grid size-10 place-items-center"><UserRound className="size-6" /></Link></div>
        </div>
      </div>
      <div className="flex h-[76px] items-center justify-between px-6 lg:hidden"><Link href="/" aria-label="AFA Olaine sākumlapa" className="relative z-10 flex size-[92px] shrink-0 translate-y-3 items-center justify-center"><Image src="/hero-logo.png" alt="" width={88} height={88} priority className="size-[88px] object-contain" /></Link><div className="flex items-center"><SiteSearch className="grid size-12 place-items-center text-white" onOpen={() => setMenuOpen(false)} /><button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="team-mobile-navigation" aria-label={menuOpen ? "Aizvērt izvēlni" : "Atvērt izvēlni"} className="grid size-14 place-items-center text-white">{menuOpen ? <X className="size-9" /> : <Menu className="size-9" />}</button></div></div>
      {menuOpen && <nav id="team-mobile-navigation" aria-label="Mobilā navigācija" className="site-menu-enter absolute left-0 top-full flex max-h-[calc(100dvh-76px)] min-h-[calc(100dvh-76px)] w-full flex-col overflow-y-auto border-t border-white/15 bg-[#050505] px-6 py-8 text-center font-heading text-[30px] font-semibold uppercase leading-[1.3] tracking-wide text-white"><SiteNavLink href="/" onClick={() => setMenuOpen(false)} className="border-b border-white/15 py-4">Sākums</SiteNavLink><SiteNavLink href="/jaunumi" onClick={() => setMenuOpen(false)} className="border-b border-white/15 py-4">Jaunumi</SiteNavLink><SiteNavLink href="/komanda" onClick={() => setMenuOpen(false)} className="border-b border-white/15 py-4">Komanda</SiteNavLink><SiteNavLink href="/akademija" onClick={() => setMenuOpen(false)} className="border-b border-white/15 py-4">Akadēmija</SiteNavLink><SiteNavLink href="/speles" onClick={() => setMenuOpen(false)} className="border-b border-white/15 py-4">Spēles</SiteNavLink><SiteNavLink href="/trenini" onClick={() => setMenuOpen(false)} className="border-b border-white/15 py-4">Treniņi</SiteNavLink><HeaderCustomLinks mobile onNavigate={() => setMenuOpen(false)} /><SiteNavLink href="/kontakti" onClick={() => setMenuOpen(false)} className="py-4">Kontakti</SiteNavLink></nav>}
    </header>
  );
}
