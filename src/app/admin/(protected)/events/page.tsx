import { Pencil } from "lucide-react";
import Link from "next/link";

import { AdminScheduleRows } from "@/components/admin/admin-schedule-rows";
import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { CopyRowLink } from "@/components/admin/form-copy";
import { db } from "@/db/client";
import { events } from "@/db/schema";
import { copyHref } from "@/lib/admin-copy";
import { SHOW_ALL_PAST_PARAM, isShowAllPast, splitAdminSchedule } from "@/lib/admin-schedule-list";
import { toDateKey } from "@/lib/calendar";
import { getTeamsByEvent } from "@/lib/event-teams";
import { firstSearchParam, type SearchParamValue } from "@/lib/url-state";

import { deleteEvent } from "./actions";
import { formatEventSpan } from "@/lib/event-dates";
import { formatDate } from "@/lib/date-display";

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<Record<string, SearchParamValue>> }) {
  const query = await searchParams;
  const [eventRows, teamsByEvent] = await Promise.all([
    db
      .select({
        id: events.id,
        title: events.title,
        date: events.date,
        endDate: events.endDate,
        startTime: events.startTime,
        endTime: events.endTime,
      })
      .from(events),
    getTeamsByEvent(),
  ]);
  // Several teams read "A, B"; none belongs to no team.
  const rows = eventRows.map((row) => ({ ...row, teamName: teamsByEvent.get(row.id)?.map((team) => team.name).join(", ") || null }));
  const { upcoming, past, hiddenPastCount } = splitAdminSchedule(
    rows,
    toDateKey(new Date()),
    isShowAllPast(firstSearchParam(query[SHOW_ALL_PAST_PARAM])),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Notikumi</h1>
        <Link
          href="/admin/events/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>
      <AdminSearch placeholder="Meklēt notikumus…" />

      <table className="w-full overflow-hidden rounded-xl bg-white text-left text-sm shadow-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-400">
            <th className="p-4 font-semibold">Nosaukums</th>
            <th className="p-4 font-semibold">Datums</th>
            <th className="p-4 font-semibold">Laiks</th>
            <th className="p-4 font-semibold">Komanda</th>
            <th className="p-4" />
          </tr>
        </thead>
        <AdminScheduleRows
          upcoming={upcoming}
          past={past}
          hiddenPastCount={hiddenPastCount}
          columnCount={5}
          basePath="/admin/events"
          emptyText="Vēl nav neviena notikuma."
          renderRow={(event) => (
            <tr data-admin-search-item={`${event.title} ${event.date} ${formatEventSpan(event.date, event.startTime, event.endDate, event.endTime)} ${event.teamName ?? ""}`} key={event.id} className="border-b border-slate-100 last:border-0">
              <td className="p-4 font-semibold text-club-navy">{event.title}</td>
              {/* Several days: the start time goes with the first day and the end time with the last, in one cell. */}
              {event.endDate ? (
                <td colSpan={2} className="p-4 text-club-navy">
                  {formatEventSpan(event.date, event.startTime, event.endDate, event.endTime)}
                </td>
              ) : (
                <>
                  <td className="p-4 text-club-navy">{formatDate(event.date)}</td>
                  <td className="p-4 text-slate-500">
                    {event.startTime}–{event.endTime}
                  </td>
                </>
              )}
              <td className="p-4 text-slate-500">{event.teamName ?? "—"}</td>
              <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-4">
                  <CopyRowLink href={copyHref("events", event.id)} label={`Kopēt notikumu "${event.title}"`} />
                  <Link
                    href={`/admin/events/${event.id}`}
                    aria-label={`Rediģēt notikumu "${event.title}"`}
                    title="Rediģēt"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton
                    action={deleteEvent.bind(null, event.id)}
                    confirmMessage={`Dzēst notikumu "${event.title}"?`}
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
