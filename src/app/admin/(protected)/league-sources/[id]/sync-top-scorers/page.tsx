import { eq } from "drizzle-orm";
import { AdminLink } from "@/components/admin/admin-link";
import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { leagueSources } from "@/db/schema";

import { TopScorersSync } from "./top-scorers-sync";

export default async function AdminLeagueSourceSyncTopScorersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sourceId = Number(id);

  const [source] = await db.select().from(leagueSources).where(eq(leagueSources.id, sourceId));
  if (!source) notFound();

  if (!source.topScorersUrl) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
          Sinhronizēt vārtu guvējus: {source.label}
        </h1>
        <p className="text-sm text-slate-400">
          Šim līgas avotam nav norādīts vārtu guvēju URL.{" "}
          <AdminLink href={`/admin/league-sources/${source.id}`} className="text-club-red hover:underline">
            Pievieno to rediģēšanas formā.
          </AdminLink>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-extrabold text-club-navy">
        Sinhronizēt vārtu guvējus: {source.label}
      </h1>
      <TopScorersSync sourceId={source.id} />
    </div>
  );
}
