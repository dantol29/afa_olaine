"use client";

import { useActionState, useMemo, useState } from "react";

import { CopyFormButton, CopyNotice, useFormCopy } from "@/components/admin/form-copy";
import { ClubSuggestionIcon, FormWithPreview } from "@/components/admin/form-preview";
import { SuggestInput } from "@/components/admin/suggest-input";
import { TimeSelect } from "@/components/admin/time-select";
import { VenueLoad } from "@/components/admin/venue-load";
import { MatchCard } from "@/components/match-card";
import { buildGamePreview, type ClubHint, type LeagueLogoHint } from "@/lib/admin-preview";
import { DEFAULT_DURATION_MINUTES, defaultEndTime } from "@/lib/admin-time";
import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";

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
/** Values used before, offered while typing, and what the card preview needs. */
export type GameFormHints = { clubs: ClubHint[]; locations: string[]; leagues: string[]; leagueLogos: LeagueLogoHint[] };

const DEFAULT_LOCATION = "Olaines pilsētas stadions";

function scoreText(score: number | null | undefined) {
  return score == null ? "" : String(score);
}

export function GameForm(
  props: { teamOptions: TeamOption[]; hints: GameFormHints } & (
    | { mode: "create"; copyOf?: GameFormValues }
    | { mode: "edit"; gameId: number; game: GameFormValues }
  ),
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
  const unsavedFormRef = useUnsavedChangesGuard(pending, state);
  const game = props.mode === "edit" ? props.game : props.copyOf ?? null;
  const [teamId, setTeamId] = useState(game ? String(game.teamId) : "");
  const [homeTeam, setHomeTeam] = useState(game?.homeTeam ?? "");
  const [awayTeam, setAwayTeam] = useState(game?.awayTeam ?? "");
  const [homeScore, setHomeScore] = useState(scoreText(game?.homeScore));
  const [awayScore, setAwayScore] = useState(scoreText(game?.awayScore));
  const [date, setDate] = useState(game?.date ?? "");
  const [startTime, setStartTime] = useState(game?.startTime ?? "");
  const [endTime, setEndTime] = useState(game?.endTime ?? "");
  const [location, setLocation] = useState(game?.location ?? DEFAULT_LOCATION);
  const [league, setLeague] = useState(game?.league ?? "");
  const clubs = useMemo(() => new Map(props.hints.clubs.map((club) => [club.name, club])), [props.hints.clubs]);
  const clubNames = useMemo(() => props.hints.clubs.map((club) => club.name), [props.hints.clubs]);
  const preview = buildGamePreview(
    { teamId: teamId ? Number(teamId) : null, homeTeam, awayTeam, homeScore, awayScore, date, startTime, location, league },
    clubs,
    props.hints.leagueLogos,
  );

  // A copy never carries the score.
  function startCopy() {
    copy.startCopy(() => {
      setHomeScore("");
      setAwayScore("");
    });
  }

  function changeStartTime(value: string) {
    setStartTime(value);
    if (!endTime) setEndTime(defaultEndTime(value, DEFAULT_DURATION_MINUTES.game));
  }

  const clubIcon = (name: string) => <ClubSuggestionIcon name={name} clubs={clubs} />;
  // Picking a suggestion fires no input event, so it marks the form as edited here.
  const edit = (set: (value: string) => void) => (value: string) => {
    copy.markDirty();
    set(value);
  };

  const form = (
    <form ref={unsavedFormRef} action={isCreate ? createAction : updateAction} onInput={copy.markDirty} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {isCreate ? `Jauna spēle${isCopy ? " (kopija)" : ""}` : "Rediģēt spēli"}
      </h1>
      {isCopy && <CopyNotice />}

      <label className="block text-sm font-semibold text-club-navy">
        Komanda
        <select
          name="teamId"
          required
          value={teamId}
          onChange={(event) => setTeamId(event.target.value)}
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
        <SuggestInput name="homeTeam" label="Mājinieki" required placeholder="AFA Olaine" value={homeTeam} onChange={edit(setHomeTeam)} options={clubNames} iconFor={clubIcon} className="min-w-0 flex-1" />
        <SuggestInput name="awayTeam" label="Viesi" required placeholder="FK Ventspils" value={awayTeam} onChange={edit(setAwayTeam)} options={clubNames} iconFor={clubIcon} className="min-w-0 flex-1" />
      </div>

      <div className="mt-4 flex gap-4">
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Mājinieku vārti
          <input
            type="number"
            name="homeScore"
            min="0"
            step="1"
            inputMode="numeric"
            value={homeScore}
            onChange={(event) => setHomeScore(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
          />
        </label>
        <label className="flex-1 text-sm font-semibold text-club-navy">
          Viesu vārti
          <input
            type="number"
            name="awayScore"
            min="0"
            step="1"
            inputMode="numeric"
            value={awayScore}
            onChange={(event) => setAwayScore(event.target.value)}
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
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <div className="mt-4 flex gap-4">
        <TimeSelect name="startTime" label="Sākuma laiks" value={startTime} onChange={changeStartTime} />
        <TimeSelect name="endTime" label="Beigu laiks" value={endTime} onChange={setEndTime} />
      </div>

      <SuggestInput name="location" label="Vieta" required value={location} onChange={edit(setLocation)} options={props.hints.locations} className="mt-4" />
      <VenueLoad
        planned={{ kind: "game", location, date, startTime, endTime }}
        excludeKey={props.mode === "edit" && !copy.isCopy ? `game-${props.gameId}` : undefined}
      />

      <SuggestInput name="league" label="Sacensības (nav obligāts)" placeholder="Draudzības spēle" value={league} onChange={edit(setLeague)} options={props.hints.leagues} className="mt-4" />

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
      {!isCreate && <CopyFormButton onClick={startCopy} />}
    </form>
  );

  return (
    <FormWithPreview
      form={form}
      preview={<MatchCard game={preview.game} homeBorderStripe={preview.homeBorderStripe} awayBorderStripe={preview.awayBorderStripe} compact />}
    />
  );
}
