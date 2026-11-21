// Pure rules for the public /trenini filters, shared by the server page and the client component so both read a
// URL such as ?komanda=3&datums=2026-11-11 the same way. A value that does not match anything means "no filter".
import { teamOptionsInOrder } from "@/lib/ordering";
import { TEAM_FILTER_PARAM, parseIdParam } from "@/lib/url-state";

export const TRAINING_TEAM_PARAM = TEAM_FILTER_PARAM;
export const TRAINING_DATE_PARAM = "datums";

type TrainingWithTeams = { rawDate: string; teams: { id: number; name: string; sort: number }[] };

/** Every distinct team that has a training, in the admin team order. */
export function trainingTeamOptions(trainings: readonly TrainingWithTeams[]): { id: number; name: string }[] {
  return teamOptionsInOrder(trainings.flatMap((training) => training.teams));
}

export const parseTeamIdParam = parseIdParam;

/** A YYYY-MM-DD value that is a real calendar date, or null. */
export function parseDateKeyParam(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

/** A training with several teams belongs under each of them. */
export function filterTrainingsByTeam<T extends TrainingWithTeams>(trainings: readonly T[], teamId: number | null): T[] {
  return teamId === null ? [...trainings] : trainings.filter((training) => training.teams.some((team) => team.id === teamId));
}
