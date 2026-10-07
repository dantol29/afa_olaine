"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export type AcademyTeam = {
  id: number;
  name: string;
  groupPhotoUrl: string | null;
  players: { id: number; name: string; number: number | null; position: string | null }[];
};

export function selectAcademyTeams<T extends { id: number }>(teams: T[]): T[] {
  return [...teams].sort((a, b) => a.id - b.id).slice(1);
}

export function AcademyContent({ teams }: { teams: AcademyTeam[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const visibleTeams = selectedTeamId === null ? teams : teams.filter((team) => team.id === selectedTeamId);

  return (
    <section aria-label="Akadēmijas komandas" className="mx-auto w-[calc(100%-3rem)] max-w-[1500px] pb-20 pt-6 text-white md:w-[calc(100%-10rem)] sm:pt-8 xl:pb-28">
      {teams.length === 0 && <p className="text-white/60">Akadēmijas komandas tiks pievienotas.</p>}
      {teams.length > 0 && (
        <div className="mb-8 flex gap-2 overflow-x-auto sm:mb-10 sm:gap-3" role="group" aria-label="Filtrēt pēc komandas">
          {[null, ...teams.map((team) => team.id)].map((teamId) => {
            const selected = selectedTeamId === teamId;
            return (
              <button
                key={teamId ?? "all"}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedTeamId(teamId)}
                className={`min-h-12 shrink-0 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-7 sm:text-[22px] ${selected ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}
              >
                {teamId === null ? "Visas komandas" : teams.find((team) => team.id === teamId)?.name}
              </button>
            );
          })}
        </div>
      )}
      <div className="space-y-16 md:space-y-24">
        {visibleTeams.map((team) => (
          <article id={`team-${team.id}`} key={team.id} className="scroll-mt-24">
            <div className="mb-7 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-heading text-4xl font-semibold uppercase leading-none md:text-6xl">{team.name}</h2>
              </div>
              <span className="text-sm text-white/50">{team.players.length} spēlētāji</span>
            </div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#171717]">
                {team.groupPhotoUrl ? (
                  <Image src={team.groupPhotoUrl} alt={`${team.name} komandas kopbilde`} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center px-5 text-center text-sm text-white/45">Komandas foto tiks pievienots</div>
                )}
              </div>
              <div>
                <h3 className="mb-4 font-heading text-2xl font-semibold uppercase">Sastāvs</h3>
                {team.players.length === 0 ? (
                  <p className="border-t border-white/15 py-5 text-white/55">Sastāvs tiks papildināts</p>
                ) : (
                  <ul className="divide-y divide-white/15 border-t border-white/15">
                    {team.players.map((player) => (
                      <li key={player.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
                        <span className="font-heading text-2xl text-[#fbb040]">{player.number ?? "—"}</span>
                        <Link href={`/komanda/speletaji/${player.id}`} className="font-heading text-xl font-semibold uppercase transition-colors hover:text-[#fbb040] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbb040]">{player.name}</Link>
                        {player.position && <span className="col-start-2 text-sm text-white/55 sm:col-start-auto">{player.position}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
