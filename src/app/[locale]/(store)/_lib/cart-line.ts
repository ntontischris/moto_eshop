/**
 * The live storefront cart line (localStorage-backed via the v3 provider) and
 * its pure operations. Lines are identified by (slug, [Size code]); the size is
 * the raw ERP code (ADR 0009), null for a no-variant product.
 */
export interface CartLine {
  /** Server `cart_items.id` — the authoritative handle for mutations. */
  id: string;
  /** Server `products.id` — needed to add/validate against stock. */
  productId: string;
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
