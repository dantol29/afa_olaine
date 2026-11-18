/** LFF pages are only fetched over https (see fetchLffHtml), so any other scheme is refused when it is saved. */
function checkHttpsUrl(value: string, name: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return `Nederīgs ${name} URL.`;
  }
  return parsed.protocol === "https:" ? null : `${capitalize(name)} URL jāsākas ar https://.`;
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase("lv") + value.slice(1);
}

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

  const urlError = checkHttpsUrl(url, "spēļu saraksta");
  if (urlError) return { error: urlError } as const;
  const standingsUrlError = standingsUrl ? checkHttpsUrl(standingsUrl, "tabulas") : null;
  if (standingsUrlError) return { error: standingsUrlError } as const;
  const topScorersUrlError = topScorersUrl ? checkHttpsUrl(topScorersUrl, "vārtu guvēju") : null;
  if (topScorersUrlError) return { error: topScorersUrlError } as const;

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
