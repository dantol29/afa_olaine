export function parseCoachInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const license = String(formData.get("license") ?? "").trim();
  const authority = String(formData.get("authority") ?? "");
  const teamIds = formData.getAll("teamIds").map(Number).filter((n) => Number.isFinite(n));

  if (!name) return { error: "Vārds, uzvārds ir obligāts." } as const;
  if (!position) return { error: "Amats ir obligāts." } as const;
  if (!license) return { error: "Licence ir obligāta." } as const;
  if (authority !== "UEFA" && authority !== "LFF") {
    return { error: "Jāizvēlas licences izdevējs." } as const;
  }

  return {
    name,
    position,
    license,
    authority: authority as "UEFA" | "LFF",
    teamIds,
  } as const;
}
