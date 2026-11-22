import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { sortTeams } from "@/lib/ordering";
import { teams } from "@/db/schema";

import { PlayerForm } from "./player-form";

export default async function AdminPlayerFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teamOptions = sortTeams(await db.select().from(teams));

  if (id === "new") {
    return <PlayerForm mode="create" teamOptions={teamOptions} />;
  }

  const playerId = Number(id);
  const player = await db.query.players.findFirst({
    where: (players, { eq }) => eq(players.id, playerId),
    with: { playerTeams: true },
  });
  if (!player) notFound();

  return <PlayerForm mode="edit" player={player} teamOptions={teamOptions} />;
}
