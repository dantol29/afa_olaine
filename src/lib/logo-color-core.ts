const DEFAULT_BORDER_COLOR = "#fbb040";

function hexColor(red: number, green: number, blue: number) {
  return `#${red.toString(16).padStart(2, "0")}${green.toString(16).padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
}

/** Maps the crest's horizontal middle pixels to a crisp CSS border stripe. */
export function middleLogoStripe(pixels: Buffer, width: number, height: number, fallback = DEFAULT_BORDER_COLOR): string {
  if (width < 1 || height < 1 || pixels.length < width * height * 4) return fallback;

  const rowStart = Math.floor(height / 2) * width * 4;
  const visibleColors: string[] = [];

  for (let column = 0; column < width; column += 1) {
    const pixel = rowStart + column * 4;
    if (pixels[pixel + 3] >= 96) {
      visibleColors.push(hexColor(pixels[pixel], pixels[pixel + 1], pixels[pixel + 2]));
    }
  }

  if (visibleColors.length === 0) return fallback;

  const stops: string[] = [];
  let previousColor = "";
  let runStart = 0;

  const appendRun = (color: string, start: number, end: number) => {
    const startPercent = ((start / visibleColors.length) * 100).toFixed(3).replace(/\.0+$/, "");
    const endPercent = ((end / visibleColors.length) * 100).toFixed(3).replace(/\.0+$/, "");
    stops.push(`${color} ${startPercent}% ${endPercent}%`);
  };

  for (let column = 0; column < visibleColors.length; column += 1) {
    const color = visibleColors[column];
    if (column > 0 && color !== previousColor) {
      appendRun(previousColor, runStart, column);
      runStart = column;
    }
    previousColor = color;
  }
  appendRun(previousColor, runStart, visibleColors.length);

  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

/** Averages a shallow center band of a crest into smoothly interpolated color stops. */
export function smoothLogoStripe(
  pixels: Buffer,
  width: number,
  height: number,
  sampleCount = 12,
  fallback = DEFAULT_BORDER_COLOR,
): string {
  if (width < 1 || height < 1 || pixels.length < width * height * 4) return fallback;

  const bandStart = Math.floor(height * 0.35);
  const bandEnd = Math.max(bandStart + 1, Math.ceil(height * 0.65));
  const visibleColumns: Array<{ red: number; green: number; blue: number }> = [];

  for (let column = 0; column < width; column += 1) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let visiblePixels = 0;
    for (let row = bandStart; row < bandEnd; row += 1) {
      const pixel = (row * width + column) * 4;
      if (pixels[pixel + 3] < 96) continue;
      red += pixels[pixel];
      green += pixels[pixel + 1];
      blue += pixels[pixel + 2];
      visiblePixels += 1;
    }
    if (visiblePixels > 0) {
      visibleColumns.push({
        red: Math.round(red / visiblePixels),
        green: Math.round(green / visiblePixels),
        blue: Math.round(blue / visiblePixels),
      });
    }
  }

  if (visibleColumns.length === 0) return fallback;

  const samples = Math.min(Math.max(sampleCount, 2), visibleColumns.length);
  const stops = Array.from({ length: samples }, (_, index) => {
    const start = Math.floor((index * visibleColumns.length) / samples);
    const end = Math.max(start + 1, Math.floor(((index + 1) * visibleColumns.length) / samples));
    const colors = visibleColumns.slice(start, end);
    const average = colors.reduce(
      (total, color) => ({ red: total.red + color.red, green: total.green + color.green, blue: total.blue + color.blue }),
      { red: 0, green: 0, blue: 0 },
    );
    const color = hexColor(
      Math.round(average.red / colors.length),
      Math.round(average.green / colors.length),
      Math.round(average.blue / colors.length),
    );
    const position = ((index / (samples - 1)) * 100).toFixed(3).replace(/\.0+$/, "");
    return `${color} ${position}%`;
  });

  return `linear-gradient(90deg, ${stops.join(", ")})`;
}
