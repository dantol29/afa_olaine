"use client";

import { useRef, useState } from "react";

import { buildWeekText, type WeekItem } from "@/lib/week-text";

type TeamOption = { id: number; name: string };
type WeekOption = { monday: string; label: string };

const COPIED_MESSAGE_MS = 2000;

/** Team and week pickers, the generated text (editable before copying) and "Kopēt". */
export function WeekText({
  teamOptions,
  itemsByTeam,
  weeks,
  initialMonday,
}: {
  teamOptions: TeamOption[];
  itemsByTeam: Record<number, WeekItem[]>;
  weeks: WeekOption[];
  initialMonday: string;
}) {
  const [teamId, setTeamId] = useState("");
  const [monday, setMonday] = useState(initialMonday);
  const [copyResult, setCopyResult] = useState<"copied" | "failed" | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const team = teamOptions.find((option) => option.id === Number(teamId));
  const generated = team ? buildWeekText(team.name, monday, itemsByTeam[team.id] ?? []) : "";
  // Edits are kept until another team or week is picked, which generates the text afresh.
  const [edited, setEdited] = useState<{ source: string; text: string } | null>(null);
  const text = edited?.source === generated ? edited.text : generated;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopyResult("copied");
      setTimeout(() => setCopyResult(null), COPIED_MESSAGE_MS);
    } catch {
      // The browser may refuse the clipboard (no permission, an unfocused window); the text is then selected for a
      // manual copy.
      textRef.current?.select();
      setCopyResult("failed");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">Nedēļas teksts</h1>

      <div className="flex flex-wrap items-end gap-4">
        <label className="min-w-48 flex-1 text-sm font-semibold text-club-navy">
          Komanda
          <select
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          >
            <option value="" disabled>
              Izvēlies komandu
            </option>
            {teamOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="flex gap-4 pb-2 text-sm text-club-navy">
          <legend className="sr-only">Nedēļa</legend>
          {weeks.map((week) => (
            <label key={week.monday} className="flex items-center gap-2">
              <input type="radio" name="week" checked={monday === week.monday} onChange={() => setMonday(week.monday)} />
              {week.label}
            </label>
          ))}
        </fieldset>
      </div>

      {team && (
        <>
          <textarea
            ref={textRef}
            value={text}
            onChange={(event) => setEdited({ source: generated, text: event.target.value })}
            rows={Math.max(6, text.split("\n").length + 1)}
            className="mt-6 w-full rounded-lg border border-slate-200 p-3 font-mono text-sm text-club-navy outline-none focus:border-club-red"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={copy}
              className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark"
            >
              Kopēt
            </button>
            {copyResult === "copied" && <span className="text-sm font-semibold text-emerald-700">Nokopēts.</span>}
            {copyResult === "failed" && (
              <span className="text-sm font-semibold text-club-red">Neizdevās nokopēt — teksts ir iezīmēts, nokopē to pats.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
