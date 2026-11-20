"use client";

import { useSyncExternalStore } from "react";

import { URL_PARAM_CHANGE_EVENT } from "@/lib/url-state";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_PARAM_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_PARAM_CHANGE_EVENT, onChange);
  };
}

/** Current value of a URL param. The server-parsed value renders the HTML and the first client render, so a refresh
 *  does not flash; afterwards the address bar is the source of truth. That matters for the browser's Back button: Next
 *  restores a page with its original server props, while the URL still carries the later selection. */
export function useUrlParam(name: string, serverValue: string | null): string | null {
  return useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(name),
    () => serverValue,
  );
}
