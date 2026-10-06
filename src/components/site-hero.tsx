"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Menu, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ClubNav } from "./club-nav";
import { SiteNavLink } from "./site-nav-link";
import { SiteSearch } from "./site-search";

type HeroArticle = {
  slug: string;
  title: string;
  date: string;
  image: string;
};

type LastGame = {
  homeTeam: string;
  awayTeam: string;
  homeLogo?: string;
  awayLogo?: string;
  score?: string;
};

function ScoreRailMark({ name, logo }: { name: string; logo?: string }) {
  return logo ? (
    <Image src={logo} alt={name} width={28} height={28} className="size-7 object-contain" />
  ) : (
    <span className="grid size-7 place-items-center rounded-full border border-white/30 font-heading text-[10px] text-white">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function SiteHero({ articles, lastGame }: { articles: HeroArticle[]; lastGame?: LastGame }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clubMenuOpen, setClubMenuOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const article = articles[activeIndex];
  const showPreviousArticle = () => {
    setActiveIndex((current) => (current - 1 + articles.length) % articles.length);
  };
  const showNextArticle = () => {
    setActiveIndex((current) => (current + 1) % articles.length);
  };
  useEffect(() => {
    const updateHeader = () => {
      setHasScrolled((heroRef.current?.getBoundingClientRect().bottom ?? 0) <= (window.innerWidth >= 768 ? 80 : 76));
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    return () => {
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <section ref={heroRef} id="jaunumi" data-site-hero className="relative z-10 h-[88svh] min-h-[600px] w-full overflow-visible bg-[#050505] md:h-[90svh] md:min-h-[680px]" aria-label="AFA Olaine">
      <h1 className="sr-only">AFA Olaine — futbola klubs un akadēmija Olainē</h1>
      <header
        className={`fixed left-0 top-0 z-50 w-full overflow-visible text-white transition-[background-color,box-shadow,backdrop-filter] duration-300 ease-out motion-reduce:transition-none ${hasScrolled || isMenuOpen || clubMenuOpen ? "bg-[#050505]" : "bg-transparent"}`}
        style={{
          boxShadow: hasScrolled ? "0 8px 28px rgba(0,0,0,0.32)" : "none",
          backdropFilter: hasScrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="hidden md:block">
          <div className="hidden relative h-10 items-center justify-center border-b border-white/10 font-heading text-sm font-semibold uppercase tracking-wide">
            {lastGame ? (
              <>
                <span className="absolute right-[calc(50%+82px)] text-white/60">Noslēgusies</span>
                <span className="absolute right-[calc(50%+40px)]"><ScoreRailMark name={lastGame.homeTeam} logo={lastGame.homeLogo} /></span>
                <span className="absolute left-1/2 -translate-x-1/2 text-2xl leading-none">{lastGame.score ?? "— : —"}</span>
                <span className="absolute left-[calc(50%+40px)]"><ScoreRailMark name={lastGame.awayTeam} logo={lastGame.awayLogo} /></span>
                <span className="absolute left-[calc(50%+82px)] text-white/60">#AFAOLAINE</span>
              </>
            ) : (
              <span className="text-white/60">AFA Olaine</span>
            )}
          </div>
          <div className="mx-auto flex h-20 w-[calc(100%-3rem)] max-w-[1500px] items-center justify-between pt-4 md:w-[calc(100%-10rem)]">
            <div className="flex items-center">
              <Link href="/" aria-label="AFA Olaine sākumlapa" className="relative z-10 flex size-[104px] shrink-0 translate-y-3 items-center justify-center">
                <Image src="/hero-logo.png" alt="" width={94} height={94} priority className="size-[94px] object-contain" />
              </Link>
              <nav aria-label="Galvenā navigācija" className="ml-5 flex items-center gap-6 font-heading text-[18px] font-semibold uppercase tracking-wide lg:gap-8">
                <SiteNavLink href="/">Sākums</SiteNavLink>
                <SiteNavLink href="/jaunumi">Jaunumi</SiteNavLink>
                <ClubNav portalContainer={heroRef} onOpenChange={setClubMenuOpen} />
                <SiteNavLink href="/speles">Spēles</SiteNavLink>
                <SiteNavLink href="/trenini">Treniņi</SiteNavLink>
                <SiteNavLink href="/kontakti">Kontakti</SiteNavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <SiteSearch className="grid size-10 place-items-center transition-colors hover:text-[#fbb040]" onOpen={() => setIsMenuOpen(false)} />
              <Link href="/admin" prefetch={false} aria-label="Profils" className="grid size-10 place-items-center transition-colors hover:text-[#fbb040]"><UserRound className="size-6" /></Link>
            </div>
          </div>
        </div>

        <div className="flex h-[76px] items-center justify-between px-6 md:hidden">
          <Link href="/" aria-label="AFA Olaine sākumlapa" className="relative z-10 flex size-[92px] shrink-0 translate-y-3 items-center justify-center">
            <Image src="/hero-logo.png" alt="" width={88} height={88} priority className="size-[88px] object-contain" />
          </Link>
          <div className="flex items-center"><SiteSearch className="grid size-12 place-items-center text-white transition-colors hover:text-[#fbb040]" onOpen={() => setIsMenuOpen(false)} /><button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Aizvērt izvēlni" : "Atvērt izvēlni"}
            className="grid size-14 place-items-center text-white transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {isMenuOpen ? <X className="size-9" aria-hidden="true" /> : <Menu className="size-9" aria-hidden="true" />}
          </button></div>
        </div>

        {isMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobilā navigācija"
            className="absolute left-0 top-full flex max-h-[calc(100dvh-76px)] min-h-[calc(100dvh-76px)] w-full flex-col overflow-y-auto border-t border-white/15 bg-[#050505] px-6 py-8 text-center font-heading text-[30px] font-semibold uppercase leading-[1.3] tracking-wide text-white shadow-[0_16px_32px_rgba(0,0,0,0.45)]"
          >
            <SiteNavLink href="/" onClick={() => setIsMenuOpen(false)} className="border-b border-white/15 py-4">
              Sākums
            </SiteNavLink>
            <SiteNavLink href="/jaunumi" onClick={() => setIsMenuOpen(false)} className="border-b border-white/15 py-4">
              Jaunumi
            </SiteNavLink>
            <ClubNav mobile onNavigate={() => setIsMenuOpen(false)} />
            <SiteNavLink href="/speles" onClick={() => setIsMenuOpen(false)} className="border-b border-white/15 py-4">
              Spēles
            </SiteNavLink>
            <SiteNavLink href="/trenini" onClick={() => setIsMenuOpen(false)} className="border-b border-white/15 py-4">
              Treniņi
            </SiteNavLink>
            <SiteNavLink href="/kontakti" onClick={() => setIsMenuOpen(false)} className="py-4">
              Kontakti
            </SiteNavLink>
          </nav>
        )}
      </header>

      <div className="absolute inset-0 overflow-visible">
        <Image
          src={article?.image ?? "/hero-team.png"}
          alt={article?.title ?? "AFA Olaine komanda"}
          width={1920}
          height={1080}
          priority
          className="absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[260px] bg-gradient-to-b from-[#050505]/70 via-[#050505]/30 to-transparent md:h-[320px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[500px] bg-gradient-to-t from-[#050505]/55 via-[#050505]/35 via-[45%] to-transparent md:hidden"
        />

        {article && (
          <>
            <div className="absolute -bottom-28 left-1/2 w-[calc(100%-3rem)] max-w-[1500px] -translate-x-1/2 bg-[#050505] px-6 py-7 md:w-[calc(100%-10rem)] md:px-10 md:py-8 xl:px-10">
              <div className="flex flex-col items-start gap-6">
                <h2 className="max-w-[1050px] font-heading text-[26px] font-semibold uppercase leading-[1.05] text-white md:text-[38px]">
                  {article.title}
                </h2>
                <div className="flex w-full items-center justify-between gap-2.5">
                  <Link href={`/jaunumi/${article.slug}`} className="bg-[#fbb040] px-6 py-3 font-heading text-[18px] font-semibold uppercase tracking-wide text-[#050505] transition-colors hover:bg-[#cd8d2e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                    Lasīt vairāk
                  </Link>
                  {articles.length > 1 && (
                    <div className="flex items-center gap-2" aria-label="Jaunumu slaidu navigācija">
                      <button
                        type="button"
                        onClick={showPreviousArticle}
                        aria-label="Iepriekšējais jaunums"
                        className="grid size-[46px] place-items-center border border-white/70 text-white transition-colors hover:border-[#fbb040] hover:bg-[#fbb040] hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        <ArrowLeft className="size-5" strokeWidth={1.8} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={showNextArticle}
                        aria-label="Nākamais jaunums"
                        className="grid size-[46px] place-items-center border border-white/70 text-white transition-colors hover:border-[#fbb040] hover:bg-[#fbb040] hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                      >
                        <ArrowRight className="size-5" strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
