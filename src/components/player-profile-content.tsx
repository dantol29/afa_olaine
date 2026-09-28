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
  return (
    <>
      <section aria-labelledby="player-profile-title" className="relative isolate min-h-[660px] overflow-hidden bg-[#050505] text-white sm:min-h-[720px] lg:min-h-[820px]">
        <Image src="/hero-team.png" alt="" fill priority sizes="100vw" className="-z-30 object-cover object-center opacity-30" />
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

        <div className="absolute inset-x-0 bottom-10 z-10 mx-auto flex w-[calc(100%-3rem)] max-w-[1500px] items-end justify-between gap-4 md:w-[calc(100%-10rem)] lg:bottom-14">
          <div className="max-w-[70%] lg:max-w-[45%]">
            <h1 id="player-profile-title" className="font-heading text-[44px] font-semibold uppercase leading-[0.9] tracking-tight drop-shadow-[0_3px_12px_rgba(0,0,0,.6)] sm:text-[68px] lg:text-[84px]">{player.name}</h1>
            <p className="mt-4 text-lg text-white/85 sm:text-2xl">{player.position ?? "Spēlētājs"}</p>
          </div>
          {player.number !== null && <span aria-label={`Numurs ${player.number}`} className="font-heading text-[100px] font-semibold leading-[0.75] text-white sm:text-[160px] lg:text-[210px]">{player.number}</span>}
        </div>
      </section>

      <section aria-label="Spēlētāja informācija" className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] py-10 md:w-[calc(100%-10rem)]">
        <dl className="grid gap-6 bg-white px-6 py-7 text-[#050505] sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-10">
          <div><dt className="text-sm text-black/60">Komanda</dt><dd className="mt-2 font-heading text-[25px] font-semibold uppercase leading-none">{player.teams.map((team) => team.name).join(", ") || "Nav norādīta"}</dd></div>
          <div><dt className="text-sm text-black/60">Pozīcija</dt><dd className="mt-2 font-heading text-[25px] font-semibold uppercase leading-none">{player.position ?? "Spēlētājs"}</dd></div>
          <div><dt className="text-sm text-black/60">Dzimšanas datums</dt><dd className="mt-2 font-heading text-[25px] font-semibold uppercase leading-none">{player.birthdate}</dd></div>
          {player.number !== null && <div><dt className="text-sm text-black/60">Numurs</dt><dd className="mt-2 font-heading text-[25px] font-semibold uppercase leading-none">{player.number}</dd></div>}
        </dl>
      </section>

      {player.teams.length > 0 && (
        <section aria-labelledby="player-stats-title" className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-20 pt-10 text-white md:w-[calc(100%-10rem)] lg:pb-28 lg:pt-20">
          <h2 id="player-stats-title" className="font-heading text-[32px] font-semibold uppercase leading-none sm:text-[42px]">Komandu statistika</h2>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {player.teams.map((team) => (
              <div key={team.name} className="bg-[#151515] px-6 py-7">
                <span className="font-heading text-[52px] font-semibold leading-none">{team.goals}</span>
                <p className="mt-2 text-sm text-white/65">Gūtie vārti</p>
                <p className="mt-5 font-heading text-[23px] font-semibold uppercase leading-none">{team.name}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
