/* Word-split helper for the S12 editorial chapter word-reveal — the pure half is
   fully unit-testable (no DOM); applyWordSplit wires it into a live element, and
   editorialZoomScale is the pure scrub math for the sticky media zoom-out.

   Accessibility contract: the original quote text stays the accessible name
   (callers set aria-label on the heading), and every generated <span> is
   aria-hidden so screen readers read the quote once, not word-by-word. The mask
   wrapper clips each word so the inner span can slide up from below on reveal. */

export interface WordToken {
  /** The visible word (no surrounding whitespace). */
  word: string;
  /** True when this word should render in the accent colour (was <em>-wrapped). */
  isAccent: boolean;
}

const EM_OPEN = "<em>";
const EM_CLOSE = "</em>";

/* Splits a string into words, flagging any wrapped in <em>…</em> as accent words
   so the reveal can colour them like the spec's italic red emphasis. Collapses
   runs of whitespace; the <em> markers are stripped from the visible word. */
export function splitTextToWords(text: string): WordToken[] {
  return text
    .split(/\s+/)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const isAccent = chunk.includes(EM_OPEN) || chunk.includes(EM_CLOSE);
      const word = chunk.split(EM_OPEN).join("").split(EM_CLOSE).join("");
      return { word, isAccent };
    });
}

const MASK_CLASS = "v3-edc-w";
const INNER_CLASS = "v3-edc-w-in";
const ACCENT_CLASS = "v3-edc-w--accent";

/* Replaces an element's HTML with aria-hidden masked word spans for the staggered
   reveal. Returns the inner (animatable) spans. Idempotent: an element already
   split is left untouched and its existing inner spans returned. Reads innerHTML
   (not textContent) so <em> accent markers survive into splitTextToWords. */
export function applyWordSplit(element: HTMLElement): HTMLElement[] {
  const existing = element.querySelectorAll<HTMLElement>(`.${INNER_CLASS}`);
  if (existing.length > 0) return [...existing];

  const tokens = splitTextToWords(element.innerHTML);
  const doc = element.ownerDocument;
  const fragment = doc.createDocumentFragment();
  const inners = tokens.map((token, index) => {
    const inner = buildWord(doc, token, fragment);
    if (index < tokens.length - 1)
      fragment.appendChild(doc.createTextNode(" "));
    return inner;
  });

  element.textContent = "";
  element.appendChild(fragment);
  return inners;
}

function buildWord(
  doc: Document,
  token: WordToken,
  fragment: DocumentFragment,
): HTMLElement {
  const mask = doc.createElement("span");
  mask.className = MASK_CLASS;
  mask.setAttribute("aria-hidden", "true");

  const inner = doc.createElement("span");
  inner.className = token.isAccent
    ? `${INNER_CLASS} ${ACCENT_CLASS}`
    : INNER_CLASS;
  inner.textContent = token.word;

  mask.appendChild(inner);
  fragment.appendChild(mask);
  return inner;
}

/* Sticky-zoom scrub math: maps chapter scroll progress in [0, 1] to the media
   scale, easing from `from` (entry, zoomed-in) down to `to` (rest). Progress is
   clamped so over/under-scroll never pushes scale past its bounds. Pure — the
   engine feeds ScrollTrigger.progress; tests cover the curve directly. */
export function editorialZoomScale(
  progress: number,
  from = 1.22,
  to = 1,
): number {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
  return from + (to - from) * p;
}
