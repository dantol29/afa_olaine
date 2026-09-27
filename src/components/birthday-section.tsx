import Image from "next/image";

import { getUpcomingBirthdays } from "@/lib/birthdays-server";

import { BirthdayCarousel } from "./birthday-carousel";

export async function BirthdaySection() {
  const players = await getUpcomingBirthdays(32);

  if (players.length === 0) return null;

  return (
    <section aria-labelledby="birthday-heading" className="relative overflow-hidden bg-[#fbb040] text-black">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[-0.47px] h-[965px] w-[1920px] overflow-hidden opacity-30 mix-blend-soft-light"
      >
        <Image
          src="/birthday-bg-logo.png"
          alt=""
          width={256}
          height={256}
          className="absolute left-[-473.02px] top-[-835.58px] size-[1835.592px] max-w-none object-cover"
        />
        <Image
          src="/birthday-bg-logo.png"
          alt=""
          width={256}
          height={256}
          className="absolute left-[627.62px] top-[-60.04px] size-[1853.472px] max-w-none object-cover"
        />
      </div>
      <div className="relative mx-auto w-[calc(100%-3rem)] max-w-[1500px] py-20 md:w-[calc(100%-10rem)] xl:py-[120px]">
        <h2 id="birthday-heading" className="font-heading text-[40px] font-semibold leading-[1.3]">
          Spēlētāju dzimšanas dienas
        </h2>
        <BirthdayCarousel players={players} />
      </div>
    </section>
  );
}
