// Riga wall-clock time to real instants. Pure and import-free, so server loaders and client components share it.

/** Converts a Riga wall-clock time (as printed on lff.lv) into the real
 *  UTC instant it refers to, correctly accounting for DST. */
export function rigaWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const guessUtc = Date.UTC(year, month - 1, day, hour, minute);
  // The offset at the guess is wrong for night times on DST change days (the guess lies on the other side of the
  // switch), so the offset is read again at the first result. A time skipped in spring moves one hour forward.
  const firstOffset = rigaOffsetMs(guessUtc);
  const secondOffset = rigaOffsetMs(guessUtc - firstOffset);
  return new Date(guessUtc - secondOffset);
}

/** How far Riga's clocks are ahead of UTC at the given instant. */
function rigaOffsetMs(instantUtc: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Riga",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(instantUtc));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  const rigaAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return rigaAsUtc - instantUtc;
}
