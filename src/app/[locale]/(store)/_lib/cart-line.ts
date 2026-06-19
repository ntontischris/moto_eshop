/**
 * The live storefront cart line (localStorage-backed via the v3 provider) and
 * its pure operations. Lines are identified by (slug, [Size code]); the size is
 * the raw ERP code (ADR 0009), null for a no-variant product.
 */
export interface CartLine {
  slug: string;
  name: string;
  brand: string;
  categorySlug?: string | null;
  price: number;
  size: string | null;
  image: string;
  qty: number;
}

export function cartLineKey(line: Pick<CartLine, "slug" | "size">): string {
  return `${line.slug}::${line.size ?? ""}`;
}

/**
 * Change a cart line's [Size code] (B1). If the new size collides with another
 * line of the same product, the two merge into one line with combined quantity
 * — consistent with add-to-cart dedup by (slug, size). A no-op size or a missing
 * key returns the cart unchanged. Stock is validated server-side by the caller
 * before this runs (this is the pure local mutation).
 */
export function changeCartLineSize(
  cart: CartLine[],
  key: string,
  newSize: string,
): CartLine[] {
  const idx = cart.findIndex((l) => cartLineKey(l) === key);
  if (idx === -1) return cart;

  const line = cart[idx];
  if ((line.size ?? "") === newSize) return cart;

  const updated = { ...line, size: newSize };
  const targetKey = cartLineKey(updated);
  const mergeIdx = cart.findIndex(
    (l, i) => i !== idx && cartLineKey(l) === targetKey,
  );

  if (mergeIdx === -1) {
    return cart.map((l, i) => (i === idx ? updated : l));
  }

  return cart
    .map((l, i) => (i === mergeIdx ? { ...l, qty: l.qty + line.qty } : l))
    .filter((_, i) => i !== idx);
}
