"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import type { PlannedEntry } from "@/lib/planned-booking";

// Lets an admin form tell the week calendar on the same page what it is planning: the calendar moves to that day and
// draws it. Outside a provider both ends do nothing.

type PlannedContext = { entry: PlannedEntry | null; setEntry: (entry: PlannedEntry | null) => void };

const Context = createContext<PlannedContext | null>(null);

export function PlannedEntryProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<PlannedEntry | null>(null);
  return <Context.Provider value={{ entry, setEntry }}>{children}</Context.Provider>;
}

/** Called by a form on every render with what it holds now. */
export function usePublishPlannedEntry(entry: PlannedEntry) {
  const setEntry = useContext(Context)?.setEntry;
  const { eventType, title, location, date, endDate, startTime, endTime, editedUid } = entry;
  useEffect(() => {
    setEntry?.({ eventType, title, location, date, endDate, startTime, endTime, editedUid });
  }, [setEntry, eventType, title, location, date, endDate, startTime, endTime, editedUid]);
  useEffect(() => () => setEntry?.(null), [setEntry]);
}

export function usePlannedEntry(): PlannedEntry | null {
  return useContext(Context)?.entry ?? null;
}
