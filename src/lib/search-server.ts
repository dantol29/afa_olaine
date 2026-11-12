import "server-only";

import { like, or } from "drizzle-orm";

import { db } from "@/db/client";
import { articles, coaches, players, teams } from "@/db/schema";
import { sortByName, uniqueSortedLabels } from "@/lib/ordering";

const RESULT_LIMIT = 5;

export type SearchResults = {
  articles: { slug: string; title: string; excerpt: string; image: string }[];
  players: { id: number; name: string; photoUrl: string | null; teamName: string | null }[];
  coaches: {
    id: number;
    name: string;
    position: string;
    photoUrl: string | null;
    license: string;
    authority: "UEFA" | "LFF";
  }[];
  teams: { id: number; name: string; isMain: boolean }[];
};

/** SQL cannot order Latvian names, so every name match is loaded and the first results are taken after sorting. */
function firstByName<T>(rows: T[], getName: (row: T) => string): T[] {
  return sortByName(rows, getName).slice(0, RESULT_LIMIT);
}

const EMPTY_RESULTS: SearchResults = { articles: [], players: [], coaches: [], teams: [] };

/** Simple case-insensitive substring search across the site's public
 *  content — players, coaches, teams, and news articles. Good enough for
 *  a club site's content volume; no need for a real search index. */
export async function searchSite(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return EMPTY_RESULTS;

  const pattern = `%${q}%`;

  const [articleRows, playerRows, coachRows, teamRows] = await Promise.all([
    db.query.articles.findMany({
      where: or(like(articles.title, pattern), like(articles.excerpt, pattern)),
      orderBy: (articles, { desc }) => [desc(articles.date), desc(articles.createdAt)],
      limit: RESULT_LIMIT,
    }),
    db.query.players.findMany({
      where: like(players.name, pattern),
      with: { playerTeams: { with: { team: true } } },
    }),
    db.query.coaches.findMany({
      where: like(coaches.name, pattern),
    }),
    db.query.teams.findMany({
      where: like(teams.name, pattern),
    }),
  ]);

  return {
    articles: articleRows.map((article) => ({
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      image: article.image,
    })),
    players: firstByName(playerRows, (player) => player.name).map((player) => ({
      id: player.id,
      name: player.name,
      photoUrl: player.photoUrl,
      teamName: uniqueSortedLabels(player.playerTeams.map(({ team }) => team?.name)).join(", ") || null,
    })),
    coaches: firstByName(coachRows, (coach) => coach.name).map((coach) => ({
      id: coach.id,
      name: coach.name,
      position: coach.position,
      photoUrl: coach.photoUrl,
      license: coach.license,
      authority: coach.authority,
    })),
    teams: firstByName(teamRows, (team) => team.name).map((team) => ({ id: team.id, name: team.name, isMain: team.isMain })),
  };
}
