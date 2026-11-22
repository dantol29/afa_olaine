"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type TeamOption = { id: number; name: string };

const ALL_TEAMS_VALUE = "__all__";
const OPTION_CLASS = "min-h-10 rounded-none font-heading text-[18px] uppercase data-highlighted:bg-white data-highlighted:text-[#050505] data-selected:text-[#fbb040] [&_svg]:text-[#fbb040]";

/** The public team filter of /speles and /trenini: "Komanda" until a team is picked, then that team's name.
 *  `teamOptions` come already in the club's display order. */
export function TeamFilterSelect({ teamOptions, teamId, onChange }: { teamOptions: TeamOption[]; teamId: number | null; onChange: (teamId: number | null) => void }) {
  return (
    <Select<string>
      value={teamId === null ? ALL_TEAMS_VALUE : String(teamId)}
      onValueChange={(value) => onChange(!value || value === ALL_TEAMS_VALUE ? null : Number(value))}
    >
      <SelectTrigger aria-label="Komanda" className={`min-h-12 w-full max-w-full rounded-none px-4 py-3 font-heading text-[18px] font-semibold uppercase leading-none sm:w-auto sm:min-w-48 sm:px-7 sm:text-[22px] ${teamId !== null ? "border border-white bg-white text-[#050505] hover:bg-white" : "border border-white/40 bg-[#050505] text-white hover:border-white hover:bg-[#050505]"} focus-visible:ring-2 focus-visible:ring-[#fbb040]`}>
        <SelectValue>{(value: string) => value === ALL_TEAMS_VALUE ? "Komanda" : teamOptions.find((team) => String(team.id) === value)?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent sideOffset={4} className="rounded-none border border-white/40 bg-[#121212] p-1 text-white shadow-xl">
        <SelectItem value={ALL_TEAMS_VALUE} className={OPTION_CLASS}>Visas komandas</SelectItem>
        {teamOptions.map((team) => <SelectItem key={team.id} value={String(team.id)} className={OPTION_CLASS}>{team.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
