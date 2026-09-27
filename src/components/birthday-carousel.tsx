"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type BirthdayPlayer = {
  id: number;
  name: string;
  teamName: string | null;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
};

const FILTERS = [
  { label: "2.līga", team: "1. liga" },
  { label: "Sievietes (Virslīga)", team: "Virsliga" },
  { label: "2017.g.dz. (U-9)", team: "U10" },
  { label: "2013.g.dz. (U-13)", team: "U14" },
  { label: "Meitenes, 2010.-2013.g.dz. (WU-16)", team: "U16" },
] as const;

function formatBirthdate(player: BirthdayPlayer) {
  return `${String(player.birthDay).padStart(2, "0")}.${String(player.birthMonth).padStart(2, "0")}.${player.birthYear}`;
}

export function BirthdayCarousel({ players }: { players: BirthdayPlayer[] }) {
  const [selectedTeam, setSelectedTeam] = useState<string>(FILTERS[0].team);
  const visiblePlayers = useMemo(
    () => players.filter((player) => player.teamName === selectedTeam),
    [players, selectedTeam],
  );

  const cards = visiblePlayers.length > 0 ? visiblePlayers : players;

  return (
    <>
      <div className="mt-8 flex gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((filter) => {
          const active = filter.team === selectedTeam;
          return (
            <button
              key={filter.team}
              type="button"
              onClick={() => setSelectedTeam(filter.team)}
              aria-pressed={active}
              className={`shrink-0 rounded-full border px-12 py-3.5 font-sans text-[18px] font-bold leading-[1.3] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black ${
                active
                  ? "border-black bg-black text-[#fbb040]"
                  : "border-[#565353] bg-transparent text-[#565353] hover:bg-white/35"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex snap-x snap-mandatory items-center gap-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cards.map((player) => (
          <article key={player.id} className="relative h-[480px] w-[350px] shrink-0 snap-start overflow-hidden rounded-[24px] bg-white">
            <Image
              src="/birthday-player.png"
              alt=""
              width={350}
              height={525}
              className="absolute bottom-0 left-0 h-[525px] w-[350px] max-w-none object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-[202px] bg-gradient-to-b from-transparent via-[rgba(0,0,0,0.7)] via-[48.515%] to-black" />
            <div className="absolute bottom-6 left-1/2 flex w-[268px] -translate-x-1/2 flex-col items-center gap-3 text-center">
              <h3 className="w-full font-heading text-[32px] font-semibold leading-[1.4] text-white">{player.name}</h3>
              <p className="w-full font-sans text-[24px] font-normal leading-[1.3] text-[#deebfd]">{formatBirthdate(player)}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
