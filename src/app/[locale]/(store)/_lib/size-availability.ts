/**
 * Per-size availability for the PDP, governed by ADR 0009.
 *
 * The ERP stores sizes zero-padded ([Size code], e.g. `00M`/`044`). We strip
 * the padding for the customer-facing [Display size] only, keep the raw code
 * authoritative for cart/stock/ERP, and show combined/range codes verbatim.
 * Three states drive the picker UI; boundaries match the grilled scope.
 */

export type SizeStockState = "available" | "limited" | "out";

export interface SizeVariant {
  /** Raw ERP [Size code] — authoritative for cart, stock checks, ERP. */
  code: string;
  /** Customer-facing [Display size], derived, never stored. */
  display: string;
  available: number;
  state: SizeStockState;
}

export const SIZE_STATE_LABEL: Record<SizeStockState, string> = {
  available: "Διαθέσιμο",
  limited: "Περιορισμένα",
  out: "Εξαντλημένο",
};

/**
 * [Size code] → [Display size]: strip leading-zero padding for display only.
 * Anything that does not match the clean rule (combined/range sizes) is shown
 * verbatim — we never guess where a combined size splits. An all-zero code is
 * kept verbatim rather than collapsing to an empty string.
 */
export function normalizeSizeCode(code: string): string {
  const stripped = code.replace(/^0+/, "");
  return stripped === "" ? code : stripped;
}

/** Διαθέσιμο (>3) · Περιορισμένα (1–3) · Εξαντλημένο (≤0). */
export function sizeStockState(available: number): SizeStockState {
  if (available > 3) return "available";
  if (available >= 1) return "limited";
  return "out";
}

/**
 * Build the PDP size picker from raw `v_product_available_stock` rows. Drops the
 * null/empty-string sentinel (a product with only that has no [Size variant]),
 * sums duplicate rows per code, and resolves display + state. A null `available`
 * counts as zero.
 */
export function buildSizeVariants(
  rows: { size: string | null; available: number | null }[],
): SizeVariant[] {
  const byCode = new Map<string, number>();
  for (const row of rows) {
    if (!row.size) continue; // drops null and ""
    byCode.set(row.size, (byCode.get(row.size) ?? 0) + (row.available ?? 0));
  }
  return Array.from(byCode, ([code, available]) => ({
    code,
    display: normalizeSizeCode(code),
    available,
    state: sizeStockState(available),
  }));
}
