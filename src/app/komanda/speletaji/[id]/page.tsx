import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlayerProfileContent } from "@/components/player-profile-content";
import { SiteEnding } from "@/components/site-ending";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/db/client";

type PlayerPageProps = { params: Promise<{ id: string }> };

async function getPlayer(idParam: string) {
  const id = Number(idParam);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const row = await db.query.players.findFirst({
    where: (players, { eq }) => eq(players.id, id),
    with: { playerTeams: { with: { team: true } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    number: row.number,
    position: row.position,
    birthdate: row.birthdate,
    photoUrl: row.id === 67 ? "/player-cutouts/nikoloz-gujabidze.png" : row.photoUrl,
    teams: row.playerTeams.map(({ team, goals }) => ({ name: team.name, goals })),
  };
}

export async function generateMetadata({ params }: PlayerPageProps): Promise<Metadata> {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) return { title: "Spēlētājs nav atrasts | AFA Olaine" };

  return {
    title: `${player.name} | AFA Olaine`,
    description: `${player.name} — ${player.position ?? "spēlētājs"}, AFA Olaine.`,
    alternates: { canonical: `/komanda/speletaji/${player.id}` },
    openGraph: {
      type: "profile",
      locale: "lv_LV",
      siteName: "AFA Olaine",
      title: `${player.name} | AFA Olaine`,
      description: `${player.name} — ${player.position ?? "spēlētājs"}, AFA Olaine.`,
      url: `/komanda/speletaji/${player.id}`,
      images: player.photoUrl ? [player.photoUrl] : ["/match-stadium.jpg"],
    },
  };
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;
  const player = await getPlayer(id);
  if (!player) notFound();

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <SiteHeader />
      <PlayerProfileContent player={player} />
      <SiteEnding />
    </main>
  );
}
