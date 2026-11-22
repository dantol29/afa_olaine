"use client";

import { useEffect, useRef } from "react";

// Warns before leaving an admin form with unsaved edits. A form counts as edited when its current values differ from
// those it opened with, so fields filled by code (a picked suggestion, the rich text editor, a time select) are
// covered without each one reporting its changes.
//
// Closing the tab, reloading or leaving for another site shows the browser's own prompt (its text cannot be set).
// Links inside the site change the page without unloading it, so a click on one is checked here and confirmed with
// window.confirm. The browser's Back button is not intercepted: the App Router gives no reliable hook for it.

const LEAVE_MESSAGE = "Ir nesaglabātas izmaiņas. Pamest lapu?";

type DirtyCheck = () => boolean;

// One listener pair for the whole page, however many guarded forms it has, so leaving asks once.
const dirtyChecks = new Set<DirtyCheck>();
const anyDirty = () => [...dirtyChecks].some((check) => check());

function warnOnUnload(event: BeforeUnloadEvent) {
  if (!anyDirty()) return;
  event.preventDefault();
  // Older browsers show the prompt only when returnValue is set.
  event.returnValue = "";
}

function confirmLinkClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
  const url = new URL(link.href, window.location.href);
  // Another site unloads this page, so the browser's own prompt covers it; a link to this same page changes nothing.
  if (url.origin !== window.location.origin) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;
  if (anyDirty() && !window.confirm(LEAVE_MESSAGE)) {
    event.preventDefault();
    // Capturing on the document runs before the link's own handler, which would otherwise still navigate.
    event.stopPropagation();
  }
}

function register(check: DirtyCheck) {
  if (dirtyChecks.size === 0) {
    window.addEventListener("beforeunload", warnOnUnload);
    document.addEventListener("click", confirmLinkClick, true);
  }
  dirtyChecks.add(check);
}

function unregister(check: DirtyCheck) {
  dirtyChecks.delete(check);
  if (dirtyChecks.size === 0) {
    window.removeEventListener("beforeunload", warnOnUnload);
    document.removeEventListener("click", confirmLinkClick, true);
  }
}

function serializeForm(form: HTMLFormElement): string {
  return JSON.stringify([...new FormData(form)].map(([name, value]) => [name, typeof value === "string" ? value : `${value.name}:${value.size}`]));
}

/** Guards the form given the returned ref. `pending` and `state` come from the form's useActionState: nothing is
 *  asked while saving (a successful save usually redirects), and a save that keeps the page open, without an error,
 *  makes the values shown the new starting point. A page whose work is not all inside one form from the start (the
 *  player import keeps the pasted text outside its table) passes `isDirty` instead of attaching the ref. */
export function useUnsavedChangesGuard(pending: boolean, state?: { error?: unknown } | null, isDirty?: boolean) {
  const formRef = useRef<HTMLFormElement>(null);
  const initialValues = useRef<string | null>(null);
  const pendingNow = useRef(pending);
  const wasPending = useRef(false);
  const dirtyFlag = useRef(isDirty);

  useEffect(() => {
    // Effects of the fields inside the form have already run here, so values they set are part of the start.
    initialValues.current = formRef.current ? serializeForm(formRef.current) : null;
    const formChanged = () =>
      formRef.current !== null && initialValues.current !== null && serializeForm(formRef.current) !== initialValues.current;
    const check = () => !pendingNow.current && (dirtyFlag.current ?? formChanged());
    register(check);
    return () => unregister(check);
  }, []);

  useEffect(() => {
    dirtyFlag.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    pendingNow.current = pending;
    if (wasPending.current && !pending && !state?.error && formRef.current) initialValues.current = serializeForm(formRef.current);
    wasPending.current = pending;
  }, [pending, state]);

  return formRef;
}
