import Image from "next/image";

import { getPartners } from "@/lib/partners-server";
import { loopSponsorTickerItems, splitSponsorTickerItems, sponsorTickerItems } from "@/lib/sponsor-ticker";

export async function SponsorsTicker() {
  const partners = await getPartners();
  const { staticItem, movingItems } = splitSponsorTickerItems(sponsorTickerItems(partners));
  const loopItems = loopSponsorTickerItems(movingItems);

  return (
    <section aria-label="Partneri" className="relative z-0 bg-[#050505] pb-7 pt-32 md:pb-9 md:pt-36">
      <div className="mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-center gap-8 md:w-[calc(100%-10rem)] md:gap-12">
        <div className="shrink-0">
          <Image
            src={staticItem.logoUrl}
            alt={staticItem.name}
            width={138}
            height={72}
            className="h-10 w-auto object-contain grayscale invert mix-blend-screen opacity-65"
          />
        </div>
        <div className="sponsors-ticker-mask min-w-0 flex-1 overflow-hidden">
          <div className="sponsors-ticker-track flex w-max items-center gap-14 pr-14 md:gap-24 md:pr-24">
            {loopItems.map((item, index) => {
            const logo = (
              <Image
                src={item.logoUrl}
                alt={item.name}
                width={180}
                height={52}
                className={`w-auto object-contain grayscale invert mix-blend-screen opacity-65 ${item.size === "sm" ? "h-7" : "h-10"}`}
              />
            );

            return item.websiteUrl ? (
              <a
                key={`${item.id}-${index}`}
                href={item.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 outline-offset-4 focus-visible:outline-2 focus-visible:outline-white"
              >
                {logo}
              </a>
            ) : (
              <div key={`${item.id}-${index}`} className="shrink-0">
                {logo}
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
