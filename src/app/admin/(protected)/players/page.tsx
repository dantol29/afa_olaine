import { Pencil, UserRound } from "lucide-react";
import Image from "next/image";
import { AdminLink } from "@/components/admin/admin-link";

import { DeleteButton } from "@/components/admin/delete-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { db } from "@/db/client";
import { sortByName, sortTeams } from "@/lib/ordering";

import { deletePlayer } from "./actions";

export default async function AdminPlayersPage() {
  const teamRows = sortTeams(await db.query.teams.findMany({ with: { playerTeams: { with: { player: true } } } }));

  const teamsWithPlayers = teamRows.map((team) => ({
    id: team.id,
    name: team.name,
    players: sortByName(
      team.playerTeams.map((pt) => pt.player).filter((player) => player !== null),
      (player) => player.name,
    ),
  }));

  const totalPlayers = teamsWithPlayers.reduce((sum, team) => sum + team.players.length, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Spēlētāji</h1>
        <AdminLink
          href="/admin/players/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </AdminLink>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <AdminSearch placeholder="Meklēt spēlētājus…" />
        </div>
        <div className="flex gap-2">
          <AdminLink
            href="/admin/players/move"
            className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-club-navy shadow-sm hover:bg-slate-50"
          >
            Pārvietot
          </AdminLink>
          <AdminLink
            href="/admin/players/import"
            className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-club-navy shadow-sm hover:bg-slate-50"
          >
            Importēt sarakstu
          </AdminLink>
        </div>
      </div>

      {totalPlayers === 0 ? (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
          Vēl nav neviena spēlētāja.
        </p>
      ) : (
        teamsWithPlayers.map((team) =>
          team.players.length === 0 ? null : (
            <div key={team.id} data-admin-search-group className="mb-8">
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="text-lg font-bold text-club-navy">{team.name}</h2>
                <span className="text-sm text-slate-400">{team.players.length} spēlētāji</span>
                <AdminLink href={`/admin/players/move?no=${team.id}`} className="ml-auto text-sm font-semibold text-slate-500 hover:text-club-navy">
                  Pārvietot…
                </AdminLink>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {team.players.map((player) => (
                  <div
                    key={player.id}
                    data-admin-search-item={`${player.name} ${player.birthdate} ${team.name} ${player.number ?? ""} ${player.position ?? ""}`}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[3/4] bg-club-gray-light">
                      {player.photoUrl ? (
                        <Image
                          src={player.photoUrl}
                          alt={player.name}
                          fill
                          sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-contain object-bottom"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <UserRound className="h-10 w-10 text-club-muted" strokeWidth={1.5} />
                        </div>
                      )}
                      {player.number !== null && (
                        <span className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-club-red text-xs font-bold text-white">
                          {player.number}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold text-club-navy">
                        {player.name}
                      </p>
                      <p className="text-xs text-slate-400">{player.position ?? player.birthdate}</p>
                      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
                        <AdminLink
                          href={`/admin/players/${player.id}`}
                          aria-label={`Rediģēt spēlētāju "${player.name}"`}
                          title="Rediģēt"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-club-navy transition hover:bg-club-gray-light"
                        >
                          <Pencil className="h-4 w-4" />
                        </AdminLink>
                        <DeleteButton
                          action={deletePlayer.bind(null, player.id)}
                          confirmMessage={`Dzēst spēlētāju "${player.name}"?`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )
      )}
    </div>
  );
}
