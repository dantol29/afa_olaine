"use client";

import { useState } from "react";

import { TeamRosterRail } from "@/components/team-roster-rail";

type TeamPagePlayer = {
  id: number;
  name: string;
  number: number | null;
  position: string | null;
  photoUrl: string | null;
};

type TeamPagePlayerGroup = {
  label: string;
  players: TeamPagePlayer[];
};

type TeamPageCoach = {
  id: number;
  name: string;
  position: string;
  license: string;
  authority: string;
  photoUrl: string | null;
};

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
              profileHrefBase="/komanda/treneri"
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
