// Browser-side downscaling for admin image uploads. Hosting cannot run sharp, so uploads are served as they arrive;
// shrinking large photos before they leave the browser keeps them small and under the server's 5 MB limit.

/** Longest side, in pixels, an uploaded image is downscaled to. */
export const MAX_IMAGE_SIDE = 2280;
const JPEG_QUALITY = 0.85;
// PNG keeps its transparency only as PNG, so every type is re-encoded as itself; GIF and others are left untouched.
const RESIZABLE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const PROCESSING_MESSAGE = "Attēls tiek sagatavots augšupielādei. Lūdzu, uzgaidi.";

/** Scales width and height down proportionally so the longest side is at most maxSide; never scales up. */
export function fitWithinMaxSide(width: number, height: number, maxSide: number): { width: number; height: number } {
  const longestSide = Math.max(width, height);
  if (longestSide <= maxSide) return { width, height };
  const scale = maxSide / longestSide;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

async function downscaleImageFile(file: File): Promise<File> {
  if (!RESIZABLE_TYPES.has(file.type)) return file;
  // "from-image" applies the EXIF orientation, so rotated phone photos keep their visible orientation. Some Safari
  // versions reject the options argument; they apply the orientation by default, so retry without it.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => createImageBitmap(file));
  try {
    const target = fitWithinMaxSide(bitmap.width, bitmap.height, MAX_IMAGE_SIDE);
    if (target.width === bitmap.width && target.height === bitmap.height) return file;
    const canvas = document.createElement("canvas");
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, target.width, target.height);
    const quality = file.type === "image/jpeg" ? JPEG_QUALITY : undefined;
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, file.type, quality));
    // A browser that cannot encode the type (e.g. WebP in older Safari) falls back to PNG; keep the original then.
    if (!blob || blob.type !== file.type || blob.size >= file.size) return file;
    return new File([blob], file.name, { type: file.type, lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}

/** Replaces oversized images selected in a file input with downscaled copies. Fails open: on any error, or when a
 *  copy would not be smaller, the original file stays. The form is held invalid while processing so a quick submit
 *  cannot send a half-prepared selection. */
export async function downscaleImageInput(input: HTMLInputElement): Promise<void> {
  const selected = input.files;
  if (!selected || selected.length === 0) return;
  input.setCustomValidity(PROCESSING_MESSAGE);
  try {
    const files = await Promise.all(Array.from(selected).map(file => downscaleImageFile(file).catch(() => file)));
    // A newer selection made while this one was processing wins and manages the validity message itself.
    if (input.files !== selected) return;
    if (!files.every((file, index) => file === selected[index])) {
      const transfer = new DataTransfer();
      files.forEach(file => transfer.items.add(file));
      input.files = transfer.files;
    }
    input.setCustomValidity("");
  } catch {
    // Keep the original selection.
    if (input.files === selected) input.setCustomValidity("");
  }
}

/** onChange handler for admin image inputs. */
export function handleImageInputChange(event: { currentTarget: HTMLInputElement }): void {
  void downscaleImageInput(event.currentTarget);
}
