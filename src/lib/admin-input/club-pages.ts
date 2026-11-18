import { parsePageAction, type ClubPageMedia } from "@/lib/club-page-media";
import { MAX_BODY_LENGTH, MAX_RAW_BODY_LENGTH } from "@/lib/content-limits";
import { richTextHasContent, sanitizeRichText } from "@/lib/rich-text";

export const MAX_IMAGES = 6;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parsePageInput(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? "") || title);
  const description = String(formData.get("description") ?? "").trim();
  const rawBody = String(formData.get("body") ?? "");
  if (rawBody.length > MAX_RAW_BODY_LENGTH) return { error: "Lapas teksts ir pārāk garš." } as const;
  const body = sanitizeRichText(rawBody);
  const displayOrder = Number.parseInt(String(formData.get("displayOrder") ?? "0"), 10);
  const isPublished = formData.get("isPublished") === "on";

  if (!title) return { error: "Virsraksts ir obligāts." } as const;
  if (title.length > 120) return { error: "Virsraksts nedrīkst pārsniegt 120 rakstzīmes." } as const;
  if (!slug) return { error: "Neizdevās izveidot derīgu lapas saiti." } as const;
  if (slug.length > 100) return { error: "Lapas saite nedrīkst pārsniegt 100 rakstzīmes." } as const;
  if (!description) return { error: "Īsais apraksts ir obligāts." } as const;
  if (description.length > 240) return { error: "Īsais apraksts nedrīkst pārsniegt 240 rakstzīmes." } as const;
  if (!richTextHasContent(body)) return { error: "Lapas teksts ir obligāts." } as const;
  if (body.length > MAX_BODY_LENGTH) return { error: "Lapas teksts ir pārāk garš." } as const;
  if (!Number.isSafeInteger(displayOrder)) return { error: "Secībai jābūt veselam skaitlim." } as const;

  return { title, slug, description, body, displayOrder, isPublished } as const;
}

export function parseMediaInput(formData: FormData, current: ClubPageMedia, files: File[]) {
  try {
    const raw = String(formData.get("actionButtons") ?? "[]");
    if (raw.length > 12000) throw new Error("Pogu dati ir pārāk gari.");
    let values: unknown;
    try { values = JSON.parse(raw); } catch { throw new Error("Neizdevās nolasīt pogas."); }
    if (!Array.isArray(values) || values.length > 6) throw new Error("Lapā var būt līdz 6 pogām.");
    const actions = values.map(parsePageAction);
    const removed = new Set(formData.getAll("removeImages").map(String));
    function text(value: FormDataEntryValue | null | undefined, max: number) {
      const result = String(value ?? "").trim();
      if (result.length > max) throw new Error(`Attēla apraksts ir pārāk garš (līdz ${max} rakstzīmēm).`);
      return result;
    }
    const retained = current.photos.filter(photo => !removed.has(photo.src)).map(photo => ({ ...photo,
      alt: text(formData.get(`imageAlt:${photo.src}`) ?? photo.alt, 200),
      caption: text(formData.get(`imageCaption:${photo.src}`) ?? photo.caption, 240),
    }));
    if (retained.length + files.length > MAX_IMAGES) throw new Error(`Vienai lapai var pievienot ne vairāk kā ${MAX_IMAGES} attēlus.`);
    if (files.reduce((total, file) => total + file.size, 0) > 5 * 1024 * 1024) throw new Error("Vienā reizē augšupielādē līdz 5 MB attēlu.");
    const alts = formData.getAll("newImageAlt"), captions = formData.getAll("newImageCaption");
    const newDetails = files.map((_, index) => ({ alt: text(alts[index], 200), caption: text(captions[index], 240) }));
    const layout: ClubPageMedia["layout"] = formData.get("imageLayout") === "sidebar" ? "sidebar" : "gallery";
    return { layout, actions, retained, newDetails };
  } catch (error) { return { error: (error as Error).message }; }
}
