import { notFound } from "next/navigation";

import { db } from "@/db/client";
import { sortByName } from "@/lib/ordering";
import { coaches, teams } from "@/db/schema";

import { ArticleForm } from "./article-form";

export default async function AdminArticleFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [teamRows, coachRows] = await Promise.all([
    db.select().from(teams),
    db.select({ id: coaches.id, name: coaches.name }).from(coaches),
  ]);
  const teamOptions = sortByName(teamRows, (team) => team.name);
  const coachOptions = sortByName(coachRows, (coach) => coach.name);

  if (id === "new") {
    return <ArticleForm mode="create" teamOptions={teamOptions} coachOptions={coachOptions} />;
  }

  const articleId = Number(id);
  const article = await db.query.articles.findFirst({
    where: (articles, { eq }) => eq(articles.id, articleId),
  });
  if (!article) notFound();

  return (
    <ArticleForm
      mode="edit"
      article={article}
      teamOptions={teamOptions}
      coachOptions={coachOptions}
    />
  );
}
