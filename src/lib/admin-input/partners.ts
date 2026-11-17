export function parsePartnerInput(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const size = String(formData.get("size") ?? "lg");
  const needsWhite = formData.get("needsWhite") === "on";
  const websiteUrlInput = String(formData.get("websiteUrl") ?? "").trim();

  if (!name) return { error: "Nosaukums ir obligāts." } as const;
  if (size !== "lg" && size !== "sm") return { error: "Nederīgs izmērs." } as const;

  let websiteUrl: string | null = null;
  if (websiteUrlInput) {
    try {
      websiteUrl = new URL(websiteUrlInput).toString();
    } catch {
      return { error: "Saitei jābūt derīgam URL (piem., https://example.com)." } as const;
    }
  }

  return { name, size, needsWhite, websiteUrl } as const;
}
