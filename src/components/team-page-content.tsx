"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { TeamRosterRail } from "@/components/team-roster-rail";

export type TeamPagePlayer = {
  id: number;
  name: string;
  number: number | null;
  position: string | null;
  photoUrl: string | null;
};

export type TeamPagePlayerGroup = {
  label: string;
  players: TeamPagePlayer[];
};

export type TeamPageCoach = {
  id: number;
  name: string;
  position: string;
  license: string;
  authority: string;
  photoUrl: string | null;
};

export function PlayerRoleRail({ group }: { group: TeamPagePlayerGroup }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const updateArrowState = useCallback(() => {
    setCanScrollPrev(emblaApi?.canScrollPrev() ?? false);
    setCanScrollNext(emblaApi?.canScrollNext() ?? false);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", updateArrowState).on("reInit", updateArrowState);
    const frame = requestAnimationFrame(updateArrowState);
    return () => {
      cancelAnimationFrame(frame);
      emblaApi.off("select", updateArrowState).off("reInit", updateArrowState);
    };
  }, [emblaApi, updateArrowState]);

  return (
    <section aria-labelledby={`role-${group.label}`} className="mt-14 first:mt-0 sm:mt-20">
      <div className="flex items-center gap-2 sm:gap-3">
        <h2 id={`role-${group.label}`} className="font-heading text-[30px] font-semibold uppercase leading-none sm:text-[40px]">{group.label}</h2>
        <button type="button" disabled={!canScrollPrev} onClick={() => emblaApi?.scrollPrev()} aria-label={`Iepriekšējie ${group.label.toLowerCase()}`} className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40 sm:size-11">
          <ArrowLeft className="size-4" aria-hidden="true" />
        </button>
        <button type="button" disabled={!canScrollNext} onClick={() => emblaApi?.scrollNext()} aria-label={`Nākamie ${group.label.toLowerCase()}`} className="grid size-10 place-items-center border border-white/50 transition-colors hover:border-white hover:bg-white hover:text-[#050505] disabled:cursor-not-allowed disabled:border-white/25 disabled:text-white/40 disabled:hover:border-white/25 disabled:hover:bg-transparent disabled:hover:text-white/40 sm:size-11">
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div ref={emblaRef} className="mt-7 overflow-hidden sm:mt-8">
        <div className="flex touch-pan-y gap-4 sm:gap-5">
          {group.players.map((player) => (
            <article key={player.id} className="relative h-[350px] min-w-0 flex-[0_0_215px] overflow-hidden bg-[#111] sm:h-[440px] sm:flex-[0_0_260px]">
              {player.photoUrl ? (
                <Image src={player.photoUrl} alt={player.name} fill sizes="(min-width: 640px) 260px, 215px" className="object-contain object-bottom" />
              ) : (
                <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_50%_32%,#343434_0%,#151515_52%,#050505_100%)]">
                  <UserRound className="size-16 text-white/25" strokeWidth={1} aria-hidden="true" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#050505] via-[#050505]/75 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 flex items-end gap-3">
                {player.number !== null && <span className="font-heading text-[52px] font-semibold leading-[0.75] text-[#fbb040]">{player.number}</span>}
                <div className="min-w-0">
                  <h3 className="font-heading text-[23px] font-semibold uppercase leading-[0.9] sm:text-[27px]">{player.name}</h3>
                  <p className="mt-2 text-sm text-white/80">{player.position ?? "Spēlētājs"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TeamPageContent({ playerGroups, coaches, initialTab = "players" }: { playerGroups: TeamPagePlayerGroup[]; coaches: TeamPageCoach[]; initialTab?: "players" | "staff" }) {
  const [activeTab, setActiveTab] = useState<"players" | "staff">(initialTab);

  return (
    <section className="bg-[#050505] pb-20 pt-6 sm:pt-8 xl:pb-28">
      <div className="w-full">
        <div role="tablist" aria-label="Komandas saturs" className="mx-auto mb-8 grid grid-cols-2 gap-2 sm:mb-10 sm:flex sm:gap-3 w-[calc(100%-3rem)] max-w-[1500px] md:w-[calc(100%-10rem)]">
          <button id="players-tab" type="button" role="tab" aria-selected={activeTab === "players"} aria-controls="players-panel" onClick={() => setActiveTab("players")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${activeTab === "players" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
            Spēlētāji
          </button>
          <button id="staff-tab" type="button" role="tab" aria-selected={activeTab === "staff"} aria-controls="staff-panel" onClick={() => setActiveTab("staff")} className={`min-h-12 px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none transition-colors sm:px-7 sm:text-[22px] ${activeTab === "staff" ? "bg-white text-[#050505]" : "border border-white/40 text-white hover:border-white"}`}>
            Treneri
          </button>
        </div>

          <div hidden={activeTab !== "players"} id="players-panel" role="tabpanel" aria-labelledby="players-tab" className="site-panel-enter [&>section:first-child]:pt-0">
            {playerGroups.map((group) => (
              <TeamRosterRail
                key={group.label}
                title={group.label}
                sectionId={`role-${group.label}`}
                showViewAll={false}
                players={group.players.map((player) => ({
                  id: player.id,
                  name: player.name,
                  number: player.number,
                  position: player.position ?? "Spēlētājs",
                  imageUrl: player.photoUrl,
                }))}
              />
            ))}
          </div>
          <div hidden={activeTab !== "staff"} id="staff-panel" role="tabpanel" aria-labelledby="staff-tab" className="site-panel-enter [&>section:first-child]:pt-0">
            <TeamRosterRail
              title="Treneri"
              sectionId="coaches"
              showViewAll={false}
              profileHrefBase={null}
              players={coaches.map((coach) => ({
                id: coach.id,
                name: coach.name,
                number: null,
                position: coach.position,
                imageUrl: coach.photoUrl,
              }))}
            />
          </div>
      </div>
    </section>
  );
}
