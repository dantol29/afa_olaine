"use client";

import { ArrowDown, ArrowUp, Pencil } from "lucide-react";
import { AdminLink } from "@/components/admin/admin-link";
import { useEffect, useState, useTransition } from "react";

import { AdminSearch } from "@/components/admin/admin-search";
import { DeleteButton } from "@/components/admin/delete-button";

import { deleteTeam, saveTeamOrder } from "./actions";

type TeamRow = { id: number; name: string; isMain: boolean };
type MoveDirection = "up" | "down";

const MOVE_OFFSET: Record<MoveDirection, number> = { up: -1, down: 1 };

/** Returns a copy with the item at `index` moved one place up or down; out-of-range moves return the list as is. */
function moveTeam(teams: readonly TeamRow[], index: number, direction: MoveDirection): TeamRow[] {
  const target = index + MOVE_OFFSET[direction];
  if (target < 0 || target >= teams.length) return [...teams];
  const next = [...teams];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** The team list in display order, with a sorting mode: arrows move teams locally and one save sends the whole order. */
export function TeamsTable({ teams }: { teams: TeamRow[] }) {
  // null while not sorting; otherwise the unsaved order shown in the table.
  const [draft, setDraft] = useState<TeamRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  // Moving a row re-inserts its DOM node, which can drop focus; the moved arrow gets it back.
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const isSorting = draft !== null;
  const rows = draft ?? teams;

  useEffect(() => {
    if (!focusTarget) return;
    document.querySelector<HTMLButtonElement>(`[data-move-button="${focusTarget}"]`)?.focus();
  }, [focusTarget, draft]);

  function startSorting() {
    setError(null);
    setDraft([...teams]);
  }

  function cancelSorting() {
    setError(null);
    setFocusTarget(null);
    setDraft(null);
  }

  function move(index: number, direction: MoveDirection) {
    if (!draft) return;
    const team = draft[index];
    const next = moveTeam(draft, index, direction);
    const newIndex = next.indexOf(team);
    // At the first or last place the arrow in this direction is disabled, so keep focus on the other one.
    const focusDirection = newIndex === 0 ? "down" : newIndex === next.length - 1 ? "up" : direction;
    setFocusTarget(`${team.id}:${focusDirection}`);
    setDraft(next);
  }

  function save() {
    if (!draft) return;
    const teamIds = draft.map((team) => team.id);
    startSaving(async () => {
      const result = await saveTeamOrder(teamIds);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFocusTarget(null);
      setDraft(null);
    });
  }

  return (
    <div>
      {isSorting ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-club-gray-light px-4 py-3">
          <p className="text-sm text-club-navy">
            Pārvietojiet komandas ar bultiņām un saglabājiet. Šī secība tiek rādīta akadēmijā un komandu filtros.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelSorting}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-club-navy hover:bg-slate-50 disabled:opacity-50"
            >
              Atcelt
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark disabled:opacity-50"
            >
              {isSaving ? "Saglabā…" : "Saglabāt secību"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <AdminSearch placeholder="Meklēt komandas…" />
          </div>
          {teams.length > 1 && (
            <button
              type="button"
              onClick={startSorting}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-club-navy shadow-sm hover:bg-slate-50"
            >
              Mainīt secību
            </button>
          )}
        </div>
      )}
      {error && <p role="alert" className="mb-4 text-sm font-semibold text-club-red">{error}</p>}

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4" />
          </tr>
        </thead>
        <tbody>
          {rows.map((team, index) => (
            <tr
              // While sorting, rows ignore the search box (it is hidden) and a filter left from before is cleared.
              data-admin-search-item={isSorting ? undefined : team.name}
              hidden={isSorting ? false : undefined}
              key={team.id}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="p-4 font-semibold text-club-navy">
                {isSorting && <span className="mr-3 inline-block w-6 text-right tabular-nums text-slate-400">{index + 1}.</span>}
                {team.name}
                {team.isMain && <span className="mt-1 block text-xs font-semibold text-club-red">Galvenā komanda</span>}
              </td>
              <td className="p-4 text-right">
                {isSorting ? (
                  <div className="flex items-center justify-end gap-2">
                    {(["up", "down"] as const).map((direction) => {
                      const isEdge = direction === "up" ? index === 0 : index === rows.length - 1;
                      const Icon = direction === "up" ? ArrowUp : ArrowDown;
                      return (
                        <button
                          key={direction}
                          type="button"
                          data-move-button={`${team.id}:${direction}`}
                          onClick={() => move(index, direction)}
                          disabled={isEdge || isSaving}
                          aria-label={`Pārvietot "${team.name}" ${direction === "up" ? "uz augšu" : "uz leju"}`}
                          title={direction === "up" ? "Uz augšu" : "Uz leju"}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-club-navy transition hover:bg-club-gray-light disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Icon className="h-4 w-4" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-4">
                    <AdminLink
                      href={`/admin/teams/${team.id}`}
                      aria-label={`Rediģēt komandu "${team.name}"`}
                      title="Rediģēt"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                    >
                      <Pencil className="h-4 w-4" />
                    </AdminLink>
                    <DeleteButton
                      action={deleteTeam.bind(null, team.id)}
                      confirmMessage={`Dzēst komandu "${team.name}"? Tiks dzēsti arī tās spēlētāji, treniņi, notikumi un spēles.`}
                    />
                  </div>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={2} className="p-4 text-center text-slate-400">
                Vēl nav neviena komanda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
