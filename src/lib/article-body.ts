/** Articles written before the rich text editor store one paragraph per line; newer ones store HTML.
 *  The admin form uses this to give the editor paragraphs when an old article is opened. Safe for client code
 *  (no sanitizer imports). */
const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function articleBodyToEditorHtml(body: string): string {
  if (/^\s*</.test(body)) return body;
  return body
    .split(/\r\n?|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${line.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])}</p>`)
    .join("");
}
