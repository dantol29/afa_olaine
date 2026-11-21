import Link from "next/link";

import { db } from "@/db/client";
import { teams } from "@/db/schema";
import { compareTeamOrder } from "@/lib/ordering";

import { TeamsTable } from "./teams-table";

export default async function AdminTeamsPage() {
  // The admin list shows the same order as the site, so sorting here is what visitors see.
  const rows = (await db.select().from(teams)).sort(compareTeamOrder);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-club-navy">Komandas</h1>
        <Link
          href="/admin/teams/new"
          className="rounded-lg bg-club-red px-4 py-2 text-sm font-semibold text-white hover:bg-club-red-dark"
        >
          + Pievienot
        </Link>
      </div>
      <TeamsTable teams={rows.map(({ id, name, isMain }) => ({ id, name, isMain }))} />
    </div>
  );
}
