import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";

import { PlayerProfileContent } from "@/components/player-profile-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";
import { pageMetadata } from "@/lib/page-metadata";
import { BreadcrumbData } from "@/components/breadcrumb-data";
import { StructuredData } from "@/components/structured-data";
import { webPageData } from "@/lib/web-page-data";
import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-url";

type PlayerPageProps = { params: Promise<{ id: string }> };

const getPlayer = cache(async function getPlayer(idParam: string) {
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const row = await db.query.players.findFirst({
    where: (players, { eq }) => eq(players.id, id),
    with: { playerTeams: { with: { team: true } } },
  });
  if (!row) return null;
  if (idParam !== String(row.id)) permanentRedirect(`/komanda/speletaji/${row.id}`);

  return {
    id: row.id,
    name: row.name,
    number: row.number,
    position: row.position,
    birthdate: row.birthdate,
    photoUrl: row.id === 67 ? "/player-cutouts/nikoloz-gujabidze.png" : row.photoUrl,
    teams: row.playerTeams.map(({ team, goals }) => ({ name: team.name, goals })),
  };
});

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) return { title: "Spēlētājs nav atrasts | AFA Olaine" };

  return {
    ...pageMetadata({
      title: `${player.name} | AFA Olaine`,
      description: `${player.name} — ${player.position ?? "spēlētājs"}, AFA Olaine.`,
      path: `/komanda/speletaji/${player.id}`,
      image: player.photoUrl ?? undefined,
    }),
    openGraph: {
      type: "profile",
      locale: "lv_LV",
      siteName: "AFA Olaine",
      title: `${player.name} | AFA Olaine`,
      description: `${player.name} — ${player.position ?? "spēlētājs"}, AFA Olaine.`,
      url: `/komanda/speletaji/${player.id}`,
      images: [{ url: player.photoUrl ?? "/match-stadium.jpg", alt: player.name }],
    },
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <StructuredData data={webPageData({
        type: "ProfilePage",
        name: player.name,
        path: `/komanda/speletaji/${player.id}`,
        mainEntity: {
          "@type": "Person",
          "@id": `${absoluteSiteUrl(`/komanda/speletaji/${player.id}`)}#person`,
          name: player.name,
          url: absoluteSiteUrl(`/komanda/speletaji/${player.id}`),
          image: player.photoUrl ? absoluteSiteUrl(player.photoUrl) : undefined,
          description: `${player.name} — ${player.position ?? "spēlētājs"}, AFA Olaine.`,
          memberOf: { "@id": `${getSiteUrl()}/#organization` },
        },
      })} />
      <BreadcrumbData items={[
        { name: "Sākums", path: "/" },
        { name: "Komanda", path: "/komanda" },
        { name: player.name, path: `/komanda/speletaji/${player.id}` },
      ]} />
      <SiteHeader />
      <PlayerProfileContent player={player} />
      <SiteEnding />
    </main>
  );
}
