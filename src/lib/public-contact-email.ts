export function normalizePublicContactEmail(email: string): string {
  return email.trim().toLowerCase() === "info@fkolaine.com" ? "info@afaolaine.lv" : email;
}
