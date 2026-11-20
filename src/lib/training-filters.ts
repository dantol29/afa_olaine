// Pure rules for the public /trenini filters, shared by the server page and the client component so both read a
// URL such as ?komanda=3&datums=2026-11-11 the same way. A value that does not match anything means "no filter".
import { sortByName } from "@/lib/ordering";

export const TRAINING_TEAM_PARAM = "komanda";
export const TRAINING_DATE_PARAM = "datums";

type TrainingWithTeams = { rawDate: string; teams: { id: number; name: string }[] };

/** Every distinct team that has a training, in Latvian name order. */
export function trainingTeamOptions(trainings: readonly TrainingWithTeams[]): { id: number; name: string }[] {
  const teamsById = new Map<number, { id: number; name: string }>();
  for (const training of trainings) {
    for (const team of training.teams) teamsById.set(team.id, team);
  }
  return sortByName([...teamsById.values()], (team) => team.name);
}

/** The team id from a URL value, or null when it is missing, not a plain integer or not among the options. */
export function parseTeamIdParam(value: string | null | undefined, options: readonly { id: number }[]): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return options.some((team) => team.id === id) ? id : null;
}

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
