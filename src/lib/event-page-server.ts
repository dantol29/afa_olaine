import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/client";
import { events } from "@/db/schema";
import { compareTeamOrder } from "@/lib/ordering";

export type EventPage = {
  id: number;
  title: string;
  date: string;
  endDate: string | null;
  startTime: string;
  endTime: string;
  location: string;
  /** Sanitized when saved; null when there is none. */
  description: string | null;
  image: string | null;
  gallery: string[];
  /** In the club's team order; empty for a club-wide event. */
  teams: { id: number; name: string }[];
};

/** One event for its public page; the admin's private notes are not read. */
export const getEventPage = cache(async function getEventPage(id: number): Promise<EventPage | null> {
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    columns: { notes: false, createdAt: false },
    with: { eventTeams: { with: { team: { columns: { id: true, name: true, sort: true } } } } },
  });
  if (!event) return null;
  const { eventTeams, gallery, ...fields } = event;
  return {
    ...fields,
    gallery: gallery?.split("\n").filter(Boolean) ?? [],
    teams: eventTeams.map((link) => link.team).sort(compareTeamOrder).map(({ id: teamId, name }) => ({ id: teamId, name })),
  };
});
