/**
 * Glossary protection: mask non-translatable terms (sizes, certifications,
 * units, brand names) before sending text to a translation engine, then
 * restore them verbatim afterwards.
 *
 * Terms are replaced with placeholder tokens of the form `⟦0⟧`, `⟦1⟧`, …
 * The engine is instructed to preserve these tokens unchanged.
 */

/** Static, always-protected terms. Order here is irrelevant — we sort by length. */
const STATIC_TERMS = [
  "XXXL",
  "XXL",
  "XL",
  "XS",
  "S",
  "M",
  "L",
  "CE",
  "Level 2",
  "Level 1",
  "mm",
  "cm",
  "kg",
];

/** Escape a string for safe use inside a RegExp. */
function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const makeToken = (index: number): string => `⟦${index}⟧`;

/**
 * Replace every glossary term (static terms + supplied brand names) with a
 * placeholder token. Longest terms are matched first so that, e.g., "XXL" is
 * never partially matched by "XL". Matching is word-boundary aware and the
 * term is regex-escaped.
 *
 * @returns the masked text and a token→term map for {@link restoreGlossary}.
 */
export function protectGlossary(
  text: string,
  brands: string[] = [],
): { masked: string; map: Record<string, string> } {
  const map: Record<string, string> = {};
  if (!text) return { masked: text, map };

  const terms = Array.from(new Set([...brands, ...STATIC_TERMS]))
    .filter((t) => t.trim().length > 0)
    .sort((a, b) => b.length - a.length);

  let masked = text;
  let tokenIndex = 0;

  for (const term of terms) {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "g");
    if (!pattern.test(masked)) continue;
    const token = makeToken(tokenIndex);
    map[token] = term;
    masked = masked.replace(pattern, token);
    tokenIndex += 1;
  }

  return { masked, map };
}

/**
 * Swap placeholder tokens back to their original terms. Uses split/join (not
 * regex) so the restored terms are inserted verbatim.
 */
export function restoreGlossary(
  text: string,
  map: Record<string, string>,
): string {
  let restored = text;
  for (const [token, term] of Object.entries(map)) {
    restored = restored.split(token).join(term);
  }
  return restored;
}
