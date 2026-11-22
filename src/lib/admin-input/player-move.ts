import type { MoveMode } from "@/lib/player-move";

const positiveIds = (values: FormDataEntryValue[]) =>
  [...new Set(values.map(Number))].filter((id) => Number.isInteger(id) && id > 0);

/** Checks the move form: two different teams, an action and at least one ticked player. */
export function parsePlayerMoveInput(formData: FormData) {
  const fromTeamId = Number(formData.get("fromTeamId"));
  const toTeamId = Number(formData.get("toTeamId"));
  const mode = String(formData.get("mode") ?? "");
  const playerIds = positiveIds(formData.getAll("playerIds"));

  if (!Number.isInteger(fromTeamId) || fromTeamId <= 0) return { error: "Jāizvēlas komanda, no kuras." } as const;
  if (!Number.isInteger(toTeamId) || toTeamId <= 0) return { error: "Jāizvēlas komanda, uz kuru." } as const;
  if (fromTeamId === toTeamId) return { error: "Komandām jābūt dažādām." } as const;
  if (mode !== "add" && mode !== "move") return { error: "Jāizvēlas darbība." } as const;
  if (playerIds.length === 0) return { error: "Nav atzīmēts neviens spēlētājs." } as const;

  return { fromTeamId, toTeamId, mode: mode as MoveMode, playerIds } as const;
}
