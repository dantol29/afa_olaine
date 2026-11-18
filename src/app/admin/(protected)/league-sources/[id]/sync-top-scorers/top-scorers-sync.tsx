"use client";

import { useActionState } from "react";

import { syncTopScorers } from "./actions";

export function TopScorersSync({ sourceId }: { sourceId: number }) {
  const [result, formAction, pending] = useActionState(syncTopScorers, undefined);

  return (
    <div>
      <form action={formAction} className="mb-6">
        <input type="hidden" name="sourceId" value={sourceId} />
        <p className="mb-3 text-sm text-slate-500">
          Ielādē LFF vārtu guvēju sarakstu un atjaunina AFA Olaine spēlētāju vārtu skaitu šīs komandas sastāvā.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? "Sinhronizē…" : "Sinhronizēt"}
        </button>
      </form>

      {result?.error ? (
        <div className="rounded-xl border border-club-red/20 bg-club-red/5 p-4 text-sm text-club-red">
          <p>
            Neizdevās ielādēt vārtu guvējus no šī URL. Pārliecinies, ka tas ir derīgs LFF
            sacensību URL — atver savu sacensību lapu lff.lv un atver &quot;Vārtu guvēji&quot;
            cilni, tad kopē šo URL.
          </p>
          <p className="mt-3 font-mono text-xs break-all text-club-red/70">{result.error}</p>
        </div>
      ) : result && result.details.length === 0 ? (
        <p className="text-sm text-slate-400">
          URL ielādējās, bet sarakstā neizdevās atrast nevienu AFA Olaine spēlētāju. Pārbaudi, vai
          URL norāda uz &quot;Vārtu guvēji&quot; cilni.
        </p>
      ) : result ? (
        <>
          <p className="mb-6 text-sm text-slate-500">
            Atrasti {result.details.length} AFA Olaine spēlētāji LFF sarakstā, atjaunināti{" "}
            {result.updated}.
          </p>
          <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400">
                <th className="p-4 font-semibold">Spēlētājs</th>
                <th className="p-4 font-semibold">Klubs (LFF)</th>
                <th className="p-4 font-semibold">Vārti (LFF)</th>
                <th className="p-4 font-semibold">Statuss</th>
              </tr>
            </thead>
            <tbody>
              {result.details.map((detail) => (
                <tr key={detail.name} className="border-b border-slate-100 last:border-0">
                  <td className="p-4 font-semibold text-club-navy">{detail.name}</td>
                  <td className="p-4 text-slate-500">{detail.club}</td>
                  <td className="p-4 text-slate-500">{detail.goals}</td>
                  <td className="p-4">
                    {detail.matchedPlayerId === null ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        Nav atrasts komandā
                      </span>
                    ) : detail.previousGoals === detail.goals ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        Bez izmaiņām
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Atjaunināts ({detail.previousGoals} → {detail.goals})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
}
