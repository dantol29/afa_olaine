import Image from "next/image";

import type { Partner } from "@/lib/partners-server";

export type Sponsor = Pick<Partner, "id" | "name" | "logoUrl" | "logoWidth" | "logoHeight" | "size" | "needsWhite" | "websiteUrl">;

export function SponsorShowcase({ partners }: { partners: Sponsor[] }) {
  if (partners.length === 0) return null;

  return (
    <section aria-label="Sponsori" className="bg-[#050505] pb-20 pt-16 text-white sm:pb-24 sm:pt-20">
      <div className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <h2 className="font-heading text-[34px] font-semibold uppercase leading-none sm:text-[40px]">Sponsori</h2>
          <a href="mailto:info@afaolaine.lv" className="border border-white/35 px-5 py-3 font-heading text-sm font-semibold uppercase transition-colors hover:border-white hover:bg-white hover:text-[#050505] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Sazināties</a>
        </div>

        <div className="mt-10 flex items-center gap-5 text-center font-sans text-sm font-semibold text-white/60 sm:mt-12">
          <span className="h-px flex-1 bg-white/25" aria-hidden="true" />
          <span>Mūsu atbalstītāji</span>
          <span className="h-px flex-1 bg-white/25" aria-hidden="true" />
        </div>

        <ul className="mt-10 grid grid-cols-2 items-center gap-x-8 gap-y-12 sm:mt-12 sm:grid-cols-3 sm:gap-y-16 lg:grid-cols-6">
          {partners.map((partner) => {
            const logo = (
              <Image
                src={partner.logoUrl}
                alt={partner.name}
                width={partner.logoWidth}
                height={partner.logoHeight}
                className={`max-w-full object-contain opacity-75 transition-opacity hover:opacity-100 ${partner.size === "sm" ? "max-h-12" : "max-h-20"} ${partner.needsWhite ? "brightness-0 invert" : "grayscale"}`}
              />
            );

            return (
              <li key={partner.id} className="flex min-h-20 items-center justify-center">
                {partner.websiteUrl ? (
                  <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={partner.name} className="flex min-h-12 items-center justify-center outline-offset-4 focus-visible:outline-2 focus-visible:outline-white">{logo}</a>
                ) : logo}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
