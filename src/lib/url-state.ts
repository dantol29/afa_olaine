// Shared helpers for filters whose selection lives in the URL, so a copied link or a refresh shows the same state.
// Pages parse the params on the server and hand the result to the client component as its initial state; clicks
// update the address bar with replaceState, without a navigation or a request.

export type SearchParamValue = string | string[] | undefined;

/** A repeated param (?a=1&a=2) arrives as an array; the first value wins. */
export function firstSearchParam(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Returns the URL's query string with one param set, or removed when value is null. Other params and the hash stay. */
export function withSearchParam(href: string, name: string, value: string | null): string {
  const url = new URL(href, "http://placeholder.invalid");
  if (value === null) url.searchParams.delete(name);
  else url.searchParams.set(name, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

// replaceState fires no event, so components subscribed to the URL are told through this one.
export const URL_PARAM_CHANGE_EVENT = "url-param-change";

/** Writes one param into the address bar without navigating. Browser only. */
export function replaceSearchParam(name: string, value: string | null): void {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(window.history.state, "", withSearchParam(`${pathname}${search}${hash}`, name, value));
  window.dispatchEvent(new Event(URL_PARAM_CHANGE_EVENT));
}
