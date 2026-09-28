import Link from "next/link";
import { ChevronRight, House, Mail, MapPin, Phone } from "lucide-react";

import type { SiteSettings } from "@/lib/site-settings";

import { ArticleHeroImage } from "./article-hero-image";

export function ContactPageContent({ settings }: { settings: SiteSettings }) {
  const phoneHref = `tel:${settings.phone.replace(/[^+\d]/g, "")}`;

  return (
    <div className="bg-[#050505] text-white">
      <section aria-label="Kontakti" className="relative isolate h-[68svh] min-h-[520px] overflow-hidden md:h-[76svh] md:min-h-[620px]">
        <ArticleHeroImage src="/match-stadium.jpg" alt="Olaines pilsētas stadions" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.55)_0%,rgba(5,5,5,0.08)_42%,rgba(5,5,5,0.76)_100%)]" />
        <nav aria-label="Atpakaļceļš" className="absolute inset-x-0 top-24 z-10 hidden md:top-28 md:block">
          <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-center gap-3 pl-12 text-sm font-semibold text-white/80 md:w-[calc(100%-10rem)] md:pl-24">
            <Link href="/" aria-label="Sākums" className="transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><House className="size-5" aria-hidden="true" /></Link>
            <ChevronRight className="size-4" aria-hidden="true" />
            <span aria-current="page" className="font-heading text-base uppercase">Kontakti</span>
          </div>
        </nav>
      </section>

      <div className="relative z-10 mx-auto -mt-24 w-[calc(100%-3rem)] max-w-[860px] bg-[#050505] px-6 pb-9 pt-8 sm:px-10 md:-mt-28 md:w-full md:pb-12 md:pt-10">
        <h1 className="font-heading text-[34px] font-semibold uppercase leading-[0.96] tracking-[-0.02em] sm:text-[46px] lg:text-[56px]">Kontakti</h1>
      </div>

      <section aria-label="Kontaktinformācija un rekvizīti" className="mx-auto max-w-[860px] px-6 pb-20 pt-10 sm:px-10 sm:pb-28 sm:pt-14">
        <div className="divide-y divide-white/20 border-y border-white/20">
          <div className="grid gap-3 py-6 sm:grid-cols-[190px_1fr] sm:gap-6 sm:py-7">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-white/60"><Phone className="size-5 text-[#fbb040]" aria-hidden="true" /> Tālrunis</div>
            <a href={phoneHref} className="w-fit font-sans text-lg transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-xl">{settings.phone}</a>
          </div>
          <div className="grid gap-3 py-6 sm:grid-cols-[190px_1fr] sm:gap-6 sm:py-7">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-white/60"><Mail className="size-5 text-[#fbb040]" aria-hidden="true" /> E-pasts</div>
            <a href={`mailto:${settings.email}`} className="w-fit break-all font-sans text-lg transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-xl">{settings.email}</a>
          </div>
          <div className="grid gap-3 py-6 sm:grid-cols-[190px_1fr] sm:gap-6 sm:py-7">
            <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-white/60"><MapPin className="size-5 text-[#fbb040]" aria-hidden="true" /> Stadions</div>
            <address className="font-sans text-lg not-italic sm:text-xl">{settings.stadiumAddress}</address>
          </div>
        </div>

        <div className="mt-14 sm:mt-20">
          <h2 className="font-heading text-[28px] font-semibold uppercase leading-none sm:text-[36px]">Kluba rekvizīti</h2>
          <div className="mt-8 space-y-3 border-t border-white/20 pt-7 font-sans text-lg leading-relaxed sm:text-xl">
            <p>{settings.legalName}</p>
            <p><span className="text-white/60">Reģ. Nr.</span> {settings.regNr}</p>
            <p>{settings.bankName}</p>
            <p className="break-all">{settings.bankAccount}</p>
            <p><span className="text-white/60">Kods:</span> {settings.bankCode}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
