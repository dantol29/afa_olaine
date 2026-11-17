const MINUTES_PER_DAY = 24 * 60;

function toMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** An item lasts within one calendar day. The shared calendar feed (read by the FK site) rejects whole feeds that
 *  contain an end earlier than the start, so reject such times when they are saved. */
export function isEndAfterStart(startTime: string, endTime: string): boolean {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  return start !== null && end !== null && end > start;
}

/** Adds minutes to a "HH:MM" time but stops at 23:59, never wrapping past midnight. */
export function addMinutesWithinDay(time: string, minutes: number): string {
  const start = toMinutes(time) ?? 0;
  const total = Math.min(start + minutes, MINUTES_PER_DAY - 1);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
