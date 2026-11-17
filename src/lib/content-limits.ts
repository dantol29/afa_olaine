/** Longest article or club page body we accept (about 10 screens of plain text). */
export const MAX_BODY_LENGTH = 30_000;

/** Limit for raw editor HTML, checked before sanitising. Tiptap output is within a few percent of the sanitised
 *  size, so 2x headroom never rejects valid input but stops huge pastes before the sanitiser's slow selector
 *  queries run (cost grows faster than linearly with input size). */
export const MAX_RAW_BODY_LENGTH = 2 * MAX_BODY_LENGTH;
