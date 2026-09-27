"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, UserRound, X } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useState } from "react";
import { SiteNavLink } from "./site-nav-link";

export function SiteHeader() {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const reduceMotion = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (current <= 24) setHidden(false);
    else if (current > previous) setHidden(true);
    else if (current < previous) setHidden(false);
  });

  useEffect(() => {
    const update = () => setHasScrolled(window.scrollY > 24 || window.location.hash.length > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("hashchange", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("hashchange", update);
    };
  }, []);

  return (
    <motion.header
      className="fixed left-0 top-0 z-50 w-full overflow-visible text-white transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out"
      animate={{ y: hidden && !menuOpen ? "-100%" : 0, opacity: hidden && !menuOpen ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.32, ease: "easeInOut" }}
      style={{ backgroundColor: hasScrolled ? "#050505" : "transparent", boxShadow: hasScrolled ? "0 8px 28px rgba(0,0,0,0.32)" : "none", backdropFilter: hasScrolled ? "blur(12px)" : "none" }}
    >
      <div className="hidden md:block">
        <div className="mx-auto flex h-20 w-[calc(100%-3rem)] max-w-[1500px] items-center justify-between pt-4 md:w-[calc(100%-10rem)]">
          <div className="flex items-center"><Link href="/" aria-label="AFA Olaine sākumlapa" className="relative z-10 flex size-[104px] shrink-0 translate-y-3 items-center justify-center"><Image src="/hero-logo.png" alt="" width={94} height={94} priority className="size-[94px] object-contain" /></Link><nav aria-label="Galvenā navigācija" className="ml-5 flex items-center gap-6 font-heading text-[18px] font-semibold uppercase tracking-wide lg:gap-8"><SiteNavLink href="/">Sākums</SiteNavLink><SiteNavLink href="/jaunumi">Jaunumi</SiteNavLink><SiteNavLink href="/speles">Spēles</SiteNavLink><SiteNavLink href="/trenini">Treniņi</SiteNavLink><SiteNavLink href="/akademija">Akadēmija</SiteNavLink><SiteNavLink href="/kontakti">Kontakti</SiteNavLink></nav></div>
          <div className="flex items-center gap-4"><Link href="/meklet" aria-label="Meklēt" className="grid size-10 place-items-center"><Search className="size-6" /></Link><Link href="/admin" prefetch={false} aria-label="Profils" className="grid size-10 place-items-center"><UserRound className="size-6" /></Link></div>
        </div>
      </div>
      <div className="flex h-[76px] items-center justify-between px-6 md:hidden"><Link href="/" aria-label="AFA Olaine sākumlapa" className="flex items-center gap-2.5"><Image src="/hero-logo.png" alt="" width={48} height={48} priority className="size-12 object-contain" /><span className="font-heading text-[23px] font-semibold uppercase tracking-[0.08em]">AFA Olaine</span></Link><div className="flex items-center"><Link href="/meklet" aria-label="Meklēt" className="grid size-12 place-items-center text-white"><Search className="size-6" /></Link><button type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="team-mobile-navigation" aria-label={menuOpen ? "Aizvērt izvēlni" : "Atvērt izvēlni"} className="grid size-14 place-items-center text-white">{menuOpen ? <X className="size-9" /> : <Menu className="size-9" />}</button></div></div>
      {menuOpen && <nav id="team-mobile-navigation" aria-label="Mobilā navigācija" className="absolute left-0 top-full flex min-h-[calc(100vh-76px)] w-full flex-col border-t border-white/15 bg-[#050505] px-6 py-8 text-center font-heading text-[30px] font-semibold uppercase leading-[1.3] tracking-wide text-white">{[["Sākums", "/"], ["Jaunumi", "/jaunumi"], ["Spēles", "/speles"], ["Treniņi", "/trenini"], ["Akadēmija", "/akademija"], ["Kontakti", "/kontakti"]].map(([label, href]) => <SiteNavLink key={href} href={href} onClick={() => setMenuOpen(false)} className="border-b border-white/15 py-4 last:border-0">{label}</SiteNavLink>)}</nav>}
    </motion.header>
  );
}
