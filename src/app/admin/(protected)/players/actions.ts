"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { PUBLIC_CONTENT_CACHE_TAG } from "@/lib/public-data-cache";
import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { playerTeams, players, teams } from "@/db/schema";
import { requireAdminSession } from "@/lib/auth";
import { parsePlayerImport } from "@/lib/admin-input/player-import";
import { parsePlayerInput } from "@/lib/admin-input/players";
import { deleteUploadedPhoto, saveUploadedPhoto } from "@/lib/uploads";

async function syncPlayerTeams(playerId: number, teamGoals: Map<number, number>) {
  await db.delete(playerTeams).where(eq(playerTeams.playerId, playerId));
  if (teamGoals.size > 0) {
    await db.insert(playerTeams).values(
      [...teamGoals.entries()].map(([teamId, goals]) => ({ playerId, teamId, goals })),
    );
  }
}

export async function createPlayer(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  const { teamGoals, ...playerFields } = parsed;
  const [inserted] = await db
    .insert(players)
    .values({ ...playerFields, photoUrl, createdAt: Date.now() })
    .returning({ id: players.id });
  await syncPlayerTeams(inserted.id, teamGoals);

  revalidatePath("/komanda/speletaji/[id]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/players");
  revalidatePath("/komanda");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  redirect("/admin/players");
}

export async function updatePlayer(
  id: number,
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  await requireAdminSession();

  const parsed = parsePlayerInput(formData);
  if ("error" in parsed) return parsed;

  const photo = formData.get("photo");
  const removePhoto = formData.get("removePhoto") === "on";

  const { teamGoals, ...playerFields } = parsed;
  const updates: typeof playerFields & { photoUrl?: string | null } = { ...playerFields };

  if (photo instanceof File && photo.size > 0) {
    let newPhotoUrl: string;
    try {
      newPhotoUrl = await saveUploadedPhoto(photo, "players");
    } catch (error) {
      return { error: (error as Error).message };
    }
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = newPhotoUrl;
  } else if (removePhoto) {
    const [existing] = await db
      .select({ photoUrl: players.photoUrl })
      .from(players)
      .where(eq(players.id, id));
    await deleteUploadedPhoto(existing?.photoUrl ?? null);
    updates.photoUrl = null;
  }

  await db.update(players).set(updates).where(eq(players.id, id));
  await syncPlayerTeams(id, teamGoals);

  revalidatePath("/komanda/speletaji/[id]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/players");
  revalidatePath("/komanda");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  redirect("/admin/players");
}

export async function deletePlayer(id: number) {
  await requireAdminSession();

  const [existing] = await db
    .select({ photoUrl: players.photoUrl })
    .from(players)
    .where(eq(players.id, id));
  await deleteUploadedPhoto(existing?.photoUrl ?? null);

  await db.delete(players).where(eq(players.id, id));
  revalidatePath("/komanda/speletaji/[id]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/players");
  revalidatePath("/komanda");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
}

export type PlayerImportState = { error?: string; saved?: { created: number; updated: number } } | undefined;

/** Saves a checked roster import in one go: new players into the chosen team, and the chosen changes to players on
 *  file. Players not in the roster keep their teams. */
export async function savePlayerImport(_prevState: PlayerImportState, formData: FormData): Promise<PlayerImportState> {
  await requireAdminSession();

  const parsed = parsePlayerImport(formData.get("teamId"), formData.get("rows"));
  if ("error" in parsed) return { error: parsed.error };
  const { teamId, creates, updates } = parsed;

  const [team] = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId));
  if (!team) return { error: "Komanda nav atrasta." };
  const playerIds = [...new Set(updates.map((update) => update.playerId))];
  if (playerIds.length > 0) {
    const found = await db.select({ id: players.id }).from(players).where(inArray(players.id, playerIds));
    if (found.length !== playerIds.length) return { error: "Kāds no izvēlētajiem spēlētājiem vairs nav atrasts. Pārbaudi sarakstu vēlreiz." };
  }

  try {
    await db.transaction(async (tx) => {
      const createdAt = Date.now();
      for (const player of creates) {
        const [inserted] = await tx.insert(players).values({ ...player, createdAt }).returning({ id: players.id });
        await tx.insert(playerTeams).values({ playerId: inserted.id, teamId, goals: 0 });
      }
      for (const { playerId, changes, addToTeam } of updates) {
        if (Object.keys(changes).length > 0) await tx.update(players).set(changes).where(eq(players.id, playerId));
        // Joining a team leaves the player's goals in other teams as they are.
        if (addToTeam) await tx.insert(playerTeams).values({ playerId, teamId, goals: 0 }).onConflictDoNothing();
      }
    });
  } catch (error) {
    console.error("Player import failed:", error);
    return { error: "Importu neizdevās saglabāt. Nekas netika mainīts." };
  }

  revalidatePath("/komanda/speletaji/[id]", "page");
  updateTag(PUBLIC_CONTENT_CACHE_TAG);
  revalidatePath("/admin/players");
  revalidatePath("/admin/players/import");
  revalidatePath("/komanda");
  revalidatePath("/akademija");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  return { saved: { created: creates.length, updated: updates.length } };
}
