import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BreadcrumbData } from "@/components/breadcrumb-data";
import { EventPageContent } from "@/components/event-page-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { formatDate } from "@/lib/date-display";
import { formatEventDates } from "@/lib/event-dates";
import { eventIdFromSlug, eventPath, eventSlug } from "@/lib/event-path";
import { getEventPage } from "@/lib/event-page-server";
import { pageMetadata } from "@/lib/page-metadata";

type EventPageProps = { params: Promise<{ slug: string }> };

async function findEvent(slug: string) {
  const id = eventIdFromSlug(slug);
  return id === null ? null : getEventPage(id);
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await findEvent((await params).slug);
  if (!event) return { title: "Notikums nav atrasts | AFA Olaine" };
  const dates = event.endDate ? formatEventDates(event.date, event.endDate) : formatDate(event.date);
  return pageMetadata({
    title: `${event.title} | AFA Olaine`,
    description: `${dates} ${event.startTime}–${event.endTime}, ${event.location}`,
    path: eventPath(event.id, event.title),
    ...(event.image ? { image: event.image } : {}),
  });
}

// Dates of the current year are shown without it, so a page kept from the old year is rebuilt within an hour of
// New Year even if nothing is saved in the admin.
export const revalidate = 3600;

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await findEvent(slug);
  if (!event) notFound();
  // An address with an old title, or only the id, moves to the current one.
  if (slug !== eventSlug(event.id, event.title)) permanentRedirect(eventPath(event.id, event.title));

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <BreadcrumbData items={[
        { name: "Sākums", path: "/" },
        { name: "Spēles", path: "/speles" },
        { name: event.title, path: eventPath(event.id, event.title) },
      ]} />
      <SiteHeader />
      <EventPageContent event={event} />
      <SiteEnding />
    </main>
  );
}
