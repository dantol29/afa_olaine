// "Kopēt" in an admin list opens the new-record form with `?kopija=<id>`, filled from that record.
import { firstSearchParam, type SearchParamValue } from "@/lib/url-state";

export const COPY_PARAM = "kopija";

/** The record id to copy from, or null when the param is missing or not a plain positive integer. */
export function copySourceId(query: Record<string, SearchParamValue>): number | null {
  const value = firstSearchParam(query[COPY_PARAM]);
  return value && /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

/** Link to the new-record form of an admin section, filled from one of its records. */
export function copyHref(section: "events" | "games" | "trainings", id: number): string {
  return `/admin/${section}/new?${COPY_PARAM}=${id}`;
}
