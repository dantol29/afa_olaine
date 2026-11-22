"use client";

import { useActionState } from "react";

import { useUnsavedChangesGuard } from "@/components/admin/unsaved-changes";

import { saveGameScore, type GameScoreState } from "./games/actions";

const SCORE_INPUT_CLASS = "w-12 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm text-club-navy outline-none focus:border-club-red";

/** Two score fields and "Saglabāt" in a row of "Spēles bez rezultāta"; once saved, the game leaves the list. */
export function ScoreForm({ gameId }: { gameId: number }) {
  const [state, action, pending] = useActionState<GameScoreState, FormData>(saveGameScore.bind(null, gameId), undefined);
  const formRef = useUnsavedChangesGuard(pending, state);

  return (
    <form ref={formRef} action={action} className="flex shrink-0 flex-wrap items-center gap-2">
      <input name="homeScore" type="number" min={0} step={1} required inputMode="numeric" aria-label="Mājinieki" className={SCORE_INPUT_CLASS} />
      <span className="text-slate-400">:</span>
      <input name="awayScore" type="number" min={0} step={1} required inputMode="numeric" aria-label="Viesi" className={SCORE_INPUT_CLASS} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-club-red px-3 py-1 text-sm font-semibold text-white transition hover:bg-club-red-dark disabled:opacity-50"
      >
        {pending ? "Saglabā..." : "Saglabāt"}
      </button>
      {state?.error && <p className="basis-full text-xs font-semibold text-club-red">{state.error}</p>}
    </form>
  );
}
