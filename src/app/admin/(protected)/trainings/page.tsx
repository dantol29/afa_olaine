import { Pencil } from "lucide-react";
import { AdminLink } from "@/components/admin/admin-link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminScheduleRows } from "@/components/admin/admin-schedule-rows";
import { CopyRowLink } from "@/components/admin/form-copy";
import { copyHref } from "@/lib/admin-copy";
import { SHOW_ALL_PAST_PARAM, isShowAllPast, splitAdminSchedule } from "@/lib/admin-schedule-list";
import { toDateKey } from "@/lib/calendar";
import { firstSearchParam, type SearchParamValue } from "@/lib/url-state";
import { AdminSearch } from "@/components/admin/admin-search";
import { db } from "@/db/client";
import { compareLatvian, uniqueSortedLabels } from "@/lib/ordering";

import { deleteTraining } from "./actions";
import { formatDate, formatFullDate } from "@/lib/date-display";

const teamNames = (training: { trainingTeams: { team: { name: string } | null }[] }) =>
  uniqueSortedLabels(training.trainingTeams.map(({ team }) => team?.name)).join(", ");

// Not de-duplicated: two coaches may share a name.
const coachNames = (training: { trainingCoaches: { coach: { name: string } | null }[] }) =>
  training.trainingCoaches.flatMap(({ coach }) => (coach ? [coach.name] : [])).sort(compareLatvian);

export default async function AdminTrainingsPage({ searchParams }: { searchParams: Promise<Record<string, SearchParamValue>> }) {
  const query = await searchParams;
  const rows = await db.query.trainings.findMany({
    with: { trainingTeams: { with: { team: true } }, trainingCoaches: { with: { coach: true } } },
  });
  const { upcoming, past, hiddenPastCount } = splitAdminSchedule(
    rows,
    toDateKey(new Date()),
    isShowAllPast(firstSearchParam(query[SHOW_ALL_PAST_PARAM])),
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-club-navy">Treniņi</h1>
        <div className="flex flex-wrap items-center gap-2">
          <AdminLink
            href="/admin/trainings/week"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-club-navy hover:border-club-red"
          >
            Nedēļas teksts
          </AdminLink>
          <AdminLink
            href="/admin/trainings/schedule"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-club-navy hover:border-club-red"
          >
            Pēc grafika
          </AdminLink>
          <AdminLink
            href="/admin/trainings/new"
            className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
          >
            + Pievienot
          </AdminLink>
        </div>
      </div>
      <AdminSearch placeholder="Meklēt treniņus…" />

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4 font-semibold">Treneri</th>
            <th className="p-4 font-semibold">Vieta</th>
            <th className="p-4" />
          </tr>
        </thead>
        <AdminScheduleRows
          upcoming={upcoming}
          past={past}
          hiddenPastCount={hiddenPastCount}
          columnCount={6}
          basePath="/admin/trainings"
          emptyText="Vēl nav neviena treniņa."
          renderRow={(training) => (
            <tr data-admin-search-item={`${training.date} ${formatFullDate(training.date)} ${training.startTime} ${teamNames(training)} ${coachNames(training).join(" ")} ${training.location}`} key={training.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-club-navy">{formatDate(training.date)}</td>
              <td className="p-4 text-slate-500">
                {training.startTime}–{training.endTime}
              </td>
              <td className="p-4 font-semibold text-club-navy">{teamNames(training) || "—"}</td>
              <td className="p-4 text-slate-500">
                {coachNames(training).join(", ") || "—"}
              </td>
              <td className="p-4 text-slate-500">{training.location}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <CopyRowLink href={copyHref("trainings", training.id)} label={`Kopēt treniņu ${formatDate(training.date)}`} />
                  <AdminLink
                    href={`/admin/trainings/${training.id}`}
                    aria-label={`Rediģēt treniņu ${formatDate(training.date)}`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </AdminLink>
                  <DeleteButton
                    action={deleteTraining.bind(null, training.id)}
                    confirmMessage="Dzēst šo treniņu?"
                  />
                </div>
              </td>
            </tr>
          )}
        />
      </table>
    </div>
  );
}
