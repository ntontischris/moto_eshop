/* Char-split helper for the S7 hero cinematic entrance — the pure half is fully
   unit-testable (no DOM); applyCharSplit wires it into a live element.

   Accessibility contract: the original heading text stays the accessible name
   (callers set aria-label on the heading), and every generated <span> is
   aria-hidden so screen readers read the heading once, not letter-by-letter.
   Spaces become non-animating spacer spans so word breaks survive the split. */

export interface CharToken {
  /** The visible character. A space is preserved as a normal space. */
  char: string;
  /** True for whitespace tokens, which animate as fixed spacers. */
  isSpace: boolean;
}

/* Splits a string into per-character tokens, flagging whitespace so the engine
   can skip animating gaps. Works on Unicode code points (spread, not split("")
   so surrogate pairs / combined glyphs stay intact). */
export function splitTextToChars(text: string): CharToken[] {
  return [...text].map((char) => ({ char, isSpace: char.trim() === "" }));
}

const CHAR_CLASS = "v3-hero-ch";
const SPACE_CLASS = "v3-hero-ch--space";

/* Replaces an element's text with aria-hidden char spans for staggered motion.
   Returns the created spans (the animatable targets). Idempotent guard: an
   element already split is left untouched and its existing spans returned. */
export function applyCharSplit(element: HTMLElement): HTMLElement[] {
  const existing = element.querySelectorAll<HTMLElement>(`.${CHAR_CLASS}`);
  if (existing.length > 0) return [...existing];

  const tokens = splitTextToChars(element.textContent ?? "");
  const fragment = element.ownerDocument.createDocumentFragment();
  const spans = tokens.map((token) =>
    createCharSpan(element.ownerDocument, token),
  );
  spans.forEach((span) => fragment.appendChild(span));

  element.textContent = "";
  element.appendChild(fragment);
  return spans;
}

function createCharSpan(doc: Document, token: CharToken): HTMLElement {
  const span = doc.createElement("span");
  span.className = token.isSpace ? `${CHAR_CLASS} ${SPACE_CLASS}` : CHAR_CLASS;
  span.setAttribute("aria-hidden", "true");
  span.textContent = token.isSpace ? " " : token.char;
  return span;
}
