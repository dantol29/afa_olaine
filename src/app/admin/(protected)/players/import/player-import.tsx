"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { parseBirthdate } from "@/lib/birthdate";
import type { ExistingPlayer } from "@/lib/player-import";
import {
  buildImportRows,
  differsFromStored,
  importPayload,
  retarget,
  rowProblem,
  teamFromHint,
  type ImportField,
  type ImportRow,
  type ImportTarget,
} from "@/lib/player-import-rows";
import { positionOptions } from "@/lib/player-positions";
import { cn } from "@/lib/utils";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";

import { savePlayerImport, type PlayerImportState } from "../actions";

type TeamOption = { id: number; name: string };

const INPUT_CLASS = "w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-club-navy outline-none focus:border-club-red";
const FIELD_LABELS: Record<ImportField, string> = { name: "Vārds, uzvārds", birthdate: "Dzimšanas datums", number: "Nr", position: "Pozīcija" };
const FIELD_WIDTHS: Record<ImportField, string> = { name: "min-w-60", birthdate: "w-40", number: "w-24", position: "w-44" };
const PLACEHOLDER = `Ielīmē sarakstu, piemēram:
U12
Anna Ozola — 04.04.2015
Pēteris Liepa Nr 7`;

function storedText(field: ImportField, player: ExistingPlayer): string {
  const value = { name: player.name, birthdate: player.birthdate, number: player.number?.toString() ?? "", position: player.position ?? "" }[field];
  return value || "—";
}

function playerLabel(player: ExistingPlayer, teams: readonly TeamOption[]) {
  const teamNames = player.teamIds.map((id) => teams.find((team) => team.id === id)?.name).filter(Boolean).join(", ");
  return `${player.name}, ${player.birthdate}${teamNames ? ` (${teamNames})` : ""}`;
}

function FieldInput({ field, value, onChange, label }: { field: ImportField; value: string; onChange: (value: string) => void; label: string }) {
  if (field === "position") {
    return (
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={INPUT_CLASS}>
        <option value="">—</option>
        {positionOptions(value).map((position) => (
          <option key={position} value={position}>{position}</option>
        ))}
      </select>
    );
  }
  const isBadDate = field === "birthdate" && value.trim() !== "" && !parseBirthdate(value).ok;
  return (
    <input
      type="text"
      aria-label={label}
      aria-invalid={isBadDate}
      inputMode={field === "name" ? "text" : "numeric"}
      placeholder={field === "birthdate" ? "DD.MM.GGGG." : undefined}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(INPUT_CLASS, isBadDate && "border-club-red")}
    />
  );
}

function statusOf(row: ImportRow): { icon: string; text: string } {
  if (row.target === null) return { icon: "⚠️", text: "Vairāki ar šo vārdu" };
  if (row.target === "new") return rowProblem({ ...row, include: true }) ? { icon: "❌", text: "Trūkst datu" } : { icon: "✅", text: "Jauns" };
  return row.include ? { icon: "🔁", text: "Ir bāzē" } : { icon: "⚪", text: "Nav izmaiņu" };
}

/** Roster import: paste, check every person against the players on file, adjust, save in one go. */
export function PlayerImport({ teamOptions, players }: { teamOptions: TeamOption[]; players: ExistingPlayer[] }) {
  const [text, setText] = useState("");
  const [teamId, setTeamId] = useState("");
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [state, formAction, pending] = useActionState(async (previous: PlayerImportState, formData: FormData) => {
    const result = await savePlayerImport(previous, formData);
    if (result?.saved) {
      setRows(null);
      setText("");
    }
    return result;
  }, undefined);
  // The pasted text sits outside the table's form, and checked rows are work too, so either counts as unsaved.
  useUnsavedChangesGuard(pending, state, text.trim() !== "" || rows !== null);

  const chosenTeamId = teamId ? Number(teamId) : null;
  const payload = rows ? importPayload(rows, players) : [];
  const problems = rows?.filter((row) => rowProblem(row) !== null).length ?? 0;
  const newCount = payload.filter((row) => row.kind === "new").length;
  const changeCount = payload.length - newCount;

  function check() {
    // A heading such as "U12" picks the team when none is chosen yet.
    const hintedTeam = chosenTeamId ?? teamFromHint(text, teamOptions);
    if (hintedTeam !== null) setTeamId(String(hintedTeam));
    setRows(buildImportRows(text, players, hintedTeam));
  }

  function changeTeam(value: string) {
    setTeamId(value);
    // Matching a surname and joining the team depend on the team, so the check runs again.
    if (rows) setRows(buildImportRows(text, players, value ? Number(value) : null));
  }

  function updateRow(key: string, change: (row: ImportRow) => ImportRow) {
    setRows((current) => current?.map((row) => (row.key === key ? change(row) : row)) ?? null);
  }

  function changeValue(row: ImportRow, field: ImportField, value: string) {
    updateRow(row.key, (current) => {
      const next = { ...current, values: { ...current.values, [field]: value } };
      const player = typeof current.target === "number" ? players.find((item) => item.id === current.target) : undefined;
      // Editing a field of a player on file means the admin wants it saved.
      if (player) next.apply = { ...current.apply, [field]: differsFromStored(field, value, player) };
      if (current.target === "new" && !current.include && rowProblem({ ...next, include: true }) === null) next.include = true;
      return next;
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-extrabold text-club-navy">Importēt spēlētājus</h1>
        <Link href="/admin/players" className="text-sm font-semibold text-slate-500 hover:underline">Atpakaļ</Link>
      </div>

      <div className="max-w-2xl">
        <label className="block text-sm font-semibold text-club-navy">
          Komanda
          <select value={teamId} onChange={(event) => changeTeam(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red">
            <option value="">Izvēlies komandu</option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-semibold text-club-navy">
          Saraksts
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={10}
            placeholder={PLACEHOLDER}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <p className="mt-1 text-xs text-slate-400">
          Var ielīmēt vairākus sarakstus kopā: viena cilvēka rindas tiek apvienotas. Virsraksti kā «AIZSARGI» nosaka pozīciju.
        </p>

        <button type="button" onClick={check} disabled={!text.trim()} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-club-navy transition hover:bg-club-gray-light disabled:opacity-50">
          Pārbaudīt
        </button>
      </div>

      {state?.saved && !rows && (
        <p className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          Saglabāts: {state.saved.created} jauni, {state.saved.updated} atjaunināti.
        </p>
      )}

      {rows && (
        <form action={formAction} className="mt-8">
          <input type="hidden" name="teamId" value={teamId} />
          <input type="hidden" name="rows" value={JSON.stringify(payload)} />

          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">Sarakstā neatradu nevienu vārdu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] bg-white text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="p-3 font-semibold">Saglabāt</th>
                    <th className="w-64 p-3 font-semibold">Statuss</th>
                    {(["name", "birthdate", "number", "position"] as const).map((field) => (
                      <th key={field} className="p-3 font-semibold">{FIELD_LABELS[field]}</th>
                    ))}
                    <th className="p-3 font-semibold">Komanda</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <ImportTableRow
                      key={row.key}
                      row={row}
                      players={players}
                      teams={teamOptions}
                      team={teamOptions.find((team) => team.id === chosenTeamId) ?? null}
                      onInclude={(include) => updateRow(row.key, (current) => ({ ...current, include }))}
                      onTarget={(target) => updateRow(row.key, (current) => retarget(current, target, players, chosenTeamId))}
                      onValue={(field, value) => changeValue(row, field, value)}
                      onApply={(field, apply) => updateRow(row.key, (current) => ({ ...current, apply: { ...current.apply, [field]: apply } }))}
                      onAddToTeam={(addToTeam) => updateRow(row.key, (current) => ({ ...current, addToTeam }))}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!chosenTeamId && <p className="mt-4 text-sm font-semibold text-club-red">Izvēlies komandu.</p>}
          {problems > 0 && <p className="mt-4 text-sm font-semibold text-club-red">Atzīmētajās rindās trūkst datu: {problems}. Papildini tos vai noņem atzīmi.</p>}
          {state?.error && <p className="mt-4 text-sm font-semibold text-club-red">{state.error}</p>}

          <button
            type="submit"
            disabled={pending || !chosenTeamId || problems > 0 || payload.length === 0}
            className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
          >
            {pending ? "Saglabā..." : `Saglabāt (${newCount} jauni, ${changeCount} izmaiņas)`}
          </button>
        </form>
      )}
    </div>
  );
}

function ImportTableRow({
  row,
  players,
  teams,
  team,
  onInclude,
  onTarget,
  onValue,
  onApply,
  onAddToTeam,
}: {
  row: ImportRow;
  players: ExistingPlayer[];
  teams: TeamOption[];
  team: TeamOption | null;
  onInclude: (include: boolean) => void;
  onTarget: (target: ImportTarget) => void;
  onValue: (field: ImportField, value: string) => void;
  onApply: (field: ImportField, apply: boolean) => void;
  onAddToTeam: (addToTeam: boolean) => void;
}) {
  const player = typeof row.target === "number" ? players.find((item) => item.id === row.target) : undefined;
  const status = statusOf(row);
  const problem = rowProblem(row);
  const label = (field: ImportField) => `${FIELD_LABELS[field]}: ${row.values.name || row.key}`;
  const candidates = row.candidates.map((id) => players.find((item) => item.id === id)).filter((item) => item !== undefined);

  return (
    <tr className={cn("border-b border-slate-100 align-top", !row.include && "opacity-60")}>
      <td className="p-3">
        <input type="checkbox" aria-label={`Saglabāt: ${row.values.name}`} checked={row.include} onChange={(event) => onInclude(event.target.checked)} />
      </td>
      <td className="p-3">
        <span className="whitespace-nowrap">{status.icon} {status.text}</span>
        {/* The choice shows only when the name fits several players on file; a single match needs no picking. */}
        {(candidates.length > 1 || row.target === null) && (
          <select
            aria-label={`Kurš spēlētājs: ${row.values.name}`}
            value={row.target === null ? "" : String(row.target)}
            onChange={(event) => onTarget(event.target.value === "new" ? "new" : event.target.value === "" ? null : Number(event.target.value))}
            className={cn(INPUT_CLASS, "mt-2 min-w-48")}
          >
            <option value="" disabled>Izvēlies…</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>{playerLabel(candidate, teams)}</option>
            ))}
            <option value="new">Jauns spēlētājs</option>
          </select>
        )}
        {problem && <span className="mt-1 block text-xs font-semibold text-club-red">{problem}</span>}
        {row.note && <span className="mt-1 block text-xs text-amber-700">{row.note}</span>}
        <span className="mt-2 block text-xs text-slate-400">
          {row.sourceLines.map((line, index) => (
            <span key={index} className="block truncate" title={line}>{line}</span>
          ))}
        </span>
      </td>
      {(["name", "birthdate", "number", "position"] as const).map((field) => (
        <td key={field} className={cn("p-3", FIELD_WIDTHS[field])}>
          <div className="flex items-center gap-2">
            {player && (
              <input type="checkbox" aria-label={`Mainīt ${FIELD_LABELS[field]}: ${player.name}`} checked={row.apply[field]} onChange={(event) => onApply(field, event.target.checked)} />
            )}
            <FieldInput field={field} value={row.values[field]} onChange={(value) => onValue(field, value)} label={label(field)} />
          </div>
          {player && <span className="mt-1 block text-xs text-slate-400">Bāzē: {storedText(field, player)}</span>}
          {row.variants[field].length > 0 && (
            <span className="mt-1 flex flex-wrap gap-1 text-xs">
              {row.variants[field].map((variant) => (
                <button key={variant} type="button" onClick={() => onValue(field, variant)} className={cn("rounded border border-slate-200 px-1.5 py-0.5", variant === row.values[field] && "border-club-red text-club-red")}>
                  {variant}
                </button>
              ))}
            </span>
          )}
        </td>
      ))}
      <td className="p-3">
        {!player ? (
          <span className="whitespace-nowrap text-slate-500">{team?.name ?? "—"}</span>
        ) : team && player.teamIds.includes(team.id) ? (
          <span className="whitespace-nowrap text-slate-500">Jau komandā</span>
        ) : (
          <label className="flex items-center gap-2 whitespace-nowrap">
            <input type="checkbox" checked={row.addToTeam} disabled={!team} onChange={(event) => onAddToTeam(event.target.checked)} />
            Pievienot {team?.name ?? ""}
          </label>
        )}
      </td>
    </tr>
  );
}
