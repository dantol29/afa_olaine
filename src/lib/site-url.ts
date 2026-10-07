const PRODUCTION_SITE_URL = "https://fkolaine.com";
const LEGACY_HOSTS = new Set(["test.afaolaine.lv"]);

export function getSiteUrl(): string {
  const configured = process.env.SITE_URL?.trim();
  if (!configured) return PRODUCTION_SITE_URL;

  try {
    const url = new URL(configured);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || LEGACY_HOSTS.has(url.hostname.toLowerCase())) return PRODUCTION_SITE_URL;
    return url.origin;
  } catch {
    return PRODUCTION_SITE_URL;
  }
}

export function absoluteSiteUrl(path: string): string {
  return new URL(path, `${getSiteUrl()}/`).href;
}
