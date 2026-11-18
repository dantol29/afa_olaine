export function parsePartnerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const size = String(formData.get("size") ?? "lg");
  const needsWhite = formData.get("needsWhite") === "on";
  const websiteUrlInput = String(formData.get("websiteUrl") ?? "").trim();

  if (!name) return { error: "Nosaukums ir obligāts." } as const;
  if (size !== "lg" && size !== "sm") return { error: "Nederīgs izmērs." } as const;

  let websiteUrl: string | null = null;
  if (websiteUrlInput) {
    let parsed: URL;
    try {
      parsed = new URL(websiteUrlInput);
    } catch {
      return { error: "Saitei jābūt derīgam URL (piem., https://example.com)." } as const;
    }
    // The site links the logo to this address, so only web pages are allowed (no javascript:, mailto:, etc.).
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { error: "Saitei jāsākas ar http:// vai https:// (piem., https://example.com)." } as const;
    }
    websiteUrl = parsed.toString();
  }

  return { name, size, needsWhite, websiteUrl } as const;
}
