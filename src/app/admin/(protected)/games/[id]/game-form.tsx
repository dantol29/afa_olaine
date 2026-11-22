"use client";

import { useActionState, useState } from "react";

import { CopyFormButton, CopyNotice, useFormCopy } from "@/components/admin/form-copy";
import { TimeSelect } from "@/components/admin/time-select";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";

import { createGame, updateGame } from "../actions";

export type GameFormValues = {
  teamId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  league: string | null;
  notes: string | null;
};
type TeamOption = { id: number; name: string };

export function GameForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[]; copyOf?: GameFormValues }
    | { mode: "edit"; gameId: number; game: GameFormValues; teamOptions: TeamOption[] },
) {
  const copy = useFormCopy();
  // Both actions are set up so an edit form can turn into a copy (a create) without losing what is typed.
  const [createState, createAction, createPending] = useActionState(createGame, undefined);
  const [updateState, updateAction, updatePending] = useActionState(
    props.mode === "edit" ? updateGame.bind(null, props.gameId) : createGame,
    undefined,
  );
  const isCreate = props.mode === "create" || copy.isCopy;
  const isCopy = copy.isCopy || (props.mode === "create" && props.copyOf !== undefined);
  const state = isCreate ? createState : updateState;
  const pending = isCreate ? createPending : updatePending;
  const game = props.mode === "edit" ? props.game : props.copyOf ?? null;
  const [startTime, setStartTime] = useState(game?.startTime ?? "");
  const [endTime, setEndTime] = useState(game?.endTime ?? "");

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.game));
  }

  return (
    <form action={isCreate ? createAction : updateAction} onInput={copy.markDirty} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {isCreate ? `Jauna spēle${isCopy ? " (kopija)" : ""}` : "Rediģēt spēli"}
      </h1>
      {isCopy && <CopyNotice />}

      <label className="block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          defaultValue={game?.teamId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        >
          <option value="" disabled>
            Izvēlies komandu
          </option>
          {props.teamOptions.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Mājinieki
          <input
            type="text"
            name="homeTeam"
            required
            placeholder="AFA Olaine"
            defaultValue={game?.homeTeam ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Viesi
          <input
            type="text"
            name="awayTeam"
            required
            placeholder="FK Ventspils"
            defaultValue={game?.awayTeam ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Mājinieku vārti
          <input
            type="number"
            name="homeScore"
            // A copy never carries the score; remounting clears what the edit form showed.
            key={isCopy ? "copy" : "original"}
            min="0"
            step="1"
            inputMode="numeric"
            defaultValue={isCopy ? "" : game?.homeScore ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Viesu vārti
          <input
            type="number"
            name="awayScore"
            key={isCopy ? "copy" : "original"}
            min="0"
            step="1"
            inputMode="numeric"
            defaultValue={isCopy ? "" : game?.awayScore ?? ""}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Datums
        <input
          type="date"
          name="date"
          required
          defaultValue={game?.date ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <TimeSelect name="startTime" label="Sākuma laiks" value={startTime} onChange={changeStartTime} />
        <TimeSelect name="endTime" label="Beigu laiks" value={endTime} onChange={setEndTime} />
      </div>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Vieta
        <input
          type="text"
          name="location"
          required
          defaultValue={game?.location ?? "Olaines pilsētas stadions"}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Sacensības (nav obligāts)
        <input
          type="text"
          name="league"
          placeholder="Draudzības spēle"
          defaultValue={game?.league ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Piezīmes (nav obligāts)
        <textarea
          name="notes"
          rows={3}
          defaultValue={game?.notes ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
      {!isCreate && <CopyFormButton onClick={copy.startCopy} />}
    </form>
  );
}
