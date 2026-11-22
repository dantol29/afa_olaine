import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { sortByName } from "@/lib/ordering";
import { events, teams } from "@/db/schema";
import { copySourceId } from "@/lib/admin-copy";
import { getEventTitleHints, getLocationHints } from "@/lib/admin-form-hints";
import { getEventBorderStripe } from "@/lib/schedule-server";
import type { SearchParamValue } from "@/lib/url-state";

import { EventForm } from "./event-form";

async function findEvent(eventId: number) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  return event;
}

export default async function AdminEventFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [teamRows, titles, locations, borderStripe] = await Promise.all([
    db.select().from(teams),
    getEventTitleHints(),
    getLocationHints(),
    getEventBorderStripe(),
  ]);
  const teamOptions = sortByName(teamRows, (team) => team.name);
  const hints = { titles, locations, borderStripe };

  if (id === "new") {
    // `?kopija=<id>` opens the new-event form filled from that event; an unknown id opens an empty form.
    const sourceId = copySourceId(query);
    const source = sourceId === null ? undefined : await findEvent(sourceId);
    return <EventForm mode="create" teamOptions={teamOptions} copyOf={source} hints={hints} />;
  }

  const event = await findEvent(Number(id));
  if (!event) notFound();

  return <EventForm mode="edit" eventId={event.id} event={event} teamOptions={teamOptions} hints={hints} />;
}
