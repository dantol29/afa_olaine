import { getScheduleForRange } from "@/lib/calendar";

import { EventsCalendar } from "./events-calendar";

export async function EventsCalendarSection() {
  const now = new Date();
  const seasonStartYear = now.getUTCMonth() >= 7 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const events = await getScheduleForRange(
    new Date(Date.UTC(seasonStartYear, 7, 1)),
    new Date(Date.UTC(seasonStartYear + 1, 6, 31, 23, 59, 59)),
  );

  return <EventsCalendar events={events} />;
}
