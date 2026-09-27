import Image from "next/image";

import { getPartners } from "@/lib/partners-server";

const FIGMA_PARTNERS = [
  {
    name: "Olaines Sporta Centrs",
    aliases: ["Olaines Sporta Centrs"],
    image: "/partner-osc.png",
    width: 221.818,
    height: 70,
  },
  {
    name: "Olaines novada pašvaldība",
    aliases: ["Olaines novads", "Olaines novada pašvaldība"],
    image: "/partner-olaine.png",
    width: 59.155,
    height: 70,
    label: "Olaines novada pašvaldība",
  },
  {
    name: "Latvijas Futbola Federācija",
    aliases: ["Latvijas Futbola Federācija"],
    image: "/partner-lff.png",
    width: 70,
    height: 70,
    label: "Latvijas Futbola Federācija",
  },
  {
    name: "Daily",
    aliases: ["Daily"],
    image: "/partner-daily.png",
    width: 221.818,
    height: 70,
  },
  {
    name: "LFF Zemgales Futbola Centrs",
    aliases: ["LFF Zemgales Futbola Centrs"],
    image: "/partner-zemgale.png",
    width: 62.687,
    height: 70,
    label: "LFF ZEMGALES FUTBOLA CENTRS",
  },
  {
    name: "Joma-sport.lv",
    aliases: ["Joma", "Joma-sport.lv"],
    image: "/partner-joma.png",
    width: 70,
    height: 70,
    label: "Joma-sport.lv",
  },
] as const;

export async function PartnersSection() {
  const partners = await getPartners();

  return (
    <section aria-labelledby="partners-heading" className="bg-white text-black">
      <div className="w-full px-6 py-20 xl:px-[160px] xl:py-[120px]">
        <h2 id="partners-heading" className="w-full font-heading text-[40px] font-semibold leading-[1.3]">
          Mūsu Partneri
        </h2>

        <div className="mt-[60px] grid w-full grid-cols-1 gap-y-12 lg:grid-cols-2 xl:grid-cols-[440px_440px_440px] xl:justify-between">
          {FIGMA_PARTNERS.map((partner) => {
            const savedPartner = partners.find((item) =>
              partner.aliases.some((alias) => alias === item.name),
            );
            const content = (
              <>
                <Image
                  src={partner.image}
                  alt=""
                  width={partner.width}
                  height={partner.height}
                  className="shrink-0 object-cover"
                  style={{ width: partner.width, height: partner.height }}
                />
                {"label" in partner && (
                  <span className="whitespace-nowrap font-sans text-[24px] font-semibold leading-[1.3] text-black">
                    {partner.label}
                  </span>
                )}
              </>
            );

            return savedPartner?.websiteUrl ? (
              <a
                key={partner.name}
                href={savedPartner.websiteUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={partner.name}
                className="flex h-[70px] w-[440px] items-center gap-3 outline-offset-4 focus-visible:outline-2 focus-visible:outline-black"
              >
                {content}
              </a>
            ) : (
              <div key={partner.name} className="flex h-[70px] w-[440px] items-center gap-3">
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
