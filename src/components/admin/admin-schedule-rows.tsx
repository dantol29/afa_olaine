import Link from "next/link";
import type { ReactNode } from "react";

import { RECENT_PAST_DAYS, SHOW_ALL_PAST_PARAM, SHOW_ALL_PAST_VALUE } from "@/lib/admin-schedule-list";

/** Table bodies of an admin schedule list: upcoming rows, then an "Aizvadītās" group, then a link to every past row
 *  when only the recent ones are shown. The past group hides with its heading when the search matches none of it. */
export function AdminScheduleRows<Row extends { id: number }>({
  upcoming,
  past,
  hiddenPastCount,
  columnCount,
  basePath,
  emptyText,
  renderRow,
}: {
  upcoming: Row[];
  past: Row[];
  hiddenPastCount: number;
  columnCount: number;
  basePath: string;
  emptyText: string;
  renderRow: (row: Row) => ReactNode;
}) {
  const isEmpty = upcoming.length === 0 && past.length === 0 && hiddenPastCount === 0;

  return (
    <>
      <tbody>
        {upcoming.map(renderRow)}
        {isEmpty && (
          <tr>
            <td colSpan={columnCount} className="p-4 text-center text-slate-400">{emptyText}</td>
          </tr>
        )}
      </tbody>
      {past.length > 0 && (
        <tbody data-admin-search-group>
          <tr className="border-y border-slate-200 bg-club-gray-light">
            <th colSpan={columnCount} scope="rowgroup" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Aizvadītās
            </th>
          </tr>
          {past.map(renderRow)}
        </tbody>
      )}
      {hiddenPastCount > 0 && (
        <tbody>
          <tr>
            <td colSpan={columnCount} className="p-4 text-center">
              <Link href={`${basePath}?${SHOW_ALL_PAST_PARAM}=${SHOW_ALL_PAST_VALUE}`} className="text-sm font-semibold text-club-red hover:underline">
                Rādīt visas aizvadītās ({hiddenPastCount} vecākas par {RECENT_PAST_DAYS} dienām)
              </Link>
            </td>
          </tr>
        </tbody>
      )}
    </>
  );
}
