export function parseLeagueSourceInput(formData: FormData) {
  const teamId = Number(formData.get("teamId"));
  const label = String(formData.get("label") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const standingsUrl = String(formData.get("standingsUrl") ?? "").trim();
  const topScorersUrl = String(formData.get("topScorersUrl") ?? "").trim();
  const displayOrderRaw = String(formData.get("displayOrder") ?? "").trim();
  const displayOrder = displayOrderRaw ? Number(displayOrderRaw) : 0;
  const isMainLeague = formData.get("isMainLeague") === "on";

  if (!teamId) return { error: "Jāizvēlas komanda." } as const;
  if (!label) return { error: "Nosaukums ir obligāts." } as const;
  if (!url) return { error: "URL ir obligāts." } as const;
  if (!Number.isInteger(displayOrder)) return { error: "Secībai jābūt veselam skaitlim." } as const;

  try {
    new URL(url);
  } catch {
    return { error: "Nederīgs spēļu saraksta URL." } as const;
  }

  if (standingsUrl) {
    try {
      new URL(standingsUrl);
    } catch {
      return { error: "Nederīgs tabulas URL." } as const;
    }
  }

  if (topScorersUrl) {
    try {
      new URL(topScorersUrl);
    } catch {
      return { error: "Nederīgs vārtu guvēju URL." } as const;
    }
  }

  return {
    teamId,
    label,
    url,
    standingsUrl: standingsUrl || null,
    topScorersUrl: topScorersUrl || null,
    displayOrder,
    isMainLeague,
  } as const;
}
