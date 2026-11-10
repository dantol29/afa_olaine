import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";

import { BreadcrumbData } from "@/components/breadcrumb-data";
import { CoachProfileContent } from "@/components/player-profile-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { StructuredData } from "@/components/structured-data";
import { db } from "@/db/client";
import { pageMetadata } from "@/lib/page-metadata";
import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-url";
import { webPageData } from "@/lib/web-page-data";

type CoachPageProps = { params: Promise<{ id: string }> };

const getCoach = cache(async function getCoach(idParam: string) {
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const row = await db.query.coaches.findFirst({
    where: (coaches, { eq }) => eq(coaches.id, id),
    with: { coachTeams: { with: { team: true } } },
  });
  if (!row) return null;
  if (idParam !== String(row.id)) permanentRedirect(`/komanda/treneri/${row.id}`);

  return {
    id: row.id,
    name: row.name,
    position: row.position,
    license: row.license,
    authority: row.authority,
    photoUrl: row.photoUrl,
    teams: row.coachTeams.map(({ team }) => team.name),
  };
});

export async function generateMetadata({ params }: CoachPageProps): Promise<Metadata> {
  const { id } = await params;
  const coach = await getCoach(id);
  if (!coach) return { title: "Treneris nav atrasts | AFA Olaine" };

  const description = `${coach.name} — ${coach.position}, AFA Olaine. Licence: ${coach.license} (${coach.authority}).`;
  return {
    ...pageMetadata({
      title: `${coach.name} | AFA Olaine`,
      description,
      path: `/komanda/treneri/${coach.id}`,
      image: coach.photoUrl ?? undefined,
    }),
    openGraph: {
      type: "profile",
      locale: "lv_LV",
      siteName: "AFA Olaine",
      title: `${coach.name} | AFA Olaine`,
      description,
      url: `/komanda/treneri/${coach.id}`,
      images: [{ url: coach.photoUrl ?? "/match-stadium.jpg", alt: coach.name }],
    },
  };
}

export default async function CoachPage({ params }: CoachPageProps) {
  const { id } = await params;
  const coach = await getCoach(id);
  if (!coach) notFound();

  const path = `/komanda/treneri/${coach.id}`;
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <StructuredData data={webPageData({
        type: "ProfilePage",
        name: coach.name,
        path,
        mainEntity: {
          "@type": "Person",
          "@id": `${absoluteSiteUrl(path)}#person`,
          name: coach.name,
          url: absoluteSiteUrl(path),
          image: coach.photoUrl ? absoluteSiteUrl(coach.photoUrl) : undefined,
          jobTitle: coach.position,
          memberOf: { "@id": `${getSiteUrl()}/#organization` },
        },
      })} />
      <BreadcrumbData items={[
        { name: "Sākums", path: "/" },
        { name: "Komanda", path: "/komanda" },
        { name: coach.name, path },
      ]} />
      <SiteHeader />
      <CoachProfileContent coach={coach} />
      <SiteEnding />
    </main>
  );
}
