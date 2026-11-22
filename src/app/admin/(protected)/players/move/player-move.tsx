"use client";

import { useActionState, useState } from "react";

import { moveOutcome, type MoveMode, type MovePlayer, type MoveOutcome } from "@/lib/player-move";

import { movePlayers, type PlayerMoveState } from "../actions";

type TeamOption = { id: number; name: string };

const SELECT_CLASS = "mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red";

/** Adding or moving the ticked players of one team to another. Each row says what saving does to that player,
 *  including the goals a move loses, before anything is saved. */
export function PlayerMove({
  teamOptions,
  players,
  initialFromTeamId,
}: {
  teamOptions: TeamOption[];
  players: MovePlayer[];
  initialFromTeamId: number | null;
}) {
  const [fromTeamId, setFromTeamId] = useState(initialFromTeamId ? String(initialFromTeamId) : "");
  const [toTeamId, setToTeamId] = useState("");
  const [mode, setMode] = useState<MoveMode>("move");
  const [ticked, setTicked] = useState<Set<number>>(new Set());
  const [state, action, pending] = useActionState(async (previous: PlayerMoveState, formData: FormData) => {
    const result = await movePlayers(previous, formData);
    if (result?.saved) setTicked(new Set());
    return result;
  }, undefined);

  const teamName = (id: number | string) => teamOptions.find((team) => team.id === Number(id))?.name ?? "";
  const from = Number(fromTeamId);
  const to = Number(toTeamId);
  const sameTeam = fromTeamId !== "" && fromTeamId === toTeamId;
  const rows = players
    .filter((player) => player.teams.some((link) => link.teamId === from))
    .map((player) => ({ player, outcome: toTeamId && !sameTeam ? moveOutcome(player, from, to, mode) : null }));
  const selectable = rows.filter((row) => row.outcome?.status !== "none");
  const tickedRows = selectable.filter((row) => ticked.has(row.player.id));
  const lostGoals = tickedRows.reduce((sum, row) => sum + (row.outcome?.lostGoals ?? 0), 0);
  const allTicked = selectable.length > 0 && tickedRows.length === selectable.length;

  function changeFromTeam(value: string) {
    setFromTeamId(value);
    setTicked(new Set());
  }

  function toggle(playerId: number, checked: boolean) {
    setTicked((current) => {
      const next = new Set(current);
      if (checked) next.add(playerId);
      else next.delete(playerId);
      return next;
    });
  }

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const verb = mode === "move" ? "Pārcelt" : "Pievienot";
        const goals = lostGoals > 0 ? ` Tiks dzēsti ${lostGoals} vārti komandā ${teamName(fromTeamId)}.` : "";
        if (!window.confirm(`${verb} ${tickedRows.length} spēlētājus uz ${teamName(toTeamId)}?${goals}`)) event.preventDefault();
      }}
      className="max-w-3xl"
    >
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">Pārvietot spēlētājus</h1>

      <div className="flex flex-wrap gap-4">
        <label className="min-w-48 flex-1 text-sm font-semibold text-club-navy">
          No komandas
          <select name="fromTeamId" required value={fromTeamId} onChange={(event) => changeFromTeam(event.target.value)} className={SELECT_CLASS}>
            <option value="" disabled>
              Izvēlies komandu
            </option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-48 flex-1 text-sm font-semibold text-club-navy">
          Uz komandu
          <select name="toTeamId" required value={toTeamId} onChange={(event) => setToTeamId(event.target.value)} className={SELECT_CLASS}>
            <option value="" disabled>
              Izvēlies komandu
            </option>
            {teamOptions.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {sameTeam && <p className="mt-2 text-sm text-club-red">Komandām jābūt dažādām.</p>}

      <fieldset className="mt-4 flex flex-wrap gap-4 text-sm text-club-navy">
        <legend className="sr-only">Darbība</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" value="move" checked={mode === "move"} onChange={() => setMode("move")} />
          <span>
            <strong>Pārcelt</strong> — izņem no vecās komandas
          </span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="mode" value="add" checked={mode === "add"} onChange={() => setMode("add")} />
          <span>
            <strong>Pievienot</strong> — paliek arī vecajā komandā
          </span>
        </label>
      </fieldset>

      {fromTeamId && (
        <section className="mt-6">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">Šajā komandā nav spēlētāju.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl bg-white text-sm shadow-sm">
              <li>
                <label className="flex items-center gap-3 px-4 py-2 font-semibold text-club-navy">
                  <input
                    type="checkbox"
                    checked={allTicked}
                    disabled={selectable.length === 0}
                    onChange={(event) => setTicked(event.target.checked ? new Set(selectable.map((row) => row.player.id)) : new Set())}
                  />
                  Atzīmēt visus ({selectable.length})
                </label>
              </li>
              {rows.map(({ player, outcome }) => {
                const disabled = outcome?.status === "none";
                return (
                  <li key={player.id}>
                    <label className={`flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2 ${disabled ? "text-slate-400" : "text-club-navy"}`}>
                      <input
                        type="checkbox"
                        name="playerIds"
                        value={player.id}
                        disabled={disabled}
                        checked={!disabled && ticked.has(player.id)}
                        onChange={(event) => toggle(player.id, event.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0 flex-1 font-semibold sm:w-48 sm:flex-none">{player.name}</span>
                      <span className="w-12 shrink-0 text-slate-500">{player.birthdate.slice(6, 10)}</span>
                      <OutcomeText outcome={outcome} fromName={teamName(fromTeamId)} toName={teamName(toTeamId)} teamName={teamName} />
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}
      {state?.saved && (
        <p className="mt-3 text-sm font-semibold text-emerald-700">
          Saglabāts: {state.saved.changed} spēlētāji
          {state.saved.lostGoals > 0 && `, dzēsti ${state.saved.lostGoals} vārti`}.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || tickedRows.length === 0 || !toTeamId || sameTeam}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : `${mode === "move" ? "Pārcelt" : "Pievienot"} (${tickedRows.length})`}
      </button>
    </form>
  );
}

function OutcomeText({
  outcome,
  fromName,
  toName,
  teamName,
}: {
  outcome: MoveOutcome | null;
  fromName: string;
  toName: string;
  teamName: (id: number) => string;
}) {
  if (!outcome) return null;
  const others = outcome.otherTeamIds.map(teamName).filter(Boolean);
  const text = {
    add: `→ ${toName}`,
    move: `→ ${toName}, izņems no ${fromName}`,
    leave: `Jau ir ${toName} — tiks tikai izņemts no ${fromName}`,
    none: `Jau ir ${toName}`,
  }[outcome.status];
  return (
    <span className="basis-full pl-7 text-slate-500 sm:basis-auto sm:pl-0">
      {text}
      {others.length > 0 && <span className="ml-2 text-xs">Arī: {others.join(", ")}</span>}
      {outcome.lostGoals > 0 && (
        <span className="block text-xs font-semibold text-amber-700">
          ⚠️ {outcome.lostGoals} vārti ({fromName}) tiks dzēsti
        </span>
      )}
    </span>
  );
}
