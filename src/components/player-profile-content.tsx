import Image from "next/image";
import Link from "next/link";
import { ChevronRight, House, UserRound } from "lucide-react";

export type PlayerProfile = {
  id: number;
  name: string;
  number: number | null;
  position: string | null;
  birthdate: string;
  photoUrl: string | null;
  teams: { name: string; goals: number }[];
};

export function PlayerProfileContent({ player }: { player: PlayerProfile }) {
  const goals = player.teams.reduce((total, team) => total + team.goals, 0);

  return (
    <>
      <section aria-labelledby="player-profile-title" data-site-hero className="relative isolate min-h-[660px] overflow-hidden bg-[#050505] text-white sm:min-h-[720px] lg:min-h-[820px]">
        {player.photoUrl && (
          <Image src={player.photoUrl} alt="" fill priority sizes="100vw" className="-z-20 scale-[1.7] object-contain object-center opacity-25 blur-md" />
        )}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,5,5,.92)_0%,rgba(5,5,5,.35)_28%,rgba(5,5,5,.2)_55%,#050505_100%)]" />
        <Image src="/afaolaine-logo-outline.png" alt="" width={700} height={700} className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[520px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.12] sm:w-[700px]" />

        <nav aria-label="Atpakaļceļš" className="relative z-20 mx-auto hidden w-[calc(100%-3rem)] max-w-[1500px] flex-wrap items-center gap-2 pt-28 font-heading text-sm font-semibold uppercase text-white/70 md:flex md:w-[calc(100%-10rem)] md:pt-32">
          <Link href="/" aria-label="Sākums" className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><House className="size-5" aria-hidden="true" /></Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <Link href="/komanda" className="hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Komanda</Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span aria-current="page" className="text-white">{player.name}</span>
        </nav>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 mx-auto h-[76%] max-w-[1500px] sm:h-[86%]">
          {player.photoUrl ? (
            <Image src={player.photoUrl} alt={player.name} fill priority sizes="(min-width: 1024px) 560px, (min-width: 640px) 470px, 90vw" className="object-contain object-bottom" />
          ) : (
            <div className="grid h-full place-items-center"><UserRound className="size-56 text-white/30" strokeWidth={0.5} aria-hidden="true" /></div>
          )}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[30%] bg-gradient-to-t from-[#050505] via-[#050505]/65 to-transparent" />

        <div className="absolute inset-x-0 bottom-10 z-10 mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-end justify-start gap-5 sm:justify-between sm:gap-4 md:w-[calc(100%-10rem)] lg:bottom-14">
          <div className="order-2 min-w-0 pb-1 sm:order-1 sm:max-w-[70%] sm:pb-0 lg:max-w-[45%]">
            <h1 id="player-profile-title" className="font-heading text-[27px] font-semibold uppercase leading-[0.95] tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,.6)] sm:text-[68px] sm:leading-[0.9] lg:text-[84px]">{player.name}</h1>
            <p className="mt-1 text-[18px] text-white/85 sm:mt-4 sm:text-2xl">{player.position ?? "Spēlētājs"}</p>
          </div>
          {player.number !== null && <span aria-label={`Numurs ${player.number}`} className="order-1 shrink-0 font-heading text-[78px] font-semibold leading-[0.85] tracking-[-0.06em] text-white sm:order-2 sm:text-[160px] sm:leading-[0.75] sm:tracking-normal lg:text-[210px]">{player.number}</span>}
        </div>
      </section>

      <section aria-labelledby="player-stats-title" className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-20 pt-10 text-white md:w-[calc(100%-10rem)] lg:pb-28 lg:pt-20">
        <h2 id="player-stats-title" className="font-heading text-[32px] font-semibold uppercase leading-none sm:text-[42px]">Info</h2>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:max-w-[760px]">
          <div className="flex flex-col bg-[#151515] px-3 py-5 sm:px-6 sm:py-7">
            <span className="flex flex-1 flex-col justify-center font-heading text-[21px] font-semibold leading-none min-[390px]:text-[24px] sm:text-[44px]">{goals}</span>
            <p className="mt-2 text-xs text-white/65 sm:text-sm">Gūtie vārti</p>
          </div>
          <div className="flex flex-col bg-[#151515] px-3 py-5 sm:px-6 sm:py-7">
            <span className="flex flex-1 flex-col justify-center whitespace-nowrap font-heading text-[21px] font-semibold leading-none min-[390px]:text-[24px] sm:text-[44px]">{player.birthdate}</span>
            <p className="mt-2 text-xs text-white/65 sm:text-sm">Dzimšanas datums</p>
          </div>
        </div>
      </section>
    </>
  );
}
