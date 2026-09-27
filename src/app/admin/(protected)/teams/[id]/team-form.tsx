"use client";

import { useActionState } from "react";

import { createTeam, updateTeam } from "../actions";

type Team = { id: number; name: string; groupPhotoUrl: string | null };

export function TeamForm(props: { mode: "create" } | { mode: "edit"; team: Team }) {
  const action = props.mode === "create" ? createTeam : updateTeam.bind(null, props.team.id);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-md">
      <h1 className="mb-6 text-2xl font-extrabold text-club-navy">
        {props.mode === "create" ? "Jauna komanda" : "Rediģēt komandu"}
      </h1>

      <label className="block text-sm font-semibold text-club-navy">
        Nosaukums
        <input
          type="text"
          name="name"
          required
          defaultValue={props.mode === "edit" ? props.team.name : ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-club-navy outline-none focus:border-club-red"
        />
      </label>

      <label className="mt-5 block text-sm font-semibold text-club-navy">
        Komandas kopbilde (JPEG, PNG vai WebP, līdz 5 MB)
        <input type="file" name="groupPhoto" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" />
      </label>
      {props.mode === "edit" && props.team.groupPhotoUrl && (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={props.team.groupPhotoUrl} alt={`${props.team.name} pašreizējā kopbilde`} className="aspect-video w-full object-cover" />
          <label className="mt-2 flex items-center gap-2 text-sm text-club-navy"><input type="checkbox" name="removeGroupPhoto" /> Noņemt kopbildi</label>
        </div>
      )}

      {state?.error && <p className="mt-3 text-sm font-semibold text-club-red">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
    </form>
  );
}
