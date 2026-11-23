// How tall the admin week calendar's hour grid is: only the hours the visible days use, plus one empty hour before and
// after, scaled so the whole range usually fits the box without scrolling. Pure, so it is tested without a browser.

/** One empty hour above the earliest event and below the latest. */
export const PADDING_HOURS = 1;
/** The grid's scroll box (GRID_BOX_HEIGHT) less its day header (~70 px): the room the hours get, in px. */
export const GRID_BODY_HEIGHT = 530;
/** No taller per hour than the old fixed grid: a short day is not stretched. */
export const MAX_ROW_HEIGHT = 56;
/** No shorter per hour than a one-hour card needs for its title and time; a longer day then scrolls a little. */
export const MIN_ROW_HEIGHT = 36;

/** Start and end of an event in hours on Riga's wall clock (17.5 = 17:30). An end at or before the start means
 *  the event runs past midnight and is cut at 24. */
export type HourSpan = { start: number; end: number };

/** Whole hours `[startHour, endHour)` the grid shows, or null when there is nothing to show. */
export function fitHourRange(spans: readonly HourSpan[]): { startHour: number; endHour: number } | null {
  if (spans.length === 0) return null;
  let earliest = Infinity;
  let latest = -Infinity;
  for (const span of spans) {
    earliest = Math.min(earliest, span.start);
    latest = Math.max(latest, span.end > span.start ? span.end : 24);
  }
  return {
    startHour: Math.max(0, Math.floor(earliest) - PADDING_HOURS),
    endHour: Math.min(24, Math.ceil(latest) + PADDING_HOURS),
  };
}

/** Pixels per hour so `hourCount` hours fill the box, within the readable limits. */
export function rowHeightFor(hourCount: number): number {
  return Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, Math.floor(GRID_BODY_HEIGHT / hourCount)));
}
