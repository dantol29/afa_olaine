"use client";

import Image from "next/image";
import { useActionState, useLayoutEffect, useRef, useState } from "react";

import { parseBirthdate, replaceDateSeparators } from "@/lib/birthdate";

import { createPlayer, updatePlayer } from "../actions";

type Player = {
  id: number;
  name: string;
  birthdate: string;
  photoUrl: string | null;
  number: number | null;
  position: string | null;
  playerTeams: { teamId: number; goals: number }[];
};
type TeamOption = { id: number; name: string };

export function PlayerForm(
  props:
    | { mode: "create"; teamOptions: TeamOption[] }
    | { mode: "edit"; player: Player; teamOptions: TeamOption[] },
) {
  const action = props.mode === "create" ? createPlayer : updatePlayer.bind(null, props.player.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const player = props.mode === "edit" ? props.player : null;
  const selectedTeamIds = new Set(player?.playerTeams.map((pt) => pt.teamId) ?? []);

  const [birthdate, setBirthdate] = useState(player?.birthdate ?? "");
  // An existing player shows its error at once, so the admin sees why Save is disabled.
  const [birthdateTouched, setBirthdateTouched] = useState(player !== null);
  const birthdateInput = useRef<HTMLInputElement>(null);
  const birthdateCaret = useRef<number | null>(null);
  const birthdateResult = parseBirthdate(birthdate);
  const showBirthdateError = !birthdateResult.ok && birthdate !== "" && (birthdateTouched || birthdate.length >= 10);

  // Replacing a character makes the browser move the caret to the end, so put it back.
  useLayoutEffect(() => {
    if (birthdateCaret.current !== null) {
      birthdateInput.current?.setSelectionRange(birthdateCaret.current, birthdateCaret.current);
      birthdateCaret.current = null;
    }
  }, [birthdate]);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauns spēlētājs" : "Rediģēt spēlētāju"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Vārds, uzvārds
        <input
          type="text"
          name="name"
          required
          defaultValue={player?.name ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Dzimšanas datums (DD.MM.GGGG.)
        <input
          ref={birthdateInput}
          type="text"
          name="birthdate"
          inputMode="numeric"
          maxLength={12}
          placeholder="12.04.1998."
          required
          value={birthdate}
          onChange={(event) => {
            birthdateCaret.current = event.target.selectionStart;
            setBirthdate(replaceDateSeparators(event.target.value));
          }}
          onBlur={() => {
            setBirthdateTouched(true);
            if (birthdateResult.ok) setBirthdate(birthdateResult.value);
          }}
          aria-invalid={showBirthdateError}
          className={`mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red ${showBirthdateError ? "border-club-red" : "border-slate-200"}`}
        />
        {showBirthdateError && !birthdateResult.ok && (
          <span className="mt-1 block text-xs font-semibold text-club-red">{birthdateResult.error}</span>
        )}
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Numurs (nav obligāts)
        <input
          type="number"
          name="number"
          min={0}
          step={1}
          defaultValue={player?.number ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-4 block text-sm font-semibold text-club-navy">
        Pozīcija (nav obligāta)
        <input
          type="text"
          name="position"
          placeholder="Piem., Aizsargs"
          defaultValue={player?.position ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-club-navy">Komandas un gūtie vārti</legend>
        <p className="mt-1 text-xs text-slate-400">
          Gūtie vārti tiek uzskaitīti atsevišķi katrai komandai/līgai — spēlētājs, kurš spēlē
          vairākās komandās, var tajās būt guvis atšķirīgu vārtu skaitu.
        </p>
        <div className="mt-1.5 flex flex-col gap-2">
          {props.teamOptions.map((team) => {
            const existingGoals = player?.playerTeams.find((pt) => pt.teamId === team.id)?.goals ?? 0;
            return (
              <div key={team.id} className="flex items-center gap-3">
                <label className="flex flex-1 items-center gap-2 text-sm text-club-navy">
                  <input
                    type="checkbox"
                    name="teamIds"
                    value={team.id}
                    defaultChecked={selectedTeamIds.has(team.id)}
                  />
                  {team.name}
                </label>
                <input
                  type="number"
                  name={`goals-${team.id}`}
                  min={0}
                  step={1}
                  placeholder="Vārti"
                  defaultValue={existingGoals}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm text-club-navy outline-none focus:border-club-red"
                />
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4">
        <span className="block text-sm font-semibold text-club-navy">Foto (nav obligāts)</span>
        {player?.photoUrl && (
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={80}
            height={80}
            className="mt-1.5 h-20 w-20 rounded-lg object-cover"
          />
        )}
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="mt-1.5 block w-full text-sm text-club-navy file:mr-3 file:rounded-lg file:border-0 file:bg-club-gray-light file:px-3 file:py-2 file:text-sm file:font-semibold file:text-club-navy hover:file:bg-slate-200"
        />
        {player?.photoUrl && (
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy">
            <input type="checkbox" name="removePhoto" />
            Noņemt foto
          </label>
        )}
      </div>

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !birthdateResult.ok}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
    </form>
  );
}
