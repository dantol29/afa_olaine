import { MAX_BODY_LENGTH, MAX_RAW_BODY_LENGTH } from "@/lib/content-limits";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";

export const CATEGORIES = ["Klubs", "Komandas", "Spēles", "Treniņi", "Pasākumi"] as const;

export function slugify(value: string): string {
  const withoutDiacritics = value
    .toLowerCase()
    .replace(/[āä]/g, "a")
    .replace(/[čć]/g, "c")
    .replace(/[ēé]/g, "e")
    .replace(/ģ/g, "g")
    .replace(/[īí]/g, "i")
    .replace(/ķ/g, "k")
    .replace(/ļ/g, "l")
    .replace(/ņ/g, "n")
    .replace(/[šś]/g, "s")
    .replace(/[ūü]/g, "u")
    .replace(/[žź]/g, "z");
  return withoutDiacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseArticleInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const teamIdRaw = String(formData.get("teamId") ?? "");
  const authorCoachIdRaw = String(formData.get("authorCoachId") ?? "");
  const rawBody = String(formData.get("body") ?? "");
  const baseSlug = slugify(title);

  if (!title) return { error: "Virsraksts ir obligāts." } as const;
  if (!excerpt) return { error: "Ievads ir obligāts." } as const;
  if (!date) return { error: "Datums ir obligāts." } as const;
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    return { error: "Jāizvēlas kategorija." } as const;
  }
  if (rawBody.length > MAX_RAW_BODY_LENGTH) return { error: "Raksta teksts ir pārāk garš." } as const;
  const body = sanitizeRichText(rawBody);
  if (!richTextHasContent(body)) return { error: "Raksta teksts ir obligāts." } as const;
  if (body.length > MAX_BODY_LENGTH) return { error: "Raksta teksts ir pārāk garš." } as const;
  if (!baseSlug) return { error: "Nederīgs virsraksts saites veidošanai." } as const;

  return {
    baseSlug,
    title,
    excerpt,
    date,
    category: category as (typeof CATEGORIES)[number],
    teamId: teamIdRaw ? Number(teamIdRaw) : null,
    authorCoachId: authorCoachIdRaw ? Number(authorCoachIdRaw) : null,
    body,
  } as const;
}
